import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Gauge,
  Server,
  Network,
  Activity,
  Layers,
  Monitor,
  Hexagon,
  Search,
  Globe,
  FolderSearch,
  Rocket,
  Bell,
  FileText,
  Clock,
  Sparkles,
  Command
} from 'lucide-react';

import PerformanceDashboard from './components/PerformanceDashboard';
import TaskManager from './components/TaskManager';
import ActivePorts from './components/ActivePorts';
import PortForwarding from './components/PortForwarding';
import Workspaces from './components/Workspaces';
import HardwareMonitor from './components/HardwareMonitor';
import NetworkSecurity from './components/NetworkSecurity';
import ProjectScanner from './components/ProjectScanner';
import StartupManager from './components/StartupManager';
import AlertsPanel from './components/AlertsPanel';
import CommandPalette from './components/CommandPalette';

const API = 'http://127.0.0.1:8000/api';

const NavItem = ({ id, icon: Icon, label, activeTab, setActiveTab, badge }) => (
  <button
    onClick={() => setActiveTab(id)}
    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl mb-1 transition-all text-xs font-semibold ${
      activeTab === id
        ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80'
        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon size={16} className={activeTab === id ? 'text-blue-400' : 'text-zinc-500'} />
      <span>{label}</span>
    </div>
    {badge && (
      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
        {badge}
      </span>
    )}
  </button>
);

function App() {
  const [activeTab, setActiveTab] = useState('performance');
  const [workspaceInitialData, setWorkspaceInitialData] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activePortsCount, setActivePortsCount] = useState(null);

  useEffect(() => {
    // Quick polling for port count badge
    const fetchBadge = () => {
      axios.get(`${API}/ports`).then(r => setActivePortsCount(r.data?.length || 0)).catch(() => {});
    };
    fetchBadge();
    const interval = setInterval(fetchBadge, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleProjectLaunch = (project) => {
    setWorkspaceInitialData(project);
    setActiveTab('workspaces');
  };

  const handleDownloadReport = () => {
    window.open(`${API}/report`, '_blank');
  };

  return (
    <div className="flex h-screen bg-[#121214] text-zinc-200 font-sans selection:bg-blue-500/30 overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#141416] border-r border-zinc-800/80 p-4 flex flex-col justify-between shrink-0 z-20">
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-6 px-2 pt-1">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('performance')}>
              <div className="p-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400 shadow-sm">
                <Hexagon size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-sm font-extrabold tracking-tight text-zinc-100 leading-none">PORT-MONITOR</h1>
                <span className="text-[10px] font-medium text-zinc-500 mt-0.5 block">Windows Core Suite</span>
              </div>
            </div>

            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="System Live" />
          </div>

          {/* Quick Command Palette Button */}
          <button
            onClick={() => setPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 bg-[#18181b] border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs text-zinc-400 hover:text-zinc-200 transition-all mb-6 group shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Search size={14} className="text-zinc-500 group-hover:text-zinc-300" />
              <span>Search ports &amp; commands...</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
              Ctrl+K
            </span>
          </button>
          
          {/* Navigation Links */}
          <div className="space-y-5 overflow-y-auto no-scrollbar max-h-[calc(100vh-230px)] pr-1">
            <div>
              <p className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Overview</p>
              <NavItem id="performance" icon={Gauge}      label="Dashboard"      activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem id="ports"       icon={Network}    label="Active Ports"   activeTab={activeTab} setActiveTab={setActiveTab} badge={activePortsCount} />
              <NavItem id="tasks"       icon={Server}     label="Processes"      activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem id="alerts"      icon={Bell}       label="Alerts &amp; Reports" activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
            
            <div>
              <p className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Network &amp; Dev</p>
              <NavItem id="scanner"    icon={FolderSearch} label="Project Scanner" activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem id="workspaces" icon={Layers}       label="Orchestrator"    activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem id="security"   icon={Globe}        label="Security Map"    activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem id="forwarding" icon={Activity}     label="Port Forwarding" activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
            
            <div>
              <p className="px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">Hardware &amp; OS</p>
              <NavItem id="hardware" icon={Monitor} label="Diagnostics"  activeTab={activeTab} setActiveTab={setActiveTab} />
              <NavItem id="startup"  icon={Rocket}  label="Startup Apps" activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          </div>
        </div>

        {/* Sidebar Bottom Report Trigger */}
        <div className="pt-3 border-t border-zinc-800/80">
          <button
            onClick={handleDownloadReport}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-all border border-zinc-700/80 shadow-sm"
          >
            <FileText size={13} />
            Export System Report
          </button>
        </div>

      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#121214]">
        <div className="max-w-6xl mx-auto pb-12">
          {activeTab === 'performance' && <PerformanceDashboard />}
          {activeTab === 'ports'       && <ActivePorts />}
          {activeTab === 'tasks'       && <TaskManager />}
          {activeTab === 'alerts'      && <AlertsPanel />}
          
          {activeTab === 'scanner'    && <ProjectScanner onLaunch={handleProjectLaunch} />}
          {activeTab === 'workspaces' && <Workspaces initialData={workspaceInitialData} />}
          {activeTab === 'security'   && <NetworkSecurity />}
          {activeTab === 'forwarding' && <PortForwarding />}
          
          {activeTab === 'hardware' && <HardwareMonitor />}
          {activeTab === 'startup'  && <StartupManager />}
        </div>
      </main>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={(tabId, toggle) => {
          if (toggle) setPaletteOpen(!paletteOpen);
          else if (tabId) setActiveTab(tabId);
        }}
      />
    </div>
  );
}

export default App;
