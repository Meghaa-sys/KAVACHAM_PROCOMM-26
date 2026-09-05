export interface WorkerData {
  node: number;
  worker_id: string;
  message: string;
  sequence: number;
  gas: number;
  temperature: number;
  gas_unsafe: boolean;
  temperature_unsafe: boolean;
  fall: boolean;
  manual_sos: boolean;
  node_type: number;
  rssi: number;
  ble_address: string;
  gateway: string;
  timestamp?: number; // local received timestamp in ms
}

export type SafetyStatus = 'SAFE' | 'WARNING' | 'EMERGENCY';

export type ConnectionState = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';

export interface AlertInfo {
  id: string;
  type: 'MANUAL_SOS' | 'FALL' | 'GAS_UNSAFE' | 'TEMPERATURE_UNSAFE';
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING';
  worker_id: string;
  node: number;
  timestamp: number;
  acknowledged?: boolean;
}

export interface NetworkConfig {
  mqttBroker: string;
  mqttTopic: string;
  wsUrl: string;
  gatewayName: string;
}

export type EmergencyBroadcastType =
  | 'EARTHQUAKE'
  | 'GAS_LEAK'
  | 'CAVE_IN'
  | 'FLOOD'
  | 'FIRE'
  | 'ALL_CLEAR'
  | 'CUSTOM';

export interface BroadcastCommand {
  command: 'EVACUATE' | 'ALERT' | 'ALL_CLEAR' | 'TEST';
  alert_type: EmergencyBroadcastType;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  message: string;
  target: 'ALL_NODES' | string;
  buzzer: boolean;
  vibration: boolean;
  led_strobe: boolean;
  timestamp: number;
  sender: string;
}

