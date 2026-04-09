import React, { useState } from 'react';
import Sidebar          from './components/Sidebar.jsx';
import Topbar           from './components/Topbar.jsx';
import CenterWorkspace  from './components/CenterWorkspace.jsx';
import ChatRail         from './components/ChatRail.jsx';

// DEV_AUTH = true → auth bypassed, app boots directly into operator shell
const DEV_AUTH = true;

export default function App() {
  const [activePanel, setActivePanel]       = useState('dashboard');
  const [workspaceContent, setWorkspaceContent] = useState(null);
  const [runtimeMode] = useState('synthetic'); // 'live' | 'synthetic' | 'local' | 'blocked'

  // Chat-to-workspace bridge: agent output can update the center panel
  const handleWorkspaceAction = (action) => {
    setWorkspaceContent(action);
    // If the action targets a specific panel, switch to it
    if (action.panel) setActivePanel(action.panel);
    else setActivePanel('workspace');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      background: '#0a0a0a',
      fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
    }}>
      {/* Top bar spans full width minus sidebar */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left sidebar */}
        <Sidebar activePanel={activePanel} onSelect={setActivePanel} />

        {/* Right section: topbar + center + chat rail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Topbar */}
          <Topbar activePanel={activePanel} runtimeMode={runtimeMode} />

          {/* Center + Chat rail */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Center workspace */}
            <CenterWorkspace
              activePanel={activePanel}
              workspaceContent={workspaceContent}
            />

            {/* Right persistent chat rail */}
            <ChatRail onWorkspaceAction={handleWorkspaceAction} />
          </div>
        </div>
      </div>
    </div>
  );
}

