'use client';

import React from 'react';
import { Shield, AlertTriangle, RefreshCw, Activity } from 'lucide-react';
import { ConnectionState } from '@/types/worker';

interface HeaderProps {
  connectionState: ConnectionState;
  secondsAgo: number | null;
  packetCount: number;
  activeAlertCount: number;
  onReconnect?: () => void;
  /** True only when the relay confirms the upstream MQTT broker is connected. */
  mqttConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  connectionState,
  secondsAgo,
  packetCount,
  activeAlertCount,
  onReconnect,
  mqttConnected = false,
}) => {
  const isConnected = connectionState === 'CONNECTED';
  const isConnecting = connectionState === 'CONNECTING';

  const linkTone = isConnected
    ? 'bg-emerald-500/12 border-emerald-500/45 text-emerald-300'
    : isConnecting
    ? 'bg-amber-400/12 border-amber-400/45 text-amber-300'
    : 'bg-rose-500/12 border-rose-500/50 text-rose-300';

  const dotTone = isConnected
    ? 'bg-emerald-400'
    : isConnecting
    ? 'bg-amber-400 animate-pulse'
    : 'bg-rose-500';

  return (
    <header className="sticky top-0 z-40 w-full glass-rail border-b border-white/[0.07] shadow-lg shadow-black/50">
      {/* Thin severity ribbon - turns red the moment anything is critical */}
      <div
        className={`h-[2px] w-full transition-colors ${
          activeAlertCount > 0
            ? 'bg-gradient-to-r from-rose-600 via-rose-400 to-rose-600 animate-pulse'
            : isConnected
            ? 'bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent'
            : 'bg-gradient-to-r from-transparent via-industrial-600 to-transparent'
        }`}
        aria-hidden="true"
      />

      <div className="px-3 sm:px-5 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3">
        {/* ------------------------- Brand ------------------------- */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            {isConnected && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-cyan-500" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl lg:text-2xl font-black tracking-[0.08em] text-slate-100 uppercase leading-none">
                KAVACHAM
              </h1>
              <span className="hidden xs:inline text-[9px] uppercase font-bold tracking-[0.12em] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                v1.0
              </span>
            </div>
            <p className="text-[9px] sm:text-[11px] font-semibold tracking-[0.1em] text-slate-500 uppercase truncate mt-0.5">
              <span className="hidden sm:inline">Worker Safety &amp; Environmental </span>
              Monitoring System
            </p>
          </div>
        </div>

        {/* --------------------- Status cluster --------------------- */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Critical alert count */}
          {activeAlertCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-500/60 text-rose-200 text-[10px] sm:text-xs font-black animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
              <span className="tabular-nums">{activeAlertCount}</span>
              <span className="hidden sm:inline uppercase tracking-wider">
                Critical Alert{activeAlertCount > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Link state */}
          <div
            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg border text-[10px] sm:text-xs font-semibold transition-all ${linkTone}`}
            role="status"
            aria-live="polite"
          >
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 ${dotTone}`}
              />
            </span>
            <span className="font-black uppercase tracking-wider">
              {isConnected ? 'LIVE' : isConnecting ? 'LINKING' : 'OFFLINE'}
            </span>
            <span className="hidden lg:inline text-[10px] font-mono opacity-70">
              {mqttConnected
                ? 'MQTT CONNECTED'
                : isConnecting
                ? 'AWAITING MQTT'
                : 'MQTT DISCONNECTED'}
            </span>
          </div>

          {/* Heartbeat / reconnect */}
          <button
            type="button"
            onClick={onReconnect}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-industrial-850 border border-white/[0.08] text-slate-300 text-[10px] sm:text-xs font-mono hover:border-cyan-500/40 hover:text-cyan-200 transition-colors group"
            title="Force reconnect to the WebSocket relay"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-180 transition-transform duration-500 shrink-0" />
            <span className="hidden md:inline text-slate-500">Updated</span>
            <span suppressHydrationWarning className="font-bold text-slate-100 tabular-nums">
              {secondsAgo !== null
                ? secondsAgo === 0
                  ? 'now'
                  : `${secondsAgo}s`
                : '—'}
            </span>
          </button>
        </div>
      </div>

      {/* --------- Mobile telemetry strip (below the fold on desktop) --------- */}
      <div className="sm:hidden flex items-center gap-3 px-3 pb-2 text-[10px] font-mono text-slate-500 overflow-x-auto no-scrollbar">
        <span className="flex items-center gap-1 shrink-0">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span className="text-slate-300 font-bold tabular-nums">{packetCount}</span> packets
        </span>
        <span className="text-slate-700">|</span>
        <span className="shrink-0 uppercase tracking-wider">{connectionState}</span>
        <span className="text-slate-700">|</span>
        <span className="shrink-0">Topic mine/test</span>
      </div>
    </header>
  );
};
