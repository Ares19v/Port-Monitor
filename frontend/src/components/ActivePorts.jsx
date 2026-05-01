import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Network, ChevronDown, ChevronRight, Activity, ShieldAlert, Cpu, Box, Globe, FileCode2, Terminal, Folder, Database, Search, Settings } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

  if (!details) return <div className="text-zinc-500 text-sm">Loading process details...</div>;

  const ioData = details.io ? [
    { name: 'Read', bytes: details.io.read_bytes },
    { name: 'Write', bytes: details.io.write_bytes }
  ] : [];

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="bg-[#161616] p-4 rounded-lg border border-[#2c2c2c] flex flex-col h-48 shadow-inner">
        <h4 className="text-sm text-zinc-400 mb-4 flex items-center gap-2"><Activity size={14}/> Total I/O Bytes</h4>
        {ioData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ioData}>
              <XAxis dataKey="name" stroke="#52525b" fontSize={12} />
              <YAxis stroke="#52525b" fontSize={12} tickFormatter={(value) => (value/1024/1024).toFixed(1) + 'MB'} />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{backgroundColor: '#1e1e1e', border: '1px solid #2c2c2c', borderRadius: '8px'}} />
              <Bar dataKey="bytes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-zinc-600">I/O data not available.</p>
        )}
      </div>
      <div className="bg-[#161616] p-4 rounded-lg border border-[#2c2c2c] shadow-inner">
        <h4 className="text-sm text-zinc-400 mb-2 flex items-center gap-2"><ShieldAlert size={14} className="text-amber-500"/> Security Info</h4>
        <div className="space-y-2 mt-4 text-sm">
          <p className="flex justify-between"><span className="text-zinc-500">Risk Score:</span> <span className={details.risk_score.includes('Privileged') ? 'text-amber-500' : 'text-emerald-500'}>{details.risk_score}</span></p>
          <p className="flex justify-between"><span className="text-zinc-500">User:</span> <span className="text-zinc-300">{details.username || 'Unknown'}</span></p>
          <p className="flex justify-between"><span className="text-zinc-500">Exposure:</span> <span className={port < 1024 ? 'text-amber-500' : 'text-emerald-500'}>{port < 1024 ? 'System Port' : 'Local/User'}</span></p>
        </div>
      </div>
      <div className="bg-[#161616] p-4 rounded-lg border border-[#2c2c2c] overflow-y-auto h-48 shadow-inner">
        <h4 className="text-sm text-zinc-400 mb-2 flex items-center gap-2"><Cpu size={14}/> Process Tree</h4>
        <div className="mt-2 text-sm">
          <div className="text-blue-400 flex items-center gap-2 mb-1"><ChevronRight size={14}/> {details.name} <span className="text-zinc-600">({details.pid})</span></div>
          <div className="pl-4 border-l border-[#2c2c2c] ml-2 space-y-1">
            {details.children.length > 0 ? (
               details.children.map(child => (
                 <div key={child.pid} className="text-zinc-400 flex items-center gap-2">
                   <div className="w-2 h-[1px] bg-[#2c2c2c]"></div> {child.name} <span className="text-zinc-600">({child.pid})</span>
                 </div>
               ))
            ) : (
               <p className="text-xs text-zinc-600 ml-2">No child processes.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActivePorts() {
  const [ports, setPorts] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    const fetchPorts = async () => {
      try {
        const response = await axios.get(`${API_BASE}/ports`);
        setPorts(response.data);
      } catch {
        // silently ignore fetch errors
      }
    };
    fetchPorts();
    const interval = setInterval(fetchPorts, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleKill = async (pid) => {
    if (!window.confirm(`Are you sure you want to kill process ${pid}?`)) return;
    try {
      await axios.post(`${API_BASE}/process/${pid}/kill`);
      const response = await axios.get(`${API_BASE}/ports`);
      setPorts(response.data);
    } catch {
      alert("Failed to kill process.");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2 text-zinc-100">
        <Network size={24} /> Active Network Ports
      </h2>
      <p className="text-zinc-400 mb-6 text-sm">Monitor all open network sockets and active connections on your machine.</p>
      
      <div className="bg-[#1e1e1e] rounded-xl border border-[#2c2c2c] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#2c2c2c] text-zinc-500 text-xs uppercase tracking-wider bg-[#161616]">
              <th className="p-4 font-medium w-10"></th>
              <th className="p-4 font-medium">Port</th>
              <th className="p-4 font-medium">Protocol</th>
              <th className="p-4 font-medium">Process</th>
              <th className="p-4 font-medium">PID</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2c2c2c]/50">
            {ports.map((p, idx) => (
              <React.Fragment key={`${p.pid}-${p.port}-${idx}`}>
                <tr className="hover:bg-white/[0.02] transition-colors group cursor-pointer" onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}>
                  <td className="p-4 text-zinc-500">
                    {expandedRow === idx ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </td>
                  <td className="p-4 font-mono text-blue-400">{p.port}</td>
                  <td className="p-4"><span className="px-2 py-1 rounded bg-[#2c2c2c] text-xs text-zinc-300">{p.protocol}</span></td>
                  <td className="p-4 text-zinc-300 flex items-center gap-3">
                    <div className="p-1.5 bg-[#2a2a2a] rounded-md"><AppIcon name={p.process_name} /></div>
                    {p.process_name}
                  </td>
                  <td className="p-4 font-mono text-sm text-zinc-500">{p.pid}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs border ${p.status === 'LISTEN' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={(e) => { e.stopPropagation(); handleKill(p.pid); }} className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-red-500/10 text-red-400 rounded border border-red-500/20 hover:bg-red-500/20 transition-all text-xs" title="Kill Process">
                      Kill Port
                    </button>
                  </td>
                </tr>
                {expandedRow === idx && (
                  <tr className="bg-[#121212] shadow-inner">
                    <td colSpan={7} className="p-6 border-b border-[#2c2c2c]">
                      <ProcessDetails pid={p.pid} port={p.port} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {ports.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-zinc-600">Scanning ports...</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
