import { useState, useEffect, useRef } from 'react';
// lucide-react icons are not used in this component's JSX
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API = 'http://127.0.0.1:8000/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#161616', border: '1px solid #2c2c2c', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontFamily: 'monospace' }}>
      <p style={{ color: '#71717a', marginBottom: 6 }}>{label}</p>
      {payload.map((e, i) => <p key={i} style={{ color: e.color }}>{e.name}: {e.value?.toFixed(2)}{e.unit}</p>)}
    </div>
  );
};

function Chart({ data, dataKey, name, unit, color, gradId }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2c" vertical={false} />
        <XAxis dataKey="time" hide />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey={dataKey} name={name} unit={unit} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#${gradId})`} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function StatCard({ label, children, extra }) {
  return (
    <div style={{ background: '#1e1e1e', border: '1px solid #2c2c2c', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <p style={{ fontSize: 11, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{label}</p>
        {extra}
      </div>
      {children}
    </div>
  );
}

export default function PerformanceDashboard() {
  const [history, setHistory] = useState([]);
  const [cur, setCur] = useState(null);
  const [range, setRange] = useState(1);
  const [histData, setHistData] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      const ws = new WebSocket('ws://127.0.0.1:8000/ws/performance');
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setCur(data);
        const t = new Date().toLocaleTimeString('en-US', { hour12: false });
        setHistory(prev => {
          const next = [...prev, { time: t, cpu: data.cpu?.percent, ram: data.memory?.percent, diskR: data.disk?.read_mbps, diskW: data.disk?.write_mbps, netR: data.network?.recv_mbps, netS: data.network?.sent_mbps }];
          return next.length > 60 ? next.slice(-60) : next;
        });
      };
      ws.onclose = () => setTimeout(connect, 2000);
      wsRef.current = ws;
    };
    connect();
    return () => wsRef.current?.close();
  }, []);

  useEffect(() => {
    fetch(`${API}/performance/history?hours=${range}`)
      .then(r => r.json())
      .then(d => {
        const mapped = (d.snapshots || []).map(s => ({
          time: s.timestamp?.slice(11, 19) || '',
          cpu: s.cpu_percent, ram: s.mem_percent,
          diskR: s.disk_read_mbps, diskW: s.disk_write_mbps,
          netR: s.net_recv_mbps, netS: s.net_sent_mbps,
        }));
        setHistData(mapped);
      }).catch(() => {});
  }, [range]);

  const displayData = range === 0 ? history : histData;

  if (!cur) return <div style={{ color: '#52525b', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Connecting to telemetry stream...</div>;

  const rangeBtn = (label, val) => (
    <button onClick={() => setRange(val)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: range === val ? '#2c2c2c' : 'transparent', color: range === val ? '#e4e4e7' : '#71717a', border: `1px solid ${range === val ? '#3c3c3c' : 'transparent'}` }}>{label}</button>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#fff', margin: '0 0 4px 0' }}>System Performance</h2>
        <p style={{ color: '#71717a', fontSize: 14, margin: 0 }}>Real-time telemetry via WebSocket. Data persisted to local SQLite.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {rangeBtn('Live', 0)}{rangeBtn('1h', 1)}{rangeBtn('6h', 6)}{rangeBtn('24h', 24)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <StatCard label="CPU Utilization" extra={<span style={{ fontFamily: 'monospace', color: '#a1a1aa', fontSize: 13 }}>{cur.cpu?.freq_ghz} GHz</span>}>
          <p style={{ fontSize: '2.5rem', fontWeight: 300, color: '#fff', margin: '0 0 16px 0' }}>{cur.cpu?.percent?.toFixed(1)}<span style={{ fontSize: '1.2rem', color: '#52525b' }}>%</span></p>
          <div style={{ height: 140, marginLeft: -24, marginRight: -24, marginBottom: -24 }}>
            <Chart data={displayData} dataKey="cpu" name="CPU" unit="%" color="#3b82f6" gradId="gCpu" />
          </div>
        </StatCard>

        <StatCard label="Memory Usage" extra={<span style={{ fontFamily: 'monospace', color: '#a1a1aa', fontSize: 13 }}>{cur.memory?.percent}%</span>}>
          <p style={{ fontSize: '2.5rem', fontWeight: 300, color: '#fff', margin: '0 0 16px 0' }}>{cur.memory?.used_gb}<span style={{ fontSize: '1.2rem', color: '#52525b' }}>/{cur.memory?.total_gb} GB</span></p>
          <div style={{ height: 140, marginLeft: -24, marginRight: -24, marginBottom: -24 }}>
            <Chart data={displayData} dataKey="ram" name="RAM" unit="%" color="#8b5cf6" gradId="gRam" />
          </div>
        </StatCard>

        <StatCard label="Network Throughput" extra={null}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><p style={{ fontSize: 11, color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>↓ Receive</p><p style={{ fontSize: '1.5rem', fontWeight: 300, color: '#e4e4e7', margin: 0 }}>{cur.network?.recv_mbps} <span style={{ fontSize: 12, color: '#52525b' }}>Mbps</span></p></div>
            <div><p style={{ fontSize: 11, color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>↑ Send</p><p style={{ fontSize: '1.5rem', fontWeight: 300, color: '#e4e4e7', margin: 0 }}>{cur.network?.sent_mbps} <span style={{ fontSize: 12, color: '#52525b' }}>Mbps</span></p></div>
          </div>
          <div style={{ height: 100, marginLeft: -24, marginRight: -24, marginBottom: -24 }}>
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={displayData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#2c2c2c" vertical={false} /><XAxis dataKey="time" hide /><YAxis hide /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="netR" name="Recv" unit=" Mbps" stroke="#10b981" fillOpacity={0} strokeWidth={2} isAnimationActive={false} /><Area type="monotone" dataKey="netS" name="Send" unit=" Mbps" stroke="#f59e0b" fillOpacity={0} strokeWidth={2} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
          </div>
        </StatCard>

        <StatCard label="Disk Activity" extra={cur.gpu && <div style={{ textAlign: 'right', borderLeft: '1px solid #2c2c2c', paddingLeft: 16 }}><p style={{ fontSize: 11, color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>GPU</p><p style={{ fontSize: '1.5rem', fontWeight: 300, color: '#10b981', margin: 0 }}>{cur.gpu?.utilization}%</p><p style={{ fontSize: 11, color: '#52525b', margin: 0 }}>{cur.gpu?.temp_c}°C</p></div>}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><p style={{ fontSize: 11, color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Read</p><p style={{ fontSize: '1.5rem', fontWeight: 300, color: '#e4e4e7', margin: 0 }}>{cur.disk?.read_mbps} <span style={{ fontSize: 12, color: '#52525b' }}>MB/s</span></p></div>
            <div><p style={{ fontSize: 11, color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Write</p><p style={{ fontSize: '1.5rem', fontWeight: 300, color: '#e4e4e7', margin: 0 }}>{cur.disk?.write_mbps} <span style={{ fontSize: 12, color: '#52525b' }}>MB/s</span></p></div>
          </div>
          <div style={{ height: 100, marginLeft: -24, marginRight: -24, marginBottom: -24 }}>
            <ResponsiveContainer width="100%" height="100%"><AreaChart data={displayData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#2c2c2c" vertical={false} /><XAxis dataKey="time" hide /><YAxis hide /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="diskR" name="Read" unit=" MB/s" stroke="#06b6d4" fillOpacity={0} strokeWidth={2} isAnimationActive={false} /><Area type="monotone" dataKey="diskW" name="Write" unit=" MB/s" stroke="#ec4899" fillOpacity={0} strokeWidth={2} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
          </div>
        </StatCard>
      </div>
    </div>
  );
}
