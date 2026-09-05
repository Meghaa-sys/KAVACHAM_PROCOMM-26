'use client';

import React from 'react';
import { Thermometer, Wind, ShieldAlert, ShieldCheck, Activity, Flame, HeartPulse } from 'lucide-react';
import { WorkerData, SafetyStatus } from '@/types/worker';
import { computeWorkerStatus } from '@/hooks/useLiveWorkerData';

interface SensorCardsProps {
  worker: WorkerData | null;
}

export const SensorCards: React.FC<SensorCardsProps> = ({ worker }) => {
  if (!worker) {
    return null;
  }

  const overallStatus: SafetyStatus = computeWorkerStatus(worker);
  const isEmergency = overallStatus === 'EMERGENCY';
  const isWarning = overallStatus === 'WARNING';

  const isTempUnsafe = worker.temperature_unsafe || worker.temperature >= 45;
  const isGasUnsafe = worker.gas_unsafe || worker.gas >= 300;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* 1. TEMPERATURE SENSOR CARD */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
          isTempUnsafe
            ? 'bg-gradient-to-br from-rose-950/90 via-red-900/50 to-industrial-900 border-2 border-rose-500 shadow-xl shadow-rose-950/50 animate-pulse'
            : 'industrial-card'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Ambient Temperature
            </span>
            <div className="flex items-baseline gap-1.5 pt-1">
              <span className="text-4xl lg:text-5xl font-black tracking-tight text-white font-mono">
                {worker.temperature}
              </span>
              <span className="text-2xl font-bold text-slate-300">°C</span>
            </div>
          </div>
          <div
            className={`p-3.5 rounded-2xl ${
              isTempUnsafe
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
            }`}
          >
            {isTempUnsafe ? <Flame className="w-7 h-7" /> : <Thermometer className="w-7 h-7" />}
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-5 pt-4 border-t border-industrial-700/60 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Environmental State</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${
              isTempUnsafe
                ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {isTempUnsafe ? 'UNSAFE' : 'NORMAL'}
          </span>
        </div>
      </div>

      {/* 2. GAS SENSOR CARD */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
          isGasUnsafe
            ? 'bg-gradient-to-br from-amber-950/90 via-orange-900/50 to-industrial-900 border-2 border-amber-500 shadow-xl shadow-amber-950/50 animate-pulse'
            : 'industrial-card'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Toxic Gas Concentration
            </span>
            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-4xl lg:text-5xl font-black tracking-tight text-white font-mono">
                {worker.gas}
              </span>
              <span className="text-sm font-semibold uppercase text-slate-400">AQI / PPM</span>
            </div>
          </div>
          <div
            className={`p-3.5 rounded-2xl ${
              isGasUnsafe
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            <Wind className="w-7 h-7" />
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-5 pt-4 border-t border-industrial-700/60 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Atmosphere Status</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${
              isGasUnsafe
                ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {isGasUnsafe ? 'UNSAFE' : 'SAFE'}
          </span>
        </div>
      </div>

      {/* 3. WORKER SAFETY STATUS CARD (PROMINENT RED EMERGENCY STYLE WHEN SOS / HAZARD) */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${
          isEmergency
            ? 'industrial-card-emergency'
            : isWarning
            ? 'bg-gradient-to-br from-amber-950/80 via-orange-950/40 to-industrial-900 border-2 border-amber-500/80 shadow-lg shadow-amber-950/40'
            : 'industrial-card border-emerald-500/30'
        }`}
      >
        {isEmergency && (
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        )}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Worker Safety Status
            </span>
            <div className="flex items-baseline gap-2 pt-1">
              <span
                className={`text-3xl lg:text-4xl font-black tracking-wider uppercase font-mono ${
                  isEmergency
                    ? 'text-rose-400 animate-pulse'
                    : isWarning
                    ? 'text-amber-300'
                    : 'text-emerald-400'
                }`}
              >
                {overallStatus}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-300 pt-1">
              {worker.manual_sos
                ? '⚠️ Manual SOS button triggered'
                : worker.fall
                ? '⚠️ Impact/Fall detected'
                : worker.gas_unsafe
                ? '⚠️ Hazardous gas condition'
                : worker.temperature_unsafe
                ? '⚠️ High thermal condition'
                : 'All vitals and perimeter normal'}
            </p>
          </div>
          <div
            className={`p-3.5 rounded-2xl ${
              isEmergency
                ? 'bg-rose-500/30 text-rose-300 border border-rose-400/50 animate-bounce'
                : isWarning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {isEmergency ? (
              <ShieldAlert className="w-7 h-7" />
            ) : (
              <ShieldCheck className="w-7 h-7" />
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-5 pt-4 border-t border-industrial-700/60 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Node ID: {worker.node}</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${
              isEmergency
                ? 'bg-rose-500 text-white shadow-md shadow-rose-950 animate-pulse'
                : isWarning
                ? 'bg-amber-500/30 text-amber-200'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            {worker.worker_id}
          </span>
        </div>
      </div>
    </div>
  );
};
