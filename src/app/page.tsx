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
import {
  Activity,
  AlertTriangle,
  Flame,
  Radio,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Users,
  Network as NetworkIcon,
  BellRing,
  Send
} from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSimulatingStream, setIsSimulatingStream] = useState<boolean>(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState<boolean>(false);

  const {
    workers,
    workersList,
    selectedWorker,
    selectedWorkerId,
    setSelectedWorkerId,
    connectionState,
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
    injectSampleData,
  } = useLiveWorkerData();

  // Helper to inject specific test scenarios
  const triggerScenario = (scenario: 'SOS' | 'FALL' | 'GAS' | 'TEMP' | 'NORMAL' | 'MULTI') => {
    if (scenario === 'SOS') {
      injectSampleData({
        node: 1,
        worker_id: 'WSN-1',
        message: 'MANUAL_SOS',
        sequence: Math.floor(Math.random() * 100) + 50,
        gas: 88,
        temperature: 28,
        gas_unsafe: false,
        temperature_unsafe: false,
        fall: false,
        manual_sos: true,
        rssi: -51,
        ble_address: 'd4:8a:fc:9d:64:6e',
        gateway: 'KAVACHAM_GATEWAY',
      });
    } else if (scenario === 'FALL') {
      injectSampleData({
        node: 2,
        worker_id: 'WSN-2',
        message: 'FALL_ALERT',
        sequence: Math.floor(Math.random() * 100) + 10,
        gas: 95,
        temperature: 29,
        gas_unsafe: false,
        temperature_unsafe: false,
        fall: true,
        manual_sos: false,
        rssi: -62,
        ble_address: 'e2:1c:aa:4f:88:10',
        gateway: 'KAVACHAM_GATEWAY',
      });
    } else if (scenario === 'GAS') {
      injectSampleData({
        node: 3,
        worker_id: 'WSN-3',
        message: 'GAS_LEAK',
        sequence: Math.floor(Math.random() * 100) + 20,
        gas: 340,
        temperature: 31,
        gas_unsafe: true,
        temperature_unsafe: false,
        fall: false,
        manual_sos: false,
        rssi: -70,
        ble_address: 'c0:49:ef:12:33:9a',
        gateway: 'KAVACHAM_GATEWAY',
      });
    } else if (scenario === 'TEMP') {
      injectSampleData({
        node: 1,
        worker_id: 'WSN-1',
        message: 'HIGH_TEMP',
        sequence: Math.floor(Math.random() * 100) + 30,
        gas: 80,
        temperature: 48,
        gas_unsafe: false,
        temperature_unsafe: true,
        fall: false,
        manual_sos: false,
        rssi: -55,
        ble_address: 'd4:8a:fc:9d:64:6e',
        gateway: 'KAVACHAM_GATEWAY',
      });
    } else if (scenario === 'NORMAL') {
      injectSampleData({
        node: 1,
        worker_id: 'WSN-1',
        message: 'HEARTBEAT_OK',
        sequence: Math.floor(Math.random() * 100) + 1,
        gas: 85,
        temperature: 27,
        gas_unsafe: false,
        temperature_unsafe: false,
        fall: false,
        manual_sos: false,
        rssi: -48,
        ble_address: 'd4:8a:fc:9d:64:6e',
        gateway: 'KAVACHAM_GATEWAY',
      });
    } else if (scenario === 'MULTI') {
      // Inject multiple workers at once
      ['WSN-1', 'WSN-2', 'WSN-3', 'WSN-4'].forEach((id, idx) => {
        injectSampleData({
          node: idx + 1,
          worker_id: id,
          message: idx === 0 ? 'MANUAL_SOS' : 'NORMAL_TELEMETRY',
          sequence: Math.floor(Math.random() * 100) + 1,
          gas: 70 + idx * 25,
          temperature: 26 + idx * 2,
          gas_unsafe: idx === 2,
          temperature_unsafe: false,
          fall: idx === 1,
          manual_sos: idx === 0,
          rssi: -50 - idx * 8,
          ble_address: `d4:8a:fc:9d:64:0${idx + 1}`,
          gateway: 'KAVACHAM_GATEWAY',
        });
      });
    }
  };

  const hasData = workersList.length > 0;

  return (
    <div className="min-h-screen bg-industrial-950 flex flex-col">
      {/* Top Header */}
      <Header
        connectionState={connectionState}
        secondsAgo={secondsAgo}
        packetCount={packetCount}
        activeAlertCount={activeAlerts.length}
        onReconnect={reconnect}
        onToggleSimulator={() => triggerScenario('SOS')}
        isSimulatorActive={isSimulatingStream}
      />

      {/* Main App Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          workerCount={workersList.length}
          alertCount={activeAlerts.length}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Main Monitoring Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl lg:text-3xl font-black text-slate-100 uppercase tracking-tight">
                  Live Monitoring
                </h2>
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
                Real-time worker and environmental safety status
              </p>
            </div>

            {/* Quick Actions & Emergency Evacuation Trigger */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* PRIMARY DOWNSTREAM EVACUATION BROADCAST BUTTON */}
              <button
                onClick={() => setIsBroadcastModalOpen(true)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border shadow-lg ${
                  activeBroadcast
                    ? 'bg-rose-600 text-white border-rose-400 shadow-rose-950 animate-pulse'
                    : 'bg-gradient-to-r from-rose-600/90 to-red-600/90 hover:from-rose-500 hover:to-red-500 text-white border-rose-500/50 shadow-rose-950/40'
                }`}
                title="Send Earthquake or Emergency Evacuation warning to all underground WSN nodes"
              >
                <Radio className="w-4 h-4 animate-spin" />
                <span>{activeBroadcast ? '📢 EVACUATION ACTIVE' : '📢 Broadcast Evac Alarm'}</span>
              </button>

              {/* Scenario Test Buttons */}
              <div className="hidden sm:flex items-center gap-1.5 p-1 rounded-xl bg-industrial-900 border border-industrial-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1.5">
                  Test:
                </span>
                <button
                  onClick={() => triggerScenario('SOS')}
                  className="px-2 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors"
                  title="Simulate WSN-1 Manual SOS"
                >
                  🚨 SOS
                </button>
                <button
                  onClick={() => triggerScenario('FALL')}
                  className="px-2 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
                  title="Simulate WSN-2 Fall Incident"
                >
                  ⚠️ Fall
                </button>
                <button
                  onClick={() => triggerScenario('GAS')}
                  className="px-2 py-1 rounded-lg text-xs font-bold bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 transition-colors"
                  title="Simulate WSN-3 Gas Leak"
                >
                  ☣️ Gas
                </button>
                <button
                  onClick={() => triggerScenario('NORMAL')}
                  className="px-2 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                  title="Simulate Normal Telemetry"
                >
                  ✅ OK
                </button>
                <button
                  onClick={() => triggerScenario('MULTI')}
                  className="px-2 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                  title="Simulate Fleet (4 nodes)"
                >
                  👥 Fleet
                </button>
              </div>
            </div>
          </div>

          {/* Active Downstream Evacuation Broadcast Siren Banner */}
          <ActiveBroadcastBanner
            broadcast={activeBroadcast}
            onCancel={cancelEmergencyBroadcast}
          />

          {/* Emergency Alert Banner (Renders whenever SOS, Fall, Gas or Temp alerts are active from workers) */}
          <EmergencyAlert
            alerts={activeAlerts}
            onAcknowledge={acknowledgeAlert}
            onClearAll={clearAllAlerts}
          />

          {/* Conditional View by Tab or Waiting State */}
          {!hasData ? (
            <WaitingState
              connectionState={connectionState}
              onSimulateSample={() => triggerScenario('SOS')}
              onReconnect={reconnect}
              wsUrl={currentWsUrl}
            />
          ) : (
            <>
              {/* TAB: DASHBOARD (PRIMARY CONTROL ROOM VIEW) */}
              {(activeTab === 'dashboard' || activeTab === 'workers') && (
                <div className="space-y-6">
                  {/* Three Large Top Sensor Cards: Temperature, Gas, Worker Safety */}
                  <SensorCards worker={selectedWorker} />

                  {/* Comprehensive Worker Detail Card */}
                  <WorkerDetailCard worker={selectedWorker} />

                  {/* Multiple Workers Fleet Section */}
                  <WorkersList
                    workers={workersList}
                    selectedWorkerId={selectedWorkerId}
                    onSelectWorker={setSelectedWorkerId}
                  />
                </div>
              )}

              {/* TAB: ALERTS */}
              {activeTab === 'alerts' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <BellRing className="w-5 h-5 text-rose-400" />
                      Critical Alert Incident Log
                    </h3>
                    {activeAlerts.length > 0 && (
                      <button
                        onClick={clearAllAlerts}
                        className="text-xs px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider"
                      >
                        Acknowledge All
                      </button>
                    )}
                  </div>

                  {activeAlerts.length === 0 ? (
                    <div className="industrial-card rounded-2xl p-8 text-center text-slate-400 space-y-2">
                      <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
                      <h4 className="text-lg font-bold text-slate-200">No Active Emergency Alerts</h4>
                      <p className="text-xs">All monitored workers and atmospheric sensors are within normal thresholds.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/60 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-100">{alert.title}</div>
                            <div className="text-xs text-rose-300">{alert.description}</div>
                            <div className="text-[11px] font-mono text-slate-400 mt-1">
                              Node #{alert.node} • {alert.worker_id} • {new Date(alert.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase"
                          >
                            Acknowledge
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: NETWORK or ALWAYS AT BOTTOM */}
              {(activeTab === 'dashboard' || activeTab === 'network') && (
                <NetworkStatus
                  connectionState={connectionState}
                  packetCount={packetCount}
                  currentWsUrl={currentWsUrl}
                  onUpdateWsUrl={setCurrentWsUrl}
                />
              )}
            </>
          )}

          {/* Emergency Surface-to-Underground Broadcast Modal */}
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
