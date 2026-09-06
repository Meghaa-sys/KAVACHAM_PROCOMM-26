'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  WorkerData,
  ConnectionState,
  SocketState,
  AlertInfo,
  AlertType,
  SafetyStatus,
  BroadcastCommand,
} from '@/types/worker';

export interface UseLiveWorkerDataOptions {
  wsUrl?: string;
  autoReconnectInterval?: number;
}

/**
 * Single-node deployment. The dashboard binds to the first WSN node that
 * reports on the topic and ignores every other worker_id until the broker link
 * drops. Set to false once the mesh carries more than one node.
 */
const SINGLE_NODE_MODE = true;

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

/**
 * Every hazard flag that raises a queued incident. Each is edge-triggered: an
 * alert is enqueued when the flag goes false -> true and then stays in the
 * queue until an operator acknowledges it, regardless of what later packets
 * say. A node that clears its own flag can never silently retract an SOS.
 */
const ALERT_TRIGGERS: {
  flag: keyof Pick<WorkerData, 'manual_sos' | 'fall' | 'gas_unsafe' | 'temperature_unsafe'>;
  type: AlertType;
  severity: AlertInfo['severity'];
  title: string;
  describe: (w: WorkerData) => string;
}[] = [
  {
    flag: 'manual_sos',
    type: 'MANUAL_SOS',
    severity: 'CRITICAL',
    title: '🚨 MANUAL SOS ACTIVATED',
    describe: (w) => `Worker ${w.worker_id} has triggered a manual emergency alert.`,
  },
  {
    flag: 'fall',
    type: 'FALL',
    severity: 'CRITICAL',
    title: '⚠️ FALL DETECTED',
    describe: (w) =>
      `Accelerometer detected a potential fall incident on Worker ${w.worker_id}.`,
  },
  {
    flag: 'gas_unsafe',
    type: 'GAS_UNSAFE',
    severity: 'HIGH',
    title: '☣️ UNSAFE GAS LEVEL',
    describe: (w) =>
      `Hazardous atmospheric gas level detected (${w.gas}) near Worker ${w.worker_id}.`,
  },
  {
    flag: 'temperature_unsafe',
    type: 'TEMPERATURE_UNSAFE',
    severity: 'HIGH',
    title: '🔥 UNSAFE TEMPERATURE',
    describe: (w) =>
      `Critical ambient thermal condition (${w.temperature}°C) detected for Worker ${w.worker_id}.`,
  },
];

export function useLiveWorkerData(options: UseLiveWorkerDataOptions = {}) {
  const defaultWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://10.109.15.22:8080';
  const [currentWsUrl, setCurrentWsUrl] = useState<string>(options.wsUrl || defaultWsUrl);

  useEffect(() => {
    if (!options.wsUrl && typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host && host !== '10.109.15.22') {
        const dynamicUrl = `ws://${host}:8080`;
        setCurrentWsUrl(dynamicUrl);
      }
    }
  }, [options.wsUrl]);

  // Workers map: worker_id -> WorkerData. Only ever populated from real broker
  // traffic; there is no sample/simulated injection path.
  const [workers, setWorkers] = useState<Record<string, WorkerData>>({});
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  const [socketState, setSocketState] = useState<SocketState>('CONNECTING');
  const [mqttConnected, setMqttConnected] = useState<boolean>(false);
  const [mqttStatusReason, setMqttStatusReason] = useState<string | null>(null);

  const [lastPacketTime, setLastPacketTime] = useState<number | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
  const [packetCount, setPacketCount] = useState<number>(0);
  // Persistent incident queue. Entries survive later packets, node flag resets,
  // broker dropouts and reconnects - only an explicit acknowledge removes one.
  const [alertQueue, setAlertQueue] = useState<AlertInfo[]>([]);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<AlertInfo[]>([]);

  const [activeBroadcast, setActiveBroadcast] = useState<BroadcastCommand | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Previous hazard-flag state per worker, for rising-edge detection.
  const prevFlagsRef = useRef<Record<string, Partial<Record<AlertType, boolean>>>>({});
  // Monotonic incident counter guarantees a unique id per raised incident even
  // when a node repeats a sequence number after reboot.
  const incidentSeqRef = useRef<number>(0);
  // The one node this dashboard is bound to while SINGLE_NODE_MODE is on.
  const boundWorkerIdRef = useRef<string | null>(null);
  // Live mirror of the broker link, readable from inside socket callbacks.
  const mqttConnectedRef = useRef<boolean>(false);
  // Live mirror of the incident queue, so acknowledge handlers can publish
  // downstream without doing side effects inside a state updater.
  const alertQueueRef = useRef<AlertInfo[]>([]);
  alertQueueRef.current = alertQueue;

  const setMqttLink = useCallback((connected: boolean, reason?: string | null) => {
    mqttConnectedRef.current = connected;
    setMqttConnected(connected);
    setMqttStatusReason(reason ?? null);
  }, []);

  /** Drop all telemetry. Incidents in the queue are deliberately preserved. */
  const clearTelemetry = useCallback(() => {
    setWorkers({});
    setSelectedWorkerId(null);
    setLastPacketTime(null);
    setSecondsAgo(null);
    prevFlagsRef.current = {};
    boundWorkerIdRef.current = null;
  }, []);

  // Enqueue any incident the incoming packet newly raises.
  const queueIncidents = useCallback((data: WorkerData) => {
    const prev = prevFlagsRef.current[data.worker_id] || {};
    const next: Partial<Record<AlertType, boolean>> = { ...prev };
    const raised: AlertInfo[] = [];

    ALERT_TRIGGERS.forEach((trigger) => {
      const isActive = Boolean(data[trigger.flag]);
      const wasActive = Boolean(prev[trigger.type]);
      next[trigger.type] = isActive;

      // Rising edge only. A flag that stays latched high does not re-queue the
      // same incident on every heartbeat.
      if (isActive && !wasActive) {
        incidentSeqRef.current += 1;
        raised.push({
          id: `${data.worker_id}-${trigger.type}-${incidentSeqRef.current}`,
          type: trigger.type,
          title: trigger.title,
          description: trigger.describe(data),
          severity: trigger.severity,
          worker_id: data.worker_id,
          node: data.node,
          sequence: data.sequence,
          timestamp: data.timestamp || Date.now(),
        });
      }
    });

    prevFlagsRef.current[data.worker_id] = next;

    if (raised.length > 0) {
      setAlertQueue((queue) => [...raised, ...queue]);
    }
  }, []);

  // Parse and process incoming worker payload
  const handleIncomingPayload = useCallback(
    (rawPayload: any) => {
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

        // Hard gate: nothing renders unless the relay confirms the broker link.
        if (!mqttConnectedRef.current) {
          console.warn('[KAVACHAM WS] Dropped packet received while MQTT is down:', data.worker_id);
          return;
        }

        if (SINGLE_NODE_MODE) {
          if (boundWorkerIdRef.current === null) {
            boundWorkerIdRef.current = data.worker_id;
            console.log(`[KAVACHAM] Bound to single node: ${data.worker_id}`);
          } else if (boundWorkerIdRef.current !== data.worker_id) {
            console.warn(
              `[KAVACHAM] Ignoring ${data.worker_id}: dashboard is bound to ${boundWorkerIdRef.current} (single-node mode).`
            );
            return;
          }
        }

        const timestampedData: WorkerData = {
          ...data,
          timestamp: Date.now(),
        };

        setWorkers((prev) =>
          SINGLE_NODE_MODE
            ? { [timestampedData.worker_id]: timestampedData }
            : { ...prev, [timestampedData.worker_id]: timestampedData }
        );

        queueIncidents(timestampedData);

        setSelectedWorkerId((prev) => {
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
    },
    [queueIncidents]
  );

  // Connect WebSocket
  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    setSocketState('CONNECTING');

    try {
      const ws = new WebSocket(currentWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setSocketState('CONNECTED');
        // The relay reports the true broker state in its handshake; stay dark
        // until it does.
        console.log(`[KAVACHAM WS] Relay socket open at ${currentWsUrl}`);
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const parsed = JSON.parse(event.data);
          if (!parsed) return;

          if (parsed.type === 'SYSTEM_STATUS') {
            setMqttLink(Boolean(parsed.mqtt_connected), parsed.mqtt_connected ? null : 'relay_handshake');
            return;
          }

          if (parsed.type === 'MQTT_STATUS') {
            setMqttLink(Boolean(parsed.connected), parsed.reason ?? null);
            return;
          }

          if (parsed.type === 'BROADCAST_CONFIRMATION') {
            if (parsed.command && parsed.command.command === 'ALL_CLEAR') {
              setActiveBroadcast(null);
            } else if (parsed.command) {
              setActiveBroadcast(parsed.command);
            }
            return;
          }

          if (parsed.type === 'ALERT_ACK_CONFIRMATION') {
            // Another control-room screen acknowledged this incident.
            const ackId = parsed.ack && parsed.ack.id;
            if (ackId) {
              setAlertQueue((queue) => queue.filter((a) => a.id !== ackId));
            }
            return;
          }

          if (parsed.type === 'TELEMETRY' && parsed.payload) {
            handleIncomingPayload(parsed.payload);
            return;
          }

          // Legacy relay shapes: a wrapped payload, or a bare telemetry frame.
          if (parsed.payload) {
            handleIncomingPayload(parsed.payload);
          } else if (parsed.worker_id) {
            handleIncomingPayload(parsed);
          }
        } catch (e) {
          console.error('[KAVACHAM WS] Invalid JSON received:', event.data);
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        setSocketState('DISCONNECTED');
        setMqttLink(false, 'relay_socket_closed');
        console.log('[KAVACHAM WS] Connection closed. Reconnecting in 3s...');
        scheduleReconnect();
      };

      ws.onerror = (err) => {
        if (!isMountedRef.current) return;
        console.warn('[KAVACHAM WS] WebSocket error:', err);
        setSocketState('ERROR');
        setMqttLink(false, 'relay_socket_error');
        ws.close();
      };
    } catch (err) {
      console.error('[KAVACHAM WS] WebSocket connection exception:', err);
      setSocketState('ERROR');
      setMqttLink(false, 'relay_socket_exception');
      scheduleReconnect();
    }
  }, [currentWsUrl, handleIncomingPayload, setMqttLink]);

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

  // The moment the broker link drops, stop showing readings. A stale gauge is
  // worse than an empty one in a control room.
  useEffect(() => {
    if (!mqttConnected) {
      clearTelemetry();
    }
  }, [mqttConnected, clearTelemetry]);

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

  const sendToRelay = useCallback((message: object): boolean => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  const sendAck = useCallback(
    (alert: AlertInfo): boolean =>
      sendToRelay({
        type: 'ALERT_ACK',
        ack: {
          id: alert.id,
          type: alert.type,
          worker_id: alert.worker_id,
          node: alert.node,
          sequence: alert.sequence,
          acknowledged_by: 'CONTROL_ROOM_SURFACE',
        },
      }),
    [sendToRelay]
  );

  // Acknowledging is a side effect (it publishes downstream), so it reads the
  // queue from a ref and never runs inside a state updater - a React updater
  // can be invoked twice and would double-publish the ACK.
  const acknowledgeAlert = useCallback(
    (alertId: string) => {
      const alert = alertQueueRef.current.find((a) => a.id === alertId);
      if (!alert) return;

      if (!sendAck(alert)) {
        console.warn('[KAVACHAM WS] Relay offline; acknowledgement recorded locally only.');
      }

      const acked: AlertInfo = { ...alert, acknowledged: true, acknowledged_at: Date.now() };
      setAcknowledgedAlerts((history) => [acked, ...history].slice(0, 100));
      setAlertQueue((queue) => queue.filter((a) => a.id !== alertId));
    },
    [sendAck]
  );

  const clearAllAlerts = useCallback(() => {
    const pending = alertQueueRef.current;
    if (pending.length === 0) return;

    pending.forEach(sendAck);

    const now = Date.now();
    const acked = pending.map((a) => ({ ...a, acknowledged: true, acknowledged_at: now }));
    const ackedIds = new Set(pending.map((a) => a.id));

    setAcknowledgedAlerts((history) => [...acked, ...history].slice(0, 100));
    setAlertQueue((queue) => queue.filter((a) => !ackedIds.has(a.id)));
  }, [sendAck]);

  // Send Downstream Emergency Broadcast from Control Room to all underground nodes
  const sendEmergencyBroadcast = useCallback(
    (customCmd?: Partial<BroadcastCommand>) => {
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

      if (sendToRelay({ type: 'BROADCAST_COMMAND', command: cmd })) {
        console.log('[KAVACHAM WS] Dispatched emergency broadcast to relay:', cmd);
      } else {
        console.warn('[KAVACHAM WS] Relay not connected; set local broadcast state only.');
      }
    },
    [sendToRelay]
  );

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

    if (sendToRelay({ type: 'BROADCAST_COMMAND', command: allClearCmd })) {
      console.log('[KAVACHAM WS] Dispatched ALL_CLEAR to underground nodes.');
    }
  }, [sendToRelay]);

  const selectedWorker = selectedWorkerId
    ? workers[selectedWorkerId] || null
    : Object.values(workers)[0] || null;
  const workersList = Object.values(workers);

  // The pipeline is only "CONNECTED" when the relay socket AND the broker
  // behind it are both up. Anything less must not read as LIVE.
  const connectionState: ConnectionState =
    socketState === 'CONNECTED'
      ? mqttConnected
        ? 'CONNECTED'
        : 'CONNECTING'
      : socketState;

  return {
    workers,
    workersList,
    selectedWorker,
    selectedWorkerId,
    setSelectedWorkerId,
    connectionState,
    socketState,
    mqttConnected,
    mqttStatusReason,
    singleNodeMode: SINGLE_NODE_MODE,
    boundWorkerId: boundWorkerIdRef.current,
    lastPacketTime,
    secondsAgo,
    packetCount,
    activeAlerts: alertQueue,
    acknowledgedAlerts,
    acknowledgeAlert,
    clearAllAlerts,
    activeBroadcast,
    sendEmergencyBroadcast,
    cancelEmergencyBroadcast,
    currentWsUrl,
    setCurrentWsUrl,
    reconnect: connect,
  };
}
