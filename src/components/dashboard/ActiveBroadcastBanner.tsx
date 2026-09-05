'use client';

import React from 'react';
import { BroadcastCommand } from '@/types/worker';
import { Radio, CheckCircle2, Volume2, Vibrate, Zap, Target } from 'lucide-react';

interface ActiveBroadcastBannerProps {
  broadcast: BroadcastCommand | null;
  onCancel: () => void;
}

const ActuatorChip: React.FC<{
  icon: React.ReactNode;
  label: string;
  state: string;
  on: boolean;
}> = ({ icon, label, state, on }) => (
  <span
    className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[10px] font-mono ${
      on
        ? 'bg-black/50 border-rose-400/50 text-rose-200'
        : 'bg-black/30 border-white/10 text-slate-500'
    }`}
  >
    <span className={on ? 'animate-pulse' : ''}>{icon}</span>
    <span className="hidden xs:inline">{label}:</span>
    <strong className={on ? 'text-white' : 'text-slate-400'}>{state}</strong>
  </span>
);

export const ActiveBroadcastBanner: React.FC<ActiveBroadcastBannerProps> = ({
  broadcast,
  onCancel,
}) => {
  if (!broadcast) return null;

  const isAllClear = broadcast.command === 'ALL_CLEAR';
  if (isAllClear) return null;

  return (
    <section
      role="alert"
      aria-live="assertive"
      className="relative overflow-hidden rounded-2xl border-2 border-rose-500 bg-gradient-to-r from-rose-950 via-red-900/90 to-rose-950 p-4 sm:p-5 shadow-2xl shadow-rose-950/70 animate-emergency-flash siren-sheen"
    >
      {/* Hazard stripes background */}
      <div className="absolute inset-0 hazard-stripes opacity-35 pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Siren + details */}
        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
          <div className="p-2.5 sm:p-3.5 rounded-2xl bg-black/60 border border-rose-400/70 text-rose-300 shrink-0 shadow-inner animate-bounce">
            <Radio className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>

          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center flex-wrap gap-2">
              <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] bg-rose-600 text-white animate-pulse">
                Surface &rarr; Underground siren active
              </span>
              <span className="text-[10px] font-mono text-rose-200/80">
                Topic <strong className="text-white">mine/command</strong>
              </span>
            </div>

            <h3 className="text-base sm:text-xl lg:text-2xl font-black tracking-tight text-white uppercase leading-tight">
              {broadcast.alert_type === 'EARTHQUAKE'
                ? '🚨 Seismic tremor / earthquake evacuation'
                : `🚨 ${broadcast.alert_type.replace(/_/g, ' ')} evacuation broadcast`}
            </h3>

            <p className="text-xs sm:text-sm font-semibold text-rose-100 max-w-3xl leading-snug">
              {broadcast.message}
            </p>

            {/* Hardware actuation badges */}
            <div className="flex items-center flex-wrap gap-1.5 pt-1.5">
              <ActuatorChip
                icon={<Volume2 className="w-3 h-3" />}
                label="Buzzer"
                state={broadcast.buzzer ? 'ENGAGED' : 'OFF'}
                on={broadcast.buzzer}
              />
              <ActuatorChip
                icon={<Vibrate className="w-3 h-3" />}
                label="Haptic"
                state={broadcast.vibration ? 'ENGAGED' : 'OFF'}
                on={broadcast.vibration}
              />
              <ActuatorChip
                icon={<Zap className="w-3 h-3" />}
                label="Strobe"
                state={broadcast.led_strobe ? 'FLASHING' : 'OFF'}
                on={broadcast.led_strobe}
              />
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/50 border border-cyan-400/40 text-cyan-300 text-[10px] font-mono">
                <Target className="w-3 h-3" />
                <strong className="text-white">{broadcast.target}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* All-clear */}
        <div className="w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="w-full lg:w-auto px-5 sm:px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.1em] text-xs shadow-xl shadow-emerald-950/60 transition-all active:scale-[0.97] border border-emerald-400 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Transmit all clear</span>
          </button>
        </div>
      </div>
    </section>
  );
};
