import React, { useState, useCallback } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import CenterWorkspace from '../CenterWorkspace.jsx';
import ChatRail from '../ChatRail.jsx';
import AdminPage from '../../pages/AdminPage.jsx';
import { WorkspaceProvider } from '../../lib/workspaceEngine.jsx';

export default function Shell() {
  const [page, setPage] = useState('workspace'); // 'workspace' | 'admin'
  const [activePanel, setActivePanel] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleWorkspaceAction = useCallback((action) => {
    if (action?.panel) setActivePanel(action.panel);
  }, []);

  return (
    <WorkspaceProvider>
      <div style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--bg-root)',
      }}>
        {/* Left: Sidebar (hidden on admin page when no workspace context needed) */}
        {page === 'workspace' && (
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(p => !p)}
            activePanel={activePanel}
            onNavigate={setActivePanel}
          />
        )}

        {/* Center: Header + Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}>
          <Header
            page={page}
            onPageChange={setPage}
            activePanel={activePanel}
            onToggleSidebar={() => setSidebarCollapsed(p => !p)}
            sidebarVisible={page === 'workspace'}
          />
          <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {page === 'workspace'
              ? <CenterWorkspace activePanel={activePanel} />
              : <AdminPage />
            }
          </main>
        </div>

        {/* Right: Persistent Chat Rail (workspace only) */}
        {page === 'workspace' && (
          <ChatRail
            onWorkspaceAction={handleWorkspaceAction}
            onNavigate={setActivePanel}
          />
        )}
      </div>
    </WorkspaceProvider>
  );
}
