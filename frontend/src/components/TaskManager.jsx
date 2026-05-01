import { useState, useEffect } from 'react';
import axios from 'axios';
import { Server, Globe, FileCode2, Terminal, Box, Folder, Database, Search, Settings } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

const AppIcon = ({ name }) => {
  const lowerName = name?.toLowerCase() || '';
  if (lowerName.includes('chrome') || lowerName.includes('browser')) return <Globe size={16} className="text-blue-400" />;
  if (lowerName.includes('code')) return <FileCode2 size={16} className="text-blue-500" />;
  if (lowerName.includes('python')) return <Terminal size={16} className="text-yellow-400" />;
  if (lowerName.includes('node')) return <Box size={16} className="text-green-500" />;
  if (lowerName.includes('explorer')) return <Folder size={16} className="text-yellow-500" />;
  if (lowerName.includes('sql') || lowerName.includes('mongo')) return <Database size={16} className="text-blue-300" />;
  if (lowerName.includes('search')) return <Search size={16} className="text-zinc-400" />;
  if (lowerName.includes('system') || lowerName.includes('host') || lowerName.includes('service')) return <Settings size={16} className="text-zinc-500" />;
  return <Box size={16} className="text-zinc-400" />;
};

export default function TaskManager() {
  const [processes, setProcesses] = useState([]);
  
  useEffect(() => {
    const fetchProcesses = async () => {
      try {
        const res = await axios.get(`${API_BASE}/processes`);
        setProcesses(res.data.processes || []);
      } catch {
        // silently ignore fetch errors
      }
    };
    fetchProcesses();
    const int = setInterval(fetchProcesses, 5000);
    return () => clearInterval(int);
  }, []);

  const handleKill = async (pid) => {
    if (!window.confirm(`End task for PID ${pid}?`)) return;
    try {
      await axios.post(`${API_BASE}/process/${pid}/kill`);
      const res = await axios.get(`${API_BASE}/processes`);
      setProcesses(res.data.processes || []);
    } catch {
      alert("Failed to kill process.");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2 text-zinc-100">
        <Server size={24} /> System Processes
      </h2>
      <p className="text-zinc-400 mb-6 text-sm">View and manage all background tasks across your system, sorted by RAM usage.</p>
      
      <div className="bg-[#1e1e1e] rounded-xl border border-[#2c2c2c] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#2c2c2c] text-zinc-500 text-xs uppercase tracking-wider bg-[#161616]">
              <th className="p-4 font-medium">Name</th>
              <th className="p-4 font-medium">PID</th>
              <th className="p-4 font-medium">User</th>
              <th className="p-4 font-medium">Memory (MB)</th>
              <th className="p-4 font-medium">CPU (%)</th>
              <th className="p-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2c2c2c]/50">
            {processes.map((p, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                <td className="p-4 font-medium text-zinc-200 flex items-center gap-3">
                  <div className="p-1.5 bg-[#2a2a2a] rounded-md"><AppIcon name={p.name} /></div>
                  {p.name}
                </td>
                <td className="p-4 text-sm font-mono text-zinc-500">{p.pid}</td>
                <td className="p-4 text-sm text-zinc-400">{p.user}</td>
                <td className="p-4 font-mono text-zinc-300">{p.memory_mb.toFixed(1)}</td>
                <td className="p-4 font-mono text-zinc-300">{p.cpu.toFixed(1)}</td>
                <td className="p-4 text-right">
                  <button onClick={() => handleKill(p.pid)} className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-red-500/10 text-red-400 rounded border border-red-500/20 hover:bg-red-500/20 transition-all text-xs">
                    End Task
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
