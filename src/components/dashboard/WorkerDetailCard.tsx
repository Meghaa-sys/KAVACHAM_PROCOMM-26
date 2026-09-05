'use client';

import React from 'react';
import { WorkerData, SafetyStatus } from '@/types/worker';
import { computeWorkerStatus } from '@/hooks/useLiveWorkerData';
import { LinearMeter, StatusPill } from '@/components/ui/Gauge';
import {
  GAS_SPEC,
  LEVEL_STYLES,
  RSSI_SPEC,
  TEMPERATURE_SPEC,
  gasLevel,
  rssiLevel,
  rssiQuality,
  temperatureLevel,
  workerLevel,
  workerReason,
} from '@/lib/metrics';
import {
  User,
  Wifi,
  Thermometer,
  Wind,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Server,
  Hash,
  Bluetooth,
  MessageSquare,
  HeartCrack,
  Cpu,
} from 'lucide-react';

interface WorkerDetailCardProps {
  worker: WorkerData | null;
}

/* Small labelled data cell used across the telemetry grid. */
const DataTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  tone?: 'neutral' | 'alert';
  className?: string;
}> = ({ icon, label, children, tone = 'neutral', className = '' }) => (
  <div
    className={`instrument-well rounded-xl p-3 sm:p-3.5 space-y-1.5 ${
      tone === 'alert' ? '!border-rose-500/50 !bg-rose-950/40' : ''
    } ${className}`}
  >
    <div className="flex items-center gap-1.5 text-slate-400">
      <span className="text-cyan-400 shrink-0">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-[0.1em] truncate">{label}</span>
    </div>
    {children}
  </div>
);

export const WorkerDetailCard: React.FC<WorkerDetailCardProps> = ({ worker }) => {
  if (!worker) {
    return null;
  }

  const overallStatus: SafetyStatus = computeWorkerStatus(worker);
  const level = workerLevel(worker);
  const style = LEVEL_STYLES[level];
  const isEmergency = overallStatus === 'EMERGENCY';

  const tempLevel = temperatureLevel(worker.temperature, worker.temperature_unsafe);
  const gLevel = gasLevel(worker.gas, worker.gas_unsafe);
  const sigLevel = rssiLevel(worker.rssi);
  const signal = rssiQuality(worker.rssi);

  return (
    <section
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 ${
        isEmergency
          ? 'bg-gradient-to-b from-rose-950/70 via-industrial-900/90 to-industrial-950 border border-rose-500/70 shadow-[0_0_40px_-12px_rgba(239,68,68,0.55)]'
          : 'industrial-card'
      }`}
      aria-label={`Telemetry detail for ${worker.worker_id}`}
    >
      {isEmergency && (
        <div className="absolute inset-x-0 top-0 h-1 hazard-stripes" aria-hidden="true" />
      )}

      {/* ---------------- Identity bar ---------------- */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center border shrink-0 ${
              isEmergency
                ? 'bg-rose-500/20 border-rose-400/60 text-rose-300'
                : 'bg-cyan-500/12 border-cyan-500/30 text-cyan-300'
            }`}
          >
            <User className="w-6 h-6 sm:w-7 sm:h-7" />
            <span
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-industrial-950"
              style={{ backgroundColor: style.hex }}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white font-mono truncate">
                {worker.worker_id}
              </h3>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-industrial-850 border border-white/[0.08] text-slate-300 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                LIVE NODE
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400 font-mono mt-1">
              <span>
                Node <strong className="text-slate-200">#{worker.node}</strong>
              </span>
              <span className="text-slate-700">|</span>
              <span>
                Type{' '}
                <strong className="text-slate-200">
                  {worker.node_type === 1 ? 'Miner Node' : `Node-${worker.node_type}`}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Verdict badge */}
        <div
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border self-stretch sm:self-center shrink-0 ${
            isEmergency
              ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-950/60 animate-pulse'
              : `${style.bg} ${style.text} ${style.border}`
          }`}
        >
          {isEmergency ? (
            <ShieldAlert className="w-5 h-5 shrink-0" />
          ) : (
            <ShieldCheck className="w-5 h-5 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-[0.14em] opacity-70 leading-none">
              Overall status
            </div>
            <div className="text-sm font-black uppercase tracking-wider leading-tight mt-0.5">
              {overallStatus}
            </div>
          </div>
        </div>
      </header>

      {/* ---------------- Reason strip ---------------- */}
      <div
        className="flex items-center gap-2 mt-4 px-3 py-2 rounded-xl border text-[11px] sm:text-xs font-medium"
        style={{
          backgroundColor: `${style.hex}12`,
          borderColor: `${style.hex}45`,
          color: style.hex,
        }}
      >
        <Cpu className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{workerReason(worker)}</span>
      </div>

      {/* ---------------- Primary readings with meters ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-5">
        {/* Temperature */}
        <div className="instrument-well rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-300">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.1em]">
                Temperature
              </span>
            </div>
            <StatusPill level={tempLevel} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="readout font-mono text-3xl font-black text-white">
              {worker.temperature}
            </span>
            <span className="text-base font-bold text-slate-400">°C</span>
          </div>
          <LinearMeter
            value={worker.temperature}
            min={TEMPERATURE_SPEC.min}
            max={TEMPERATURE_SPEC.max}
            zones={TEMPERATURE_SPEC.zones}
            level={tempLevel}
            showTicks
            label="Scale °C"
          />
          <div className="text-[10px] font-mono text-slate-500">
            Sensor flag:{' '}
            <span
              className={
                worker.temperature_unsafe ? 'text-rose-400 font-bold' : 'text-emerald-400'
              }
            >
              {worker.temperature_unsafe ? 'UNSAFE' : 'SAFE'}
            </span>
          </div>
        </div>

        {/* Gas */}
        <div className="instrument-well rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-300">
              <Wind className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.1em]">Gas Level</span>
            </div>
            <StatusPill level={gLevel} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="readout font-mono text-3xl font-black text-white">{worker.gas}</span>
            <span className="text-sm font-bold text-slate-400">AQI</span>
          </div>
          <LinearMeter
            value={worker.gas}
            min={GAS_SPEC.min}
            max={GAS_SPEC.max}
            zones={GAS_SPEC.zones}
            level={gLevel}
            showTicks
            label="Scale AQI"
          />
          <div className="text-[10px] font-mono text-slate-500">
            Sensor flag:{' '}
            <span className={worker.gas_unsafe ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {worker.gas_unsafe ? 'UNSAFE' : 'SAFE'}
            </span>
          </div>
        </div>

        {/* RSSI */}
        <div className="instrument-well rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-300">
              <Wifi className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-bold uppercase tracking-[0.1em]">
                RSSI Signal
              </span>
            </div>
            <StatusPill level={sigLevel}>{signal.label.toUpperCase()}</StatusPill>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="readout font-mono text-3xl font-black text-white">
              {worker.rssi}
            </span>
            <span className="text-sm font-bold text-slate-400">dBm</span>
          </div>
          <LinearMeter
            value={worker.rssi}
            min={RSSI_SPEC.min}
            max={RSSI_SPEC.max}
            zones={RSSI_SPEC.zones}
            level={sigLevel}
            showTicks
            label="Scale dBm"
          />
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className="h-1.5 flex-1 rounded-sm transition-colors"
                style={{
                  backgroundColor:
                    bar <= signal.bars ? LEVEL_STYLES[sigLevel].hex : 'rgba(36,50,77,0.9)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- Safety flags + node metadata ---------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 pt-4">
        <DataTile
          icon={<HeartCrack className={`w-3.5 h-3.5 ${worker.fall ? 'text-rose-400' : ''}`} />}
          label="Fall Detection"
          tone={worker.fall ? 'alert' : 'neutral'}
        >
          <div
            className={`text-sm sm:text-base font-black uppercase font-mono leading-tight ${
              worker.fall ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
            }`}
          >
            {worker.fall ? 'FALL DETECTED' : 'NORMAL'}
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            IMU: {worker.fall ? 'Triggered' : 'Stable'}
          </div>
        </DataTile>

        <DataTile
          icon={
            <AlertTriangle className={`w-3.5 h-3.5 ${worker.manual_sos ? 'text-rose-400' : ''}`} />
          }
          label="Manual SOS"
          tone={worker.manual_sos ? 'alert' : 'neutral'}
        >
          <div
            className={`text-sm sm:text-base font-black uppercase font-mono leading-tight ${
              worker.manual_sos ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
            }`}
          >
            {worker.manual_sos ? 'ACTIVE' : 'NORMAL'}
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            Switch: {worker.manual_sos ? 'ENGAGED' : 'STANDBY'}
          </div>
        </DataTile>

        <DataTile icon={<Server className="w-3.5 h-3.5" />} label="Gateway">
          <div
            className="text-xs sm:text-sm font-bold font-mono text-slate-200 truncate"
            title={worker.gateway}
          >
            {worker.gateway}
          </div>
          <div className="text-[10px] font-mono text-cyan-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Relay online
          </div>
        </DataTile>

        <DataTile icon={<Hash className="w-3.5 h-3.5" />} label="Sequence">
          <div className="readout text-base font-bold font-mono text-slate-100">
            #{worker.sequence}
          </div>
          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 min-w-0">
            <MessageSquare className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="text-slate-300 truncate">{worker.message}</span>
          </div>
        </DataTile>

        <DataTile
          icon={<Bluetooth className="w-3.5 h-3.5" />}
          label="BLE Address"
          className="col-span-2 lg:col-span-1"
        >
          <div
            className="text-xs font-bold font-mono text-slate-300 truncate"
            title={worker.ble_address}
          >
            {worker.ble_address}
          </div>
          <div className="text-[10px] font-mono text-slate-500">ESP32 node MAC</div>
        </DataTile>
      </div>
    </section>
  );
};
