'use client';

import React from 'react';
import { Shield, Radio, Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { ConnectionState } from '@/types/worker';

interface HeaderProps {
  connectionState: ConnectionState;
  secondsAgo: number | null;
  packetCount: number;
  activeAlertCount: number;
  onReconnect?: () => void;
  onToggleSimulator?: () => void;
  isSimulatorActive?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  connectionState,
  secondsAgo,
  packetCount,
  activeAlertCount,
  onReconnect,
  onToggleSimulator,
  isSimulatorActive,
}) => {
  const isConnected = connectionState === 'CONNECTED';
  const isConnecting = connectionState === 'CONNECTING';

  return (
    <header className="sticky top-0 z-30 w-full bg-industrial-900/90 backdrop-blur-md border-b border-industrial-700/60 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-black/40">
      {/* Left: Brand & Subtitle */}
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shadow-inner">
          <Shield className="w-6 h-6 stroke-[2.2]" />
          {isConnected && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
            </span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-black tracking-wider text-slate-100 uppercase">
              KAVACHAM
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              v1.0 Live
            </span>
          </div>
          <p className="text-[11px] lg:text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Worker Safety & Environmental Monitoring System
          </p>
        </div>
      </div>

      {/* Right: Live Connection Indicator & Heartbeat Telemetry */}
      <div className="flex items-center flex-wrap gap-2.5 sm:gap-4">
        {/* Active Alert Pill if any */}
        {activeAlertCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-bold animate-pulse shadow-sm shadow-rose-950">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{activeAlertCount} CRITICAL ALERT{activeAlertCount > 1 ? 'S' : ''}</span>
          </div>
        )}

        {/* Simulator Toggle Button (Useful for instant hardware testing/demo) */}
        {onToggleSimulator && (
          <button
            onClick={onToggleSimulator}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border transition-colors flex items-center gap-1.5 ${
              isSimulatorActive
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : 'bg-industrial-800 border-industrial-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Inject simulated ESP32 WSN node packets"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Test Node Sim</span>
          </button>
        )}

        {/* Live Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold tracking-wide transition-all ${
            isConnected
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-950'
              : isConnecting
              ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
              : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isConnected
                  ? 'bg-emerald-400'
                  : isConnecting
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
          </span>
          <span className="font-bold uppercase">
            {isConnected ? 'LIVE' : isConnecting ? 'CONNECTING...' : 'OFFLINE'}
          </span>
          <span className="text-slate-400 font-normal">|</span>
          <span className="text-[11px] font-mono text-slate-300 hidden sm:inline">
            {isConnected ? 'MQTT CONNECTED' : isConnecting ? 'SEARCHING WS' : 'MQTT DISCONNECTED'}
          </span>
        </div>

        {/* Last Updated Counter */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-industrial-800/80 border border-industrial-700/60 text-slate-300 text-xs font-mono">
          <RefreshCw
            className={`w-3.5 h-3.5 text-cyan-400 ${
              isConnected ? 'hover:rotate-180 transition-transform cursor-pointer' : ''
            }`}
            onClick={onReconnect}
          />
          <span className="text-slate-400">Last updated:</span>
          <span className="font-semibold text-slate-100">
            {secondsAgo !== null
              ? secondsAgo === 0
                ? 'just now'
                : `${secondsAgo}s ago`
              : 'waiting...'}
          </span>
        </div>
      </div>
    </header>
  );
};
