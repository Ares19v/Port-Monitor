import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Monitor,
  Zap,
  Network,
  Usb,
  RefreshCw,
  Cpu,
  CheckCircle2,
  ShieldAlert,
  HardDrive
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function HardwareMonitor() {
  const [diagnostics, setDiagnostics] = useState({ usb: [], displays: [], network: [], power: {} });
  const [loading, setLoading] = useState(false);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/hardware`);
      setDiagnostics(res.data?.diagnostics || { usb: [], displays: [], network: [], power: {} });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Monitor size={24} className="text-blue-400" /> Physical Hardware Diagnostics
          </h2>
          <p className="text-zinc-400 text-xs mt-0.5">
            Direct WMI telemetry for displays, network interfaces, power delivery, and USB bus.
          </p>
        </div>

        <button
          onClick={fetchDevices}
          disabled={loading}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition-all self-start sm:self-auto"
          title="Refresh Hardware"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Grid of 4 Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Power State */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap size={15} className="text-amber-400" /> Power Delivery &amp; Battery
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/80">
              <span className="text-zinc-400">Power Source</span>
              <span className="font-bold text-zinc-200">{diagnostics.power?.plugged_in ? 'AC Mains / Wall Power' : 'Battery'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-zinc-800/80">
              <span className="text-zinc-400">Battery Level</span>
              <span className="font-mono font-bold text-blue-400">{diagnostics.power?.percent || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-zinc-400">Health / Status</span>
              <span className={`font-bold ${diagnostics.power?.health?.includes('Critical') ? 'text-red-400' : 'text-emerald-400'}`}>
                {diagnostics.power?.health || 'Optimal'}
              </span>
            </div>
          </div>
        </div>

        {/* Display Topology */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Monitor size={15} className="text-blue-400" /> Display &amp; GPU Topology
          </h3>
          <div className="space-y-3 max-h-[160px] overflow-y-auto pr-1 text-xs">
            {diagnostics.displays?.length === 0 ? (
              <p className="text-zinc-600">No display interfaces found.</p>
            ) : (
              diagnostics.displays?.map((disp, i) => (
                <div key={i} className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/60">
                  <p className="font-bold text-zinc-200 truncate">{disp.name}</p>
                  <div className="flex justify-between items-center text-[11px] mt-1.5 font-mono">
                    <span className="text-zinc-400">{disp.resolution} @ {disp.refresh_rate}</span>
                    <span className={disp.health === 'Good' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                      {disp.health}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Network Adapters */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Network size={15} className="text-emerald-400" /> Physical Network Adapters
          </h3>
          <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1 text-xs">
            {diagnostics.network?.length === 0 ? (
              <p className="text-zinc-600">No active physical adapters.</p>
            ) : (
              diagnostics.network?.map((net, i) => (
                <div key={i} className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/60">
                  <p className="font-bold text-zinc-200 truncate" title={net.name}>{net.name}</p>
                  <div className="flex justify-between items-center text-[11px] mt-1.5 font-mono">
                    <span className="text-zinc-400">Link Speed: {net.speed}</span>
                    <span className={net.health === 'Good' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                      {net.health}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* USB Peripherals */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Usb size={15} className="text-purple-400" /> USB Peripherals &amp; Bus
          </h3>
          <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1 text-xs">
            {diagnostics.usb?.length === 0 ? (
              <p className="text-zinc-600">No USB peripherals detected.</p>
            ) : (
              diagnostics.usb?.map((usb, i) => (
                <div key={i} className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/60 flex justify-between items-center">
                  <div className="overflow-hidden pr-2">
                    <p className="font-bold text-zinc-200 truncate" title={usb.name}>{usb.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{usb.manufacturer || 'Standard Device'}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    usb.risk_score?.includes('Critical')
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {usb.risk_score?.includes('Critical') ? 'Flagged' : 'Secure'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
