import { useState } from 'react';
import { 
  Gauge, Server, Network, Activity, Layers, Monitor, Hexagon, Search, Globe, FolderSearch, Rocket, Bell 
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

// NavItem is defined at module level to satisfy react-hooks/static-components
const NavItem = ({ id, icon: Icon, label, activeTab, setActiveTab }) => (
  <button 
    onClick={() => setActiveTab(id)}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-all text-sm font-medium ${
      activeTab === id 
        ? 'bg-[#1e1e1e] text-white shadow-sm border border-[#2c2c2c]' 
        : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200 border border-transparent'
    }`}
  >
    <Icon size={18} className={activeTab === id ? 'text-blue-400' : 'text-zinc-600'} />
    {label}
  </button>
);

function App() {
  const [activeTab, setActiveTab] = useState('performance');
  const [workspaceInitialData, setWorkspaceInitialData] = useState(null);

  const handleProjectLaunch = (project) => {
    setWorkspaceInitialData(project);
    setActiveTab('workspaces');
  };

  return (
    <div className="flex h-screen bg-[#121212] text-zinc-200 font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <div className="w-64 bg-[#121212] border-r border-[#2c2c2c] p-4 flex flex-col relative z-10">
        
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2 mt-2">
          <div className="p-2 bg-[#1e1e1e] border border-[#2c2c2c] rounded-lg shadow-sm">
            <Hexagon size={18} className="text-zinc-100" strokeWidth={2} />
          </div>
          <h1 className="text-md font-medium tracking-tight text-zinc-100">Port-Monitor</h1>
        </div>

        {/* Search Mockup */}
        <div className="relative mb-8">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input type="text" placeholder="Search" disabled className="w-full bg-[#161616] border border-[#2c2c2c] rounded-md py-1.5 pl-9 pr-3 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none cursor-not-allowed" />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 border border-[#2c2c2c] px-1.5 rounded bg-[#161616]">/</span>
        </div>
        
        <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar">
          <div>
            <p className="px-3 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">Overview</p>
            <NavItem id="performance" icon={Gauge}      label="Dashboard"      activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem id="tasks"       icon={Server}     label="Processes"      activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem id="alerts"      icon={Bell}       label="Alerts & Reports" activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          
          <div>
            <p className="px-3 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">Network & Dev</p>
            <NavItem id="scanner"    icon={FolderSearch} label="Project Scanner" activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem id="workspaces" icon={Layers}       label="Orchestrator"    activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem id="ports"      icon={Network}      label="Active Ports"    activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem id="security"   icon={Globe}        label="Security Map"    activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem id="forwarding" icon={Activity}     label="Forwarding"      activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          
          <div>
            <p className="px-3 text-[11px] font-semibold text-zinc-600 uppercase tracking-wider mb-2">System</p>
            <NavItem id="hardware" icon={Monitor} label="Diagnostics"  activeTab={activeTab} setActiveTab={setActiveTab} />
            <NavItem id="startup"  icon={Rocket}  label="Startup Apps" activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-10 overflow-auto bg-[#121212]">
        <div className="max-w-6xl mx-auto h-full">
          {activeTab === 'performance' && <PerformanceDashboard />}
          {activeTab === 'tasks'       && <TaskManager />}
          {activeTab === 'alerts'      && <AlertsPanel />}
          
          {activeTab === 'scanner'    && <ProjectScanner onLaunch={handleProjectLaunch} />}
          {activeTab === 'workspaces' && <Workspaces initialData={workspaceInitialData} />}
          {activeTab === 'ports'      && <ActivePorts />}
          {activeTab === 'security'   && <NetworkSecurity />}
          {activeTab === 'forwarding' && <PortForwarding />}
          
          {activeTab === 'hardware' && <HardwareMonitor />}
          {activeTab === 'startup'  && <StartupManager />}
        </div>
      </div>
    </div>
  );
}

export default App;
