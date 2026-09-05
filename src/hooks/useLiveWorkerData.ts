'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { WorkerData, ConnectionState, AlertInfo, SafetyStatus, BroadcastCommand } from '@/types/worker';

export interface UseLiveWorkerDataOptions {
  wsUrl?: string;
  autoReconnectInterval?: number;
}

export function computeWorkerStatus(data: WorkerData | null): SafetyStatus {
  if (!data) return 'SAFE';
  if (data.manual_sos || data.fall || data.gas_unsafe || data.temperature_unsafe) {
    return 'EMERGENCY';
  }
  if (data.gas > 200 || data.temperature > 40 || data.rssi < -85) {
    return 'WARNING';
  }
  return 'SAFE';
}

export function useLiveWorkerData(options: UseLiveWorkerDataOptions = {}) {
  const defaultWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://192.168.146.22:8080';
  const [currentWsUrl, setCurrentWsUrl] = useState<string>(options.wsUrl || defaultWsUrl);

  useEffect(() => {
    if (!options.wsUrl && typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host && host !== '192.168.146.22') {
        const dynamicUrl = `ws://${host}:8080`;
        setCurrentWsUrl(dynamicUrl);
      }
    }
  }, [options.wsUrl]);
  
  // Workers map: worker_id -> WorkerData
  const [workers, setWorkers] = useState<Record<string, WorkerData>>({});
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('CONNECTING');
  const [lastPacketTime, setLastPacketTime] = useState<number | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
  const [packetCount, setPacketCount] = useState<number>(0);
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState<Set<string>>(new Set());
  
  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastCommand | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Parse and process incoming worker payload
  const handleIncomingPayload = useCallback((rawPayload: any) => {
    try {
      let data: WorkerData;
      if (typeof rawPayload === 'string') {
        data = JSON.parse(rawPayload);
      } else {
        data = rawPayload;
      }

      if (!data || !data.worker_id) {
        return;
      }

      const timestampedData: WorkerData = {
        ...data,
        timestamp: Date.now(),
      };

      setWorkers((prev) => {
        const next = { ...prev, [timestampedData.worker_id]: timestampedData };
        return next;
      });

      setSelectedWorkerId((prev) => {
        // If no worker selected yet, or this incoming one is in emergency, focus on it
        if (!prev) return timestampedData.worker_id;
        if (timestampedData.manual_sos || timestampedData.fall || timestampedData.gas_unsafe) {
          return timestampedData.worker_id;
        }
        return prev;
      });

      setLastPacketTime(Date.now());
      setSecondsAgo(0);
      setPacketCount((c) => c + 1);
    } catch (err) {
      console.error('[KAVACHAM WS] Failed to parse payload:', err, rawPayload);
    }
  }, []);

  // Connect WebSocket
  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setConnectionState('CONNECTING');

    try {
      const ws = new WebSocket(currentWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setConnectionState('CONNECTED');
        console.log(`[KAVACHAM WS] Connected to ${currentWsUrl}`);
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const parsed = JSON.parse(event.data);
          
          if (parsed && parsed.type === 'BROADCAST_CONFIRMATION') {
            if (parsed.command && parsed.command.command === 'ALL_CLEAR') {
              setActiveBroadcast(null);
            } else if (parsed.command) {
              setActiveBroadcast(parsed.command);
            }
            return;
          }

          // Check if it's a broadcast wrapper or raw payload
          if (parsed && parsed.payload) {
            handleIncomingPayload(parsed.payload);
          } else {
            handleIncomingPayload(parsed);
          }
        } catch (e) {
          console.error('[KAVACHAM WS] Invalid JSON received:', event.data);
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setConnectionState('DISCONNECTED');
        console.log('[KAVACHAM WS] Connection closed. Reconnecting in 3s...');
        scheduleReconnect();
      };

      ws.onerror = (err) => {
        if (!isMountedRef.current) return;
        console.warn('[KAVACHAM WS] WebSocket error:', err);
        setConnectionState('ERROR');
        ws.close();
      };
    } catch (err) {
      console.error('[KAVACHAM WS] WebSocket connection exception:', err);
      setConnectionState('ERROR');
      scheduleReconnect();
    }
  }, [currentWsUrl, handleIncomingPayload]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        connect();
      }
    }, options.autoReconnectInterval || 3000);
  }, [connect, options.autoReconnectInterval]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  // Update "seconds ago" ticker every second
  useEffect(() => {
    const timer = setInterval(() => {
      if (lastPacketTime) {
        const diffSeconds = Math.max(0, Math.floor((Date.now() - lastPacketTime) / 1000));
        setSecondsAgo(diffSeconds);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lastPacketTime]);

  // Calculate active alerts
  const activeAlerts: AlertInfo[] = [];
  Object.values(workers).forEach((worker) => {
    if (worker.manual_sos) {
      const alertId = `${worker.worker_id}-SOS-${worker.sequence}`;
      if (!acknowledgedAlertIds.has(alertId)) {
        activeAlerts.push({
          id: alertId,
          type: 'MANUAL_SOS',
          title: '🚨 MANUAL SOS ACTIVATED',
          description: `Worker ${worker.worker_id} has triggered a manual emergency alert.`,
          severity: 'CRITICAL',
          worker_id: worker.worker_id,
          node: worker.node,
          timestamp: worker.timestamp || Date.now(),
        });
      }
    }
    if (worker.fall) {
      const alertId = `${worker.worker_id}-FALL-${worker.sequence}`;
      if (!acknowledgedAlertIds.has(alertId)) {
        activeAlerts.push({
          id: alertId,
          type: 'FALL',
          title: '⚠️ FALL DETECTED',
          description: `Potential fall incident detected on Worker ${worker.worker_id}.`,
          severity: 'CRITICAL',
          worker_id: worker.worker_id,
          node: worker.node,
          timestamp: worker.timestamp || Date.now(),
        });
      }
    }
    if (worker.gas_unsafe) {
      const alertId = `${worker.worker_id}-GAS-${worker.sequence}`;
      if (!acknowledgedAlertIds.has(alertId)) {
        activeAlerts.push({
          id: alertId,
          type: 'GAS_UNSAFE',
          title: '☣️ UNSAFE GAS LEVEL',
          description: `Hazardous atmospheric gas level detected (${worker.gas}) near Worker ${worker.worker_id}.`,
          severity: 'HIGH',
          worker_id: worker.worker_id,
          node: worker.node,
          timestamp: worker.timestamp || Date.now(),
        });
      }
    }
    if (worker.temperature_unsafe) {
      const alertId = `${worker.worker_id}-TEMP-${worker.sequence}`;
      if (!acknowledgedAlertIds.has(alertId)) {
        activeAlerts.push({
          id: alertId,
          type: 'TEMPERATURE_UNSAFE',
          title: '🔥 UNSAFE TEMPERATURE',
          description: `Critical ambient thermal condition (${worker.temperature}°C) detected for Worker ${worker.worker_id}.`,
          severity: 'HIGH',
          worker_id: worker.worker_id,
          node: worker.node,
          timestamp: worker.timestamp || Date.now(),
        });
      }
    }
  });

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAcknowledgedAlertIds((prev) => {
      const updated = new Set(Array.from(prev));
      updated.add(alertId);
      return updated;
    });
  }, []);

  const clearAllAlerts = useCallback(() => {
    const allIds = activeAlerts.map((a) => a.id);
    setAcknowledgedAlertIds((prev) => {
      const updated = new Set(Array.from(prev));
      allIds.forEach((id) => updated.add(id));
      return updated;
    });
  }, [activeAlerts]);

  // Inject sample data for testing / simulation
  const injectSampleData = useCallback((sample: Partial<WorkerData>) => {
    const base: WorkerData = {
      node: 1,
      worker_id: 'WSN-1',
      message: 'MANUAL_SOS',
      sequence: Math.floor(Math.random() * 1000),
      gas: 88,
      temperature: 28,
      gas_unsafe: false,
      temperature_unsafe: false,
      fall: false,
      manual_sos: true,
      node_type: 1,
      rssi: -51,
      ble_address: 'd4:8a:fc:9d:64:6e',
      gateway: 'KAVACHAM_GATEWAY',
      timestamp: Date.now(),
      ...sample,
    };
    handleIncomingPayload(base);
  }, [handleIncomingPayload]);

  // Send Downstream Emergency Broadcast from Control Room to all underground nodes
  const sendEmergencyBroadcast = useCallback((customCmd?: Partial<BroadcastCommand>) => {
    const cmd: BroadcastCommand = {
      command: 'EVACUATE',
      alert_type: 'EARTHQUAKE',
      priority: 'CRITICAL',
      message: 'CRITICAL: SEISMIC ACTIVITY / EARTHQUAKE WARNING. EVACUATE MINE IMMEDIATELY!',
      target: 'ALL_NODES',
      buzzer: true,
      vibration: true,
      led_strobe: true,
      timestamp: Date.now(),
      sender: 'CONTROL_ROOM_SURFACE',
      ...customCmd,
    };

    setActiveBroadcast(cmd);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'BROADCAST_COMMAND',
          command: cmd,
        })
      );
      console.log('[KAVACHAM WS] Dispatched emergency broadcast to relay:', cmd);
    } else {
      console.warn('[KAVACHAM WS] WebSocket not connected; set local broadcast state only.');
    }
  }, []);

  const cancelEmergencyBroadcast = useCallback(() => {
    const allClearCmd: BroadcastCommand = {
      command: 'ALL_CLEAR',
      alert_type: 'ALL_CLEAR',
      priority: 'NORMAL',
      message: 'ALL CLEAR: Emergency condition resolved. Resume standard operations.',
      target: 'ALL_NODES',
      buzzer: false,
      vibration: false,
      led_strobe: false,
      timestamp: Date.now(),
      sender: 'CONTROL_ROOM_SURFACE',
    };

    setActiveBroadcast(null);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'BROADCAST_COMMAND',
          command: allClearCmd,
        })
      );
      console.log('[KAVACHAM WS] Dispatched ALL_CLEAR to underground nodes.');
    }
  }, []);

  const selectedWorker = selectedWorkerId ? workers[selectedWorkerId] || null : Object.values(workers)[0] || null;
  const workersList = Object.values(workers);

  return {
    workers,
    workersList,
    selectedWorker,
    selectedWorkerId,
    setSelectedWorkerId,
    connectionState,
    lastPacketTime,
    secondsAgo,
    packetCount,
    activeAlerts,
    acknowledgeAlert,
    clearAllAlerts,
    activeBroadcast,
    sendEmergencyBroadcast,
    cancelEmergencyBroadcast,
    currentWsUrl,
    setCurrentWsUrl,
    reconnect: connect,
    injectSampleData,
  };
}
