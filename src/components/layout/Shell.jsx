import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import AssistantRail from '../assistant/AssistantRail.jsx';

export default function Shell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [railOpen, setRailOpen] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-root)' }}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header onToggleSidebar={() => setSidebarCollapsed(p => !p)} onOpenRail={() => setRailOpen(true)} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          <Outlet />
        </main>
      </div>

      <AssistantRail open={railOpen} onToggle={() => setRailOpen(p => !p)} />
    </div>
  );
}
