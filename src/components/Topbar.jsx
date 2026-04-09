import React from 'react';

const gold = '#d4a843';

export default function Topbar({ activePanel, runtimeMode }) {
  const titleMap = {
    dashboard:  'Dashboard',
    workspace:  'Workspace',
    bytebot:    'ByteBot Orchestrator',
    research:   'Research',
    scraper:    'Scraper',
    outreach:   'Outreach',
    analytics:  'Analytics',
    connectors: 'Connectors',
    admin:      'Admin',
    status:     'System Status',
    settings:   'Settings',
  };

  const modeColors = {
    live:      '#4ade80',
    synthetic: '#fbbf24',
    local:     '#60a5fa',
    blocked:   '#f87171',
  };
  const modeColor = modeColors[runtimeMode] || modeColors.synthetic;

  return (
    <header style={{
      height: 52,
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      background: '#0a0a0a',
      flexShrink: 0,
      gap: 12,
    }}>
      {/* Sidebar toggle icon placeholder */}
      <button style={iconBtnStyle} aria-label="Toggle sidebar">
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M1 1h14M1 6h14M1 11h14"/>
        </svg>
      </button>

      {/* Page title */}
      <span style={{ fontSize: 15, fontWeight: 600, color: '#fff', letterSpacing: 0.1 }}>
        {titleMap[activePanel] || activePanel}
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: '6px 12px',
        width: 260,
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round">
          <circle cx="6" cy="6" r="4.5"/>
          <path d="M9.5 9.5L13 13"/>
        </svg>
        <input
          placeholder="Search workspace…"
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 13,
            width: '100%',
          }}
        />
      </div>

      {/* Runtime mode badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 10px',
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${modeColor}33`,
        borderRadius: 99,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.8,
        color: modeColor,
        textTransform: 'uppercase',
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: modeColor }} />
        {runtimeMode || 'synthetic'}
      </div>

      {/* Notification icon */}
      <button style={iconBtnStyle} aria-label="Notifications">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 1a5 5 0 0 1 5 5v2l1.5 3H1.5L3 8V6a5 5 0 0 1 5-5z"/>
          <path d="M6.5 13a1.5 1.5 0 0 0 3 0"/>
        </svg>
      </button>

      {/* User avatar */}
      <div style={{
        width: 32, height: 32,
        borderRadius: '50%',
        background: gold,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, color: '#0a0a0a',
        cursor: 'pointer',
        flexShrink: 0,
      }}>
        OP
      </div>
    </header>
  );
}

const iconBtnStyle = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 6,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'rgba(255,255,255,0.5)',
  transition: 'background 0.15s',
};
