import { useState, useEffect } from 'react';
import { FolderOpen, Play } from 'lucide-react';

const API = 'http://127.0.0.1:8000/api';
const S = {
  card: { background: '#1e1e1e', border: '1px solid #2c2c2c', borderRadius: 12, padding: '20px 24px' },
};

const TYPE_COLORS = {
  'Next.js': '#e4e4e7', 'React': '#61dafb', 'Vue': '#42b883', 'Node.js': '#68a063',
  'FastAPI': '#009688', 'Django': '#44b78b', 'Flask': '#e4e4e7', 'Python': '#ffd43b',
  'Go': '#00acd7', 'Rust': '#ce412b', 'Java/Maven': '#f89820', 'Docker': '#2496ed', 'Unknown': '#52525b',
};

export default function ProjectScanner({ onLaunch }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanPath, setScanPath] = useState('');
  const [error, setError] = useState('');

  const runScan = (path) => {
    setLoading(true); setError('');
    fetch(`${API}/projects/scan?path=${encodeURIComponent(path)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setProjects(d.projects || []);
        else setError(d.message);
        setLoading(false);
      })
      .catch(() => { setError('Scan failed'); setLoading(false); });
  };

  const scan = () => runScan(scanPath);

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { runScan(scanPath); }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 300, color: '#fff', margin: '0 0 4px 0' }}>Project Scanner</h2>
        <p style={{ color: '#71717a', fontSize: 14, margin: 0 }}>Auto-detects project frameworks and generates one-click launch configs for the Orchestrator.</p>
      </div>

      <div style={{ ...S.card, marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <FolderOpen size={16} style={{ color: '#71717a', flexShrink: 0 }} />
        <input
          value={scanPath}
          onChange={e => setScanPath(e.target.value)}
          style={{ flex: 1, background: '#121212', border: '1px solid #2c2c2c', borderRadius: 8, padding: '8px 12px', color: '#e4e4e7', fontFamily: 'monospace', fontSize: 13, outline: 'none' }}
        />
        <button onClick={scan} style={{ padding: '8px 20px', background: '#fff', color: '#000', border: 'none', borderRadius: 8, fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
          Scan
        </button>
      </div>

      {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</p>}

      {loading ? (
        <div style={{ color: '#52525b', textAlign: 'center', padding: 40 }}>Scanning directory...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {projects.map(p => (
            <div key={p.path} style={{ background: '#1e1e1e', border: '1px solid #2c2c2c', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ color: '#e4e4e7', fontWeight: 500, margin: '0 0 4px 0', fontSize: 15 }}>{p.name}</p>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: TYPE_COLORS[p.type] || '#a1a1aa' }}>
                    {p.type}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {p.has_frontend && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#1a2e4a', color: '#60a5fa', border: '1px solid #1e3a5f' }}>FE</span>}
                  {p.has_backend && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: '#1a2e1a', color: '#4ade80', border: '1px solid #1e3a1e' }}>BE</span>}
                </div>
              </div>

              <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#52525b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.path}</p>

              <div style={{ background: '#161616', borderRadius: 8, padding: '10px 12px' }}>
                {(p.suggested_commands || []).map((cmd, i) => (
                  <p key={i} style={{ fontFamily: 'monospace', fontSize: 12, color: '#a1a1aa', margin: 0 }}>$ {cmd}</p>
                ))}
                {!p.suggested_commands?.length && <p style={{ fontSize: 12, color: '#52525b', margin: 0 }}>No commands detected</p>}
              </div>

              {p.suggested_commands?.length > 0 && (
                <button
                  onClick={() => onLaunch && onLaunch(p)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px', background: 'rgba(255,255,255,0.04)', color: '#a1a1aa', border: '1px solid #2c2c2c', borderRadius: 8, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#e4e4e7'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#a1a1aa'; }}
                >
                  <Play size={14} /> Launch in Orchestrator
                </button>
              )}
            </div>
          ))}
          {projects.length === 0 && !loading && (
            <div style={{ color: '#52525b', textAlign: 'center', padding: 40, gridColumn: '1/-1' }}>No projects found in the specified directory.</div>
          )}
        </div>
      )}
    </div>
  );
}
