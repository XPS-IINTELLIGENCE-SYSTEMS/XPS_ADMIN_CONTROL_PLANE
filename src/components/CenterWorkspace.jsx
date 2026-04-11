import React from 'react';
import Dashboard from '../pages/Dashboard.jsx';
import CRM from '../pages/CRM.jsx';
import Leads from '../pages/Leads.jsx';
import AIAssistant from '../pages/AIAssistant.jsx';
import ResearchLab from '../pages/ResearchLab.jsx';
import Outreach from '../pages/Outreach.jsx';
import Proposals from '../pages/Proposals.jsx';
import Analytics from '../pages/Analytics.jsx';
import Connectors from '../pages/Connectors.jsx';
import AdminPage from '../pages/AdminPage.jsx';
import Settings from '../pages/Settings.jsx';

function PagePanel({ children, fullBleed = false }) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: fullBleed ? 0 : '28px 32px',
        height: '100%',
      }}
    >
      {children}
    </div>
  );
}

export default function CenterWorkspace({ activePanel }) {
  const panel = (() => {
    switch (activePanel) {
      case 'crm':
        return <PagePanel><CRM /></PagePanel>;
      case 'leads':
        return <PagePanel><Leads /></PagePanel>;
      case 'ai-assistant':
        return <PagePanel fullBleed><AIAssistant /></PagePanel>;
      case 'research':
        return <PagePanel><ResearchLab /></PagePanel>;
      case 'outreach':
        return <PagePanel><Outreach /></PagePanel>;
      case 'proposals':
        return <PagePanel><Proposals /></PagePanel>;
      case 'analytics':
        return <PagePanel><Analytics /></PagePanel>;
      case 'connectors':
        return <PagePanel><Connectors /></PagePanel>;
      case 'admin':
        return <PagePanel><AdminPage /></PagePanel>;
      case 'settings':
        return <PagePanel><Settings /></PagePanel>;
      case 'dashboard':
      default:
        return <PagePanel><Dashboard /></PagePanel>;
    }
  })();

  return (
    <div
      style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-root)',
        minWidth: 0,
      }}
    >
      {panel}
    </div>
  );
}
