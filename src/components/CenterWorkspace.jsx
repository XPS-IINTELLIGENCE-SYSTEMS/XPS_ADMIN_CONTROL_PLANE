import React from 'react';
import DashboardPanel    from './panels/DashboardPanel.jsx';
import ByteBotPanel      from './panels/ByteBotPanel.jsx';
import ResearchPanel     from './panels/ResearchPanel.jsx';
import ScraperPanel      from './panels/ScraperPanel.jsx';
import OutreachPanel     from './panels/OutreachPanel.jsx';
import AnalyticsPanel    from './panels/AnalyticsPanel.jsx';
import ConnectorsPanel   from './panels/ConnectorsPanel.jsx';
import AdminPanel        from './panels/AdminPanel.jsx';
import StatusPanel       from './panels/StatusPanel.jsx';
import SettingsPanel     from './panels/SettingsPanel.jsx';

// Active workspace engine renderer
import ActiveWorkspace   from './workspace/ActiveWorkspace.jsx';

// Page-level components mounted as center panels
import CRM               from '../pages/CRM.jsx';
import Leads             from '../pages/Leads.jsx';
import Proposals         from '../pages/Proposals.jsx';
import KnowledgeBase     from '../pages/KnowledgeBase.jsx';
import Competition       from '../pages/Competition.jsx';
import JobLogs           from './JobLogs.jsx';
import Artifacts         from './Artifacts.jsx';
import WorkflowBuilder   from './WorkflowBuilder.jsx';

// XPS system pages
import AdminControlPlane from '../pages/xps/AdminControlPlane.jsx';
import VisionCortex      from '../pages/xps/VisionCortex.jsx';
import AutoBuilder       from '../pages/xps/AutoBuilder.jsx';
import IntelCore         from '../pages/xps/IntelCore.jsx';
import Sandbox           from '../pages/xps/Sandbox.jsx';
import Quarantine        from '../pages/xps/Quarantine.jsx';

// Scrollable wrapper for page-level components
function PagePanel({ children }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', height: '100%' }}>
      {children}
    </div>
  );
}

export default function CenterWorkspace({ activePanel }) {
  const panel = (() => {
    switch (activePanel) {
      case 'dashboard':       return <DashboardPanel />;
      case 'crm':             return <PagePanel><CRM /></PagePanel>;
      case 'leads':           return <PagePanel><Leads /></PagePanel>;
      case 'bytebot':         return <ByteBotPanel />;
      case 'research':        return <ResearchPanel />;
      case 'outreach':        return <OutreachPanel />;
      case 'proposals':       return <PagePanel><Proposals /></PagePanel>;
      case 'analytics':       return <AnalyticsPanel />;
      case 'knowledge':       return <PagePanel><KnowledgeBase /></PagePanel>;
      case 'competition':     return <PagePanel><Competition /></PagePanel>;
      case 'connectors':      return <ConnectorsPanel />;
      case 'workspace':       return <ActiveWorkspace />;
      case 'scraper':         return <ScraperPanel />;
      case 'workflows':       return <PagePanel><WorkflowBuilder /></PagePanel>;
      case 'logs':            return <PagePanel><JobLogs /></PagePanel>;
      case 'artifacts':       return <PagePanel><Artifacts /></PagePanel>;
      case 'xps-admin':       return <PagePanel><AdminControlPlane /></PagePanel>;
      case 'xps-vision':      return <PagePanel><VisionCortex /></PagePanel>;
      case 'xps-builder':     return <PagePanel><AutoBuilder /></PagePanel>;
      case 'xps-intel':       return <PagePanel><IntelCore /></PagePanel>;
      case 'xps-sandbox':     return <PagePanel><Sandbox /></PagePanel>;
      case 'xps-quarantine':  return <PagePanel><Quarantine /></PagePanel>;
      case 'admin':           return <AdminPanel />;
      case 'settings':        return <SettingsPanel />;
      case 'status':          return <StatusPanel />;
      default:                return <DashboardPanel />;
    }
  })();

  return (
    <div style={{
      flex: 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-root)',
      minWidth: 0,
    }}>
      {panel}
    </div>
  );
}
