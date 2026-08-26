import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Server,
  Globe,
  FileCode2,
  Terminal,
  Box,
  Folder,
  Database,
  Search,
  Settings,
  Trash2,
  RefreshCw,
  Cpu,
  Zap,
  ShieldAlert
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

const AppIcon = ({ name }) => {
  const lowerName = name?.toLowerCase() || '';
  if (lowerName.includes('chrome') || lowerName.includes('browser') || lowerName.includes('edge'))
    return <Globe size={16} className="text-blue-400" />;
  if (lowerName.includes('code') || lowerName.includes('cursor'))
    return <FileCode2 size={16} className="text-blue-500" />;
  if (lowerName.includes('python'))
    return <Terminal size={16} className="text-yellow-400" />;
  if (lowerName.includes('node') || lowerName.includes('npm'))
    return <Box size={16} className="text-emerald-400" />;
  if (lowerName.includes('explorer'))
    return <Folder size={16} className="text-amber-400" />;
  if (lowerName.includes('sql') || lowerName.includes('mongo') || lowerName.includes('postgres') || lowerName.includes('redis'))
    return <Database size={16} className="text-purple-400" />;
  if (lowerName.includes('search'))
    return <Search size={16} className="text-zinc-400" />;
  if (lowerName.includes('system') || lowerName.includes('host') || lowerName.includes('service'))
    return <Settings size={16} className="text-zinc-500" />;
  return <Box size={16} className="text-zinc-400" />;
};

export default function TaskManager() {
  const [processes, setProcesses] = useState([]);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('memory'); // 'memory' | 'cpu' | 'name'
  const [loading, setLoading] = useState(false);

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/processes?limit=150`);
      setProcesses(res.data?.processes || []);
    } catch {
      // silently ignore fetch errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleKill = async (pid) => {
    if (!window.confirm(`End task for PID ${pid}?`)) return;
    try {
      await axios.post(`${API_BASE}/process/${pid}/kill`);
      setProcesses(prev => prev.filter(p => p.pid !== pid));
    } catch {
      alert("Failed to kill process.");
    }
  };

  const filtered = processes
    .filter(p => {
      const q = search.toLowerCase();
      return (
        !q ||
        p.name?.toLowerCase().includes(q) ||
        String(p.pid).includes(q) ||
        p.user?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'memory') return b.memory_mb - a.memory_mb;
      if (sortBy === 'cpu') return b.cpu - a.cpu;
      return a.name.localeCompare(b.name);
    });

  const totalRam = processes.reduce((acc, p) => acc + (p.memory_mb || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Server size={24} className="text-blue-400" /> Active System Processes
          </h2>
          <p className="text-zinc-400 text-xs mt-0.5">
            Detailed task manager showing memory, CPU utilization, and user context.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-[#18181b] border border-zinc-800 rounded-xl text-xs font-mono text-zinc-400">
            Tracked: <strong className="text-zinc-200">{processes.length}</strong> tasks ({(totalRam / 1024).toFixed(1)} GB)
          </div>
          <button
            onClick={fetchProcesses}
            disabled={loading}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition-all"
            title="Refresh Processes"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Sort Controls */}
        <div className="flex items-center gap-1.5">
          {[
            { id: 'memory', label: 'Top Memory (RAM)', icon: Zap },
            { id: 'cpu', label: 'Top CPU (%)', icon: Cpu },
            { id: 'name', label: 'Process Name (A-Z)', icon: Server },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setSortBy(btn.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                sortBy === btn.id
                  ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <btn.icon size={13} />
              {btn.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, PID, or user..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#18181b] border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-zinc-600 transition-colors"
          />
        </div>
      </div>

      {/* Processes Table */}
      <div className="bg-[#18181b] rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-[11px] uppercase tracking-wider bg-[#141416]">
              <th className="p-3.5 font-semibold">Process Name</th>
              <th className="p-3.5 font-semibold">PID</th>
              <th className="p-3.5 font-semibold">User</th>
              <th className="p-3.5 font-semibold">Memory (MB)</th>
              <th className="p-3.5 font-semibold">CPU (%)</th>
              <th className="p-3.5 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filtered.map((p) => (
              <tr key={p.pid} className="hover:bg-zinc-800/40 transition-colors group text-xs">
                <td className="p-3.5 font-medium text-zinc-200">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1 rounded-lg bg-zinc-800 border border-zinc-700">
                      <AppIcon name={p.name} />
                    </div>
                    <span className="font-bold">{p.name}</span>
                  </div>
                </td>
                
                <td className="p-3.5 font-mono text-zinc-400">{p.pid}</td>
                
                <td className="p-3.5 text-zinc-400 truncate max-w-[140px]">{p.user}</td>
                
                <td className="p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-200 w-16">{p.memory_mb.toFixed(1)} MB</span>
                    <div className="w-20 bg-zinc-800 h-1.5 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${Math.min(100, (p.memory_mb / 1024) * 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                
                <td className="p-3.5 font-mono font-bold text-blue-400">
                  {p.cpu > 0 ? `${p.cpu.toFixed(1)}%` : '0.0%'}
                </td>
                
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => handleKill(p.pid)}
                    className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-all text-xs font-semibold"
                    title="End Task"
                  >
                    End Task
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-10 text-center text-zinc-500 text-xs">
                  No matching processes found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
