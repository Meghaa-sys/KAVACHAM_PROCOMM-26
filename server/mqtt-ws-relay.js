/**
 * KAVACHAM Industrial Safety Monitoring System
 * MQTT to WebSocket Relay Server
 * 
 * Pipeline:
 * ESP32 WSN Nodes -> MQTT Broker (10.10.189.91:1883) -> mine/test -> This Relay -> WebSocket (:8080) -> Next.js Dashboard
 */

const mqtt = require('mqtt');
const { WebSocketServer, WebSocket } = require('ws');

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://192.168.146.22:1883';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'mine/test';
const WS_PORT = parseInt(process.env.WS_PORT || '8080', 10);

console.log('====================================================');
console.log('🛡️  KAVACHAM MQTT -> WebSocket Relay Server');
console.log(`📡 MQTT Broker : ${MQTT_BROKER}`);
console.log(`📋 MQTT Topic  : ${MQTT_TOPIC}`);
console.log(`🌐 WS Server   : ws://0.0.0.0:${WS_PORT}`);
console.log('====================================================');

const MQTT_COMMAND_TOPIC = process.env.MQTT_COMMAND_TOPIC || 'mine/command';

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

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`[WS] New Dashboard client connected from ${clientIp}. Total clients: ${wss.clients.size}`);

  // Send initial handshake / ready signal
  ws.send(JSON.stringify({
    type: 'SYSTEM_STATUS',
    status: 'CONNECTED',
    mqtt_broker: MQTT_BROKER,
    topic: MQTT_TOPIC,
    command_topic: MQTT_COMMAND_TOPIC,
    timestamp: Date.now()
  }));

  // Handle downstream broadcast commands from Dashboard (Surface -> Underground)
  ws.on('message', (messageData) => {
    try {
      const parsed = JSON.parse(messageData.toString());
      if (parsed && parsed.type === 'BROADCAST_COMMAND') {
        const cmd = parsed.command;
        const payloadStr = JSON.stringify(cmd);
        console.log(`\n🚨 [DOWNSTREAM COMMAND] [${cmd.command} - ${cmd.alert_type}]`);
        console.log(`Forwarding to MQTT: ${MQTT_COMMAND_TOPIC} -> Target: ${cmd.target}`);
        
        // Publish to MQTT Broker for ESP32 WSN nodes
        if (mqttClient && mqttClient.connected) {
          mqttClient.publish(MQTT_COMMAND_TOPIC, payloadStr, { qos: 1 });
          mqttClient.publish('mine/broadcast', payloadStr, { qos: 1 });
          console.log(`[MQTT PUB SUCCESS] Sent to ${MQTT_COMMAND_TOPIC} & mine/broadcast`);
        } else {
          console.warn(`[MQTT WARNING] Broker not connected, could not send downstream command to MQTT.`);
        }

        // Echo back to all dashboards
        broadcast({
          type: 'BROADCAST_CONFIRMATION',
          command: cmd,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error('[WS INCOMING ERROR] Failed to process message:', err.message);
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Dashboard client disconnected. Total clients: ${wss.clients.size}`);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Client error:`, err.message);
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
    } else {
      console.log(`[MQTT] Subscribed to topic: ${MQTT_TOPIC}`);
    }
  });
});

mqttClient.on('message', (topic, message) => {
  const timestamp = new Date().toISOString();
  const rawMsg = message.toString();
  console.log(`\n[${timestamp}] [MQTT INCOMING] [${topic}]`);
  console.log(rawMsg);

  try {
    const parsed = JSON.parse(rawMsg);
    
    // Broadcast raw payload directly to dashboard
    const clientCount = broadcast(parsed);
    console.log(`[WS BROADCAST] Forwarded packet to ${clientCount} dashboard client(s)`);
  } catch (err) {
    console.warn(`[MQTT] Message is not JSON, forwarding as string:`, rawMsg);
    broadcast({ message: rawMsg, raw: true });
  }
});

mqttClient.on('error', (err) => {
  console.error(`[MQTT] Connection Error:`, err.message);
});

mqttClient.on('offline', () => {
  console.warn(`[MQTT] Client offline. Retrying in 3s...`);
});

mqttClient.on('reconnect', () => {
  console.log(`[MQTT] Reconnecting to broker...`);
});

// Handle termination gracefully
process.on('SIGINT', () => {
  console.log('\n[KAVACHAM] Shutting down relay server...');
  wss.close();
  mqttClient.end();
  process.exit(0);
});
