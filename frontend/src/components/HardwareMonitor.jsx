import { useState, useEffect } from 'react';
import axios from 'axios';
import { Monitor, Zap, Network, Usb } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function HardwareMonitor() {
  const [diagnostics, setDiagnostics] = useState({ usb: [], displays: [], network: [], power: {} });

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await axios.get(`${API_BASE}/hardware`);
        setDiagnostics(res.data.diagnostics);
      } catch {
        // silently ignore fetch errors
      }
    };
    fetchDevices();
    const int = setInterval(fetchDevices, 10000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div>
        <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2 text-zinc-100">
          <Monitor size={24} /> Hardware Diagnostics
        </h2>
        <p className="text-zinc-400 text-sm">Deep inspection for all connected physical interfaces and power delivery.</p>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#1e1e1e] rounded-xl border border-[#2c2c2c] p-6">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6 flex items-center gap-2"><Zap size={16} className="text-yellow-500"/> Power State</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[#2c2c2c] pb-2"><span className="text-zinc-500 text-sm">Battery Level</span> <span className="font-mono text-zinc-200">{diagnostics.power.percent}</span></div>
            <div className="flex justify-between items-center border-b border-[#2c2c2c] pb-2"><span className="text-zinc-500 text-sm">Plugged In</span> <span className="font-mono text-zinc-200">{diagnostics.power.plugged_in ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between items-center border-b border-[#2c2c2c] pb-2"><span className="text-zinc-500 text-sm">Health Status</span> <span className={`font-mono ${diagnostics.power.health?.includes('Critical') ? 'text-red-500' : 'text-emerald-500'}`}>{diagnostics.power.health}</span></div>
          </div>
        </div>

        <div className="bg-[#1e1e1e] rounded-xl border border-[#2c2c2c] p-6">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6 flex items-center gap-2"><Monitor size={16} className="text-blue-400"/> Display Topology</h3>
          <div className="space-y-4 max-h-[200px] overflow-y-auto">
            {diagnostics.displays.length === 0 ? <p className="text-zinc-600 text-sm">No displays detected.</p> : diagnostics.displays.map((disp, i) => (
              <div key={i} className="border-b border-[#2c2c2c] pb-3 last:border-0">
                <p className="font-medium text-zinc-200 text-sm">{disp.name}</p>
                <div className="flex justify-between text-xs mt-2 font-mono">
                  <span className="text-zinc-500">{disp.resolution} @ {disp.refresh_rate}</span>
                  <span className={disp.health === 'Good' ? 'text-emerald-500' : 'text-amber-500'}>{disp.health}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-[#1e1e1e] rounded-xl border border-[#2c2c2c] p-6">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6 flex items-center gap-2"><Network size={16} className="text-emerald-500"/> Network Adapters</h3>
          <div className="space-y-4 max-h-[250px] overflow-y-auto">
            {diagnostics.network.length === 0 ? <p className="text-zinc-600 text-sm">No active networks.</p> : diagnostics.network.map((net, i) => (
              <div key={i} className="border-b border-[#2c2c2c] pb-3 last:border-0">
                <p className="font-medium text-sm text-zinc-200 truncate" title={net.name}>{net.name}</p>
                <div className="flex justify-between text-xs mt-2 font-mono">
                  <span className="text-zinc-500">Speed: {net.speed}</span>
                  <span className={net.health === 'Good' ? 'text-emerald-500' : 'text-amber-500'}>{net.health}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1e1e1e] rounded-xl border border-[#2c2c2c] p-6">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-6 flex items-center gap-2"><Usb size={16} className="text-purple-400"/> USB Peripherals</h3>
          <div className="space-y-4 max-h-[250px] overflow-y-auto">
            {diagnostics.usb.length === 0 ? <p className="text-zinc-600 text-sm">No USB devices detected.</p> : diagnostics.usb.map((usb, i) => (
              <div key={i} className="border-b border-[#2c2c2c] pb-3 last:border-0 flex justify-between items-start">
                <div className="overflow-hidden">
                  <p className="font-medium text-sm text-zinc-200 truncate pr-4" title={usb.name}>{usb.name}</p>
                  <p className="text-xs text-zinc-500 mt-1 truncate">{usb.manufacturer}</p>
                </div>
                <span className={`text-xs font-mono whitespace-nowrap mt-1 ${usb.risk_score.includes('Critical') ? 'text-red-500' : 'text-emerald-500'}`}>{usb.risk_score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
