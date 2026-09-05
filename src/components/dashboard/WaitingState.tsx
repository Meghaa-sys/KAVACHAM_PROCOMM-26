'use client';

import React from 'react';
import { Radio, Cpu, RefreshCw, Terminal } from 'lucide-react';
import { ConnectionState } from '@/types/worker';

interface WaitingStateProps {
  connectionState: ConnectionState;
  /** True only when the relay confirms the upstream MQTT broker is connected. */
  mqttConnected?: boolean;
  onReconnect?: () => void;
  wsUrl: string;
}

export const WaitingState: React.FC<WaitingStateProps> = ({
  connectionState,
  mqttConnected = false,
  onReconnect,
  wsUrl,
}) => {
  const isConnecting = connectionState === 'CONNECTING';
  const isConnected = connectionState === 'CONNECTED';

  // Two independent links can be down. Say which one, so nobody hunts the
  // wrong end of the pipeline.
  const headline = mqttConnected
    ? 'Waiting for node telemetry'
    : 'Waiting for MQTT broker';
  const detail = mqttConnected
    ? 'Broker link is up. Listening for the first packet from the ESP32 WSN node on mine/test.'
    : 'The dashboard stays dark until the relay reports a live MQTT broker connection. No readings are shown until then.';

  return (
    <div className="industrial-card rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-14 text-center relative overflow-hidden border-dashed">
      {/* Radar sweep backdrop */}
      <div
        className="absolute inset-0 flex items-center justify-center opacity-[0.12] pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute w-[22rem] h-[22rem] sm:w-[30rem] sm:h-[30rem] rounded-full border border-cyan-400 animate-ping-slow" />
        <div className="absolute w-[14rem] h-[14rem] sm:w-[20rem] sm:h-[20rem] rounded-full border border-cyan-500 animate-pulse" />
        <div className="absolute w-[7rem] h-[7rem] sm:w-[11rem] sm:h-[11rem] rounded-full border border-cyan-300" />
      </div>

      <div className="relative z-10 max-w-xl mx-auto space-y-5 sm:space-y-6">
        {/* Beacon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl instrument-well !border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Radio className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500" />
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-[0.06em] text-slate-100">
            {headline}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
            {detail}
          </p>
        </div>

        {/* Endpoint pill */}
        <div className="inline-flex items-center flex-wrap justify-center gap-2 px-3 py-2 rounded-xl instrument-well text-[10px] sm:text-[11px] font-mono text-slate-300 max-w-full">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isConnected
                ? 'bg-emerald-400 animate-pulse'
                : isConnecting
                ? 'bg-amber-400 animate-ping'
                : 'bg-rose-500'
            }`}
          />
          <span suppressHydrationWarning className="truncate max-w-[16rem] sm:max-w-none">
            {wsUrl}
          </span>
          <span className="text-slate-700">|</span>
          <span className="uppercase text-cyan-300 font-bold tracking-wider">
            {connectionState}
          </span>
          <span className="text-slate-700">|</span>
          <span
            className={`uppercase font-bold tracking-wider ${
              mqttConnected ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            MQTT {mqttConnected ? 'UP' : 'DOWN'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
          {onReconnect && (
            <button
              type="button"
              onClick={onReconnect}
              className="px-4 py-3 rounded-xl bg-industrial-850 hover:bg-industrial-800 border border-white/[0.08] text-slate-300 text-[11px] font-bold uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span>Retry connect</span>
            </button>
          )}
        </div>

        {/* Runbook */}
        <div className="text-left instrument-well rounded-2xl p-4 text-[11px] font-mono text-slate-400 space-y-2">
          <div className="font-bold text-slate-200 flex items-center gap-2 text-[10px] uppercase tracking-[0.12em]">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Stream live ESP32 packets</span>
          </div>
          <ol className="space-y-1.5">
            <li className="flex gap-2">
              <span className="text-slate-600 shrink-0">1.</span>
              <span>
                Start the relay: <code className="text-cyan-300">npm run relay</code>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-600 shrink-0">2.</span>
              <span>
                Confirm the broker is reachable at{' '}
                <code className="text-cyan-300">mqtt://…:1883</code>
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-slate-600 shrink-0">3.</span>
              <span className="flex items-center gap-1.5 flex-wrap">
                <Cpu className="w-3 h-3 text-cyan-400 shrink-0" />
                ESP32 must publish to <code className="text-cyan-300">mine/test</code>
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};
