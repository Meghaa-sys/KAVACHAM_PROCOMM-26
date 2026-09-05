'use client';

import React from 'react';
import { WorkerData, SafetyStatus } from '@/types/worker';
import { computeWorkerStatus } from '@/hooks/useLiveWorkerData';
import { User, ShieldAlert, ShieldCheck, AlertTriangle, Thermometer, Wind, Wifi } from 'lucide-react';

interface WorkersListProps {
  workers: WorkerData[];
  selectedWorkerId: string | null;
  onSelectWorker: (workerId: string) => void;
}

export const WorkersList: React.FC<WorkersListProps> = ({
  workers,
  selectedWorkerId,
  onSelectWorker,
}) => {
  if (!workers || workers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Active Worker Fleet</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-industrial-800 border border-industrial-700 text-cyan-300 font-mono">
              {workers.length} {workers.length === 1 ? 'Node' : 'Nodes'} Active
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Select a worker node to inspect real-time sensor telemetry and diagnostics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {workers.map((worker) => {
          const status: SafetyStatus = computeWorkerStatus(worker);
          const isSelected = selectedWorkerId === worker.worker_id;
          const isEmergency = status === 'EMERGENCY';
          const isWarning = status === 'WARNING';

          return (
            <button
              key={worker.worker_id}
              onClick={() => onSelectWorker(worker.worker_id)}
              className={`w-full text-left p-4 rounded-2xl transition-all duration-200 border relative overflow-hidden group ${
                isSelected
                  ? isEmergency
                    ? 'bg-rose-950/70 border-rose-500 shadow-lg shadow-rose-950/60 ring-2 ring-rose-500/50'
                    : 'bg-industrial-800 border-cyan-500/80 shadow-lg shadow-cyan-950/40 ring-2 ring-cyan-500/40'
                  : isEmergency
                  ? 'bg-rose-950/40 border-rose-600/60 hover:border-rose-500'
                  : 'bg-industrial-850/60 border-industrial-700/50 hover:border-industrial-600 hover:bg-industrial-800/80'
              }`}
            >
              {/* Emergency indicator stripe */}
              {isEmergency && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 animate-pulse" />
              )}

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border text-xs font-bold ${
                      isEmergency
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : isWarning
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-base text-white font-mono flex items-center gap-1.5">
                      {worker.worker_id}
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Node #{worker.node}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                    isEmergency
                      ? 'bg-rose-500 text-white animate-pulse'
                      : isWarning
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {status}
                </span>
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-industrial-700/40 text-xs font-mono">
                <div className="text-slate-300">
                  <span className="text-[10px] text-slate-400 block">TEMP</span>
                  <span className="font-bold">{worker.temperature}°C</span>
                </div>
                <div className="text-slate-300">
                  <span className="text-[10px] text-slate-400 block">GAS</span>
                  <span className="font-bold">{worker.gas}</span>
                </div>
                <div className="text-slate-300 text-right">
                  <span className="text-[10px] text-slate-400 block">RSSI</span>
                  <span className="font-bold">{worker.rssi} dBm</span>
                </div>
              </div>

              {/* Alert Reason Tag if any */}
              {isEmergency && (
                <div className="mt-2.5 text-[11px] font-semibold text-rose-300 bg-rose-950/80 px-2 py-1 rounded border border-rose-500/40 truncate">
                  {worker.manual_sos ? '🚨 Manual SOS' : worker.fall ? '⚠️ Fall' : '☣️ Gas Hazard'}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
