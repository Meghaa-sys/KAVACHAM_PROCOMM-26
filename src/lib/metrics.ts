import { WorkerData } from '@/types/worker';

/**
 * Four-step criticality ramp used by every gauge, tile and badge in the app.
 * `caution` sits between "all good" and "act now" so operators get a visible
 * lead-in before a reading actually breaches an unsafe threshold.
 */
export type MetricLevel = 'safe' | 'caution' | 'warning' | 'critical';

export interface LevelStyle {
  /** Operator-facing word. Never rely on colour alone. */
  label: string;
  /** Raw hex - used for SVG strokes, glows and inline gradients. */
  hex: string;
  /** Dimmed hex for inactive tracks / zone rings. */
  hexMuted: string;
  text: string;
  bg: string;
  border: string;
  ring: string;
  glow: string;
  /** Solid, high-contrast fill for the most urgent badges. */
  solid: string;
}

export const LEVEL_STYLES: Record<MetricLevel, LevelStyle> = {
  safe: {
    label: 'NORMAL',
    hex: '#10b981',
    hexMuted: 'rgba(16, 185, 129, 0.22)',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
    ring: 'ring-emerald-500/40',
    glow: 'glow-safe',
    solid: 'bg-emerald-500 text-emerald-950',
  },
  caution: {
    label: 'ELEVATED',
    hex: '#fbbf24',
    hexMuted: 'rgba(251, 191, 36, 0.22)',
    text: 'text-amber-300',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/40',
    ring: 'ring-amber-400/40',
    glow: 'glow-caution',
    solid: 'bg-amber-400 text-amber-950',
  },
  warning: {
    label: 'WARNING',
    hex: '#f97316',
    hexMuted: 'rgba(249, 115, 22, 0.22)',
    text: 'text-orange-300',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/45',
    ring: 'ring-orange-500/45',
    glow: 'glow-warning',
    solid: 'bg-orange-500 text-orange-950',
  },
  critical: {
    label: 'CRITICAL',
    hex: '#ef4444',
    hexMuted: 'rgba(239, 68, 68, 0.24)',
    text: 'text-rose-300',
    bg: 'bg-rose-500/12',
    border: 'border-rose-500/60',
    ring: 'ring-rose-500/50',
    glow: 'glow-emergency',
    solid: 'bg-rose-500 text-white',
  },
};

/** Severity ordering helper - lets us roll several readings up into one status. */
const LEVEL_RANK: Record<MetricLevel, number> = {
  safe: 0,
  caution: 1,
  warning: 2,
  critical: 3,
};

export function worstLevel(...levels: MetricLevel[]): MetricLevel {
  return levels.reduce<MetricLevel>(
    (worst, l) => (LEVEL_RANK[l] > LEVEL_RANK[worst] ? l : worst),
    'safe',
  );
}

export interface GaugeZone {
  from: number;
  to: number;
  level: MetricLevel;
}

export interface MetricSpec {
  min: number;
  max: number;
  unit: string;
  zones: GaugeZone[];
}

/* ------------------------------------------------------------------ */
/* Ambient temperature (deg C)                                         */
/* ------------------------------------------------------------------ */

export const TEMPERATURE_SPEC: MetricSpec = {
  min: 0,
  max: 60,
  unit: '°C',
  zones: [
    { from: 0, to: 35, level: 'safe' },
    { from: 35, to: 40, level: 'caution' },
    { from: 40, to: 45, level: 'warning' },
    { from: 45, to: 60, level: 'critical' },
  ],
};

export function temperatureLevel(value: number, unsafeFlag?: boolean): MetricLevel {
  if (unsafeFlag || value >= 45) return 'critical';
  if (value >= 40) return 'warning';
  if (value >= 35) return 'caution';
  return 'safe';
}

/* ------------------------------------------------------------------ */
/* Toxic gas concentration (AQI / ppm)                                 */
/* ------------------------------------------------------------------ */

export const GAS_SPEC: MetricSpec = {
  min: 0,
  max: 500,
  unit: 'AQI',
  zones: [
    { from: 0, to: 150, level: 'safe' },
    { from: 150, to: 200, level: 'caution' },
    { from: 200, to: 300, level: 'warning' },
    { from: 300, to: 500, level: 'critical' },
  ],
};

export function gasLevel(value: number, unsafeFlag?: boolean): MetricLevel {
  if (unsafeFlag || value >= 300) return 'critical';
  if (value >= 200) return 'warning';
  if (value >= 150) return 'caution';
  return 'safe';
}

/* ------------------------------------------------------------------ */
/* Radio link quality (RSSI, dBm - less negative is better)            */
/* ------------------------------------------------------------------ */

export const RSSI_SPEC: MetricSpec = {
  min: -100,
  max: -30,
  unit: 'dBm',
  zones: [
    { from: -100, to: -85, level: 'critical' },
    { from: -85, to: -75, level: 'warning' },
    { from: -75, to: -60, level: 'caution' },
    { from: -60, to: -30, level: 'safe' },
  ],
};

export function rssiLevel(rssi: number): MetricLevel {
  if (rssi >= -60) return 'safe';
  if (rssi >= -75) return 'caution';
  if (rssi >= -85) return 'warning';
  return 'critical';
}

export function rssiQuality(rssi: number): { label: string; bars: number; level: MetricLevel } {
  if (rssi >= -60) return { label: 'Excellent', bars: 4, level: 'safe' };
  if (rssi >= -75) return { label: 'Good', bars: 3, level: 'caution' };
  if (rssi >= -85) return { label: 'Fair', bars: 2, level: 'warning' };
  return { label: 'Weak', bars: 1, level: 'critical' };
}

/* ------------------------------------------------------------------ */
/* Whole-worker rollup                                                 */
/* ------------------------------------------------------------------ */

/**
 * Mirrors `computeWorkerStatus` from the live-data hook, but resolved onto the
 * finer four-step ramp so cards can distinguish "elevated" from "warning".
 */
export function workerLevel(worker: WorkerData | null): MetricLevel {
  if (!worker) return 'safe';
  if (worker.manual_sos || worker.fall || worker.gas_unsafe || worker.temperature_unsafe) {
    return 'critical';
  }
  return worstLevel(
    temperatureLevel(worker.temperature),
    gasLevel(worker.gas),
    rssiLevel(worker.rssi),
  );
}

/** Short, human explanation of why a worker is in its current state. */
export function workerReason(worker: WorkerData | null): string {
  if (!worker) return 'No telemetry received';
  if (worker.manual_sos) return 'Manual SOS button triggered';
  if (worker.fall) return 'Impact / fall detected by IMU';
  if (worker.gas_unsafe) return 'Hazardous gas concentration';
  if (worker.temperature_unsafe) return 'Critical thermal condition';

  const reasons: string[] = [];
  if (temperatureLevel(worker.temperature) !== 'safe') reasons.push('rising temperature');
  if (gasLevel(worker.gas) !== 'safe') reasons.push('elevated gas');
  if (rssiLevel(worker.rssi) !== 'safe') reasons.push('degraded radio link');

  if (reasons.length === 0) return 'All vitals and perimeter normal';
  return `Monitoring ${reasons.join(', ')}`;
}

/** Clamp a reading to its gauge range and express it as a 0..1 fraction. */
export function toFraction(value: number, min: number, max: number): number {
  if (max === min) return 0;
  const clamped = Math.min(max, Math.max(min, value));
  return (clamped - min) / (max - min);
}
