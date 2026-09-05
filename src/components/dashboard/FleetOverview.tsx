'use client';

import React from 'react';
import { WorkerData, ConnectionState } from '@/types/worker';
import { LEVEL_STYLES, MetricLevel, workerLevel } from '@/lib/metrics';
import { Users, ShieldAlert, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

interface FleetOverviewProps {
  workers: WorkerData[];
  packetCount: number;
  connectionState: ConnectionState;
  activeAlertCount: number;
}

interface Tile {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  hex: string;
  pulse?: boolean;
}

/**
 * Compact severity rollup for the whole fleet. Every tile carries its own
 * colour so an operator can triage the shift without reading a single number.
 */
export const FleetOverview: React.FC<FleetOverviewProps> = ({
  workers,
  packetCount,
  connectionState,
  activeAlertCount,
}) => {
  const counts: Record<MetricLevel, number> = {
    safe: 0,
    caution: 0,
    warning: 0,
    critical: 0,
  };

  workers.forEach((w) => {
    counts[workerLevel(w)] += 1;
  });

  const elevated = counts.caution + counts.warning;
  const isConnected = connectionState === 'CONNECTED';

  const tiles: Tile[] = [
    {
      label: 'Nodes Online',
      value: workers.length,
      sub: 'Registered WSN nodes',
      icon: <Users className="w-4 h-4" />,
      hex: '#06b6d4',
    },
    {
      label: 'Critical',
      value: counts.critical,
      sub: counts.critical > 0 ? 'Immediate response' : 'None in hazard',
      icon: <ShieldAlert className="w-4 h-4" />,
      hex: LEVEL_STYLES.critical.hex,
      pulse: counts.critical > 0,
    },
    {
      label: 'Elevated',
      value: elevated,
      sub: elevated > 0 ? 'Approaching limits' : 'All within band',
      icon: <AlertTriangle className="w-4 h-4" />,
      hex: LEVEL_STYLES.warning.hex,
    },
    {
      label: 'Normal',
      value: counts.safe,
      sub: 'Operating safely',
      icon: <ShieldCheck className="w-4 h-4" />,
      hex: LEVEL_STYLES.safe.hex,
    },
    {
      label: 'Packets',
      value: packetCount,
      sub: isConnected ? 'Telemetry streaming' : 'Link interrupted',
      icon: <Activity className="w-4 h-4" />,
      hex: isConnected ? '#06b6d4' : '#64748b',
    },
  ];

  return (
    <section
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3"
      aria-label="Fleet safety summary"
    >
      {tiles.map((tile, i) => (
        <div
          key={tile.label}
          className={`industrial-card rounded-xl sm:rounded-2xl p-3 sm:p-3.5 relative overflow-hidden ${
            i === 4 ? 'col-span-2 sm:col-span-1' : ''
          }`}
        >
          <span
            className="absolute inset-y-0 left-0 w-[3px]"
            style={{ backgroundColor: tile.hex, opacity: tile.pulse ? 1 : 0.55 }}
            aria-hidden="true"
          />

          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="label-eyebrow truncate">{tile.label}</span>
            <span
              className={`shrink-0 ${tile.pulse ? 'animate-pulse' : ''}`}
              style={{ color: tile.hex }}
            >
              {tile.icon}
            </span>
          </div>

          <div
            className={`readout font-mono text-2xl sm:text-3xl font-black leading-none ${
              tile.pulse ? 'animate-pulse' : ''
            }`}
            style={{ color: tile.hex }}
          >
            {tile.value}
          </div>

          <div className="text-[10px] font-medium text-slate-500 mt-1 truncate">{tile.sub}</div>
        </div>
      ))}

      {/* Screen-reader summary so the rollup is not colour-only */}
      <p className="sr-only">
        {workers.length} nodes online. {counts.critical} critical, {elevated} elevated,{' '}
        {counts.safe} normal. {activeAlertCount} unacknowledged alerts.
      </p>
    </section>
  );
};
