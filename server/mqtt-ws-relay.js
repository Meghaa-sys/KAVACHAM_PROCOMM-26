/**
 * KAVACHAM Industrial Safety Monitoring System
 * MQTT to WebSocket Relay Server
 *
 * Pipeline:
 * ESP32 WSN Node -> MQTT Broker -> mine/test -> This Relay -> WebSocket (:8080) -> Next.js Dashboard
 *
 * The relay is a strict pass-through for REAL broker traffic only. It never
 * fabricates telemetry, and it always reports the true MQTT broker state so the
 * dashboard can refuse to render anything while the broker is down.
 */

const mqtt = require('mqtt');
const { WebSocketServer, WebSocket } = require('ws');

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://192.168.146.22:1883';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'mine/test';
const WS_PORT = parseInt(process.env.WS_PORT || '8080', 10);

const MQTT_COMMAND_TOPIC = process.env.MQTT_COMMAND_TOPIC || 'mine/command';
const MQTT_ACK_TOPIC = process.env.MQTT_ACK_TOPIC || 'mine/ack';

console.log('====================================================');
console.log('🛡️  KAVACHAM MQTT -> WebSocket Relay Server');
console.log(`📡 MQTT Broker : ${MQTT_BROKER}`);
console.log(`📋 MQTT Topic  : ${MQTT_TOPIC}`);
console.log(`🌐 WS Server   : ws://0.0.0.0:${WS_PORT}`);
console.log('====================================================');

// 1. Initialize WebSocket Server
const wss = new WebSocketServer({ port: WS_PORT }, () => {
  console.log(`[WS] WebSocket server started and listening on port ${WS_PORT}`);
});

// Broadcast helper
function broadcast(data) {
  const payloadStr = typeof data === 'string' ? data : JSON.stringify(data);
  let activeClients = 0;

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payloadStr);
      activeClients++;
    }
  });

  return activeClients;
}

// Single source of truth for the upstream broker link. The dashboard gates all
// telemetry rendering on this flag, so it must never be optimistic.
let mqttConnected = false;

function publishMqttState(reason) {
  broadcast({
    type: 'MQTT_STATUS',
    connected: mqttConnected,
    reason: reason || null,
    broker: MQTT_BROKER,
    topic: MQTT_TOPIC,
    timestamp: Date.now(),
  });
}

function setMqttConnected(next, reason) {
  if (mqttConnected === next) return;
  mqttConnected = next;
  console.log(`[MQTT] Link state -> ${next ? 'CONNECTED' : 'DISCONNECTED'} (${reason})`);
  publishMqttState(reason);
}

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`[WS] New Dashboard client connected from ${clientIp}. Total clients: ${wss.clients.size}`);

  // The handshake reports the ACTUAL broker state, not merely that the relay
  // process is alive.
  ws.send(JSON.stringify({
    type: 'SYSTEM_STATUS',
    status: 'RELAY_READY',
    mqtt_connected: mqttConnected,
    mqtt_broker: MQTT_BROKER,
    topic: MQTT_TOPIC,
    command_topic: MQTT_COMMAND_TOPIC,
    ack_topic: MQTT_ACK_TOPIC,
    timestamp: Date.now(),
  }));

  // Handle downstream messages from the Dashboard (Surface -> Underground)
  ws.on('message', (messageData) => {
    try {
      const parsed = JSON.parse(messageData.toString());
      if (!parsed || !parsed.type) return;

      if (parsed.type === 'BROADCAST_COMMAND') {
        const cmd = parsed.command;
        const payloadStr = JSON.stringify(cmd);
        console.log(`\n🚨 [DOWNSTREAM COMMAND] [${cmd.command} - ${cmd.alert_type}]`);
        console.log(`Forwarding to MQTT: ${MQTT_COMMAND_TOPIC} -> Target: ${cmd.target}`);

        if (mqttClient && mqttClient.connected) {
          mqttClient.publish(MQTT_COMMAND_TOPIC, payloadStr, { qos: 1 });
          mqttClient.publish('mine/broadcast', payloadStr, { qos: 1 });
          console.log(`[MQTT PUB SUCCESS] Sent to ${MQTT_COMMAND_TOPIC} & mine/broadcast`);
        } else {
          console.warn('[MQTT WARNING] Broker not connected, could not send downstream command to MQTT.');
        }

        broadcast({
          type: 'BROADCAST_CONFIRMATION',
          command: cmd,
          timestamp: Date.now(),
        });
        return;
      }

      // Operator acknowledged a queued incident (SOS / fall / gas / thermal).
      // Push it back down so the node can clear its latched alarm.
      if (parsed.type === 'ALERT_ACK') {
        const ack = parsed.ack || {};
        const payloadStr = JSON.stringify({
          command: 'ACK',
          alert_id: ack.id,
          alert_type: ack.type,
          worker_id: ack.worker_id,
          node: ack.node,
          acknowledged_by: ack.acknowledged_by || 'CONTROL_ROOM_SURFACE',
          timestamp: Date.now(),
        });

        console.log(`✅ [ACK] ${ack.type} on ${ack.worker_id} (node ${ack.node}) acknowledged`);

        if (mqttClient && mqttClient.connected) {
          mqttClient.publish(MQTT_ACK_TOPIC, payloadStr, { qos: 1 });
          console.log(`[MQTT PUB SUCCESS] ACK sent to ${MQTT_ACK_TOPIC}`);
        } else {
          console.warn('[MQTT WARNING] Broker not connected, ACK not delivered downstream.');
        }

        // Mirror to every dashboard so multiple control-room screens stay in sync.
        broadcast({
          type: 'ALERT_ACK_CONFIRMATION',
          ack: { ...ack, timestamp: Date.now() },
        });
        return;
      }
    } catch (err) {
      console.error('[WS INCOMING ERROR] Failed to process message:', err.message);
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Dashboard client disconnected. Total clients: ${wss.clients.size}`);
  });

  ws.on('error', (err) => {
    console.error('[WS] Client error:', err.message);
  });
});

// 2. Initialize MQTT Client with automatic reconnection
const mqttClient = mqtt.connect(MQTT_BROKER, {
  reconnectPeriod: 3000,
  connectTimeout: 5000,
  clientId: `kavacham_relay_${Math.random().toString(16).slice(2, 8)}`,
});

mqttClient.on('connect', () => {
  console.log(`[MQTT] Successfully connected to broker: ${MQTT_BROKER}`);
  mqttClient.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error(`[MQTT] Failed to subscribe to topic ${MQTT_TOPIC}:`, err);
      setMqttConnected(false, 'subscribe_failed');
    } else {
      console.log(`[MQTT] Subscribed to topic: ${MQTT_TOPIC}`);
      setMqttConnected(true, 'subscribed');
    }
  });
});

mqttClient.on('message', (topic, message) => {
  const timestamp = new Date().toISOString();
  const rawMsg = message.toString();
  console.log(`\n[${timestamp}] [MQTT INCOMING] [${topic}]`);
  console.log(rawMsg);

  let parsed;
  try {
    parsed = JSON.parse(rawMsg);
  } catch (err) {
    // Never forward unparseable traffic - a malformed frame must not surface in
    // the control room as if it were a telemetry reading.
    console.warn(`[MQTT] Dropping non-JSON message on ${topic}:`, rawMsg);
    return;
  }

  if (!parsed || typeof parsed !== 'object' || !parsed.worker_id) {
    console.warn('[MQTT] Dropping payload with no worker_id:', rawMsg);
    return;
  }

  const clientCount = broadcast({ type: 'TELEMETRY', payload: parsed });
  console.log(`[WS BROADCAST] Forwarded packet to ${clientCount} dashboard client(s)`);
});

mqttClient.on('error', (err) => {
  console.error('[MQTT] Connection Error:', err.message);
  setMqttConnected(false, `error: ${err.message}`);
});

mqttClient.on('offline', () => {
  console.warn('[MQTT] Client offline. Retrying in 3s...');
  setMqttConnected(false, 'offline');
});

mqttClient.on('close', () => {
  setMqttConnected(false, 'closed');
});

mqttClient.on('reconnect', () => {
  console.log('[MQTT] Reconnecting to broker...');
});

// Handle termination gracefully
process.on('SIGINT', () => {
  console.log('\n[KAVACHAM] Shutting down relay server...');
  setMqttConnected(false, 'shutdown');
  wss.close();
  mqttClient.end();
  process.exit(0);
});
