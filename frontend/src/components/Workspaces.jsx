import { useState, useEffect, startTransition } from 'react';
import axios from 'axios';
import { Layers, Trash2, Terminal } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000/api';

export default function Workspaces({ initialData }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [name, setName] = useState('');
  const [cwd, setCwd] = useState('');
  const [commands, setCommands] = useState(['']);
  const [selectedWs, setSelectedWs] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!initialData) return;
    startTransition(() => {
      setName(initialData.name || '');
      setCwd(initialData.path || '');
      setCommands(initialData.suggested_commands?.length ? initialData.suggested_commands : ['']);
    });
  }, [initialData]);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const res = await axios.get(`${API_BASE}/workspace`);
        setWorkspaces(res.data);
      } catch {
        // silently ignore
      }
    };

    const fetchLogs = async () => {
      if (!selectedWs) return;
      try {
        const res = await axios.get(`${API_BASE}/workspace/${selectedWs}/logs`);
        setLogs(res.data.logs);
      } catch {
        // silently ignore
      }
    };

    fetchWorkspaces();
    const int = setInterval(() => {
      fetchWorkspaces();
      fetchLogs();
    }, 2000);
    return () => clearInterval(int);
  }, [selectedWs]);

  const handleStart = async (e) => {
    if (e) e.preventDefault();
    try {
      await axios.post(`${API_BASE}/workspace`, {
        name, commands: commands.filter(c => c.trim() !== ''), cwd: cwd || null
      });
      setName(''); setCommands(['']); setCwd('');
      const res = await axios.get(`${API_BASE}/workspace`);
      setWorkspaces(res.data);
    } catch {
      alert("Error starting workspace");
    }
  };

  const handleStop = async (id) => {
    try {
      await axios.delete(`${API_BASE}/workspace/${id}`);
      const res = await axios.get(`${API_BASE}/workspace`);
      setWorkspaces(res.data);
      if (selectedWs === id) setSelectedWs(null);
    } catch {
      // silently ignore
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-full pb-10">
      <div className="col-span-2 flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2 text-zinc-100">
            <Layers size={24} /> Workspace Orchestrator
          </h2>
          <p className="text-zinc-400 text-sm">Run projects without port conflicts. Dynamically injects free ports via <code className="bg-[#2c2c2c] px-1 rounded text-zinc-300">PORT</code>.</p>
        </div>
        
        <div className="bg-[#1e1e1e] border border-[#2c2c2c] p-6 rounded-xl">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Start New Workspace</h3>
          <form onSubmit={handleStart} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wide">Workspace Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. My Next.js App" className="w-full bg-[#121212] border border-[#2c2c2c] rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-[#444] text-sm" />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wide">Working Directory</label>
                <input type="text" value={cwd} onChange={e => setCwd(e.target.value)} placeholder="e.g. C:\Projects\MyApp" className="w-full bg-[#121212] border border-[#2c2c2c] rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-[#444] text-sm" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-zinc-500 mb-2 uppercase tracking-wide">Startup Commands</label>
              {commands.map((cmd, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input type="text" required value={cmd} onChange={e => {
                    const newCmds = [...commands];
                    newCmds[idx] = e.target.value;
                    setCommands(newCmds);
                  }} placeholder="e.g. npm run dev" className="flex-1 bg-[#121212] border border-[#2c2c2c] rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-[#444] font-mono text-sm" />
                  {idx > 0 && (
                    <button type="button" onClick={() => setCommands(commands.filter((_, i) => i !== idx))} className="px-4 border border-[#2c2c2c] bg-[#161616] text-zinc-500 rounded-lg hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setCommands([...commands, ''])} className="text-sm text-blue-400 hover:text-blue-300 mt-2">+ Add another command</button>
            </div>
            <button type="submit" className="w-full bg-white text-black hover:bg-zinc-200 px-6 py-3 rounded-lg font-medium transition-colors mt-4 text-sm">
              Launch Workspace
            </button>
          </form>
        </div>

        <div className="bg-[#161616] border border-[#2c2c2c] shadow-inner rounded-xl overflow-hidden flex-1 flex flex-col min-h-[300px]">
          <div className="bg-[#1e1e1e] p-3 border-b border-[#2c2c2c] flex items-center justify-between">
            <h3 className="font-medium text-sm text-zinc-300 flex items-center gap-2"><Terminal size={14} className="text-zinc-500"/> Terminal Output {selectedWs && <span className="text-zinc-500">({workspaces.find(w => w.id === selectedWs)?.name})</span>}</h3>
          </div>
          <div className="p-4 bg-[#121212] flex-1 overflow-y-auto font-mono text-xs text-zinc-400 space-y-1">
            {!selectedWs ? (
              <p className="text-zinc-600 text-center mt-10">Select an active workspace to view logs.</p>
            ) : logs.length === 0 ? (
              <p className="text-zinc-600">Waiting for logs...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={log.includes('[STDERR]') ? 'text-red-400' : 'text-zinc-400'}>{log}</div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#1e1e1e] border border-[#2c2c2c] rounded-xl overflow-hidden h-fit">
        <div className="bg-[#161616] p-4 border-b border-[#2c2c2c]">
          <h3 className="font-semibold text-sm text-zinc-300 uppercase tracking-wider">Active Run states</h3>
        </div>
        <div className="divide-y divide-[#2c2c2c]/50">
          {workspaces.map(ws => (
            <div key={ws.id} className={`p-4 transition-colors cursor-pointer border-l-2 ${selectedWs === ws.id ? 'bg-white/[0.04] border-blue-500' : 'border-transparent hover:bg-white/[0.02]'}`} onClick={() => setSelectedWs(ws.id)}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-zinc-200">{ws.name}</h4>
                <button onClick={(e) => { e.stopPropagation(); handleStop(ws.id); }} className="text-zinc-600 hover:text-red-400" title="Stop">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="text-xs text-zinc-500 space-y-1 font-mono">
                {ws.commands.map((cmd, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="truncate max-w-[150px]">{cmd}</span>
                    <span className="text-emerald-500">:{ws.ports[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {workspaces.length === 0 && (
            <div className="p-8 text-center text-zinc-600 text-sm">No active workspaces.</div>
          )}
        </div>
      </div>
    </div>
  );
}
