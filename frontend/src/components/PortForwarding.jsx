import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, ChevronRight } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function PortForwarding() {
  const [rules, setRules] = useState([]);
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await axios.get(`${API_BASE}/forward`);
        setRules(res.data);
      } catch {
        // silently ignore fetch errors
      }
    };
    fetchRules();
    const int = setInterval(fetchRules, 5000);
    return () => clearInterval(int);
  }, []);

  const handleStart = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/forward`, { source_port: parseInt(source), target_port: parseInt(target) });
      setSource(''); setTarget('');
      const res = await axios.get(`${API_BASE}/forward`);
      setRules(res.data);
    } catch {
      alert("Error starting forwarder");
    }
  };

  const handleStop = async (srcPort) => {
    try {
      await axios.delete(`${API_BASE}/forward/${srcPort}`);
      const res = await axios.get(`${API_BASE}/forward`);
      setRules(res.data);
    } catch {
      // silently ignore
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2 text-zinc-100">
        <Activity size={24} /> Local Port Forwarding
      </h2>
      <p className="text-zinc-400 mb-6 text-sm">Reroute traffic from one local port to another seamlessly.</p>
      
      <div className="bg-[#1e1e1e] border border-[#2c2c2c] p-6 rounded-xl mb-8">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Create New Rule</h3>
        <form onSubmit={handleStart} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wide">Listen Port (Source)</label>
            <input type="number" required value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. 8080" className="w-full bg-[#121212] border border-[#2c2c2c] rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-[#444]" />
          </div>
          <div className="flex items-center pb-4 text-zinc-600"><ChevronRight size={20} /></div>
          <div className="flex-1">
            <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wide">Target Port (Destination)</label>
            <input type="number" required value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g. 3000" className="w-full bg-[#121212] border border-[#2c2c2c] rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-[#444]" />
          </div>
          <button type="submit" className="bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-lg font-medium transition-colors text-sm">
            Start Forwarding
          </button>
        </form>
      </div>

      <div className="bg-[#1e1e1e] rounded-xl border border-[#2c2c2c] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#2c2c2c] text-zinc-500 text-xs uppercase tracking-wider bg-[#161616]">
              <th className="p-4 font-medium">Source Port</th>
              <th className="p-4 font-medium">Target Port</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2c2c2c]/50">
            {rules.map(rule => (
              <tr key={rule.source_port} className="hover:bg-white/[0.02]">
                <td className="p-4 font-mono text-blue-400">{rule.source_port}</td>
                <td className="p-4 font-mono text-zinc-300">{rule.target_port}</td>
                <td className="p-4"><span className="px-2 py-1 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">Active</span></td>
                <td className="p-4 text-right">
                  <button onClick={() => handleStop(rule.source_port)} className="px-3 py-1 bg-red-500/10 text-red-400 rounded border border-red-500/20 hover:bg-red-500/20 transition-all text-xs">Stop</button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-zinc-600">No active forwarding rules.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
