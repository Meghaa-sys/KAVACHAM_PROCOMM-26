'use client';

import React from 'react';
import {
  Thermometer,
  Wind,
  ShieldAlert,
  ShieldCheck,
  Flame,
  AlertTriangle,
  HeartCrack,
  Signal,
} from 'lucide-react';
import { WorkerData, SafetyStatus } from '@/types/worker';
import { computeWorkerStatus } from '@/hooks/useLiveWorkerData';
import { RadialGauge, StatusPill } from '@/components/ui/Gauge';
import {
  GAS_SPEC,
  LEVEL_STYLES,
  MetricLevel,
  RSSI_SPEC,
  TEMPERATURE_SPEC,
  gasLevel,
  rssiLevel,
  rssiQuality,
  temperatureLevel,
  workerLevel,
  workerReason,
} from '@/lib/metrics';

interface SensorCardsProps {
  worker: WorkerData | null;
}

/* ------------------------------------------------------------------ */
/* Card shell - keeps every instrument on the same rhythm              */
/* ------------------------------------------------------------------ */

const InstrumentCard: React.FC<{
  title: string;
  subtitle: string;
  level: MetricLevel;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ title, subtitle, level, children, footer }) => {
  const style = LEVEL_STYLES[level];
  const isCritical = level === 'critical';

  return (
    <section
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 flex flex-col ${
        isCritical
          ? 'industrial-card-emergency'
          : level === 'warning'
          ? 'industrial-card border-orange-500/40'
          : 'industrial-card'
      }`}
    >
      {/* Severity accent rail across the top of the card */}
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${style.hex}, transparent)`,
          opacity: level === 'safe' ? 0.45 : 0.95,
        }}
      />

      {isCritical && (
        <span className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
      )}

      <header className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-[0.1em] text-slate-200 leading-tight text-balance">
            {title}
          </h3>
          <p className="text-[10px] font-medium text-slate-500 leading-tight mt-0.5">{subtitle}</p>
        </div>
        <StatusPill level={level} />
      </header>

      <div className="flex-1 flex items-center justify-center py-2">{children}</div>

      {footer && (
        <footer className="pt-3 mt-auto border-t border-white/[0.06]">{footer}</footer>
      )}
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Hazard lamp - illuminated indicator for the boolean safety flags    */
/* ------------------------------------------------------------------ */

const HazardLamp: React.FC<{
  active: boolean;
  label: string;
  icon: React.ReactNode;
  activeText: string;
  idleText: string;
}> = ({ active, label, icon, activeText, idleText }) => (
  <div
    className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 border transition-colors ${
      active
        ? 'bg-rose-500/15 border-rose-500/60'
        : 'bg-industrial-900/60 border-white/[0.06]'
    }`}
  >
    <span
      className={`relative flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${
        active ? 'bg-rose-500/25 text-rose-300' : 'bg-industrial-800 text-slate-500'
      }`}
    >
      {active && (
        <span className="absolute inset-0 rounded-lg bg-rose-500/40 animate-ping" />
      )}
      <span className="relative">{icon}</span>
    </span>
    <div className="min-w-0">
      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 leading-tight">
        {label}
      </div>
      <div
        className={`text-[11px] font-black uppercase leading-tight truncate ${
          active ? 'text-rose-300' : 'text-emerald-400/90'
        }`}
      >
        {active ? activeText : idleText}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */

export const SensorCards: React.FC<SensorCardsProps> = ({ worker }) => {
  if (!worker) {
    return null;
  }

  const overallStatus: SafetyStatus = computeWorkerStatus(worker);
  const overallLevel = workerLevel(worker);
  const isEmergency = overallStatus === 'EMERGENCY';

  const tempLevel = temperatureLevel(worker.temperature, worker.temperature_unsafe);
  const gLevel = gasLevel(worker.gas, worker.gas_unsafe);
  const sigLevel = rssiLevel(worker.rssi);
  const signal = rssiQuality(worker.rssi);

  const overallStyle = LEVEL_STYLES[overallLevel];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. AMBIENT TEMPERATURE ------------------------------------- */}
      <InstrumentCard
        title="Ambient Temperature"
        subtitle="Helmet thermal probe"
        level={tempLevel}
        footer={
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-500">Unsafe threshold</span>
            <span className="font-bold text-slate-300">&ge; 45 °C</span>
          </div>
        }
      >
        <RadialGauge
          value={worker.temperature}
          min={TEMPERATURE_SPEC.min}
          max={TEMPERATURE_SPEC.max}
          zones={TEMPERATURE_SPEC.zones}
          level={tempLevel}
          unit="°C"
          ariaLabel="Ambient temperature"
          icon={
            tempLevel === 'critical' ? (
              <Flame className="w-4 h-4" />
            ) : (
              <Thermometer className="w-4 h-4" />
            )
          }
          className="w-full max-w-[190px]"
        />
      </InstrumentCard>

      {/* 2. TOXIC GAS ------------------------------------------------ */}
      <InstrumentCard
        title="Toxic Gas Level"
        subtitle="MQ-series air sensor"
        level={gLevel}
        footer={
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-500">Unsafe threshold</span>
            <span className="font-bold text-slate-300">&ge; 300 AQI</span>
          </div>
        }
      >
        <RadialGauge
          value={worker.gas}
          min={GAS_SPEC.min}
          max={GAS_SPEC.max}
          zones={GAS_SPEC.zones}
          level={gLevel}
          unit="AQI"
          ariaLabel="Toxic gas concentration"
          icon={<Wind className="w-4 h-4" />}
          className="w-full max-w-[190px]"
        />
      </InstrumentCard>

      {/* 3. RADIO LINK ----------------------------------------------- */}
      <InstrumentCard
        title="Radio Link Quality"
        subtitle="BLE uplink to gateway"
        level={sigLevel}
        footer={
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-500">Link grade</span>
            <span className={`font-bold ${LEVEL_STYLES[sigLevel].text}`}>
              {signal.label.toUpperCase()}
            </span>
          </div>
        }
      >
        <RadialGauge
          value={worker.rssi}
          min={RSSI_SPEC.min}
          max={RSSI_SPEC.max}
          zones={RSSI_SPEC.zones}
          level={sigLevel}
          unit="dBm"
          ariaLabel="Radio signal strength"
          icon={<Signal className="w-4 h-4" />}
          className="w-full max-w-[190px]"
        />
      </InstrumentCard>

      {/* 4. WORKER SAFETY STATUS ------------------------------------- */}
      <section
        className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 flex flex-col ${
          isEmergency ? 'industrial-card-emergency animate-emergency-flash' : 'industrial-card'
        }`}
      >
        <span
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{
            background: `linear-gradient(90deg, transparent, ${overallStyle.hex}, transparent)`,
            opacity: overallLevel === 'safe' ? 0.45 : 0.95,
          }}
        />

        {isEmergency && (
          <div className="absolute inset-0 hazard-stripes opacity-[0.12] pointer-events-none" />
        )}

        <header className="relative flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-[11px] sm:text-xs font-black uppercase tracking-[0.14em] text-slate-200">
              Worker Safety Status
            </h3>
            <p className="text-[10px] font-medium text-slate-500 truncate">
              Node #{worker.node} &middot; {worker.worker_id}
            </p>
          </div>
          <span
            className={`p-2 rounded-xl border shrink-0 ${overallStyle.bg} ${overallStyle.text} ${overallStyle.border} ${
              isEmergency ? 'animate-pulse' : ''
            }`}
          >
            {isEmergency ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
          </span>
        </header>

        {/* Headline verdict */}
        <div className="relative py-3">
          <div
            className={`readout font-mono text-3xl sm:text-[2.1rem] font-black uppercase tracking-tight leading-none ${overallStyle.text} ${
              isEmergency ? 'animate-pulse' : ''
            }`}
          >
            {overallStatus}
          </div>
          <p className="mt-1.5 text-[11px] font-medium text-slate-300 leading-snug">
            {workerReason(worker)}
          </p>
        </div>

        {/* Hazard lamp bank */}
        <div className="relative grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-1 gap-2 mt-auto">
          <HazardLamp
            active={worker.manual_sos}
            label="Manual SOS"
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            activeText="Engaged"
            idleText="Standby"
          />
          <HazardLamp
            active={worker.fall}
            label="Fall / IMU"
            icon={<HeartCrack className="w-3.5 h-3.5" />}
            activeText="Detected"
            idleText="Stable"
          />
        </div>

        <footer className="relative pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-slate-500 truncate">
            Seq #{worker.sequence} &middot; {worker.message}
          </span>
          <StatusPill level={overallLevel} solid={isEmergency}>
            {worker.worker_id}
          </StatusPill>
        </footer>
      </section>
    </div>
  );
};
