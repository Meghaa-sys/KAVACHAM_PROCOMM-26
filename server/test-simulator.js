/**
 * KAVACHAM ESP32 WSN Packet Simulator
 * Used to test the dashboard by streaming mock sensor telemetry
 * 
 * Can publish to:
 * 1. MQTT Broker (10.10.189.91:1883) -> mine/test
 * 2. Or directly to WebSocket server (ws://localhost:8080)
 */

const mqtt = require('mqtt');
const WebSocket = require('ws');

const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://10.79.142.22:1883';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'mine/test';
const WS_URL = process.env.WS_URL || 'ws://10.79.142.22:8080';

console.log('🛡️ KAVACHAM ESP32 WSN Packet Simulator Starting...');

let seq = 60;
let emergencyMode = false;

// Sample ESP32 nodes
const nodes = [
  { node: 1, worker_id: 'WSN-1', ble_address: 'd4:8a:fc:9d:64:6e', baseTemp: 28, baseGas: 88, node_type: 1 },
  { node: 2, worker_id: 'WSN-2', ble_address: 'e2:1c:aa:4f:88:10', baseTemp: 27, baseGas: 75, node_type: 1 },
  { node: 3, worker_id: 'WSN-3', ble_address: 'c0:49:ef:12:33:9a', baseTemp: 29, baseGas: 92, node_type: 1 },
  { node: 4, worker_id: 'WSN-4', ble_address: 'f8:94:c2:b1:07:44', baseTemp: 26, baseGas: 65, node_type: 1 },
];

function generatePacket(nodeObj) {
  seq++;
  
  // Random small fluctuation
  const tempVariance = Math.floor(Math.random() * 3) - 1;
  const gasVariance = Math.floor(Math.random() * 9) - 4;
  const rssiVariance = Math.floor(Math.random() * 7) - 3;

  const currentTemp = nodeObj.baseTemp + tempVariance;
  const currentGas = nodeObj.baseGas + gasVariance;
  const currentRssi = -51 + rssiVariance;

  // Simulate SOS on WSN-1 every now and then
  const isSos = nodeObj.worker_id === 'WSN-1' ? emergencyMode : false;
  const isFall = false;
  const isGasUnsafe = currentGas > 250;
  const isTempUnsafe = currentTemp > 45;

  return {
    node: nodeObj.node,
    worker_id: nodeObj.worker_id,
    message: isSos ? 'MANUAL_SOS' : isGasUnsafe ? 'GAS_ALARM' : 'PERIODIC_TELEMETRY',
    sequence: seq,
    gas: currentGas,
    temperature: currentTemp,
    gas_unsafe: isGasUnsafe,
    temperature_unsafe: isTempUnsafe,
    fall: isFall,
    manual_sos: isSos,
    node_type: nodeObj.node_type,
    rssi: currentRssi,
    ble_address: nodeObj.ble_address,
    gateway: 'KAVACHAM_GATEWAY'
  };
}

// Try connecting to MQTT
console.log(`Connecting to MQTT broker: ${MQTT_BROKER}...`);
const mqttClient = mqtt.connect(MQTT_BROKER, { connectTimeout: 3000 });

let isMqttConnected = false;
let wsClient = null;

mqttClient.on('connect', () => {
  isMqttConnected = true;
  console.log(`[Simulator] Connected to MQTT broker ${MQTT_BROKER}`);
  
  // Subscribe to downstream commands from surface
  mqttClient.subscribe('mine/command', (err) => {
    if (!err) console.log(`[Simulator] ESP32 Nodes listening for downstream evacuation commands on: mine/command`);
  });
});

mqttClient.on('message', (topic, msg) => {
  if (topic === 'mine/command' || topic === 'mine/broadcast') {
    try {
      const cmd = JSON.parse(msg.toString());
      console.log(`\n======================================================`);
      console.log(`🚨 [UNDERGROUND ESP32 NODES RECEIVED BROADCAST!]`);
      console.log(`COMMAND      : ${cmd.command} (${cmd.alert_type})`);
      console.log(`MESSAGE      : ${cmd.message}`);
      console.log(`ACTUATORS    : Buzzer [${cmd.buzzer ? '🔔 ON' : 'OFF'}] | Vibration [${cmd.vibration ? '📳 ON' : 'OFF'}] | Strobe [${cmd.led_strobe ? '💡 ON' : 'OFF'}]`);
      console.log(`NODE STATUS  : All 4 Miner nodes (WSN-1..WSN-4) acknowledging alarm & executing evacuation!`);
      console.log(`======================================================\n`);
    } catch (e) {}
  }
});

mqttClient.on('error', (err) => {
  console.log(`[Simulator] MQTT Broker error (${err.message}). Falling back to direct WS broadcast at ${WS_URL}`);
  connectWsFallback();
});

function connectWsFallback() {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) return;

  try {
    wsClient = new WebSocket(WS_URL);
    wsClient.on('open', () => {
      console.log(`[Simulator] Connected directly to WebSocket relay at ${WS_URL}`);
    });
    wsClient.on('error', () => {
      // Ignore retry in interval
    });
  } catch (e) {}
}

connectWsFallback();

// Toggle emergency mode every 20 seconds for dynamic testing
setInterval(() => {
  emergencyMode = !emergencyMode;
  console.log(`\n>>> [SIMULATOR] Emergency SOS mode on WSN-1 set to: ${emergencyMode ? 'ACTIVE 🚨' : 'NORMAL ✅'} <<<\n`);
}, 20000);

// Publish packets every 2 seconds for all nodes round-robin
let currentNodeIdx = 0;
setInterval(() => {
  const node = nodes[currentNodeIdx];
  const packet = generatePacket(node);
  const payloadStr = JSON.stringify(packet);

  if (isMqttConnected) {
    mqttClient.publish(MQTT_TOPIC, payloadStr);
    console.log(`[MQTT PUB -> ${MQTT_TOPIC}] Worker: ${packet.worker_id} | SOS: ${packet.manual_sos} | Temp: ${packet.temperature}°C | Gas: ${packet.gas}`);
  }

  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    wsClient.send(payloadStr);
    console.log(`[WS DIRECT -> :8080] Worker: ${packet.worker_id} | SOS: ${packet.manual_sos} | Temp: ${packet.temperature}°C | Gas: ${packet.gas}`);
  } else if (!isMqttConnected) {
    connectWsFallback();
  }

  currentNodeIdx = (currentNodeIdx + 1) % nodes.length;
}, 2000);
