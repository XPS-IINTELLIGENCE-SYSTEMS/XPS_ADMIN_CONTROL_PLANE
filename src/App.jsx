import React, { useState } from 'react';
import './styles.css';
import HomePage from './components/HomePage.jsx';
import Shell from './components/Shell.jsx';
import Dashboard from './components/Dashboard.jsx';
import CRM from './components/CRM.jsx';
import Leads from './components/Leads.jsx';
import AIAssistant from './components/AIAssistant.jsx';
import ResearchLab from './components/ResearchLab.jsx';
import Outreach from './components/Outreach.jsx';
import Proposals from './components/Proposals.jsx';
import Analytics from './components/Analytics.jsx';
import KnowledgeBase from './components/KnowledgeBase.jsx';
import Competition from './components/Competition.jsx';
import Connectors from './components/Connectors.jsx';
import Editor from './components/Editor.jsx';
import Scraper from './components/Scraper.jsx';
import WorkflowBuilder from './components/WorkflowBuilder.jsx';
import JobLogs from './components/JobLogs.jsx';
import Artifacts from './components/Artifacts.jsx';
import Admin from './components/Admin.jsx';
import Settings from './components/Settings.jsx';

export default function App() {
  const [page, setPage] = useState('home');

  if (page === 'home') {
    return <HomePage onEnterAdmin={() => setPage('dashboard')} />;
  }

  const pageMap = {
    dashboard: <Dashboard />,
    crm: <CRM />,
    leads: <Leads />,
    'ai-assistant': <AIAssistant />,
    research: <ResearchLab />,
    outreach: <Outreach />,
    proposals: <Proposals />,
    analytics: <Analytics />,
    knowledge: <KnowledgeBase />,
    competition: <Competition />,
    connectors: <Connectors />,
    editor: <Editor />,
    scraper: <Scraper />,
    workflows: <WorkflowBuilder />,
    logs: <JobLogs />,
    artifacts: <Artifacts />,
    admin: <Admin />,
    settings: <Settings />,
  };

  // Pages that need full height (no scroll padding) for their own internal layout
  const fullHeightPages = new Set(['ai-assistant', 'editor']);

  return (
    <Shell page={page} setPage={setPage}>
      {pageMap[page] || <NotFound page={page} setPage={setPage} />}
    </Shell>
  );
}

function NotFound({ page, setPage }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 40px' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Page not found: {page}</div>
      <div style={{ color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>This section is not yet available.</div>
      <button className="btn-gold" onClick={() => setPage('dashboard')}>← Back to Dashboard</button>
    </div>
  );
}
