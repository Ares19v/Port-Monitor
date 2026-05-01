import { useState, useEffect } from 'react';
import { Globe, AlertTriangle, MapPin } from 'lucide-react';

const API = 'http://127.0.0.1:8000/api';
const S = {
  card: { background: '#1e1e1e', border: '1px solid #2c2c2c', borderRadius: 12 },
  th: { padding: '12px 16px', color: '#71717a', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, borderBottom: '1px solid #2c2c2c', textAlign: 'left' },
  td: { padding: '12px 16px', borderBottom: '1px solid #1a1a1a', fontSize: 13 },
};

const riskColor = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };
const riskBg   = { High: 'rgba(239,68,68,0.1)', Medium: 'rgba(245,158,11,0.1)', Low: 'rgba(16,185,129,0.1)' };

// Icon constants defined outside component to avoid "create component during render" lint error
const ICON_GLOBE   = <Globe size={16} />;
const ICON_MAPPIN  = <MapPin size={16} />;
const ICON_ALERT   = <AlertTriangle size={16} />;

export default function NetworkSecurity() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | external | high
  const [tick, setTick] = useState(0); // used to manually trigger refresh

  useEffect(() => {
    fetch(`${API}/network/security`)
      .then(r => r.json())
      .then(d => { setData(d.connections || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tick]);

  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(i);
  }, []);

  const filtered = data.filter(c => {
    if (filter === 'external') return c.is_external;
    if (filter === 'high') return c.risk === 'High';
    return true;
  });

  const externalCount = data.filter(c => c.is_external).length;
  const highRiskCount = data.filter(c => c.risk === 'High').length;

  const SUMMARY_CARDS = [
    { label: 'Total Connections', value: data.length,    color: '#a1a1aa', icon: ICON_GLOBE   },
    { label: 'External IPs',      value: externalCount,  color: '#f59e0b', icon: ICON_MAPPIN  },
    { label: 'High Risk',         value: highRiskCount,  color: '#ef4444', icon: ICON_ALERT   },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#fff', margin: '0 0 4px 0' }}>Network Security</h2>
        <p style={{ color: '#71717a', fontSize: 14, margin: 0 }}>Live connection map with external IP geolocation and risk assessment.</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {SUMMARY_CARDS.map(({ label, value, color, icon }) => (
          <div key={label} style={{ ...S.card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ color }}>{icon}</div>
            <div>
              <p style={{ fontSize: 11, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 2px 0' }}>{label}</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 300, color, margin: 0 }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['All', 'all'], ['External Only', 'external'], ['High Risk', 'high']].map(([label, val]) => (
          <button key={val} onClick={() => setFilter(val)} style={{ padding: '5px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: filter === val ? '#2c2c2c' : 'transparent', color: filter === val ? '#e4e4e7' : '#71717a', border: `1px solid ${filter === val ? '#3c3c3c' : 'transparent'}` }}>
            {label}
          </button>
        ))}
        <button onClick={() => setTick(t => t + 1)} style={{ marginLeft: 'auto', padding: '5px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'transparent', color: '#71717a', border: '1px solid #2c2c2c' }}>
          ↻ Refresh
        </button>
      </div>

      <div style={{ ...S.card, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#52525b', fontSize: 13 }}>Scanning connections &amp; geolocating IPs...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#161616' }}>
                {['Process', 'Remote IP', 'Port', 'Location', 'ISP', 'Risk', 'Status'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} style={{ background: c.risk === 'High' ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                  <td style={{ ...S.td, color: '#e4e4e7', fontWeight: 500 }}>{c.process_name}</td>
                  <td style={{ ...S.td, fontFamily: 'monospace', color: c.is_external ? '#60a5fa' : '#71717a' }}>{c.remote_ip}</td>
                  <td style={{ ...S.td, fontFamily: 'monospace', color: '#a1a1aa' }}>{c.remote_port}</td>
                  <td style={{ ...S.td, color: '#a1a1aa', fontSize: 12 }}>
                    {c.is_external ? `${c.geo?.city}, ${c.geo?.country}` : 'Local Network'}
                  </td>
                  <td style={{ ...S.td, color: '#71717a', fontSize: 12, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.geo?.isp}</td>
                  <td style={S.td}>
                    <span style={{ padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: riskBg[c.risk] || 'transparent', color: riskColor[c.risk] || '#a1a1aa' }}>
                      {c.risk}
                    </span>
                  </td>
                  <td style={{ ...S.td, color: '#71717a', fontSize: 12 }}>{c.status}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#52525b', fontSize: 13 }}>No connections match filter.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
