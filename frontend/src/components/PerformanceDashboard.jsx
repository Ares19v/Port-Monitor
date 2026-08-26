import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import {
  Gauge,
  Cpu,
  HardDrive,
  Activity,
  Wifi,
  Clock,
  Zap,
  Trash2,
  AlertTriangle,
  Flame,
  CheckCircle2
} from 'lucide-react';

const API = 'http://127.0.0.1:8000/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#18181b] border border-zinc-700 p-2.5 rounded-xl text-xs font-mono shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color }} className="font-bold">
          {e.name}: {typeof e.value === 'number' ? e.value.toFixed(1) : e.value}{e.unit}
        </p>
      ))}
    </div>
  );
};

function Chart({ data, dataKey, name, unit, color, gradId }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis dataKey="time" hide />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey={dataKey}
          name={name}
          unit={unit}
          stroke={color}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#${gradId})`}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function PerformanceDashboard() {
  const [history, setHistory] = useState([]);
  const [cur, setCur] = useState(null);
  const [range, setRange] = useState(0);
  const [histData, setHistData] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket('ws://127.0.0.1:8000/ws/performance');
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setCur(data);
          const t = new Date().toLocaleTimeString('en-US', { hour12: false });
          setHistory(prev => {
            const next = [
              ...prev,
              {
                time: t,
                cpu: data.cpu?.percent,
                ram: data.memory?.percent,
                diskR: data.disk?.read_mbps,
                diskW: data.disk?.write_mbps,
                netR: data.network?.recv_mbps,
                netS: data.network?.sent_mbps,
              }
            ];
            return next.length > 50 ? next.slice(-50) : next;
          });
        } catch {
          // ignore
        }
      };
      ws.onclose = () => setTimeout(connect, 2000);
      wsRef.current = ws;
    };
    connect();
    return () => wsRef.current?.close();
  }, []);

  useEffect(() => {
    if (range > 0) {
      axios.get(`${API}/performance/history?hours=${range}`)
        .then(res => {
          const mapped = (res.data?.snapshots || []).map(s => ({
            time: s.timestamp?.slice(11, 19) || '',
            cpu: s.cpu_percent,
            ram: s.mem_percent,
            diskR: s.disk_read_mbps,
            diskW: s.disk_write_mbps,
            netR: s.net_recv_mbps,
            netS: s.net_sent_mbps,
          }));
          setHistData(mapped);
        })
        .catch(() => {});
    }
  }, [range]);

  const handleKillProc = async (pid) => {
    if (!window.confirm(`Terminate process PID ${pid}?`)) return;
    try {
      await axios.post(`${API}/process/${pid}/kill`);
    } catch {
      alert('Failed to kill process.');
    }
  };

  const displayData = range === 0 ? history : histData;

  if (!cur) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-500 text-sm gap-2">
        <Activity className="w-5 h-5 animate-pulse text-blue-400" />
        Connecting to system telemetry stream...
      </div>
    );
  }

  const rangeBtns = [
    { label: 'Live Stream', val: 0 },
    { label: '1 Hour', val: 1 },
    { label: '6 Hours', val: 6 },
    { label: '24 Hours', val: 24 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header & Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Gauge size={24} className="text-blue-400" /> Real-Time Telemetry Dashboard
          </h2>
          <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
            <span>WebSocket Live Feed</span>
            <span>·</span>
            <span className="flex items-center gap-1 text-zinc-300">
              <Clock size={12} className="text-emerald-400" /> Uptime: {cur.uptime || 'Active'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#18181b] p-1 rounded-xl border border-zinc-800 self-start">
          {rangeBtns.map(b => (
            <button
              key={b.val}
              onClick={() => setRange(b.val)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                range === b.val
                  ? 'bg-zinc-700 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Main Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CPU Card */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Cpu size={16} className="text-blue-400" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">CPU Total Load</span>
            </div>
            <span className="font-mono text-xs font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {cur.cpu?.freq_ghz} GHz · {cur.cpu?.core_count} Cores
            </span>
          </div>

          <div className="mb-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {cur.cpu?.percent?.toFixed(1)}<span className="text-sm font-normal text-zinc-500 ml-0.5">%</span>
            </h3>
          </div>

          {/* Per-Core Load Bars */}
          {cur.cpu?.cores && (
            <div className="space-y-1 mb-4">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Core Distribution</span>
              <div className="grid grid-cols-8 sm:grid-cols-12 gap-1">
                {cur.cpu.cores.slice(0, 16).map((c, i) => (
                  <div key={i} className="h-4 bg-zinc-800 rounded overflow-hidden flex flex-col justify-end" title={`Core ${i}: ${c}%`}>
                    <div
                      className={`w-full transition-all duration-300 ${
                        c > 80 ? 'bg-red-500' : c > 50 ? 'bg-amber-400' : 'bg-blue-500'
                      }`}
                      style={{ height: `${c}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="h-28 -mx-5 -mb-5">
            <Chart data={displayData} dataKey="cpu" name="CPU" unit="%" color="#3b82f6" gradId="gCpu" />
          </div>
        </div>

        {/* Memory Card */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-purple-400" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">RAM Utilization</span>
            </div>
            <span className="font-mono text-xs font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
              {cur.memory?.free_gb} GB Free
            </span>
          </div>

          <div className="mb-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">
              {cur.memory?.percent?.toFixed(1)}<span className="text-sm font-normal text-zinc-500 ml-0.5">%</span>
              <span className="text-xs font-normal text-zinc-400 ml-3 font-mono">
                {cur.memory?.used_gb} / {cur.memory?.total_gb} GB
              </span>
            </h3>
          </div>

          {/* Memory Progress Bar */}
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full transition-all duration-300 ${
                cur.memory?.percent > 85 ? 'bg-red-500' : cur.memory?.percent > 70 ? 'bg-amber-400' : 'bg-purple-500'
              }`}
              style={{ width: `${cur.memory?.percent || 0}%` }}
            />
          </div>

          <div className="h-28 -mx-5 -mb-5">
            <Chart data={displayData} dataKey="ram" name="RAM" unit="%" color="#8b5cf6" gradId="gRam" />
          </div>
        </div>

        {/* Network Card */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wifi size={16} className="text-emerald-400" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Network Bandwidth</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">↓ Receive Rate</span>
              <p className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                {cur.network?.recv_mbps} <span className="text-xs font-normal text-zinc-500">Mbps</span>
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">↑ Upload Rate</span>
              <p className="text-xl font-bold text-amber-400 font-mono mt-0.5">
                {cur.network?.sent_mbps} <span className="text-xs font-normal text-zinc-500">Mbps</span>
              </p>
            </div>
          </div>

          <div className="h-28 -mx-5 -mb-5">
            <Chart data={displayData} dataKey="netR" name="Receive" unit=" Mbps" color="#10b981" gradId="gNet" />
          </div>
        </div>

        {/* Disk & GPU Card */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-cyan-400" />
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Disk I/O &amp; GPU</span>
            </div>
            {cur.gpu && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 font-mono">
                <Flame size={12} /> {cur.gpu.utilization}% ({cur.gpu.temp_c}°C)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Disk Read</span>
              <p className="text-xl font-bold text-cyan-400 font-mono mt-0.5">
                {cur.disk?.read_mbps} <span className="text-xs font-normal text-zinc-500">MB/s</span>
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Disk Write</span>
              <p className="text-xl font-bold text-pink-400 font-mono mt-0.5">
                {cur.disk?.write_mbps} <span className="text-xs font-normal text-zinc-500">MB/s</span>
              </p>
            </div>
          </div>

          <div className="h-28 -mx-5 -mb-5">
            <Chart data={displayData} dataKey="diskR" name="Disk Read" unit=" MB/s" color="#06b6d4" gradId="gDisk" />
          </div>
        </div>

      </div>

      {/* Top Resource Consumers Section */}
      {cur.top_consumers && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Top CPU Hogs */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 shadow-sm">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Cpu size={14} className="text-blue-400" /> Top CPU Consumers
            </h4>
            <div className="space-y-1.5 text-xs">
              {cur.top_consumers.top_cpu?.map(p => (
                <div key={p.pid} className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 transition-colors group">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-bold text-zinc-200 truncate max-w-[150px]">{p.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">({p.pid})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-blue-400">{p.cpu?.toFixed(1)}%</span>
                    <button
                      onClick={() => handleKillProc(p.pid)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/20 rounded transition-all"
                      title="Kill Process"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top RAM Hogs */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 shadow-sm">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap size={14} className="text-purple-400" /> Top Memory Consumers
            </h4>
            <div className="space-y-1.5 text-xs">
              {cur.top_consumers.top_mem?.map(p => (
                <div key={p.pid} className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 transition-colors group">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-bold text-zinc-200 truncate max-w-[150px]">{p.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">({p.pid})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-purple-400">{p.memory_mb} MB</span>
                    <button
                      onClick={() => handleKillProc(p.pid)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-red-500/20 rounded transition-all"
                      title="Kill Process"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
