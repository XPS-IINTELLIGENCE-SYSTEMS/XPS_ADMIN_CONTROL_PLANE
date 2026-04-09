import React from 'react';
import DashboardPanel   from './panels/DashboardPanel.jsx';
import WorkspacePanel   from './panels/WorkspacePanel.jsx';
import ByteBotPanel     from './panels/ByteBotPanel.jsx';
import ResearchPanel    from './panels/ResearchPanel.jsx';
import ScraperPanel     from './panels/ScraperPanel.jsx';
import OutreachPanel    from './panels/OutreachPanel.jsx';
import AnalyticsPanel   from './panels/AnalyticsPanel.jsx';
import ConnectorsPanel  from './panels/ConnectorsPanel.jsx';
import AdminPanel       from './panels/AdminPanel.jsx';
import StatusPanel      from './panels/StatusPanel.jsx';
import SettingsPanel    from './panels/SettingsPanel.jsx';

export default function CenterWorkspace({ activePanel, workspaceContent }) {
  const panel = (() => {
    switch (activePanel) {
      case 'dashboard':   return <DashboardPanel />;
      case 'workspace':   return <WorkspacePanel workspaceContent={workspaceContent} />;
      case 'bytebot':     return <ByteBotPanel />;
      case 'research':    return <ResearchPanel />;
      case 'scraper':     return <ScraperPanel />;
      case 'outreach':    return <OutreachPanel />;
      case 'analytics':   return <AnalyticsPanel />;
      case 'connectors':  return <ConnectorsPanel />;
      case 'admin':       return <AdminPanel />;
      case 'status':      return <StatusPanel />;
      case 'settings':    return <SettingsPanel />;
      default:            return <DashboardPanel />;
    }
  })();

  return (
    <div style={{
      flex: 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: '#0a0a0a',
      minWidth: 0,
    }}>
      {panel}
    </div>
  );
}
