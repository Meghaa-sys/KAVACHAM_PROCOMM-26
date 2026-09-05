'use client';

import React, { useEffect, useState } from 'react';
import {
  Radio,
  AlertTriangle,
  Flame,
  Wind,
  Layers,
  Waves,
  X,
  Send,
  Volume2,
  Vibrate,
  Zap,
  ShieldAlert,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { BroadcastCommand, EmergencyBroadcastType } from '@/types/worker';

interface EmergencyBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBroadcast: (command: Partial<BroadcastCommand>) => void;
  activeBroadcast: BroadcastCommand | null;
  onCancelBroadcast: () => void;
}

export const EmergencyBroadcastModal: React.FC<EmergencyBroadcastModalProps> = ({
  isOpen,
  onClose,
  onBroadcast,
  activeBroadcast,
  onCancelBroadcast,
}) => {
  const [selectedType, setSelectedType] = useState<EmergencyBroadcastType>('EARTHQUAKE');
  const [customMsg, setCustomMsg] = useState<string>('');
  const [target, setTarget] = useState<string>('ALL_NODES');
  const [buzzer, setBuzzer] = useState<boolean>(true);
  const [vibration, setVibration] = useState<boolean>(true);
  const [ledStrobe, setLedStrobe] = useState<boolean>(true);
  const [confirmed, setConfirmed] = useState<boolean>(false);

  // Escape closes, and the page behind must not scroll while the sheet is open.
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const presets: Record<
    EmergencyBroadcastType,
    { title: string; defaultMsg: string; icon: any; accent: string; severity: string }
  > = {
    EARTHQUAKE: {
      title: '🌋 Earthquake / Seismic Tremor',
      defaultMsg:
        'CRITICAL: SEISMIC ACTIVITY / EARTHQUAKE EXPECTED. EVACUATE MINE WORKINGS IMMEDIATELY TO DESIGNATED REFUGE CHAMBERS OR SURFACE PORTAL!',
      icon: Layers,
      accent: '#ef4444',
      severity: 'CRITICAL EVACUATION',
    },
    GAS_LEAK: {
      title: '💨 Toxic Gas / Methane Surge',
      defaultMsg:
        'HAZARDOUS GAS CONCENTRATION DETECTED. DON SELF-CONTAINED BREATHING APPARATUS AND EVACUATE UPWIND VIA INTAKE AIRWAYS!',
      icon: Wind,
      accent: '#f59e0b',
      severity: 'CRITICAL HAZARD',
    },
    CAVE_IN: {
      title: '💥 Cave-In / Rockfall Threat',
      defaultMsg:
        'STRUCTURAL UNSTABILITY / ROOF STRATA FAILURE DETECTED. CEASE ALL HEAVY DRILLING AND CLEAR ACTIVE STOPE IMMEDIATELY!',
      icon: AlertTriangle,
      accent: '#f97316',
      severity: 'STRUCTURAL DANGER',
    },
    FLOOD: {
      title: '🌊 Water Ingress / Inundation',
      defaultMsg:
        'UNCONTROLLED WATER INFLOW IN LOWER SUMP. MOVE UPWARD TO HIGHER ELEVATION DRIFTS AND SHAFTS IMMEDIATELY!',
      icon: Waves,
      accent: '#06b6d4',
      severity: 'WATER HAZARD',
    },
    FIRE: {
      title: '🔥 Underground Fire / Smoke',
      defaultMsg:
        'MINE FIRE DETECTED. ACTIVATE FIRE SUPPRESSION AND RETREAT TOWARDS FRESH AIR BASE.',
      icon: Flame,
      accent: '#dc2626',
      severity: 'FIRE EMERGENCY',
    },
    CUSTOM: {
      title: '📢 Custom Operator Dispatch',
      defaultMsg:
        'ATTENTION ALL UNDERGROUND CREWS: SPECIAL INSTRUCTIONS FROM SURFACE CONTROL ROOM.',
      icon: Radio,
      accent: '#3b82f6',
      severity: 'GENERAL NOTICE',
    },
    ALL_CLEAR: {
      title: '✅ All Clear / Normalcy',
      defaultMsg: 'ALL CLEAR: Emergency condition resolved. Safe to resume operations.',
      icon: CheckCircle2,
      accent: '#10b981',
      severity: 'SAFE STATUS',
    },
  };

  const handleSend = () => {
    const preset = presets[selectedType];
    const message = customMsg.trim() || preset.defaultMsg;

    onBroadcast({
      command: selectedType === 'ALL_CLEAR' ? 'ALL_CLEAR' : 'EVACUATE',
      alert_type: selectedType,
      priority: selectedType === 'ALL_CLEAR' ? 'NORMAL' : 'CRITICAL',
      message: message,
      target: target,
      buzzer,
      vibration,
      led_strobe: ledStrobe,
      timestamp: Date.now(),
      sender: 'SURFACE_CONTROL_ROOM',
    });

    onClose();
  };

  const actuators = [
    {
      key: 'buzzer',
      on: buzzer,
      toggle: () => setBuzzer(!buzzer),
      icon: Volume2,
      label: 'Audible Buzzer',
    },
    {
      key: 'vibration',
      on: vibration,
      toggle: () => setVibration(!vibration),
      icon: Vibrate,
      label: 'Vibration Motor',
    },
    {
      key: 'strobe',
      on: ledStrobe,
      toggle: () => setLedStrobe(!ledStrobe),
      icon: Zap,
      label: 'LED Strobe',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Surface to underground emergency broadcast"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl bg-industrial-900 border-t-2 sm:border-2 border-rose-500/80 shadow-2xl shadow-rose-950/80 overflow-hidden flex flex-col max-h-[92dvh] animate-rise-in">
        {/* Hazard stripe header */}
        <div className="hazard-stripes h-2 w-full shrink-0" />

        {/* Drag affordance on mobile sheets */}
        <div className="sm:hidden flex justify-center pt-2 shrink-0">
          <span className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <header className="p-4 sm:p-5 border-b border-white/[0.08] flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 animate-pulse shrink-0">
              <Radio className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center flex-wrap gap-2">
                <h3 className="text-sm sm:text-lg font-black uppercase tracking-tight text-white leading-tight">
                  Emergency Broadcast
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-600 text-white animate-pulse shrink-0">
                  2-Way WSN
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 leading-snug mt-0.5">
                Dispatches evacuation commands to every ESP32 node buzzer &amp; strobe via MQTT
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close broadcast dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1 overscroll-contain">
          {/* Active broadcast notice */}
          {activeBroadcast && (
            <div className="p-3.5 rounded-2xl bg-rose-950/90 border-2 border-rose-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <ShieldAlert className="w-5 h-5 text-rose-400 animate-bounce shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.1em] text-rose-400">
                    Siren live on MQTT ({activeBroadcast.alert_type})
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 line-clamp-2">
                    {activeBroadcast.message}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onCancelBroadcast();
                  onClose();
                }}
                className="shrink-0 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider transition-colors"
              >
                Send all clear
              </button>
            </div>
          )}

          {/* Step 1 - scenario */}
          <fieldset className="space-y-2.5">
            <legend className="label-eyebrow !text-slate-300">
              1. Select emergency scenario
            </legend>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2.5">
              {(Object.keys(presets) as EmergencyBroadcastType[])
                .filter((k) => k !== 'ALL_CLEAR')
                .map((key) => {
                  const item = presets[key];
                  const Icon = item.icon;
                  const isSelected = selectedType === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedType(key);
                        setCustomMsg('');
                      }}
                      aria-pressed={isSelected}
                      className={`p-3 rounded-2xl text-left border transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'border-rose-500 bg-rose-950/50 ring-2 ring-rose-500/40'
                          : 'border-white/[0.08] bg-industrial-850/70 hover:bg-industrial-800 hover:border-white/[0.16]'
                      }`}
                    >
                      <span
                        className="p-2 rounded-xl shrink-0"
                        style={{
                          backgroundColor: isSelected ? `${item.accent}25` : 'rgba(21,29,44,0.9)',
                          color: isSelected ? item.accent : '#7087b5',
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-xs font-bold truncate ${
                            isSelected ? 'text-white' : 'text-slate-300'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span
                          className="block text-[9px] font-mono uppercase tracking-[0.1em] font-bold mt-0.5"
                          style={{ color: isSelected ? item.accent : '#4b618e' }}
                        >
                          {item.severity}
                        </span>
                      </span>
                    </button>
                  );
                })}
            </div>
          </fieldset>

          {/* Step 2 - payload */}
          <div className="space-y-2">
            <label
              htmlFor="broadcast-message"
              className="label-eyebrow !text-slate-300 flex items-center justify-between gap-2"
            >
              <span>2. Audio / display payload</span>
              <span className="text-[9px] text-slate-500 font-mono normal-case tracking-normal">
                Topic: mine/command
              </span>
            </label>
            <textarea
              id="broadcast-message"
              rows={3}
              value={customMsg || presets[selectedType].defaultMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              className="w-full px-3.5 py-3 rounded-2xl bg-industrial-980 border border-white/[0.1] text-[11px] sm:text-xs font-mono text-slate-200 leading-relaxed focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/60 resize-y"
              placeholder="Enter custom broadcast instructions..."
            />
          </div>

          {/* Step 3 - actuators */}
          <fieldset className="space-y-2.5">
            <legend className="label-eyebrow !text-slate-300">
              3. Hardware actuators on miner nodes
            </legend>
            <div className="grid grid-cols-3 gap-2.5">
              {actuators.map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={a.toggle}
                    aria-pressed={a.on}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1.5 text-center transition-all ${
                      a.on
                        ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                        : 'bg-industrial-850/60 border-white/[0.08] text-slate-500'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${a.on ? 'text-rose-400 animate-pulse' : 'text-slate-600'}`}
                    />
                    <span className="text-[10px] font-bold leading-tight">{a.label}</span>
                    <span
                      className={`text-[9px] uppercase font-mono font-black px-1.5 py-0.5 rounded ${
                        a.on ? 'bg-rose-500/25 text-rose-200' : 'bg-industrial-800 text-slate-600'
                      }`}
                    >
                      {a.on ? 'Active' : 'Off'}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        {/* Footer */}
        <footer
          className="p-4 sm:p-5 bg-industrial-980 border-t border-white/[0.08] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 justify-center sm:justify-start">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              Target: <strong className="text-slate-200">{target}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-industrial-850 hover:bg-industrial-800 border border-white/[0.08] text-slate-300 text-[11px] font-black uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="flex-[2] sm:flex-none px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white text-[11px] font-black uppercase tracking-[0.1em] transition-all shadow-xl shadow-rose-950/70 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>Transmit alarm</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
