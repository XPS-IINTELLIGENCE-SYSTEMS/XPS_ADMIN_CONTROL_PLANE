import React, { useState } from 'react';
import { PanelLeft, Search, Bell, MapPin, LayoutDashboard, Shield } from 'lucide-react';
import { userContext } from '../../data/synthetic.js';
import { ORCHESTRATOR_MODE } from '../../lib/orchestrator.js';

const panelLabels = {
  dashboard:        'Dashboard',
  crm:              'CRM',
  leads:            'Leads',
  bytebot:          'ByteBot Orchestrator',
  research:         'Research Lab',
  outreach:         'Outreach',
  proposals:        'Proposals',
  analytics:        'Analytics',
  knowledge:        'Knowledge Base',
  competition:      'Competition',
  connectors:       'Connectors',
  workspace:        'Editor / Workspace',
  scraper:          'Scraper Control',
  workflows:        'Workflow Builder',
  logs:             'Job Logs',
  artifacts:        'Artifacts',
  'xps-admin':      'Admin Control Plane',
  'xps-vision':     'Vision Cortex',
  'xps-builder':    'Auto Builder',
  'xps-intel':      'Intel Core',
  'xps-sandbox':    'Sandbox',
  'xps-quarantine': 'Quarantine',
  admin:            'Admin',
  settings:         'Settings',
  status:           'System Status',
};

// Inline animated gradient logo accent
function GradientLogo() {
  return (
    <div style={{ position: 'relative', width: 24, height: 24, borderRadius: 5, overflow: 'hidden', flexShrink: 0 }}>
      <div className="xps-gold-accent" style={{ position: 'absolute', inset: 0, borderRadius: 5 }} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="11" height="13" viewBox="0 0 14 16" fill="none">
          <path d="M7 1L1 4.5V8.5C1 11.8 3.7 14.8 7 16C10.3 14.8 13 11.8 13 8.5V4.5L7 1Z" fill="#0a0b0c"/>
        </svg>
      </div>
    </div>
  );
}

export default function Header({ page, onPageChange, activePanel, onToggleSidebar, sidebarVisible }) {
  const label = panelLabels[activePanel] || 'XPS Intelligence';
  const [search, setSearch] = useState('');

  const modeColor = ORCHESTRATOR_MODE === 'live' ? '#22c55e' : '#eab308';
  const modeLabel = ORCHESTRATOR_MODE === 'live' ? 'live' : 'synthetic';

  return (
    <header style={{
      height: 'var(--header-h)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 16px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-sidebar)',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 9,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <GradientLogo />
        <span style={{ fontWeight: 700, fontSize: 11, letterSpacing: 1.2, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
          XPS
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

      {/* Page switcher tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        {[
          { id: 'workspace', label: 'Workspace', icon: LayoutDashboard },
          { id: 'admin',     label: 'Admin',     icon: Shield },
        ].map(tab => {
          const Icon = tab.icon;
          const active = page === tab.id;
          return (
            <button
              key={tab.id}
              data-testid={`page-tab-${tab.id}`}
              onClick={() => onPageChange(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px',
                borderRadius: 6,
                border: 'none',
                fontSize: 12, fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: active ? 'transparent' : 'rgba(255,255,255,0.45)',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={13} strokeWidth={active ? 2.2 : 1.8} className={active ? 'xps-gold-text' : ''} style={active ? {} : { color: 'rgba(255,255,255,0.45)' }} />
              <span className={active ? 'xps-gold-text' : ''}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

      {sidebarVisible && (
        <button
          onClick={onToggleSidebar}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex', cursor: 'pointer' }}
          title="Toggle sidebar"
        >
          <PanelLeft size={16} />
        </button>
      )}

      {page === 'workspace' && (
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
          {label}
        </span>
      )}

      <div style={{ flex: 1, maxWidth: 420, position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={page === 'admin' ? 'Search integrations, capabilities…' : 'Search leads, companies, proposals…'}
          style={{
            width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 12px 6px 30px',
            color: 'var(--text-primary)', fontSize: 13, outline: 'none',
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 500,
        color: modeColor,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: modeColor, display: 'inline-block' }} />
        {modeLabel}
      </div>

      <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 4, position: 'relative', cursor: 'pointer' }}>
        <Bell size={15} />
        <span style={{ position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: '50%' }} className="xps-gold-accent" />
      </button>

      {typeof userContext.location === 'string' && userContext.location.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12 }}>
          <MapPin size={12} />
          {userContext.location}
        </div>
      )}

      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 11, flexShrink: 0, overflow: 'hidden',
        position: 'relative',
      }}>
        <div className="xps-gold-accent" style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />
        <span style={{ position: 'relative', color: '#0a0b0c', zIndex: 1 }}>{userContext.avatar || 'XP'}</span>
      </div>
    </header>
  );
}
