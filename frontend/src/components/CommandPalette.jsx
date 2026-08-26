import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Search,
  Network,
  Server,
  Gauge,
  Globe,
  Monitor,
  Rocket,
  Bell,
  Layers,
  FolderSearch,
  Activity,
  Trash2,
  ArrowRight,
  CheckCircle2,
  X,
  CornerDownLeft,
  Sparkles
} from 'lucide-react';

const API = 'http://127.0.0.1:8000/api';

export default function CommandPalette({ isOpen, onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [ports, setPorts] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [suggestedPort, setSuggestedPort] = useState(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSuggestedPort(null);
      setTimeout(() => inputRef.current?.focus(), 50);

      // Fetch fresh ports and processes
      axios.get(`${API}/ports`).then(r => setPorts(r.data || [])).catch(() => {});
      axios.get(`${API}/processes?limit=50`).then(r => setProcesses(r.data?.processes || [])).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onNavigate?.(null, true);
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNavigate]);

  const handleKill = async (pid, e) => {
    e.stopPropagation();
    try {
      await axios.post(`${API}/process/${pid}/kill`);
      setPorts(prev => prev.filter(p => p.pid !== pid));
      setProcesses(prev => prev.filter(p => p.pid !== pid));
    } catch {
      alert(`Failed to terminate PID ${pid}`);
    }
  };

  const handleCheckNextFree = async (startPort) => {
    try {
      const res = await axios.get(`${API}/ports/next-available?start=${startPort || 3000}`);
      setSuggestedPort(res.data?.next_available_port);
    } catch {
      // fallback
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Filtered Navigation items
  const navItems = [
    { id: 'performance', label: 'Performance Dashboard', icon: Gauge, cat: 'Navigate' },
    { id: 'ports',       label: 'Active Ports & Sockets', icon: Network, cat: 'Navigate' },
    { id: 'tasks',       label: 'Processes & Task Manager', icon: Server, cat: 'Navigate' },
    { id: 'security',    label: 'Network Security & GeoIP Map', icon: Globe, cat: 'Navigate' },
    { id: 'hardware',    label: 'Hardware Diagnostics (WMI)', icon: Monitor, cat: 'Navigate' },
    { id: 'scanner',     label: 'Project Scanner', icon: FolderSearch, cat: 'Navigate' },
    { id: 'workspaces',  label: 'Workspace Orchestrator', icon: Layers, cat: 'Navigate' },
    { id: 'forwarding',  label: 'Port Forwarding (TCP)', icon: Activity, cat: 'Navigate' },
    { id: 'startup',     label: 'Windows Startup Registry', icon: Rocket, cat: 'Navigate' },
    { id: 'alerts',      label: 'Alert Thresholds & Report', icon: Bell, cat: 'Navigate' },
  ].filter(item => !q || item.label.toLowerCase().includes(q) || item.id.includes(q));

  // Filtered Ports
  const filteredPorts = ports.filter(p =>
    !q ||
    String(p.port).includes(q) ||
    p.process_name?.toLowerCase().includes(q) ||
    p.service?.toLowerCase().includes(q) ||
    String(p.pid).includes(q)
  );

  // Filtered Processes
  const filteredProcesses = processes.filter(p =>
    !q ||
    p.name?.toLowerCase().includes(q) ||
    String(p.pid).includes(q) ||
    p.user?.toLowerCase().includes(q)
  ).slice(0, 8);

  const queryIsNumber = !isNaN(Number(q)) && q.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#18181b] border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-zinc-800 bg-[#1f1f23]">
          <Search className="w-5 h-5 text-zinc-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search ports (3000, 8000), processes, services, or commands..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 mr-2"
            >
              <X size={14} />
            </button>
          )}
          <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 font-mono">
            ESC
          </span>
        </div>

        {/* Port Helper Widget for Numerical Query */}
        {queryIsNumber && (
          <div className="p-3 bg-blue-500/10 border-b border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-zinc-200">
                Port <strong>{q}</strong> — Find next open free port?
              </span>
            </div>
            <div className="flex items-center gap-2">
              {suggestedPort && (
                <button
                  onClick={() => copyToClipboard(`PORT=${suggestedPort}`)}
                  className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold hover:bg-emerald-500/30 transition-all flex items-center gap-1"
                >
                  <CheckCircle2 size={12} />
                  {suggestedPort} (Copy)
                </button>
              )}
              <button
                onClick={() => handleCheckNextFree(Number(q))}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Scan Available Port
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Results Stream */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          
          {/* Active Ports Section */}
          {filteredPorts.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>Active Ports ({filteredPorts.length})</span>
                <span className="text-zinc-600 font-normal">Click to navigate</span>
              </div>
              <div className="space-y-1">
                {filteredPorts.slice(0, 10).map((p, idx) => (
                  <div
                    key={`${p.port}-${p.pid}-${idx}`}
                    onClick={() => { onNavigate?.('ports'); onClose(); }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-800/80 cursor-pointer group transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 w-16 text-center">
                        :{p.port}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-zinc-200">{p.process_name}</p>
                          {p.project_name && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {p.project_name}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-zinc-500">PID: {p.pid} · {p.service || 'Service'}{p.cwd ? ` · ${p.cwd.split('\\').slice(-2).join('\\')}` : ''}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        p.status === 'LISTEN'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {p.status}
                      </span>
                      <button
                        onClick={(e) => handleKill(p.pid, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                        title="Kill Process"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Running Processes Section */}
          {filteredProcesses.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Processes ({filteredProcesses.length})
              </div>
              <div className="space-y-1">
                {filteredProcesses.map((proc) => (
                  <div
                    key={proc.pid}
                    onClick={() => { onNavigate?.('tasks'); onClose(); }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-zinc-800/80 cursor-pointer group transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Server size={14} className="text-zinc-500" />
                      <div>
                        <p className="font-bold text-zinc-200">{proc.name}</p>
                        <span className="text-[10px] text-zinc-500">PID: {proc.pid} · RAM: {proc.memory_mb} MB</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-zinc-400">{proc.memory_mb} MB</span>
                      <button
                        onClick={(e) => handleKill(proc.pid, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                        title="Kill Process"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Items Section */}
          {navItems.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Modules &amp; Navigation
              </div>
              <div className="grid grid-cols-2 gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onNavigate?.(item.id); onClose(); }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-zinc-800/80 text-left text-xs font-medium text-zinc-300 hover:text-white transition-colors"
                    >
                      <Icon size={15} className="text-blue-400 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2.5 bg-[#141416] border-t border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span><strong>↑↓</strong> navigate</span>
            <span><strong>↵</strong> select</span>
            <span><strong>Esc</strong> close</span>
          </div>
          <span className="font-mono text-zinc-400">Port-Monitor Core</span>
        </div>
      </div>
    </div>
  );
}
