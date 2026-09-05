'use client';

import React, { useState } from 'react';
import { ConnectionState } from '@/types/worker';
import {
  Network,
  Radio,
  Server,
  Activity,
  Layers,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Settings2,
  RefreshCw
} from 'lucide-react';

interface NetworkStatusProps {
  connectionState: ConnectionState;
  packetCount: number;
  currentWsUrl: string;
  onUpdateWsUrl: (url: string) => void;
  gatewayName?: string;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  connectionState,
  packetCount,
  currentWsUrl,
  onUpdateWsUrl,
  gatewayName = 'KAVACHAM_GATEWAY',
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

  return (
    <div className="industrial-card rounded-3xl p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-industrial-700/60">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Network & Gateway Topology</h3>
            <p className="text-xs text-slate-400">
              Live telemetry bridge from ESP32 Mesh/Star nodes to Cloud Dashboard
            </p>
          </div>
        </div>

        {/* Global Connection Badge */}
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border ${
              isConnected
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950'
                : isConnecting
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : isConnecting ? (
              <AlertCircle className="w-4 h-4 text-amber-400 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{connectionState}</span>
          </span>
        </div>
      </div>

      {/* Network Info Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. MQTT Broker */}
        <div className="p-4 rounded-2xl bg-industrial-850/80 border border-industrial-700/50 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Server className="w-4 h-4 text-cyan-400" />
              MQTT Broker
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Port 1883</span>
          </div>
          <div className="text-lg font-mono font-bold text-slate-100">
            {process.env.NEXT_PUBLIC_MQTT_BROKER || '192.168.146.22'}
          </div>
          <div className="text-[11px] font-mono text-cyan-400">
            TCP / Industrial LAN
          </div>
        </div>

        {/* 2. MQTT Topic */}
        <div className="p-4 rounded-2xl bg-industrial-850/80 border border-industrial-700/50 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              Subscribed Topic
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">QoS 0/1</span>
          </div>
          <div className="text-lg font-mono font-bold text-slate-100 truncate" title="mine/test">
            mine/test
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Telemetry Feed
          </div>
        </div>

        {/* 3. WebSocket Endpoint */}
        <div className="p-4 rounded-2xl bg-industrial-850/80 border border-industrial-700/50 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-cyan-400" />
              WebSocket Bridge
            </span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
            >
              {isEditing ? 'Cancel' : 'Change'}
            </button>
          </div>
          <div className="text-sm font-mono font-bold text-slate-100 truncate" title={currentWsUrl}>
            {currentWsUrl}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            Packets Received: <strong className="text-cyan-300">{packetCount}</strong>
          </div>
        </div>

        {/* 4. Active Gateway */}
        <div className="p-4 rounded-2xl bg-industrial-850/80 border border-industrial-700/50 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Server className="w-4 h-4 text-cyan-400" />
              Hardware Gateway
            </span>
            <span className="text-[10px] font-bold text-emerald-400">ACTIVE</span>
          </div>
          <div className="text-lg font-mono font-bold text-slate-100 truncate" title={gatewayName}>
            {gatewayName}
          </div>
          <div className="text-[11px] font-mono text-slate-400">
            ESP32 Central Concentrator
          </div>
        </div>
      </div>

      {/* URL Configuration Form if opened */}
      {isEditing && (
        <form onSubmit={handleSaveUrl} className="p-4 rounded-2xl bg-industrial-900 border border-cyan-500/40 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Configure WebSocket Server Endpoint
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="ws://10.10.189.91:8080 or ws://localhost:8080"
              className="flex-1 px-4 py-2.5 rounded-xl bg-industrial-950 border border-industrial-700 text-sm font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Connect Endpoint
              </button>
              <button
                type="button"
                onClick={() => setCustomUrl('ws://localhost:8080')}
                className="px-3 py-2.5 rounded-xl bg-industrial-800 hover:bg-industrial-700 border border-industrial-700 text-xs font-mono text-slate-300 transition-colors"
              >
                Localhost:8080
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
