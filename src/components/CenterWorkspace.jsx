import React from 'react';
import ControlCenter from '../pages/ControlCenter.jsx';

function PagePanel({ children }) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '28px 32px',
        height: '100%',
      }}
    >
      {children}
    </div>
  );
}

export default function CenterWorkspace({ activePanel, onNavigate, onOpenLogin }) {
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
      <PagePanel>
        <ControlCenter activeSection={activePanel} onNavigate={onNavigate} onOpenLogin={onOpenLogin} />
      </PagePanel>
    </div>
  );
}
