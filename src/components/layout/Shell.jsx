import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import CenterWorkspace from '../CenterWorkspace.jsx';
import ChatRail from '../ChatRail.jsx';
import HomePage from '../HomePage.jsx';
import LoginPage from '../LoginPage.jsx';
import { WorkspaceProvider } from '../../lib/workspaceEngine.jsx';
import { APP_SHELL_NAV_EVENT } from '../../lib/appShellEvents.js';

const APP_PANELS = new Set([
  'workspace',
  'dashboard',
  'crm',
  'leads',
  'research',
  'outreach',
  'proposals',
  'analytics',
  'knowledge',
  'competition',
  'connectors',
  'admin',
  'settings',
]);

export default function Shell() {
  const [page, setPage] = useState('login');
  const [activePanel, setActivePanel] = useState('workspace');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const enterApp = useCallback((panel = 'workspace') => {
    setPage('app');
    setActivePanel(APP_PANELS.has(panel) ? panel : 'workspace');
  }, []);

  const openHome = useCallback(() => {
    setPage('home');
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
      if (detail.page === 'home') {
        setPage('home');
        return;
      }
      if (detail.page === 'admin') {
        setPage('app');
        setActivePanel('admin');
        return;
      }
      if (detail.panel && APP_PANELS.has(detail.panel)) {
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
        <LoginPage onContinue={() => enterApp('workspace')} />
      ) : page === 'home' ? (
        <HomePage onEnterApp={enterApp} onBackToLogin={openLogin} />
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
              onGoHome={openHome}
              onOpenAdmin={() => setActivePanel('admin')}
              onNavigate={setActivePanel}
              onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
              sidebarVisible
            />
            <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
              <main style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <CenterWorkspace activePanel={activePanel} />
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
                <ChatRail onNavigate={setActivePanel} />
              </aside>
            </div>
          </div>
        </div>
      )}
    </WorkspaceProvider>
  );
}
