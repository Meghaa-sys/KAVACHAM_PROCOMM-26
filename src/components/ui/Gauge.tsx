'use client';

import React, { useEffect, useId, useState } from 'react';
import {
  GaugeZone,
  LEVEL_STYLES,
  MetricLevel,
  toFraction,
} from '@/lib/metrics';

/* ------------------------------------------------------------------ */
/* Shared geometry                                                     */
/* ------------------------------------------------------------------ */

/** Gauges sweep 270deg, starting at the 7:30 position and ending at 4:30. */
const SWEEP = 0.75;
const START_ANGLE = 135;

const polar = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

/**
 * Holds the arc at zero for one frame so it animates in on first paint.
 *
 * Note: only the *arc* is ever animated, never the numeral. A rolling counter
 * would briefly render a value the sensor never reported while the severity
 * pill beside it already reflects the new reading - on a safety dashboard that
 * mismatch is worse than a less flashy transition.
 */
function useArcReveal() {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setRevealed(true), 60);
    return () => window.clearTimeout(id);
  }, []);
  return revealed;
}

/* ------------------------------------------------------------------ */
/* RadialGauge                                                         */
/* ------------------------------------------------------------------ */

export interface RadialGaugeProps {
  value: number;
  min: number;
  max: number;
  level: MetricLevel;
  unit?: string;
  /** Zone ring segments drawn outside the main arc. */
  zones?: GaugeZone[];
  /** Outer square size in px. Component scales fluidly inside its container. */
  size?: number;
  thickness?: number;
  decimals?: number;
  /** Small caption under the numeric readout, e.g. "SAFE BELOW 35". */
  caption?: string;
  /** Rendered inside the dial above the number. */
  icon?: React.ReactNode;
  /** Overrides the level word shown in the pill. */
  statusLabel?: string;
  showScaleEnds?: boolean;
  className?: string;
  /** Accessible name; falls back to a generic description. */
  ariaLabel?: string;
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  value,
  min,
  max,
  level,
  unit,
  zones = [],
  size = 190,
  thickness = 13,
  decimals = 0,
  caption,
  icon,
  statusLabel,
  showScaleEnds = true,
  className = '',
  ariaLabel,
}) => {
  const style = LEVEL_STYLES[level];
  const revealed = useArcReveal();
  // Several gauges share one document, so <defs> ids must be instance-scoped.
  const uid = useId().replace(/:/g, '');
  const gradientId = `arc-${uid}`;
  const glowId = `glow-${uid}`;

  const cx = size / 2;
  const cy = size / 2;
  const zoneGap = 9;
  const zoneThickness = 4;
  const r = (size - thickness) / 2 - zoneThickness - zoneGap;
  const rZone = r + thickness / 2 + zoneGap;

  const c = 2 * Math.PI * r;
  const cZone = 2 * Math.PI * rZone;

  const fraction = toFraction(value, min, max);
  const shown = revealed ? fraction : 0;

  // The pointer is rotated (not repositioned) so it eases in lockstep with the
  // arc; repositioning made it snap ahead while the arc was still sweeping.
  const pointerAngle = shown * 360 * SWEEP;
  const pointerHome = polar(cx, cy, r, START_ANGLE);

  const isCritical = level === 'critical';

  return (
    <div
      className={`relative ${className}`}
      role="meter"
      aria-valuenow={Math.round(value * 100) / 100}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuetext={`${value}${unit ? ` ${unit}` : ''} - ${statusLabel ?? style.label}`}
      aria-label={ariaLabel ?? 'Sensor reading'}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-auto overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={style.hex} stopOpacity="0.55" />
            <stop offset="100%" stopColor={style.hex} stopOpacity="1" />
          </linearGradient>
          <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Threshold zone ring - shows where the danger bands sit on the scale */}
        <g transform={`rotate(${START_ANGLE} ${cx} ${cy})`}>
          {zones.map((zone, i) => {
            const start = toFraction(zone.from, min, max);
            const end = toFraction(zone.to, min, max);
            const span = Math.max(0, end - start);
            if (span <= 0) return null;
            return (
              <circle
                key={`${zone.level}-${i}`}
                cx={cx}
                cy={cy}
                r={rZone}
                fill="none"
                stroke={LEVEL_STYLES[zone.level].hex}
                strokeOpacity={zone.level === level ? 0.85 : 0.28}
                strokeWidth={zoneThickness}
                strokeLinecap="butt"
                strokeDasharray={`${span * SWEEP * cZone} ${cZone}`}
                strokeDashoffset={-start * SWEEP * cZone}
              />
            );
          })}
        </g>

        {/* Dial track */}
        <g transform={`rotate(${START_ANGLE} ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(36, 50, 77, 0.85)"
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${SWEEP * c} ${c}`}
          />

          {/* Live value arc */}
          <circle
            className="gauge-arc"
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${SWEEP * c} ${c}`}
            strokeDashoffset={SWEEP * c * (1 - shown)}
            filter={isCritical ? `url(#${glowId})` : undefined}
          />
        </g>

        {/* Minor scale ticks */}
        <g opacity="0.4">
          {Array.from({ length: 11 }).map((_, i) => {
            const a = START_ANGLE + (i / 10) * 360 * SWEEP;
            const outer = polar(cx, cy, r - thickness / 2 - 3, a);
            const inner = polar(cx, cy, r - thickness / 2 - (i % 5 === 0 ? 9 : 6), a);
            return (
              <line
                key={i}
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
                stroke={i % 5 === 0 ? '#9fb3dc' : '#4b618e'}
                strokeWidth={i % 5 === 0 ? 1.6 : 1}
                strokeLinecap="round"
              />
            );
          })}
        </g>

        {/* Value pointer - rotated around the dial centre */}
        <g
          className="gauge-pointer"
          style={{
            transform: `rotate(${pointerAngle}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
          }}
        >
          <circle
            cx={pointerHome.x}
            cy={pointerHome.y}
            r={thickness / 2 - 2.5}
            fill="#05070c"
            stroke={style.hex}
            strokeWidth="2.5"
            className="gauge-arc"
          />
        </g>
      </svg>

      {/* Centred readout */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-[16%]">
        {icon && (
          <div className={`mb-1 ${style.text} ${isCritical ? 'animate-pulse' : ''}`}>{icon}</div>
        )}
        <div className="flex items-baseline gap-1">
          <span className="readout font-mono text-3xl sm:text-4xl font-black text-white leading-none">
            {value.toFixed(decimals)}
          </span>
          {unit && (
            <span className="text-sm font-bold text-slate-400 leading-none">{unit}</span>
          )}
        </div>
        <span
          className={`mt-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-[0.12em] border ${style.bg} ${style.text} ${style.border} ${
            isCritical ? 'animate-pulse' : ''
          }`}
        >
          {statusLabel ?? style.label}
        </span>
        {caption && (
          <span className="mt-1.5 text-[10px] font-medium text-slate-500 leading-tight">
            {caption}
          </span>
        )}
      </div>

      {/* Scale end labels sit under the arc opening */}
      {showScaleEnds && (
        <div className="absolute inset-x-[8%] bottom-[4%] flex justify-between text-[9px] font-mono font-semibold text-slate-600">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* MiniGauge - compact dial for fleet cards                            */
/* ------------------------------------------------------------------ */

export interface MiniGaugeProps {
  value: number;
  min: number;
  max: number;
  level: MetricLevel;
  label: string;
  display?: string;
  size?: number;
}

export const MiniGauge: React.FC<MiniGaugeProps> = ({
  value,
  min,
  max,
  level,
  label,
  display,
  size = 58,
}) => {
  const style = LEVEL_STYLES[level];
  const revealed = useArcReveal();
  const thickness = 5;
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2 - 1;
  const c = 2 * Math.PI * r;
  const fraction = toFraction(value, min, max);
  const shown = revealed ? fraction : 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" aria-hidden="true">
          <g transform={`rotate(${START_ANGLE} ${cx} ${cy})`}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="rgba(36, 50, 77, 0.9)"
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${SWEEP * c} ${c}`}
            />
            <circle
              className="gauge-arc"
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={style.hex}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${SWEEP * c} ${c}`}
              strokeDashoffset={SWEEP * c * (1 - shown)}
            />
          </g>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="readout font-mono text-[11px] font-bold text-slate-100">
            {display ?? value}
          </span>
        </div>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* LinearMeter - horizontal bar with threshold zones                   */
/* ------------------------------------------------------------------ */

export interface LinearMeterProps {
  value: number;
  min: number;
  max: number;
  level: MetricLevel;
  zones?: GaugeZone[];
  /** Optional text shown above the bar, right-aligned. */
  valueText?: string;
  label?: string;
  showTicks?: boolean;
  className?: string;
}

export const LinearMeter: React.FC<LinearMeterProps> = ({
  value,
  min,
  max,
  level,
  zones = [],
  valueText,
  label,
  showTicks = false,
  className = '',
}) => {
  const style = LEVEL_STYLES[level];
  const revealed = useArcReveal();
  const fraction = toFraction(value, min, max);
  const pct = (revealed ? fraction : 0) * 100;

  return (
    <div className={className}>
      {(label || valueText) && (
        <div className="flex items-baseline justify-between gap-2 mb-1.5">
          {label && <span className="label-eyebrow">{label}</span>}
          {valueText && (
            <span className={`readout font-mono text-xs font-bold ${style.text}`}>
              {valueText}
            </span>
          )}
        </div>
      )}

      <div
        className="relative h-2 rounded-full overflow-hidden bg-industrial-800/90 ring-1 ring-inset ring-white/5"
        role="meter"
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={label ?? 'Reading'}
      >
        {/* Zone backdrop so the danger bands stay visible even at low readings */}
        {zones.map((zone, i) => {
          const start = toFraction(zone.from, min, max) * 100;
          const end = toFraction(zone.to, min, max) * 100;
          return (
            <div
              key={`${zone.level}-${i}`}
              className="absolute inset-y-0"
              style={{
                left: `${start}%`,
                width: `${Math.max(0, end - start)}%`,
                backgroundColor: LEVEL_STYLES[zone.level].hexMuted,
              }}
            />
          );
        })}

        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-[780ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${style.hex}80, ${style.hex})`,
            boxShadow: `0 0 12px -2px ${style.hex}`,
          }}
        />

        {/* Head marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1 h-3.5 rounded-full transition-[left] duration-[780ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ left: `${pct}%`, backgroundColor: '#ffffff', opacity: 0.9 }}
        />
      </div>

      {showTicks && (
        <div className="flex justify-between mt-1 text-[9px] font-mono text-slate-600">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* StatusPill - the shared severity chip                               */
/* ------------------------------------------------------------------ */

export interface StatusPillProps {
  level: MetricLevel;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  solid?: boolean;
  pulse?: boolean;
  className?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  level,
  children,
  icon,
  size = 'sm',
  solid = false,
  pulse,
  className = '',
}) => {
  const style = LEVEL_STYLES[level];
  const shouldPulse = pulse ?? level === 'critical';
  const sizing =
    size === 'md' ? 'px-3 py-1 text-xs gap-1.5' : 'px-2 py-0.5 text-[10px] gap-1';

  return (
    <span
      className={`inline-flex items-center rounded-full font-black uppercase tracking-[0.1em] border whitespace-nowrap ${sizing} ${
        solid ? `${style.solid} border-transparent` : `${style.bg} ${style.text} ${style.border}`
      } ${shouldPulse ? 'animate-pulse' : ''} ${className}`}
    >
      {icon}
      {children ?? style.label}
    </span>
  );
};
