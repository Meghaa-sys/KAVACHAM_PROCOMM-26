'use client';

import React from 'react';
import { WorkerData, SafetyStatus } from '@/types/worker';
import { computeWorkerStatus } from '@/hooks/useLiveWorkerData';
import {
  User,
  Radio,
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
  Activity,
  HeartCrack,
  Clock
} from 'lucide-react';

interface WorkerDetailCardProps {
  worker: WorkerData | null;
}

export const WorkerDetailCard: React.FC<WorkerDetailCardProps> = ({ worker }) => {
  if (!worker) {
    return null;
  }

  const overallStatus: SafetyStatus = computeWorkerStatus(worker);
  const isEmergency = overallStatus === 'EMERGENCY';
  const isWarning = overallStatus === 'WARNING';

  // RSSI Signal Strength Calculation
  const getSignalStrength = (rssi: number) => {
    if (rssi >= -60) return { label: 'Excellent', bars: 4, color: 'text-emerald-400' };
    if (rssi >= -75) return { label: 'Good', bars: 3, color: 'text-cyan-400' };
    if (rssi >= -85) return { label: 'Fair', bars: 2, color: 'text-amber-400' };
    return { label: 'Weak', bars: 1, color: 'text-rose-400' };
  };

  const signal = getSignalStrength(worker.rssi);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 lg:p-8 transition-all duration-300 ${
        isEmergency
          ? 'bg-gradient-to-b from-rose-950/80 via-industrial-900/90 to-industrial-950 border-2 border-rose-500 shadow-2xl shadow-rose-950/60'
          : 'industrial-card'
      }`}
    >
      {/* Top Bar: Worker ID, Node, Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-industrial-700/60">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner ${
              isEmergency
                ? 'bg-rose-500/20 border-rose-400/50 text-rose-300'
                : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
            }`}
          >
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl lg:text-3xl font-black tracking-tight text-white font-mono">
                {worker.worker_id}
              </h3>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-industrial-800 border border-industrial-700 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Live Node
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono mt-1">
              <span>Node ID: <strong className="text-slate-200">#{worker.node}</strong></span>
              <span>•</span>
              <span>Type: <strong className="text-slate-200">{worker.node_type === 1 ? 'Miner Node' : `Node-${worker.node_type}`}</strong></span>
            </div>
          </div>
        </div>

        {/* Status indicator badge */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <div
            className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider flex items-center gap-2 border ${
              isEmergency
                ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-950 animate-pulse'
                : isWarning
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}
          >
            {isEmergency ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
            <span>STATUS: {overallStatus}</span>
          </div>
        </div>
      </div>

      {/* Grid of Telemetry Parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-6">
        {/* Temperature */}
        <div className="p-4 rounded-xl bg-industrial-850/70 border border-industrial-700/50 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              Temperature
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {worker.temperature} <span className="text-sm text-slate-400">°C</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Status: <span className={worker.temperature_unsafe ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {worker.temperature_unsafe ? 'UNSAFE' : 'SAFE'}
            </span>
          </div>
        </div>

        {/* Gas */}
        <div className="p-4 rounded-xl bg-industrial-850/70 border border-industrial-700/50 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-cyan-400" />
              Gas Level
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {worker.gas} <span className="text-xs text-slate-400 font-normal">AQI</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Status: <span className={worker.gas_unsafe ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {worker.gas_unsafe ? 'UNSAFE' : 'SAFE'}
            </span>
          </div>
        </div>

        {/* RSSI Signal */}
        <div className="p-4 rounded-xl bg-industrial-850/70 border border-industrial-700/50 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-cyan-400" />
              RSSI Signal
            </span>
            <span className={`text-[10px] font-bold uppercase ${signal.color}`}>
              {signal.label}
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {worker.rssi} <span className="text-sm text-slate-400">dBm</span>
          </div>
          <div className="flex items-center gap-1 pt-1">
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={`h-1.5 flex-1 rounded-sm ${
                  bar <= signal.bars ? 'bg-cyan-400' : 'bg-industrial-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Fall Detection */}
        <div
          className={`p-4 rounded-xl border space-y-1 ${
            worker.fall
              ? 'bg-rose-950/60 border-rose-500/60'
              : 'bg-industrial-850/70 border-industrial-700/50'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <HeartCrack className={`w-4 h-4 ${worker.fall ? 'text-rose-400' : 'text-slate-400'}`} />
              Fall Detection
            </span>
          </div>
          <div
            className={`text-xl font-black uppercase font-mono ${
              worker.fall ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
            }`}
          >
            {worker.fall ? 'FALL DETECTED' : 'NORMAL'}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            IMU Sensor: {worker.fall ? 'Triggered' : 'Stable'}
          </div>
        </div>

        {/* Manual SOS */}
        <div
          className={`p-4 rounded-xl border space-y-1 ${
            worker.manual_sos
              ? 'bg-rose-950/80 border-rose-500/80 shadow-md shadow-rose-950'
              : 'bg-industrial-850/70 border-industrial-700/50'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className={`w-4 h-4 ${worker.manual_sos ? 'text-rose-400' : 'text-slate-400'}`} />
              Manual SOS
            </span>
          </div>
          <div
            className={`text-xl font-black uppercase font-mono ${
              worker.manual_sos ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
            }`}
          >
            {worker.manual_sos ? 'ACTIVE' : 'NORMAL'}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            SOS Switch: {worker.manual_sos ? 'ENGAGED' : 'STANDBY'}
          </div>
        </div>

        {/* Gateway */}
        <div className="p-4 rounded-xl bg-industrial-850/70 border border-industrial-700/50 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Server className="w-4 h-4 text-cyan-400" />
              Gateway
            </span>
          </div>
          <div className="text-base font-bold font-mono text-slate-200 truncate" title={worker.gateway}>
            {worker.gateway}
          </div>
          <div className="text-[11px] font-mono text-cyan-400">
            Relay Online
          </div>
        </div>

        {/* Sequence & Message */}
        <div className="p-4 rounded-xl bg-industrial-850/70 border border-industrial-700/50 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-cyan-400" />
              Sequence #
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            #{worker.sequence}
          </div>
          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-cyan-400" />
            <span className="text-slate-200 truncate">{worker.message}</span>
          </div>
        </div>

        {/* BLE MAC Address */}
        <div className="p-4 rounded-xl bg-industrial-850/70 border border-industrial-700/50 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <Bluetooth className="w-4 h-4 text-cyan-400" />
              BLE Address
            </span>
          </div>
          <div className="text-sm font-bold font-mono text-slate-300 truncate" title={worker.ble_address}>
            {worker.ble_address}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            ESP32 Node MAC
          </div>
        </div>
      </div>
    </div>
  );
};
