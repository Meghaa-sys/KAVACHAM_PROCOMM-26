'use client';

import React, { useState } from 'react';
import { ConnectionState, SocketState } from '@/types/worker';
import {
  Network,
  Radio,
  Server,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Cpu,
  ArrowRight,
} from 'lucide-react';

interface NetworkStatusProps {
  connectionState: ConnectionState;
  packetCount: number;
  currentWsUrl: string;
  onUpdateWsUrl: (url: string) => void;
  gatewayName?: string;
  /** Relay socket link, independent of the broker link. */
  socketState?: SocketState;
  /** True only when the relay confirms the upstream MQTT broker is connected. */
  mqttConnected?: boolean;
}

const InfoTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  meta?: React.ReactNode;
  value: string;
  valueTitle?: string;
  footer: React.ReactNode;
}> = ({ icon, label, meta, value, valueTitle, footer }) => (
  <div className="instrument-well rounded-2xl p-3.5 sm:p-4 space-y-1.5">
    <div className="flex items-center justify-between gap-2 text-slate-400">
      <span className="flex items-center gap-1.5 min-w-0">
        <span className="text-cyan-400 shrink-0">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] truncate">{label}</span>
      </span>
      {meta}
    </div>
    <div
      className="text-sm sm:text-base font-mono font-bold text-slate-100 truncate"
      title={valueTitle ?? value}
    >
      {value}
    </div>
    <div className="text-[10px] font-mono text-slate-500">{footer}</div>
  </div>
);

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  connectionState,
  packetCount,
  currentWsUrl,
  onUpdateWsUrl,
  gatewayName = 'KAVACHAM_GATEWAY',
  socketState = 'CONNECTING',
  mqttConnected = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [customUrl, setCustomUrl] = useState(currentWsUrl);

  const isConnected = connectionState === 'CONNECTED';
  const isConnecting = connectionState === 'CONNECTING';

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateWsUrl(customUrl.trim());
    setIsEditing(false);
  };

  const broker = process.env.NEXT_PUBLIC_MQTT_BROKER || '192.168.146.22';

  return (
    <section className="industrial-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 space-y-5">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0">
            <Network className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-xl font-bold text-white truncate">
              Network &amp; Gateway Topology
            </h3>
            <p className="text-[11px] text-slate-500">
              Live telemetry bridge from ESP32 mesh nodes to the control room
            </p>
          </div>
        </div>

        <span
          className={`self-start sm:self-center shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2 border ${
            isConnected
              ? 'bg-emerald-500/12 text-emerald-300 border-emerald-500/45'
              : isConnecting
              ? 'bg-amber-400/12 text-amber-300 border-amber-400/45'
              : 'bg-rose-500/12 text-rose-300 border-rose-500/50'
          }`}
          role="status"
        >
          {isConnected ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : isConnecting ? (
            <AlertCircle className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          {connectionState}
        </span>
      </header>

      {/* Signal chain - shows where a break would be if data stops flowing */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
        {[
          { label: 'ESP32 Nodes', icon: <Cpu className="w-3.5 h-3.5" />, ok: packetCount > 0 },
          { label: 'MQTT Broker', icon: <Server className="w-3.5 h-3.5" />, ok: mqttConnected },
          { label: 'WS Relay', icon: <Radio className="w-3.5 h-3.5" />, ok: socketState === 'CONNECTED' },
          { label: 'Dashboard', icon: <Network className="w-3.5 h-3.5" />, ok: true },
        ].map((hop, i, arr) => (
          <React.Fragment key={hop.label}>
            <span
              className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${
                hop.ok
                  ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300'
                  : 'bg-industrial-850 border-white/[0.08] text-slate-500'
              }`}
            >
              {hop.icon}
              {hop.label}
            </span>
            {i < arr.length - 1 && (
              <ArrowRight
                className={`w-3.5 h-3.5 shrink-0 ${
                  hop.ok ? 'text-emerald-500/60' : 'text-slate-700'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Endpoint grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <InfoTile
          icon={<Server className="w-3.5 h-3.5" />}
          label="MQTT Broker"
          meta={<span className="text-[9px] font-bold text-slate-500 shrink-0">PORT 1883</span>}
          value={broker}
          footer="TCP / industrial LAN"
        />

        <InfoTile
          icon={<Layers className="w-3.5 h-3.5" />}
          label="Subscribed Topic"
          meta={<span className="text-[9px] font-bold text-slate-500 shrink-0">QoS 0/1</span>}
          value="mine/test"
          footer="Upstream telemetry feed"
        />

        <InfoTile
          icon={<Radio className="w-3.5 h-3.5" />}
          label="WebSocket Bridge"
          meta={
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider shrink-0"
            >
              {isEditing ? 'Cancel' : 'Change'}
            </button>
          }
          value={currentWsUrl}
          footer={
            <>
              Packets received:{' '}
              <strong className="text-cyan-300 tabular-nums">{packetCount}</strong>
            </>
          }
        />

        <InfoTile
          icon={<Server className="w-3.5 h-3.5" />}
          label="Hardware Gateway"
          meta={<span className="text-[9px] font-bold text-emerald-400 shrink-0">ACTIVE</span>}
          value={gatewayName}
          footer="ESP32 central concentrator"
        />
      </div>

      {/* Endpoint editor */}
      {isEditing && (
        <form
          onSubmit={handleSaveUrl}
          className="p-4 rounded-2xl bg-industrial-925 border border-cyan-500/40 space-y-3 animate-scale-in"
        >
          <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-300">
            Configure WebSocket server endpoint
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="ws://10.10.189.91:8080 or ws://localhost:8080"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-industrial-980 border border-white/[0.1] text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-black uppercase tracking-wider transition-colors"
              >
                Connect
              </button>
              <button
                type="button"
                onClick={() => setCustomUrl('ws://localhost:8080')}
                className="shrink-0 px-3 py-3 rounded-xl bg-industrial-850 hover:bg-industrial-800 border border-white/[0.08] text-[10px] font-mono text-slate-300 transition-colors"
              >
                localhost:8080
              </button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
};
