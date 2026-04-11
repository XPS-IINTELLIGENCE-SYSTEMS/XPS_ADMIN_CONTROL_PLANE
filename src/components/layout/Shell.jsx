import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import CenterWorkspace from '../CenterWorkspace.jsx';
import HomePage from '../HomePage.jsx';
import LoginPage from '../LoginPage.jsx';
import { WorkspaceProvider } from '../../lib/workspaceEngine.jsx';
import { APP_SHELL_NAV_EVENT } from '../../lib/appShellEvents.js';

const APP_PANELS = new Set([
  'dashboard',
  'crm',
  'leads',
  'ai-assistant',
  'research',
  'outreach',
  'proposals',
  'analytics',
  'connectors',
  'admin',
  'settings',
]);

export default function Shell() {
  const [page, setPage] = useState('login');
  const [activePanel, setActivePanel] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const enterApp = useCallback((panel = 'dashboard') => {
    setPage('app');
    setActivePanel(APP_PANELS.has(panel) ? panel : 'dashboard');
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
        <LoginPage onContinue={openHome} />
      ) : page === 'home' ? (
        <HomePage onOpenPanel={enterApp} onBackToLogin={openLogin} />
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
              onToggleSidebar={() => setSidebarCollapsed((current) => !current)}
              sidebarVisible
            />
            <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <CenterWorkspace activePanel={activePanel} />
            </main>
          </div>
        </div>
      )}
    </WorkspaceProvider>
  );
}
