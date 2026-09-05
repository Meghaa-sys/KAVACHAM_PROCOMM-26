'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  AlertOctagon,
  Network,
  Radio,
  Cpu,
  ShieldCheck,
  HardHat
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  workerCount: number;
  alertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  workerCount,
  alertCount,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'workers',
      label: 'Workers',
      icon: Users,
      badge: workerCount > 0 ? workerCount : null,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: AlertOctagon,
      badge: alertCount > 0 ? alertCount : null,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
    },
    {
      id: 'network',
      label: 'Network',
      icon: Network,
      badge: null,
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-industrial-900/95 border-r border-industrial-700/60 flex flex-col justify-between shrink-0 p-4 transition-all">
      <div className="space-y-6">
        {/* Unit Identifier */}
        <div className="hidden md:flex items-center gap-3 px-3 py-3 rounded-xl bg-industrial-850/80 border border-industrial-700/50">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Mine Zone A
            </div>
            <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
              Gateway Active
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Navigation Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600/20 to-blue-600/10 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-950/50 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-industrial-800/70 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      item.badgeColor || 'bg-industrial-750 text-slate-300 border border-industrial-600/50'
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

      {/* Footer Info Box */}
      <div className="hidden md:block pt-4 border-t border-industrial-800">
        <div className="p-3 rounded-xl bg-industrial-850/60 border border-industrial-750 text-slate-400 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              WSN Protocol
            </span>
            <span className="font-mono text-cyan-300">ESP32 BLE/MQTT</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Broker:</span>
            <span className="text-slate-300">{process.env.NEXT_PUBLIC_MQTT_BROKER || '192.168.146.22'}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Topic:</span>
            <span className="text-slate-300">mine/test</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
