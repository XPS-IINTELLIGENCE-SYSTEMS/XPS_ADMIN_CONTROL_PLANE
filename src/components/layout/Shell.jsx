import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import CenterWorkspace from '../CenterWorkspace.jsx';
import ChatRail from '../ChatRail.jsx';
import AdminPage from '../../pages/AdminPage.jsx';
import { WorkspaceProvider } from '../../lib/workspaceEngine.jsx';
import { APP_SHELL_NAV_EVENT } from '../../lib/appShellEvents.js';

export default function Shell() {
  const [page, setPage] = useState('workspace'); // 'workspace' | 'admin'
  const [activePanel, setActivePanel] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [adminSection, setAdminSection] = useState('integrations');

  const handleWorkspaceAction = useCallback((action) => {
    if (action?.panel) setActivePanel(action.panel);
  }, []);

  useEffect(() => {
    const handleNav = (event) => {
      const detail = event?.detail || {};
      if (detail.page) setPage(detail.page);
      if (detail.panel) setActivePanel(detail.panel);
      if (detail.adminSection) setAdminSection(detail.adminSection);
    };
    window.addEventListener(APP_SHELL_NAV_EVENT, handleNav);
    return () => window.removeEventListener(APP_SHELL_NAV_EVENT, handleNav);
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
              : <AdminPage activeSection={adminSection} onSectionChange={setAdminSection} />
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
