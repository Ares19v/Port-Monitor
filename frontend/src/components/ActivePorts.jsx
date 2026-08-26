import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Network,
  ChevronDown,
  ChevronRight,
  Activity,
  ShieldAlert,
  Cpu,
  Box,
  Globe,
  FileCode2,
  Terminal,
  Folder,
  Database,
  Search,
  Settings,
  Trash2,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  CheckCircle2,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_BASE = 'http://127.0.0.1:8000/api';

const AppIcon = ({ name }) => {
  const lowerName = name?.toLowerCase() || '';
  if (lowerName.includes('chrome') || lowerName.includes('browser')) return <Globe size={16} className="text-blue-400" />;
  if (lowerName.includes('code')) return <FileCode2 size={16} className="text-blue-500" />;
  if (lowerName.includes('python')) return <Terminal size={16} className="text-yellow-400" />;
  if (lowerName.includes('node')) return <Box size={16} className="text-green-500" />;
  if (lowerName.includes('explorer')) return <Folder size={16} className="text-yellow-500" />;
  if (lowerName.includes('sql') || lowerName.includes('mongo') || lowerName.includes('postgres') || lowerName.includes('redis'))
    return <Database size={16} className="text-purple-400" />;
  if (lowerName.includes('system') || lowerName.includes('host') || lowerName.includes('service'))
    return <Settings size={16} className="text-zinc-500" />;
  return <Box size={16} className="text-zinc-400" />;
};

const CategoryBadge = ({ category, service }) => {
  let color = 'bg-zinc-800 text-zinc-300 border-zinc-700';
  if (category === 'Frontend') color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (category === 'Backend') color = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  if (category === 'Database') color = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  if (category === 'Web') color = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  if (category === 'Container') color = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';

  return (
    <div className="flex items-center gap-1.5">
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${color}`}>
        {category}
      </span>
      <span className="text-[11px] text-zinc-400 truncate max-w-[140px]">{service}</span>
    </div>
  );
};

function ProcessDetails({ pid, port }) {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const response = await axios.get(`${API_BASE}/process/${pid}`);
        setDetails(response.data);
      } catch {
        // silently ignore fetch errors
      }
    };
    fetchDetails();
  }, [pid]);

  if (!details) return <div className="text-zinc-500 text-xs p-4">Loading process details...</div>;

  const ioData = details.io ? [
    { name: 'Read', bytes: details.io.read_bytes },
    { name: 'Write', bytes: details.io.write_bytes }
  ] : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
      {/* I/O Stats */}
      <div className="bg-[#18181b] p-4 rounded-xl border border-zinc-800 flex flex-col h-44 shadow-inner">
        <h4 className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-2">
          <Activity size={13} className="text-blue-400" /> Total I/O Bytes
        </h4>
        {ioData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ioData}>
              <XAxis dataKey="name" stroke="#52525b" fontSize={11} />
              <YAxis stroke="#52525b" fontSize={11} tickFormatter={(value) => (value / 1024 / 1024).toFixed(1) + 'MB'} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '11px' }}
              />
              <Bar dataKey="bytes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-zinc-600 my-auto">I/O data not available.</p>
        )}
      </div>

      {/* Process Meta */}
      <div className="bg-[#18181b] p-4 rounded-xl border border-zinc-800 flex flex-col justify-between shadow-inner text-xs">
        <h4 className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-2">
          <ShieldAlert size={13} className="text-amber-400" /> Process Metadata
        </h4>
        <div className="space-y-2">
          <p className="flex justify-between"><span className="text-zinc-500">Memory:</span> <span className="font-mono text-zinc-200 font-bold">{details.memory_mb} MB</span></p>
          <p className="flex justify-between"><span className="text-zinc-500">User:</span> <span className="text-zinc-300 truncate max-w-[140px]">{details.username || 'System'}</span></p>
          <p className="flex justify-between"><span className="text-zinc-500">Started:</span> <span className="font-mono text-zinc-400">{details.create_time || 'N/A'}</span></p>
          {details.parent && (
            <p className="flex justify-between"><span className="text-zinc-500">Parent:</span> <span className="text-blue-400">{details.parent.name} ({details.parent.pid})</span></p>
          )}
        </div>
      </div>

      {/* Process Tree (Children) */}
      <div className="bg-[#18181b] p-4 rounded-xl border border-zinc-800 overflow-y-auto h-44 shadow-inner text-xs">
        <h4 className="text-xs font-bold text-zinc-400 mb-2 flex items-center gap-2">
          <Cpu size={13} className="text-purple-400" /> Child Process Tree
        </h4>
        <div className="mt-2">
          <div className="text-blue-400 flex items-center gap-1.5 font-bold mb-1">
            <ChevronRight size={13} /> {details.name} <span className="text-zinc-600 font-normal">({details.pid})</span>
          </div>
          <div className="pl-3 border-l border-zinc-800 ml-1.5 space-y-1">
            {details.children && details.children.length > 0 ? (
              details.children.map(child => (
                <div key={child.pid} className="text-zinc-400 flex items-center justify-between">
                  <span>{child.name} <span className="text-zinc-600">({child.pid})</span></span>
                  <span className="font-mono text-[10px] text-zinc-500">{child.memory_mb}MB</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-600">No child processes spawned.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActivePorts() {
  const [ports, setPorts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [finderStart, setFinderStart] = useState('3000');
  const [suggestedPort, setSuggestedPort] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPorts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/ports`);
      setPorts(response.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPorts();
    const interval = setInterval(fetchPorts, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleKill = async (pid, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to kill PID ${pid}?`)) return;
    try {
      await axios.post(`${API_BASE}/process/${pid}/kill`);
      fetchPorts();
    } catch {
      alert('Failed to kill process.');
    }
  };

  const handleBatchKillDev = async () => {
    const devPorts = ports.filter(p => [3000, 3001, 5173, 5174, 8000, 8001, 8080, 5000].includes(p.port));
    if (!devPorts.length) return alert('No active dev servers found on standard ports (3000, 5173, 8000, etc.).');
    const pids = [...new Set(devPorts.map(p => p.pid))];
    if (!window.confirm(`Kill ${pids.length} active dev process(es) holding ports: ${devPorts.map(p => p.port).join(', ')}?`)) return;
    try {
      await axios.post(`${API_BASE}/processes/kill-multiple`, { pids });
      fetchPorts();
    } catch {
      alert('Failed to batch terminate.');
    }
  };

  const handleFindFree = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await axios.get(`${API_BASE}/ports/next-available?start=${finderStart || 3000}`);
      setSuggestedPort(res.data?.next_available_port);
    } catch {
      // fallback
    }
  };

  const copyPort = (val) => {
    navigator.clipboard.writeText(String(val));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter logic
  const filtered = ports.filter(p => {
    // Search query
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      String(p.port).includes(q) ||
      p.process_name?.toLowerCase().includes(q) ||
      p.service?.toLowerCase().includes(q) ||
      String(p.pid).includes(q);

    if (!matchesSearch) return false;

    // Filter tabs
    if (filter === 'LISTEN') return p.status === 'LISTEN';
    if (filter === 'ESTABLISHED') return p.status === 'ESTABLISHED';
    if (filter === 'DEV') return ['Frontend', 'Backend', 'Web'].includes(p.category) || [3000, 5173, 8000, 8001, 8080, 5000].includes(p.port);
    if (filter === 'DB') return p.category === 'Database' || [5432, 3306, 6379, 27017].includes(p.port);

    return true;
  });

  const listeningCount = ports.filter(p => p.status === 'LISTEN').length;
  const devCount = ports.filter(p => ['Frontend', 'Backend'].includes(p.category)).length;

  return (
    <div className="space-y-6">
      
      {/* Header with quick stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Network size={24} className="text-blue-400" /> Active Ports &amp; Sockets
          </h2>
          <p className="text-zinc-400 text-xs mt-0.5">
            Real-time inspection of open TCP/UDP sockets with service auto-detection.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBatchKillDev}
            className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Trash2 size={13} />
            Kill All Dev Ports
          </button>
          <button
            onClick={fetchPorts}
            disabled={loading}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition-all"
            title="Refresh Ports"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Smart Port Finder Card */}
      <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sparkles size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-200">Smart Free Port Finder</h4>
            <p className="text-[11px] text-zinc-400">Scan for the next available, conflict-free port for your dev server.</p>
          </div>
        </div>

        <form onSubmit={handleFindFree} className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500">:</span>
            <input
              type="number"
              value={finderStart}
              onChange={e => setFinderStart(e.target.value)}
              placeholder="3000"
              className="w-28 pl-6 pr-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-zinc-200 outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            Scan Free Port
          </button>

          {suggestedPort && (
            <button
              type="button"
              onClick={() => copyPort(suggestedPort)}
              className="px-3 py-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold hover:bg-emerald-500/25 transition-all flex items-center gap-1.5"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              :{suggestedPort}
            </button>
          )}
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: `All (${ports.length})` },
            { id: 'LISTEN', label: `Listening (${listeningCount})` },
            { id: 'DEV', label: `Dev Servers (${devCount})` },
            { id: 'DB', label: 'Databases' },
            { id: 'ESTABLISHED', label: 'Established' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                filter === tab.id
                  ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {tab.label}
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
            placeholder="Filter port, PID, or name..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#18181b] border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-zinc-600 transition-colors"
          />
        </div>
      </div>

      {/* Active Ports Table */}
      <div className="bg-[#18181b] rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-[11px] uppercase tracking-wider bg-[#141416]">
              <th className="p-3.5 font-semibold w-10"></th>
              <th className="p-3.5 font-semibold">Port</th>
              <th className="p-3.5 font-semibold">Project &amp; Service</th>
              <th className="p-3.5 font-semibold">Process</th>
              <th className="p-3.5 font-semibold">PID</th>
              <th className="p-3.5 font-semibold">RAM</th>
              <th className="p-3.5 font-semibold">Status</th>
              <th className="p-3.5 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filtered.map((p, idx) => (
              <React.Fragment key={`${p.pid}-${p.port}-${idx}`}>
                <tr
                  onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                  className="hover:bg-zinc-800/40 transition-colors group cursor-pointer text-xs"
                >
                  <td className="p-3.5 text-zinc-500">
                    {expandedRow === idx ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </td>

                  <td className="p-3.5 font-mono font-bold text-blue-400">
                    <span className="bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                      :{p.port}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <div className="space-y-1">
                      {p.project_name ? (
                        <div className="flex items-center gap-1.5" title={p.cwd || p.cmdline}>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                            <Folder size={10} className="text-blue-400" />
                            {p.project_name}
                          </span>
                          <span className="text-[11px] text-zinc-400 truncate max-w-[120px]">{p.service}</span>
                        </div>
                      ) : (
                        <CategoryBadge category={p.category} service={p.service} />
                      )}
                      {p.cwd && (
                        <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[180px]" title={p.cwd}>
                          {p.cwd.split('\\').slice(-2).join('\\')}
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="p-3.5 text-zinc-200">
                    <div className="flex items-center gap-2.5 font-medium">
                      <div className="p-1 rounded-lg bg-zinc-800 border border-zinc-700">
                        <AppIcon name={p.process_name} />
                      </div>
                      <span className="truncate max-w-[120px]">{p.process_name}</span>
                    </div>
                  </td>

                  <td className="p-3.5 font-mono text-zinc-400">{p.pid}</td>

                  <td className="p-3.5 font-mono text-zinc-400">{p.memory_mb || 0} MB</td>

                  <td className="p-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      p.status === 'LISTEN'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {p.status}
                    </span>
                  </td>

                  <td className="p-3.5 text-right">
                    <button
                      onClick={(e) => handleKill(p.pid, e)}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-all text-xs font-semibold"
                      title="Kill Process"
                    >
                      Kill Port
                    </button>
                  </td>
                </tr>

                {expandedRow === idx && (
                  <tr className="bg-[#121214]">
                    <td colSpan={8} className="p-5 border-b border-zinc-800">
                      <ProcessDetails pid={p.pid} port={p.port} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-10 text-center text-zinc-500 text-xs">
                  No matching sockets or ports active.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
