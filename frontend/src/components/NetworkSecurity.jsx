import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Globe,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Server,
  Trash2,
  Lock,
  Radio
} from 'lucide-react';

const API = 'http://127.0.0.1:8000/api';

export default function NetworkSecurity() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | external | high | lan
  const [search, setSearch] = useState('');

  const fetchSecurity = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/network/security`);
      setData(res.data?.connections || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurity();
    const interval = setInterval(fetchSecurity, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleKill = async (pid) => {
    if (!pid || pid === 0) return;
    if (!window.confirm(`Terminate process PID ${pid}?`)) return;
    try {
      await axios.post(`${API}/process/${pid}/kill`);
      fetchSecurity();
    } catch {
      alert('Failed to kill process.');
    }
  };

  const externalCount = data.filter(c => c.is_external).length;
  const highRiskCount = data.filter(c => c.risk === 'High').length;
  const lanCount = data.filter(c => !c.is_external).length;

  const filtered = data.filter(c => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      c.remote_ip?.toLowerCase().includes(q) ||
      c.process_name?.toLowerCase().includes(q) ||
      c.geo?.country?.toLowerCase().includes(q) ||
      c.geo?.city?.toLowerCase().includes(q) ||
      c.geo?.isp?.toLowerCase().includes(q) ||
      String(c.remote_port).includes(q);

    if (!matchesSearch) return false;

    if (filter === 'external') return c.is_external;
    if (filter === 'high') return c.risk === 'High';
    if (filter === 'lan') return !c.is_external;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Globe size={24} className="text-blue-400" /> Network Security &amp; Connection Map
          </h2>
          <p className="text-zinc-400 text-xs mt-0.5">
            Live telemetry of external sockets, GeoIP geolocation, and threat risk scoring.
          </p>
        </div>

        <button
          onClick={fetchSecurity}
          disabled={loading}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition-all self-start sm:self-auto"
          title="Refresh Network Map"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-zinc-800/80 rounded-xl text-zinc-300 border border-zinc-700">
            <Radio size={20} className="text-blue-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Total Sockets</span>
            <h3 className="text-2xl font-extrabold text-white mt-0.5">{data.length}</h3>
          </div>
        </div>

        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
            <MapPin size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">External Endpoints</span>
            <h3 className="text-2xl font-extrabold text-amber-400 mt-0.5">{externalCount}</h3>
          </div>
        </div>

        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-red-500/10 rounded-xl text-red-400 border border-red-500/20">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Flagged Threats</span>
            <h3 className="text-2xl font-extrabold text-red-400 mt-0.5">{highRiskCount}</h3>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `All (${data.length})` },
            { id: 'external', label: `External (${externalCount})` },
            { id: 'high', label: `High Risk (${highRiskCount})` },
            { id: 'lan', label: `Local LAN (${lanCount})` },
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
            placeholder="Search IP, port, country, ISP..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#18181b] border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 outline-none focus:border-zinc-600 transition-colors"
          />
        </div>
      </div>

      {/* Security Connections Table */}
      <div className="bg-[#18181b] rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 text-zinc-500 text-[11px] uppercase tracking-wider bg-[#141416]">
              <th className="p-3.5 font-semibold">Process</th>
              <th className="p-3.5 font-semibold">Remote IP</th>
              <th className="p-3.5 font-semibold">Port</th>
              <th className="p-3.5 font-semibold">Location</th>
              <th className="p-3.5 font-semibold">ISP / Hosting</th>
              <th className="p-3.5 font-semibold">Risk Level</th>
              <th className="p-3.5 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filtered.map((c, i) => (
              <tr
                key={i}
                className={`hover:bg-zinc-800/40 transition-colors text-xs group ${
                  c.risk === 'High' ? 'bg-red-500/5' : ''
                }`}
              >
                <td className="p-3.5 font-bold text-zinc-200">
                  <div className="flex items-center gap-2">
                    <Server size={14} className="text-zinc-500 shrink-0" />
                    <span className="truncate max-w-[120px]">{c.process_name}</span>
                    {c.pid && <span className="text-[10px] text-zinc-500 font-mono">({c.pid})</span>}
                  </div>
                </td>

                <td className="p-3.5 font-mono">
                  <span className={c.is_external ? 'text-blue-400 font-bold' : 'text-zinc-500'}>
                    {c.remote_ip}
                  </span>
                </td>

                <td className="p-3.5 font-mono text-zinc-400">
                  :{c.remote_port}
                </td>

                <td className="p-3.5 text-zinc-300">
                  {c.is_external ? (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-amber-400 shrink-0" />
                      <span className="truncate max-w-[130px]">{c.geo?.city}, {c.geo?.country}</span>
                    </div>
                  ) : (
                    <span className="text-zinc-500">Local Loopback</span>
                  )}
                </td>

                <td className="p-3.5 text-zinc-400 truncate max-w-[160px]">
                  {c.geo?.isp || 'Local'}
                </td>

                <td className="p-3.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        c.risk === 'High'
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : c.risk === 'Medium'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {c.risk}
                    </span>
                    {c.risk_reasons && c.risk_reasons.length > 0 && (
                      <span className="text-[10px] text-zinc-500 truncate max-w-[120px]" title={c.risk_reasons.join(', ')}>
                        {c.risk_reasons[0]}
                      </span>
                    )}
                  </div>
                </td>

                <td className="p-3.5 text-right">
                  {c.pid ? (
                    <button
                      onClick={() => handleKill(c.pid)}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-all text-xs font-semibold"
                      title="Kill Process"
                    >
                      Kill
                    </button>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-10 text-center text-zinc-500 text-xs">
                  {loading ? 'Scanning and geolocating network sockets...' : 'No connections match filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
