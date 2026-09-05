'use client';

import React, { useState } from 'react';
import { useLiveWorkerData } from '@/hooks/useLiveWorkerData';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { EmergencyAlert } from '@/components/dashboard/EmergencyAlert';
import { SensorCards } from '@/components/dashboard/SensorCard';
import { WorkerDetailCard } from '@/components/dashboard/WorkerDetailCard';
import { WorkersList } from '@/components/dashboard/WorkersList';
import { NetworkStatus } from '@/components/dashboard/NetworkStatus';
import { WaitingState } from '@/components/dashboard/WaitingState';
import { EmergencyBroadcastModal } from '@/components/dashboard/EmergencyBroadcastModal';
import { ActiveBroadcastBanner } from '@/components/dashboard/ActiveBroadcastBanner';
import { FleetOverview } from '@/components/dashboard/FleetOverview';
import { Radio, ShieldCheck, BellRing, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);

  const {
    workers,
    workersList,
    selectedWorker,
    selectedWorkerId,
    setSelectedWorkerId,
    connectionState,
    socketState,
    mqttConnected,
    singleNodeMode,
    secondsAgo,
    packetCount,
    activeAlerts,
    acknowledgeAlert,
    clearAllAlerts,
    activeBroadcast,
    sendEmergencyBroadcast,
    cancelEmergencyBroadcast,
    currentWsUrl,
    setCurrentWsUrl,
    reconnect,
  } = useLiveWorkerData();

  // Nothing renders until the broker link is live AND a real node has reported.
  const hasData = mqttConnected && workersList.length > 0;

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {/* Top Header */}
      <Header
        connectionState={connectionState}
        secondsAgo={secondsAgo}
        packetCount={packetCount}
        activeAlertCount={activeAlerts.length}
        onReconnect={reconnect}
        mqttConnected={mqttConnected}
      />

      {/* Main App Body */}
      <div className="flex-1 flex flex-col md:flex-row md:items-start">
        {/* Sidebar rail (desktop) + bottom nav & zone strip (mobile) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          workerCount={workersList.length}
          alertCount={activeAlerts.length}
        />

        {/* Content Area */}
        <main className="flex-1 min-w-0 w-full px-3 sm:px-5 lg:px-8 pt-4 sm:pt-6 pb-safe-nav">
          <div className="mx-auto w-full max-w-[1600px] space-y-5 sm:space-y-6">
            {/* ------------------ Section header + actions ------------------ */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-100 uppercase tracking-tight">
                    Live Monitoring
                  </h2>
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-70" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
                  </span>
                </div>
                <p className="text-[11px] sm:text-sm text-slate-500 font-medium mt-0.5">
                  Real-time worker and environmental safety status
                </p>
              </div>

              {/* Evacuation broadcast — the single most important control */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(true)}
                  className={`flex-1 lg:flex-none justify-center px-4 py-2.5 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 border shadow-lg ${
                    activeBroadcast
                      ? 'bg-rose-600 text-white border-rose-400 shadow-rose-950 animate-pulse'
                      : 'bg-gradient-to-r from-rose-600/90 to-red-600/90 hover:from-rose-500 hover:to-red-500 text-white border-rose-500/50 shadow-rose-950/40'
                  }`}
                  title="Send an earthquake or emergency evacuation warning to all underground WSN nodes"
                >
                  <Radio className="w-4 h-4 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
                  <span className="truncate">
                    {activeBroadcast ? 'Evacuation Active' : 'Broadcast Evac Alarm'}
                  </span>
                </button>
              </div>
            </div>

            {/* Active downstream evacuation siren banner */}
            <ActiveBroadcastBanner
              broadcast={activeBroadcast}
              onCancel={cancelEmergencyBroadcast}
            />

            {/* Emergency alert banner (SOS / Fall / Gas / Temp from workers).
                Suppressed on the Alerts tab only - the incident log below
                already lists the very same alerts, so showing both rendered
                every incident twice on that screen. */}
            {activeTab !== 'alerts' && (
              <EmergencyAlert
                alerts={activeAlerts}
                onAcknowledge={acknowledgeAlert}
                onClearAll={clearAllAlerts}
              />
            )}

            {/* ------------------ Conditional views ------------------ */}

            {/* Telemetry views require a live broker link AND a real packet. */}
            {(activeTab === 'dashboard' || activeTab === 'workers') &&
              (!hasData ? (
                <WaitingState
                  connectionState={connectionState}
                  mqttConnected={mqttConnected}
                  onReconnect={reconnect}
                  wsUrl={currentWsUrl}
                />
              ) : (
                <div className="space-y-5 sm:space-y-6 animate-fade-in">
                  <FleetOverview
                    workers={workersList}
                    packetCount={packetCount}
                    connectionState={connectionState}
                    activeAlertCount={activeAlerts.length}
                  />

                  {/* Gauge instrument row */}
                  <SensorCards worker={selectedWorker} />

                  {/* Full telemetry breakdown for the focused node */}
                  <WorkerDetailCard worker={selectedWorker} />

                  {/* Fleet grid - redundant while a single node is deployed,
                      the detail card above already covers that node. */}
                  {!singleNodeMode && (
                    <WorkersList
                      workers={workersList}
                      selectedWorkerId={selectedWorkerId}
                      onSelectWorker={setSelectedWorkerId}
                    />
                  )}
                </div>
              ))}

            {/* TAB: ALERTS - the incident queue stays reachable even with the
                broker down; a pending SOS must never be hidden by a dropout. */}
            {activeTab === 'alerts' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 min-w-0">
                      <BellRing className="w-5 h-5 text-rose-400 shrink-0" />
                      <span className="truncate">Critical Alert Incident Log</span>
                    </h3>
                    {activeAlerts.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllAlerts}
                        className="shrink-0 text-[11px] px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-wider transition-colors"
                      >
                        Ack All
                      </button>
                    )}
                  </div>

                  {activeAlerts.length === 0 ? (
                    <div className="industrial-card rounded-2xl p-8 sm:p-10 text-center space-y-3">
                      <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                        <ShieldCheck className="w-9 h-9 text-emerald-400" />
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-100">
                        No Active Emergency Alerts
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        All monitored workers and atmospheric sensors are within normal
                        thresholds.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeAlerts.map((alert) => {
                        const critical = alert.severity === 'CRITICAL';
                        return (
                        <div
                          key={alert.id}
                          className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            critical
                              ? 'bg-rose-950/40 border-rose-500/50'
                              : 'bg-amber-950/30 border-amber-500/45'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-[0.1em] ${
                                  critical
                                    ? 'bg-rose-500 text-white'
                                    : 'bg-amber-400 text-amber-950'
                                }`}
                              >
                                {alert.severity}
                              </span>
                              <span className="font-bold text-slate-100">{alert.title}</span>
                            </div>
                            <div
                              className={`text-xs mt-1 ${
                                critical ? 'text-rose-300' : 'text-amber-200'
                              }`}
                            >
                              {alert.description}
                            </div>
                            <div className="text-[10px] font-mono text-slate-500 mt-1.5">
                              Node #{alert.node} &middot; {alert.worker_id} &middot;{' '}
                              <span suppressHydrationWarning>
                                {new Date(alert.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => acknowledgeAlert(alert.id)}
                            className={`shrink-0 w-full sm:w-auto px-4 py-2.5 rounded-xl text-white text-[11px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                              critical
                                ? 'bg-rose-600 hover:bg-rose-500'
                                : 'bg-amber-600 hover:bg-amber-500'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Acknowledge
                          </button>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            {/* Network diagnostics stay reachable when the pipeline is broken -
                this panel is how an operator finds which hop died. */}
            {(activeTab === 'dashboard' || activeTab === 'network') && (
              <div className="animate-fade-in">
                <NetworkStatus
                  connectionState={connectionState}
                  socketState={socketState}
                  mqttConnected={mqttConnected}
                  packetCount={packetCount}
                  currentWsUrl={currentWsUrl}
                  onUpdateWsUrl={setCurrentWsUrl}
                />
              </div>
            )}
          </div>

          {/* Emergency surface-to-underground broadcast modal */}
          <EmergencyBroadcastModal
            isOpen={isBroadcastModalOpen}
            onClose={() => setIsBroadcastModalOpen(false)}
            onBroadcast={sendEmergencyBroadcast}
            activeBroadcast={activeBroadcast}
            onCancelBroadcast={cancelEmergencyBroadcast}
          />
        </main>
      </div>
    </div>
  );
}
