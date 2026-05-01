import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

const API = 'http://127.0.0.1:8000/api';
const S = {
  card: { background: '#1e1e1e', border: '1px solid #2c2c2c', borderRadius: 12, overflow: 'hidden' },
  th: { padding: '12px 16px', color: '#71717a', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500, borderBottom: '1px solid #2c2c2c', textAlign: 'left' },
  td: { padding: '12px 16px', borderBottom: '1px solid #1a1a1a', fontSize: 13 },
};

export default function StartupManager() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const load = () => {
      setLoading(true);
      fetch(`${API}/startup`)
        .then(r => r.json())
        .then(d => { setPrograms(d.programs || []); setLoading(false); })
        .catch(() => setLoading(false));
    };
    load();
  }, []);

  const handleRemove = async (p) => {
    if (!p.removable) { setMsg('Cannot remove HKLM entries without admin rights.'); return; }
    if (!window.confirm(`Remove "${p.name}" from Windows startup?`)) return;
    const res = await fetch(`${API}/startup`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: p.name, hive: p.hive, key_path: p.key_path }),
    });
    const d = await res.json();
    setMsg(d.message || (d.success ? 'Removed.' : 'Failed.'));
    if (d.success) {
      // Reload after successful removal
      fetch(`${API}/startup`)
        .then(r => r.json())
        .then(data => setPrograms(data.programs || []))
        .catch(() => {});
    }
    setTimeout(() => setMsg(''), 4000);
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#fff', margin: '0 0 4px 0' }}>Startup Programs</h2>
        <p style={{ color: '#71717a', fontSize: 14, margin: 0 }}>Programs configured to run automatically when Windows starts.</p>
      </div>

      {msg && (
        <div style={{ background: msg.includes('Cannot') || msg.includes('Failed') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${msg.includes('Cannot') || msg.includes('Failed') ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: msg.includes('Cannot') || msg.includes('Failed') ? '#ef4444' : '#10b981' }}>
          {msg}
        </div>
      )}

      <div style={S.card}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#52525b' }}>Reading registry...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#161616' }}>
                {['Name', 'Executable', 'Scope', 'Command', 'Action'].map(h => <th key={h} style={S.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {programs.map((p, i) => (
                <tr key={i} style={{ background: 'transparent' }}>
                  <td style={{ ...S.td, color: '#e4e4e7', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ ...S.td, color: '#60a5fa', fontFamily: 'monospace', fontSize: 12 }}>{p.exe}</td>
                  <td style={S.td}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: p.hive === 'HKCU' ? 'rgba(139,92,246,0.1)' : 'rgba(245,158,11,0.1)', color: p.hive === 'HKCU' ? '#8b5cf6' : '#f59e0b', border: `1px solid ${p.hive === 'HKCU' ? 'rgba(139,92,246,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                      {p.scope}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11, color: '#52525b', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.command}>{p.command}</td>
                  <td style={S.td}>
                    {p.removable ? (
                      <button onClick={() => handleRemove(p)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                        <Trash2 size={12} /> Remove
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: '#52525b', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertTriangle size={12} /> Admin only
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {programs.length === 0 && <tr><td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#52525b' }}>No startup entries found.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
