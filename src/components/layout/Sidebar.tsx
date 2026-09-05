'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  AlertOctagon,
  Network,
  Cpu,
  HardHat,
  Radio,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  workerCount: number;
  alertCount: number;
}

interface NavItem {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badge: number | null;
  critical?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  workerCount,
  alertCount,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      shortLabel: 'Dash',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'workers',
      label: 'Workers',
      shortLabel: 'Workers',
      icon: Users,
      badge: workerCount > 0 ? workerCount : null,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      shortLabel: 'Alerts',
      icon: AlertOctagon,
      badge: alertCount > 0 ? alertCount : null,
      critical: true,
    },
    {
      id: 'network',
      label: 'Network',
      shortLabel: 'Network',
      icon: Network,
      badge: null,
    },
  ];

  return (
    <>
      {/* ==================== DESKTOP / TABLET RAIL ==================== */}
      <aside className="hidden md:flex md:w-[15rem] lg:w-[16.5rem] shrink-0 flex-col justify-between glass-rail border-r border-white/[0.07] p-4 sticky top-[70px] h-[calc(100dvh-70px)] overflow-y-auto">
        <div className="space-y-6 min-h-0">
          {/* Zone identifier */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-2xl instrument-well">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0">
              <HardHat className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black uppercase tracking-[0.1em] text-slate-200 truncate">
                Mine Zone A
              </div>
              <div className="text-[10px] font-mono text-cyan-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse" />
                Gateway active
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1" aria-label="Primary">
            <div className="px-3 pb-2 label-eyebrow">Navigation</div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all border ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/5 text-cyan-200 border-cyan-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border-transparent'
                  }`}
                >
                  {/* Active marker */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-cyan-400" />
                  )}
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}
                    />
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== null && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-black tabular-nums ${
                        item.critical
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-industrial-750 text-slate-300 border border-white/[0.08]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Link info panel */}
        <div className="pt-4">
          <div className="p-3 rounded-2xl instrument-well text-slate-400 text-xs space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                WSN Protocol
              </span>
            </div>
            <div className="text-[10px] font-mono text-cyan-300">ESP32 BLE / MQTT</div>
            <div className="h-px bg-white/[0.07]" />
            <div className="flex items-center justify-between text-[10px] font-mono gap-2">
              <span className="text-slate-500 shrink-0">Broker</span>
              <span className="text-slate-300 truncate">
                {process.env.NEXT_PUBLIC_MQTT_BROKER || '192.168.146.22'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono gap-2">
              <span className="text-slate-500 shrink-0">Topic</span>
              <span className="text-slate-300 truncate">mine/test</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ======================= MOBILE BOTTOM NAV ======================= */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-40 glass-rail border-t border-white/[0.09] shadow-[0_-8px_28px_-10px_rgba(0,0,0,0.9)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Primary"
      >
        <div className="grid grid-cols-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-1 py-2.5 min-h-[3.75rem] transition-colors ${
                  isActive ? 'text-cyan-300' : 'text-slate-500 active:text-slate-300'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 inset-x-5 h-[2px] rounded-b-full bg-cyan-400" />
                )}

                <span className="relative">
                  <Icon className="w-5 h-5" />
                  {item.badge !== null && (
                    <span
                      className={`absolute -top-1.5 -right-2.5 min-w-[1.05rem] h-[1.05rem] px-1 rounded-full text-[9px] font-black flex items-center justify-center tabular-nums ${
                        item.critical
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-industrial-700 text-slate-200 border border-white/10'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile zone strip - keeps the gateway context visible without the rail */}
      <div className="md:hidden flex items-center justify-between gap-2 px-3 py-2 border-b border-white/[0.06] bg-industrial-925/70 text-[10px] font-mono">
        <span className="flex items-center gap-1.5 text-slate-300 font-bold uppercase tracking-wider">
          <HardHat className="w-3.5 h-3.5 text-cyan-400" />
          Mine Zone A
        </span>
        <span className="flex items-center gap-1.5 text-cyan-400">
          <Radio className="w-3 h-3" />
          {process.env.NEXT_PUBLIC_MQTT_BROKER || '192.168.146.22'}
        </span>
      </div>
    </>
  );
};
