import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import CenterWorkspace from '../CenterWorkspace.jsx';
import ChatRail from '../ChatRail.jsx';
import LoginPage from '../LoginPage.jsx';
import HomePage from '../HomePage.jsx';
import { WorkspaceProvider } from '../../lib/workspaceEngine.jsx';
import { APP_SHELL_NAV_EVENT } from '../../lib/appShellEvents.js';

const APP_SECTIONS = new Set(['overview', 'workspace', 'connectors', 'access']);
const MOBILE_BREAKPOINT = 960;

function getViewportWidth() {
  if (typeof window === 'undefined') return 1440;
  return window.innerWidth;
}

export default function Shell() {
  const [page, setPage] = useState('landing');
  const [activePanel, setActivePanel] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(getViewportWidth);
  const [chatOpen, setChatOpen] = useState(() => getViewportWidth() >= MOBILE_BREAKPOINT);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isMobile = viewportWidth < MOBILE_BREAKPOINT;

  const navigateToPanel = useCallback((panel) => {
    const nextPanel = APP_SECTIONS.has(panel) ? panel : 'overview';
    setActivePanel(nextPanel);
    if (viewportWidth < MOBILE_BREAKPOINT) {
      setMobileNavOpen(false);
    }
  }, [viewportWidth]);

  const enterApp = useCallback((panel = 'overview') => {
    const width = getViewportWidth();
    setPage('app');
    setActivePanel(APP_SECTIONS.has(panel) ? panel : 'overview');
    setMobileNavOpen(false);
    setChatOpen(width >= MOBILE_BREAKPOINT);
  }, []);

  const openLogin = useCallback(() => {
    setPage('login');
    setMobileNavOpen(false);
  }, []);

  const openLanding = useCallback(() => {
    setPage('landing');
    setMobileNavOpen(false);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = getViewportWidth();
      setViewportWidth(width);
      if (width < MOBILE_BREAKPOINT) {
        setSidebarCollapsed(false);
        setChatOpen(false);
        return;
      }
      setMobileNavOpen(false);
      setChatOpen(true);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
        navigateToPanel(detail.panel);
      }
    };

    window.addEventListener(APP_SHELL_NAV_EVENT, handleNav);
    return () => window.removeEventListener(APP_SHELL_NAV_EVENT, handleNav);
  }, [navigateToPanel]);

  return (
    <WorkspaceProvider>
      {page === 'login' ? (
        <LoginPage onContinue={() => enterApp('overview')} onBack={openLanding} />
      ) : page === 'landing' ? (
        <HomePage onStartSignIn={openLogin} onEnterApp={enterApp} />
      ) : (
        <div
          style={{
            display: 'flex',
            height: '100vh',
            overflow: 'hidden',
            background: 'var(--bg-root)',
            position: 'relative',
          }}
        >
          {!isMobile && (
            <Sidebar
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed((current) => !current)}
              activePanel={activePanel}
              onNavigate={navigateToPanel}
            />
          )}

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
              onNavigate={navigateToPanel}
              onToggleSidebar={!isMobile ? () => setSidebarCollapsed((current) => !current) : undefined}
              sidebarVisible={!isMobile}
              isMobile={isMobile}
              chatOpen={chatOpen}
              onToggleChat={() => setChatOpen((current) => !current)}
              onToggleNavigation={() => setMobileNavOpen((current) => !current)}
            />

            <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden', position: 'relative' }}>
              {isMobile && mobileNavOpen ? (
                <>
                  <button
                    type="button"
                    aria-label="Close navigation"
                    onClick={() => setMobileNavOpen(false)}
                    style={{
                      position: 'fixed',
                      inset: 'var(--header-h) 0 0 0',
                      border: 'none',
                      background: 'rgba(3,4,6,0.72)',
                      zIndex: 30,
                    }}
                  />
                  <div style={{ position: 'fixed', inset: 'var(--header-h) auto 0 0', zIndex: 31 }}>
                    <Sidebar
                      collapsed={false}
                      onToggle={() => setMobileNavOpen(false)}
                      activePanel={activePanel}
                      onNavigate={navigateToPanel}
                    />
                  </div>
                </>
              ) : null}

              <main style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <CenterWorkspace activePanel={activePanel} onNavigate={navigateToPanel} onOpenLogin={openLogin} />
              </main>

              {!isMobile ? (
                <aside
                  data-testid="chat-rail"
                  style={{
                    width: chatOpen ? 'var(--chat-rail-w)' : 0,
                    minWidth: chatOpen ? 'var(--chat-rail-w)' : 0,
                    maxWidth: chatOpen ? 'var(--chat-rail-w)' : 0,
                    borderLeft: chatOpen ? '1px solid var(--border)' : 'none',
                    background: 'var(--bg-sidebar)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    transition: 'width 0.24s ease, min-width 0.24s ease, border-color 0.24s ease',
                  }}
                >
                  {chatOpen ? <ChatRail activePanel={activePanel} onNavigate={navigateToPanel} /> : null}
                </aside>
              ) : null}
            </div>
          </div>

          {isMobile && chatOpen ? (
            <>
              <button
                type="button"
                aria-label="Close chat rail"
                onClick={() => setChatOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 'var(--header-h) 0 0 0',
                  border: 'none',
                  background: 'rgba(3,4,6,0.72)',
                  zIndex: 40,
                }}
              />
              <aside
                data-testid="chat-rail"
                style={{
                  position: 'fixed',
                  inset: 'auto 0 0 0',
                  height: 'min(82vh, 760px)',
                  zIndex: 41,
                  borderTop: '1px solid var(--border)',
                  borderRadius: '22px 22px 0 0',
                  background: 'var(--bg-sidebar)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <ChatRail activePanel={activePanel} onNavigate={navigateToPanel} isMobile />
              </aside>
            </>
          ) : null}
        </div>
      )}
    </WorkspaceProvider>
  );
}
