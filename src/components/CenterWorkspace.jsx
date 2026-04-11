import React, { useEffect } from 'react';
import Dashboard from '../pages/Dashboard.jsx';
import CRM from '../pages/CRM.jsx';
import Leads from '../pages/Leads.jsx';
import ResearchLab from '../pages/ResearchLab.jsx';
import Outreach from '../pages/Outreach.jsx';
import Proposals from '../pages/Proposals.jsx';
import Analytics from '../pages/Analytics.jsx';
import Connectors from '../pages/Connectors.jsx';
import AdminPage from '../pages/AdminPage.jsx';
import Settings from '../pages/Settings.jsx';
import KnowledgeBase from '../pages/KnowledgeBase.jsx';
import Competition from '../pages/Competition.jsx';
import ActiveWorkspace from './workspace/ActiveWorkspace.jsx';
import { useWorkspace, OBJ_TYPE, RUN_STATUS, genId } from '../lib/workspaceEngine.jsx';
import { createDefaultUiState, createHistoryEntry } from '../lib/uiMutations.js';

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

function WorkspaceView() {
  const { objects, createObject, setActive } = useWorkspace();

  useEffect(() => {
    if (objects.length > 0) return;
    const id = genId();
    const uiState = createDefaultUiState();
    createObject({
      id,
      type: OBJ_TYPE.UI,
      title: 'UI Editor Canvas',
      content: 'Editable UI canvas',
      status: RUN_STATUS.IDLE,
      meta: {
        uiEditor: true,
        uiState,
        history: [createHistoryEntry(uiState, 'Initial UI state', 'seed')],
      },
    });
    setActive(id);
  }, [createObject, objects.length, setActive]);

  return <ActiveWorkspace />;
}

export default function CenterWorkspace({ activePanel }) {
  const panel = (() => {
    switch (activePanel) {
      case 'workspace':
        return <PagePanel fullBleed><WorkspaceView /></PagePanel>;
      case 'crm':
        return <PagePanel><CRM /></PagePanel>;
      case 'leads':
        return <PagePanel><Leads /></PagePanel>;
      case 'research':
        return <PagePanel><ResearchLab /></PagePanel>;
      case 'outreach':
        return <PagePanel><Outreach /></PagePanel>;
      case 'proposals':
        return <PagePanel><Proposals /></PagePanel>;
      case 'analytics':
        return <PagePanel><Analytics /></PagePanel>;
      case 'knowledge':
        return <PagePanel><KnowledgeBase /></PagePanel>;
      case 'competition':
        return <PagePanel><Competition /></PagePanel>;
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
