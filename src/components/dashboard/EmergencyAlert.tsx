'use client';

import React from 'react';
import { AlertInfo } from '@/types/worker';
import { AlertTriangle, Flame, Wind, AlertOctagon, CheckCircle2, BellRing, Clock, Cpu } from 'lucide-react';

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
        return <BellRing className="w-8 h-8 text-rose-300 animate-bounce" />;
      case 'FALL':
        return <AlertOctagon className="w-8 h-8 text-rose-300 animate-pulse" />;
      case 'GAS_UNSAFE':
        return <Wind className="w-8 h-8 text-amber-300 animate-pulse" />;
      case 'TEMPERATURE_UNSAFE':
        return <Flame className="w-8 h-8 text-orange-400 animate-pulse" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-rose-300" />;
    }
  };

  const getAlertStyles = (severity: AlertInfo['severity']) => {
    if (severity === 'CRITICAL') {
      return {
        cardBg: 'bg-gradient-to-r from-rose-950/90 via-red-900/80 to-rose-950/90 border-rose-500',
        textColor: 'text-rose-200',
        titleColor: 'text-white',
        buttonClass: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/60 border border-rose-400',
        glow: 'glow-emergency',
      };
    }
    if (severity === 'HIGH') {
      return {
        cardBg: 'bg-gradient-to-r from-amber-950/90 via-orange-900/80 to-amber-950/90 border-amber-500',
        textColor: 'text-amber-200',
        titleColor: 'text-amber-100',
        buttonClass: 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/60 border border-amber-400',
        glow: 'glow-warning',
      };
    }
    return {
      cardBg: 'bg-gradient-to-r from-orange-950/90 via-red-950/80 to-orange-950/90 border-orange-500',
      textColor: 'text-orange-200',
      titleColor: 'text-orange-100',
      buttonClass: 'bg-orange-600 hover:bg-orange-500 text-white border border-orange-400',
      glow: 'glow-warning',
    };
  };

  return (
    <section aria-label="Critical Emergency Alerts" className="space-y-3 my-4">
      {alerts.map((alert) => {
        const style = getAlertStyles(alert.severity);
        const alertTime = new Date(alert.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        return (
          <div
            key={alert.id}
            className={`relative overflow-hidden rounded-2xl border-2 p-5 sm:p-6 transition-all duration-300 animate-emergency-flash ${style.cardBg} ${style.glow}`}
          >
            {/* Background warning pattern */}
            <div className="absolute inset-0 hazard-stripes opacity-30 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* Alert Left Column: Icon + Text */}
              <div className="flex items-start gap-4">
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/20 shrink-0 shadow-inner">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-black/50 border border-rose-400/50 text-rose-300">
                      {alert.severity} PRIORITY
                    </span>
                    <h2 className={`text-xl sm:text-2xl font-black tracking-wide ${style.titleColor}`}>
                      {alert.title}
                    </h2>
                  </div>
                  <p className={`text-sm sm:text-base font-medium ${style.textColor}`}>
                    {alert.description}
                  </p>
                  <div className="flex items-center flex-wrap gap-3 pt-1 text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded">
                      <Cpu className="w-3.5 h-3.5 text-cyan-300" />
                      Node: <strong className="text-white ml-1">{alert.node}</strong>
                    </span>
                    <span className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded">
                      Worker ID: <strong className="text-white ml-1">{alert.worker_id}</strong>
                    </span>
                    <span className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Packet Time: <strong className="text-white ml-1">{alertTime}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Alert Right Column: Acknowledge Button */}
              <div className="w-full md:w-auto flex items-center justify-end shrink-0 pt-2 md:pt-0">
                <button
                  id={`ack-btn-${alert.id}`}
                  onClick={() => onAcknowledge(alert.id)}
                  className={`w-full md:w-auto px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all transform active:scale-95 flex items-center justify-center gap-2 ${style.buttonClass}`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>ACKNOWLEDGE</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
};
