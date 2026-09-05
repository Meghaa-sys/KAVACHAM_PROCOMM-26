'use client';

import React, { useState } from 'react';
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
  Lock
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

  if (!isOpen) return null;

  const presets: Record<
    EmergencyBroadcastType,
    { title: string; defaultMsg: string; icon: any; color: string; severity: string }
  > = {
    EARTHQUAKE: {
      title: '🌋 Earthquake / Seismic Tremor',
      defaultMsg:
        'CRITICAL: SEISMIC ACTIVITY / EARTHQUAKE EXPECTED. EVACUATE MINE WORKINGS IMMEDIATELY TO DESIGNATED REFUGE CHAMBERS OR SURFACE PORTAL!',
      icon: Layers,
      color: 'border-rose-500 bg-rose-950/60 text-rose-300',
      severity: 'CRITICAL EVACUATION',
    },
    GAS_LEAK: {
      title: '💨 Toxic Gas / Methane Surge',
      defaultMsg:
        'HAZARDOUS GAS CONCENTRATION DETECTED. DON SELF-CONTAINED BREATHING APPARATUS AND EVACUATE UPWIND VIA INTAKE AIRWAYS!',
      icon: Wind,
      color: 'border-amber-500 bg-amber-950/60 text-amber-300',
      severity: 'CRITICAL HAZARD',
    },
    CAVE_IN: {
      title: '💥 Cave-In / Rockfall Threat',
      defaultMsg:
        'STRUCTURAL UNSTABILITY / ROOF STRATA FAILURE DETECTED. CEASE ALL HEAVY DRILLING AND CLEAR ACTIVE STOPE IMMEDIATELY!',
      icon: AlertTriangle,
      color: 'border-orange-500 bg-orange-950/60 text-orange-300',
      severity: 'STRUCTURAL DANGER',
    },
    FLOOD: {
      title: '🌊 Water Ingress / Inundation',
      defaultMsg:
        'UNCONTROLLED WATER INFLOW IN LOWER SUMP. MOVE UPWARD TO HIGHER ELEVATION DRIFTS AND SHAFTS IMMEDIATELY!',
      icon: Waves,
      color: 'border-cyan-500 bg-cyan-950/60 text-cyan-300',
      severity: 'WATER HAZARD',
    },
    FIRE: {
      title: '🔥 Underground Fire / Smoke',
      defaultMsg:
        'MINE FIRE DETECTED. ACTIVATE FIRE SUPPRESSION AND RETREAT TOWARDS FRESH AIR BASE.',
      icon: Flame,
      color: 'border-red-600 bg-red-950/60 text-red-300',
      severity: 'FIRE EMERGENCY',
    },
    CUSTOM: {
      title: '📢 Custom Operator Dispatch',
      defaultMsg: 'ATTENTION ALL UNDERGROUND CREWS: SPECIAL INSTRUCTIONS FROM SURFACE CONTROL ROOM.',
      icon: Radio,
      color: 'border-blue-500 bg-blue-950/60 text-blue-300',
      severity: 'GENERAL NOTICE',
    },
    ALL_CLEAR: {
      title: '✅ All Clear / Normalcy',
      defaultMsg: 'ALL CLEAR: Emergency condition resolved. Safe to resume operations.',
      icon: CheckCircle2,
      color: 'border-emerald-500 bg-emerald-950/60 text-emerald-300',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-industrial-900 border-2 border-rose-500/80 shadow-2xl shadow-rose-950/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Hazard Stripe Header */}
        <div className="hazard-stripes h-2 w-full" />

        {/* Modal Header */}
        <div className="p-6 border-b border-industrial-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 animate-pulse">
              <Radio className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black uppercase tracking-wide text-white">
                  Surface-to-Underground Emergency Broadcast
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-600 text-white animate-pulse">
                  2-Way WSN
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dispatches high-priority evacuation commands to all ESP32 node buzzers & LED strobes via MQTT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-industrial-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Active Broadcast Notification if running */}
          {activeBroadcast && (
            <div className="p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500 text-rose-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-6 h-6 text-rose-400 animate-bounce" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-rose-400">
                    Active Evacuation Siren Live on MQTT ({activeBroadcast.alert_type})
                  </div>
                  <div className="text-xs font-mono text-slate-300 line-clamp-1">
                    {activeBroadcast.message}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  onCancelBroadcast();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase shrink-0 transition-colors"
              >
                Send ALL CLEAR
              </button>
            </div>
          )}

          {/* Preset Selection Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Select Emergency Warning Scenario
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(presets) as EmergencyBroadcastType[])
                .filter((k) => k !== 'ALL_CLEAR')
                .map((key) => {
                  const item = presets[key];
                  const Icon = item.icon;
                  const isSelected = selectedType === key;

                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedType(key);
                        setCustomMsg('');
                      }}
                      className={`p-3.5 rounded-2xl text-left border transition-all flex items-start gap-3 ${
                        isSelected
                          ? `border-rose-500 bg-rose-950/50 shadow-lg shadow-rose-950/60 ring-2 ring-rose-500/40`
                          : 'border-industrial-750 bg-industrial-850/70 hover:bg-industrial-800 text-slate-400'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-xl ${
                          isSelected ? 'bg-rose-500/20 text-rose-300' : 'bg-industrial-800 text-slate-400'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {item.title}
                        </div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-semibold">
                          {item.severity}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Broadcast Message Preview / Edit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>2. Emergency Audio / Display Payload</span>
              <span className="text-[10px] text-slate-400 font-mono">Topic: mine/command</span>
            </label>
            <textarea
              rows={3}
              value={customMsg || presets[selectedType].defaultMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-industrial-950 border border-industrial-700 text-sm font-mono text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              placeholder="Enter custom broadcast instructions..."
            />
          </div>

          {/* Hardware Trigger Signals on ESP32 */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
              3. Hardware Actuators to Fire on Underground Miner Helmets / Nodes
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setBuzzer(!buzzer)}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                  buzzer
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                    : 'bg-industrial-850/60 border-industrial-750 text-slate-500'
                }`}
              >
                <Volume2 className={`w-5 h-5 ${buzzer ? 'text-rose-400' : 'text-slate-600'}`} />
                <span>Audible Buzzer</span>
                <span className="text-[10px] uppercase font-mono">{buzzer ? 'ACTIVE' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={() => setVibration(!vibration)}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                  vibration
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                    : 'bg-industrial-850/60 border-industrial-750 text-slate-500'
                }`}
              >
                <Vibrate className={`w-5 h-5 ${vibration ? 'text-rose-400' : 'text-slate-600'}`} />
                <span>Vibration Motor</span>
                <span className="text-[10px] uppercase font-mono">{vibration ? 'ACTIVE' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={() => setLedStrobe(!ledStrobe)}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all ${
                  ledStrobe
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                    : 'bg-industrial-850/60 border-industrial-750 text-slate-500'
                }`}
              >
                <Zap className={`w-5 h-5 ${ledStrobe ? 'text-rose-400' : 'text-slate-600'}`} />
                <span>LED Strobe Alarm</span>
                <span className="text-[10px] uppercase font-mono">{ledStrobe ? 'ACTIVE' : 'OFF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer / Activation Button */}
        <div className="p-6 bg-industrial-950 border-t border-industrial-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Target: <strong className="text-white">ALL 4+ UNDERGROUND NODES</strong></span>
          </div>

          <div className="flex w-full sm:w-auto items-center gap-3">
            <button
              onClick={onClose}
              className="w-1/2 sm:w-auto px-4 py-3 rounded-xl bg-industrial-800 hover:bg-industrial-700 text-slate-300 text-xs font-bold uppercase transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              className="w-1/2 sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-rose-950 flex items-center justify-center gap-2 animate-pulse"
            >
              <Send className="w-4 h-4 fill-current" />
              <span>TRANSMIT EVACUATION ALARM</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
