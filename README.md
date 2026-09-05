# 🛡️ KAVACHAM - Worker Safety Monitoring System

An industrial real-time worker safety and environmental monitoring dashboard built with **Next.js**, **React**, **TypeScript**, and **Tailwind CSS**, communicating with **ESP32 WSN Nodes** over **MQTT** and **WebSocket**.

---

## 📡 System Architecture & Data Flow

```
+------------------+         MQTT (:1883)          +----------------------------+
|  ESP32 WSN Nodes | ----------------------------> | MQTT Broker (10.10.189.91) |
| (Sensors + IMU)  |                               +----------------------------+
+------------------+                                             |
                                                            mine/test
                                                                 |
                                                                 v
+------------------+        WebSocket (:8080)      +----------------------------+
| Next.js Dashboard| <---------------------------- | Node.js Relay Server       |
| (React/Tailwind) |                               | (server/mqtt-ws-relay.js)  |
+------------------+                               +----------------------------+
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Frontend Dashboard
```bash
npm run dev
```
Open **http://localhost:3000** in your browser.

### 3. Start the MQTT-to-WebSocket Relay
```bash
npm run relay
```
Connects to `mqtt://10.10.189.91:1883`, subscribes to `mine/test`, and forwards packets to WebSocket on port `8080`.

### 4. (Optional) Run the ESP32 Node Simulator
```bash
npm run simulate
```
Streams realistic sensor packets (WSN-1, WSN-2, WSN-3, WSN-4) with temperature fluctuations, gas readings, and simulated emergency SOS / Fall alerts for live UI testing.

---

## 📦 MQTT Payload Specification

Topic: `mine/test`

```json
{
  "node": 1,
  "worker_id": "WSN-1",
  "message": "MANUAL_SOS",
  "sequence": 59,
  "gas": 88,
  "temperature": 28,
  "gas_unsafe": false,
  "temperature_unsafe": false,
  "fall": false,
  "manual_sos": true,
  "node_type": 1,
  "rssi": -51,
  "ble_address": "d4:8a:fc:9d:64:6e",
  "gateway": "KAVACHAM_GATEWAY"
}
```

---

## 🎨 Features & Safety Standards

- **Semantic Industrial Palette**:
  - 🟢 **Safe / Normal**: Emerald indicators for standard environmental readings.
  - 🟡 **Warning**: Amber alerts for approaching thresholds.
  - 🔴 **Emergency**: Vivid crimson flashing banners and cards for Manual SOS, Fall, and Gas hazards.
  - 🔵 **Telemetry / Live**: Cyan highlights for live connection and sequence telemetry.
- **Critical Emergency Banner**: Instant acknowledgment system for `manual_sos`, `fall`, `gas_unsafe`, and `temperature_unsafe`.
- **Worker Fleet Hierarchy**: Automatically registers and maintains multiple WSN worker nodes (`WSN-1`, `WSN-2`, etc.).
- **Automatic Reconnect**: WebSocket automatically manages reconnections with heartbeats and status tickers.
