'use client';

import React from 'react';
import { BroadcastCommand } from '@/types/worker';
import { Radio, AlertTriangle, Layers, Wind, Flame, Waves, CheckCircle2, Volume2, Vibrate, Zap } from 'lucide-react';

interface ActiveBroadcastBannerProps {
  broadcast: BroadcastCommand | null;
  onCancel: () => void;
}

export const ActiveBroadcastBanner: React.FC<ActiveBroadcastBannerProps> = ({
  broadcast,
  onCancel,
}) => {
  if (!broadcast) return null;

  const isAllClear = broadcast.command === 'ALL_CLEAR';
  if (isAllClear) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-rose-500 bg-gradient-to-r from-rose-950 via-red-900 to-rose-950 p-5 sm:p-6 shadow-2xl shadow-rose-950 animate-emergency-flash my-4">
      {/* Hazard stripes background */}
      <div className="absolute inset-0 hazard-stripes opacity-40 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Side: Animated Siren & Details */}
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-black/60 border border-rose-400 text-rose-300 shrink-0 shadow-inner animate-bounce">
            <Radio className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center flex-wrap gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                SURFACE ➔ UNDERGROUND EVACUATION SIREN ACTIVE
              </span>
              <span className="text-xs font-mono text-rose-200">
                MQTT Topic: <strong className="text-white">mine/command</strong>
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black tracking-wide text-white uppercase">
              {broadcast.alert_type === 'EARTHQUAKE'
                ? '🚨 SEISMIC TREMOR / EARTHQUAKE EVACUATION WARNING'
                : `🚨 ${broadcast.alert_type} EVACUATION BROADCAST`}
            </h3>

            <p className="text-sm font-semibold text-rose-100 max-w-3xl">
              {broadcast.message}
            </p>

            {/* Hardware Actuation Badges */}
            <div className="flex items-center flex-wrap gap-2 pt-2 text-[11px] font-mono">
              <span className="px-2 py-0.5 rounded bg-black/50 border border-rose-400/40 text-rose-300 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" /> Buzzer: {broadcast.buzzer ? 'ENGAGED' : 'OFF'}
              </span>
              <span className="px-2 py-0.5 rounded bg-black/50 border border-rose-400/40 text-rose-300 flex items-center gap-1">
                <Vibrate className="w-3.5 h-3.5" /> Haptic Vibration: {broadcast.vibration ? 'ENGAGED' : 'OFF'}
              </span>
              <span className="px-2 py-0.5 rounded bg-black/50 border border-rose-400/40 text-rose-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> LED Strobe: {broadcast.led_strobe ? 'FLASHING' : 'OFF'}
              </span>
              <span className="px-2 py-0.5 rounded bg-black/50 border border-cyan-400/40 text-cyan-300">
                Target: {broadcast.target}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Cancel / All Clear Button */}
        <div className="w-full md:w-auto flex items-center justify-end shrink-0 pt-2 md:pt-0">
          <button
            onClick={onCancel}
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-wider text-xs shadow-xl shadow-emerald-950 transition-all border border-emerald-400 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>TRANSMIT ALL CLEAR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
