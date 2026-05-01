import { useState, useEffect } from 'react';
import { Bell, Sliders, ExternalLink } from 'lucide-react';

const API = 'http://127.0.0.1:8000/api';

export default function AlertsPanel() {
  const [alertList, setAlertList] = useState([]);
  const [thresholds, setThresholds] = useState({ cpu_percent: 85, mem_percent: 90 });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});

  useEffect(() => {
    const loadAlerts = () => fetch(`${API}/alerts`).then(r => r.json()).then(d => setAlertList(d.alerts || [])).catch(() => {});
    const loadThresholds = () => fetch(`${API}/alerts/thresholds`).then(r => r.json()).then(d => { setThresholds(d.thresholds || {}); setDraft(d.thresholds || {}); }).catch(() => {});
    loadAlerts();
    loadThresholds();
    const i = setInterval(loadAlerts, 10000);
    return () => clearInterval(i);
  }, []);

  const saveThresholds = async () => {
    const res = await fetch(`${API}/alerts/thresholds`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
    const d = await res.json();
    if (d.thresholds) { setThresholds(d.thresholds); setDraft(d.thresholds); }
    setEditing(false);
  };

  const exportReport = () => window.open(`${API}/report`, '_blank');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#fff', margin: '0 0 4px 0' }}>Alerts & Reports</h2>
          <p style={{ color: '#71717a', fontSize: 14, margin: 0 }}>Anomaly detection with Windows toast notifications. Configurable thresholds.</p>
        </div>
        <button onClick={exportReport} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#fff', color: '#000', border: 'none', borderRadius: 8, fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
          <ExternalLink size={14} /> Export Report
        </button>
      </div>

      {/* Threshold Config */}
      <div style={{ background: '#1e1e1e', border: '1px solid #2c2c2c', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: '#a1a1aa', fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sliders size={14} /> Alert Thresholds
          </h3>
          {editing ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditing(false)} style={{ padding: '5px 14px', background: 'transparent', color: '#71717a', border: '1px solid #2c2c2c', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Cancel</button>
              <button onClick={saveThresholds} style={{ padding: '5px 14px', background: '#fff', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Save</button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} style={{ padding: '5px 14px', background: 'transparent', color: '#71717a', border: '1px solid #2c2c2c', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>Edit</button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[['cpu_percent', 'CPU Usage (%)', '#3b82f6'], ['mem_percent', 'Memory Usage (%)', '#8b5cf6']].map(([key, label, color]) => (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#a1a1aa' }}>{label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: 13, color }}>{editing ? draft[key] : thresholds[key]}%</span>
              </div>
              {editing ? (
                <input type="range" min={50} max={99} value={draft[key] || 85} onChange={e => setDraft(d => ({ ...d, [key]: Number(e.target.value) }))} style={{ width: '100%', accentColor: color }} />
              ) : (
                <div style={{ height: 4, background: '#2c2c2c', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${thresholds[key]}%`, background: color, borderRadius: 2 }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alert History */}
      <div style={{ background: '#1e1e1e', border: '1px solid #2c2c2c', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ background: '#161616', padding: '12px 20px', borderBottom: '1px solid #2c2c2c' }}>
          <h3 style={{ color: '#a1a1aa', fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={14} /> Recent Alerts
          </h3>
        </div>
        {alertList.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#52525b', fontSize: 13 }}>No alerts triggered yet. System is within normal thresholds.</div>
        ) : (
          alertList.map((a, i) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#e4e4e7', fontSize: 13, margin: '0 0 2px 0' }}>{a.message}</p>
                <p style={{ color: '#52525b', fontSize: 11, margin: 0, fontFamily: 'monospace' }}>{a.timestamp?.replace('T', ' ')?.slice(0, 19)}</p>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#ef4444', padding: '4px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 6 }}>{a.value?.toFixed(1)}%</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
