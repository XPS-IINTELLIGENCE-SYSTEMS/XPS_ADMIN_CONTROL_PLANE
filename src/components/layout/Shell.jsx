import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import CenterWorkspace from '../CenterWorkspace.jsx';
import ChatRail from '../ChatRail.jsx';
import LoginPage from '../LoginPage.jsx';
import { WorkspaceProvider } from '../../lib/workspaceEngine.jsx';
import { APP_SHELL_NAV_EVENT } from '../../lib/appShellEvents.js';

const APP_SECTIONS = new Set(['overview', 'workspace', 'connectors', 'access']);

export default function Shell() {
  const [page, setPage] = useState('login');
  const [activePanel, setActivePanel] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const enterApp = useCallback((panel = 'overview') => {
    setPage('app');
    setActivePanel(APP_SECTIONS.has(panel) ? panel : 'overview');
  }, []);

  const openLogin = useCallback(() => {
    setPage('login');
  }, []);

  useEffect(() => {
    const handleNav = (event) => {
      const detail = event?.detail || {};
      if (detail.page === 'login') {
        setPage('login');
        return;
      }
      if (detail.panel && APP_SECTIONS.has(detail.panel)) {
        setPage('app');
        setActivePanel(detail.panel);
      }
    };

    window.addEventListener(APP_SHELL_NAV_EVENT, handleNav);
    return () => window.removeEventListener(APP_SHELL_NAV_EVENT, handleNav);
  }, []);

  return (
    <WorkspaceProvider>
      {page === 'login' ? (
        <LoginPage onContinue={() => enterApp('overview')} />
      ) : (
        <div
          style={{
            display: 'flex',
            height: '100vh',
            overflow: 'hidden',
            background: 'var(--bg-root)',
          }}
        >
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((current) => !current)}
            activePanel={activePanel}
            onNavigate={setActivePanel}
          />

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            <Header
              activePanel={activePanel}
              onOpenLogin={openLogin}
              onNavigate={setActivePanel}
              onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
              sidebarVisible
            />
            <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
              <main style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <CenterWorkspace activePanel={activePanel} onNavigate={setActivePanel} onOpenLogin={openLogin} />
              </main>
              <aside
                style={{
                  width: 'var(--rail-w)',
                  minWidth: 360,
                  maxWidth: 460,
                  borderLeft: '1px solid var(--border)',
                  background: 'var(--bg-sidebar)',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <ChatRail />
              </aside>
            </div>
          </div>
        </div>
      )}
    </WorkspaceProvider>
  );
}
