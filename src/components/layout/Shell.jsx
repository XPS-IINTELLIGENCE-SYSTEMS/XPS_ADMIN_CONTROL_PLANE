import React, { useState, useCallback } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import CenterWorkspace from '../CenterWorkspace.jsx';
import ChatRail from '../ChatRail.jsx';

export default function Shell() {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [workspaceContent, setWorkspaceContent] = useState(null);

  const handleWorkspaceAction = useCallback((action) => {
    if (action?.panel) setActivePanel(action.panel);
    if (action?.content) setWorkspaceContent(action.content);
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      background: 'var(--bg-root)',
    }}>
      {/* Left: Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
        activePanel={activePanel}
        onNavigate={setActivePanel}
      />

      {/* Center: Header + Workspace */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}>
        <Header
          activePanel={activePanel}
          onToggleSidebar={() => setSidebarCollapsed(p => !p)}
        />
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <CenterWorkspace
            activePanel={activePanel}
            workspaceContent={workspaceContent}
          />
        </main>
      </div>

      {/* Right: Persistent Chat Rail */}
      <ChatRail onWorkspaceAction={handleWorkspaceAction} />
    </div>
  );
}
