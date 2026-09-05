'use client';

import React from 'react';
import { WorkerData, SafetyStatus } from '@/types/worker';
import { computeWorkerStatus } from '@/hooks/useLiveWorkerData';
import { MiniGauge, StatusPill } from '@/components/ui/Gauge';
import {
  GAS_SPEC,
  LEVEL_STYLES,
  RSSI_SPEC,
  TEMPERATURE_SPEC,
  gasLevel,
  rssiLevel,
  temperatureLevel,
  workerLevel,
} from '@/lib/metrics';
import { User, Users, Check } from 'lucide-react';

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
    <section className="space-y-4" aria-label="Active worker fleet">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-slate-100 flex items-center flex-wrap gap-2">
            <Users className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Active Worker Fleet</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-industrial-850 border border-white/[0.08] text-cyan-300 font-mono font-bold">
              {workers.length} {workers.length === 1 ? 'NODE' : 'NODES'}
            </span>
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Tap a node to inspect its full sensor telemetry and diagnostics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-3 sm:gap-4">
        {workers.map((worker) => {
          const status: SafetyStatus = computeWorkerStatus(worker);
          const level = workerLevel(worker);
          const style = LEVEL_STYLES[level];
          const isSelected = selectedWorkerId === worker.worker_id;
          const isEmergency = status === 'EMERGENCY';

          const tLevel = temperatureLevel(worker.temperature, worker.temperature_unsafe);
          const gLevel = gasLevel(worker.gas, worker.gas_unsafe);
          const sLevel = rssiLevel(worker.rssi);

          return (
            <button
              key={worker.worker_id}
              type="button"
              onClick={() => onSelectWorker(worker.worker_id)}
              aria-pressed={isSelected}
              className={`relative w-full text-left rounded-2xl overflow-hidden border transition-all duration-200 industrial-card-interactive ${
                isSelected
                  ? isEmergency
                    ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/45 shadow-lg shadow-rose-950/50'
                    : 'bg-industrial-800/80 border-cyan-500/70 ring-2 ring-cyan-500/35 shadow-lg shadow-cyan-950/40'
                  : isEmergency
                  ? 'bg-rose-950/35 border-rose-600/50 hover:border-rose-500'
                  : 'bg-industrial-875/70 border-white/[0.07] hover:border-white/[0.16] hover:bg-industrial-850/80'
              }`}
            >
              {/* Severity rail */}
              <span
                className={`absolute inset-x-0 top-0 h-[3px] ${isEmergency ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: style.hex, opacity: level === 'safe' ? 0.5 : 1 }}
                aria-hidden="true"
              />

              <div className="p-3.5 sm:p-4">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0"
                      style={{
                        backgroundColor: `${style.hex}1f`,
                        borderColor: `${style.hex}55`,
                        color: style.hex,
                      }}
                    >
                      <User className="w-[18px] h-[18px]" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-sm sm:text-base text-white font-mono truncate">
                        {worker.worker_id}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Node #{worker.node}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isSelected && (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500 text-industrial-950">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                    {/* Show the finer severity word so the pill colour and its
                        label always agree - an amber chip reading "SAFE" is
                        exactly the ambiguity a control room cannot afford. */}
                    <StatusPill level={level} solid={isEmergency}>
                      {isEmergency ? status : LEVEL_STYLES[level].label}
                    </StatusPill>
                  </div>
                </div>

                {/* Three mini dials - reading at a glance without opening the node */}
                <div className="flex items-start justify-around gap-1 pt-3 border-t border-white/[0.06]">
                  <MiniGauge
                    value={worker.temperature}
                    min={TEMPERATURE_SPEC.min}
                    max={TEMPERATURE_SPEC.max}
                    level={tLevel}
                    label="Temp °C"
                    display={`${worker.temperature}`}
                  />
                  <MiniGauge
                    value={worker.gas}
                    min={GAS_SPEC.min}
                    max={GAS_SPEC.max}
                    level={gLevel}
                    label="Gas AQI"
                    display={`${worker.gas}`}
                  />
                  <MiniGauge
                    value={worker.rssi}
                    min={RSSI_SPEC.min}
                    max={RSSI_SPEC.max}
                    level={sLevel}
                    label="RSSI"
                    display={`${worker.rssi}`}
                  />
                </div>

                {/* Reason tag */}
                {isEmergency && (
                  <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-rose-200 bg-rose-950/80 px-2.5 py-1.5 rounded-lg border border-rose-500/50 truncate">
                    {worker.manual_sos
                      ? '🚨 Manual SOS engaged'
                      : worker.fall
                      ? '⚠️ Fall detected'
                      : worker.gas_unsafe
                      ? '☣️ Gas hazard'
                      : '🔥 Thermal hazard'}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
