'use client';

import React from 'react';
import { Radio, Cpu, Wifi, Play, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { ConnectionState } from '@/types/worker';

interface WaitingStateProps {
  connectionState: ConnectionState;
  onSimulateSample?: () => void;
  onReconnect?: () => void;
  wsUrl: string;
}

export const WaitingState: React.FC<WaitingStateProps> = ({
  connectionState,
  onSimulateSample,
  onReconnect,
  wsUrl,
}) => {
  const isConnecting = connectionState === 'CONNECTING';
  const isConnected = connectionState === 'CONNECTED';

  return (
    <div className="industrial-card rounded-3xl p-8 sm:p-12 text-center my-6 relative overflow-hidden border-2 border-dashed border-industrial-700">
      {/* Background radar animation */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-96 h-96 rounded-full border border-cyan-400 animate-ping" />
        <div className="w-64 h-64 rounded-full border border-cyan-500 animate-pulse" />
      </div>

      <div className="relative z-10 max-w-xl mx-auto space-y-6">
        {/* Radar / Sensor Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-3xl bg-industrial-800 border-2 border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-950">
            <Radio className="w-10 h-10 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500" />
          </span>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-2">
          <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-slate-100">
            Waiting for Live Sensor Data...
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            The dashboard is actively listening for telemetry packets from the ESP32 WSN nodes via MQTT and WebSocket.
          </p>
        </div>

        {/* Status Indicator Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-industrial-850 border border-industrial-700 text-xs font-mono text-slate-300">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected
                ? 'bg-emerald-400 animate-pulse'
                : isConnecting
                ? 'bg-amber-400 animate-ping'
                : 'bg-rose-500'
            }`}
          />
          <span>Endpoint: {wsUrl}</span>
          <span>•</span>
          <span className="uppercase text-cyan-300 font-semibold">{connectionState}</span>
        </div>

        {/* Diagnostic Actions & Sample Ingestion */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          {onSimulateSample && (
            <button
              onClick={onSimulateSample}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-950 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Load Sample Node Telemetry (WSN-1)</span>
            </button>
          )}

          {onReconnect && (
            <button
              onClick={onReconnect}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-industrial-800 hover:bg-industrial-700 border border-industrial-700 text-slate-300 text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry WS Connect</span>
            </button>
          )}
        </div>

        {/* Quick Instructions */}
        <div className="text-left bg-industrial-900/90 rounded-2xl p-4 border border-industrial-800 text-xs font-mono text-slate-400 space-y-1.5">
          <div className="font-bold text-slate-300 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>To stream live ESP32 hardware packets:</span>
          </div>
          <div>1. Start backend relay: <code className="text-cyan-300">npm run relay</code></div>
          <div>2. Or run test packet injector: <code className="text-cyan-300">npm run simulate</code></div>
          <div>3. Ensure ESP32 is publishing to MQTT topic: <code className="text-cyan-300">mine/test</code></div>
        </div>
      </div>
    </div>
  );
};
