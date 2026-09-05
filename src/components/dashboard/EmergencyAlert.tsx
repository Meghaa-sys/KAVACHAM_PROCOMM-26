'use client';

import React from 'react';
import { AlertInfo } from '@/types/worker';
import {
  AlertTriangle,
  Flame,
  Wind,
  AlertOctagon,
  CheckCircle2,
  BellRing,
  Clock,
  Cpu,
  CheckCheck,
} from 'lucide-react';

interface EmergencyAlertProps {
  alerts: AlertInfo[];
  onAcknowledge: (alertId: string) => void;
  onClearAll?: () => void;
}

export const EmergencyAlert: React.FC<EmergencyAlertProps> = ({
  alerts,
  onAcknowledge,
  onClearAll,
}) => {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type: AlertInfo['type']) => {
    switch (type) {
      case 'MANUAL_SOS':
        return <BellRing className="w-6 h-6 sm:w-7 sm:h-7 text-rose-300 animate-bounce" />;
      case 'FALL':
        return <AlertOctagon className="w-6 h-6 sm:w-7 sm:h-7 text-rose-300 animate-pulse" />;
      case 'GAS_UNSAFE':
        return <Wind className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300 animate-pulse" />;
      case 'TEMPERATURE_UNSAFE':
        return <Flame className="w-6 h-6 sm:w-7 sm:h-7 text-orange-400 animate-pulse" />;
      default:
        return <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-rose-300" />;
    }
  };

  const getAlertStyles = (severity: AlertInfo['severity']) => {
    if (severity === 'CRITICAL') {
      return {
        cardBg:
          'bg-gradient-to-r from-rose-950/95 via-red-900/75 to-rose-950/95 border-rose-500/80',
        textColor: 'text-rose-100',
        titleColor: 'text-white',
        chip: 'border-rose-400/60 text-rose-200',
        buttonClass:
          'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/60 border border-rose-400',
        glow: 'glow-emergency',
      };
    }
    if (severity === 'HIGH') {
      return {
        cardBg:
          'bg-gradient-to-r from-amber-950/95 via-orange-900/75 to-amber-950/95 border-amber-500/80',
        textColor: 'text-amber-100',
        titleColor: 'text-amber-50',
        chip: 'border-amber-400/60 text-amber-200',
        buttonClass:
          'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/60 border border-amber-400',
        glow: 'glow-warning',
      };
    }
    return {
      cardBg:
        'bg-gradient-to-r from-orange-950/95 via-red-950/75 to-orange-950/95 border-orange-500/80',
      textColor: 'text-orange-100',
      titleColor: 'text-orange-50',
      chip: 'border-orange-400/60 text-orange-200',
      buttonClass: 'bg-orange-600 hover:bg-orange-500 text-white border border-orange-400',
      glow: 'glow-warning',
    };
  };

  return (
    <section
      aria-label="Critical emergency alerts"
      aria-live="assertive"
      className="space-y-3"
    >
      {/* Stack header - lets an operator clear a burst of alerts in one action */}
      {alerts.length > 1 && onClearAll && (
        <div className="flex items-center justify-between gap-3 px-1">
          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-rose-300 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            {alerts.length} unacknowledged incidents
          </span>
          <button
            type="button"
            onClick={onClearAll}
            className="shrink-0 flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg bg-industrial-850 border border-white/[0.1] text-slate-300 hover:text-white hover:border-white/25 font-black uppercase tracking-wider transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Ack all
          </button>
        </div>
      )}

      {alerts.map((alert) => {
        const style = getAlertStyles(alert.severity);
        const alertTime = new Date(alert.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        return (
          <article
            key={alert.id}
            className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 animate-emergency-flash ${style.cardBg} ${style.glow}`}
          >
            {/* Background warning pattern */}
            <div className="absolute inset-0 hazard-stripes opacity-25 pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Icon + copy */}
              <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                <div className="p-2.5 sm:p-3 rounded-2xl bg-black/45 border border-white/20 shrink-0 shadow-inner">
                  {getAlertIcon(alert.type)}
                </div>

                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center flex-wrap gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.12em] bg-black/55 border ${style.chip}`}
                    >
                      {alert.severity} priority
                    </span>
                    <h2
                      className={`text-base sm:text-xl lg:text-2xl font-black tracking-tight leading-tight ${style.titleColor}`}
                    >
                      {alert.title}
                    </h2>
                  </div>

                  <p className={`text-xs sm:text-sm font-medium ${style.textColor}`}>
                    {alert.description}
                  </p>

                  <div className="flex items-center flex-wrap gap-1.5 pt-1 text-[10px] font-mono text-slate-200">
                    <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md">
                      <Cpu className="w-3 h-3 text-cyan-300" />
                      Node <strong className="text-white">{alert.node}</strong>
                    </span>
                    <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md">
                      <strong className="text-white">{alert.worker_id}</strong>
                    </span>
                    <span className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span suppressHydrationWarning className="text-white">
                        {alertTime}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Acknowledge */}
              <div className="w-full lg:w-auto shrink-0">
                <button
                  id={`ack-btn-${alert.id}`}
                  type="button"
                  onClick={() => onAcknowledge(alert.id)}
                  className={`w-full lg:w-auto px-5 sm:px-6 py-3 rounded-xl font-black uppercase tracking-[0.1em] text-xs sm:text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 ${style.buttonClass}`}
                >
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Acknowledge</span>
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
};
