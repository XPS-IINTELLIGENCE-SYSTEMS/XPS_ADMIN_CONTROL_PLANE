import React, { useState } from 'react';
import { PanelLeft, Search, Bell, MapPin, LayoutDashboard, Shield } from 'lucide-react';
import { userContext } from '../../data/synthetic.js';
import { ORCHESTRATOR_MODE } from '../../lib/orchestrator.js';
import { requestAppShellNavigation } from '../../lib/appShellEvents.js';

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

const BRAND_LOGO = '/brand/xps-shield-wings.png';

function BrandLogo() {
  return (
    <div
      className="xps-logo xps-brand-logo-glow"
      style={{
        position: 'relative',
        width: 40,
        height: 40,
        flexShrink: 0,
      }}
    >
      <img
        src={BRAND_LOGO}
        alt="XPS"
        data-testid="brand-logo-header"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
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
      <div className="xps-brand-lockup" style={{ flexShrink: 0 }}>
        <BrandLogo />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span className="xps-silver-text" style={{ fontWeight: 800, fontSize: 16, letterSpacing: 1.1, whiteSpace: 'nowrap' }}>
            XPS INTELLIGENCE
          </span>
          <span className="xps-gold-text" style={{ fontWeight: 700, fontSize: 10, letterSpacing: 2, whiteSpace: 'nowrap', marginTop: 3 }}>
            COMMAND CENTER
          </span>
        </div>
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
              className="xps-electric-hover"
              data-active={active ? 'true' : undefined}
              onClick={() => onPageChange(tab.id)}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: 6,
                 padding: '8px 14px',
                borderRadius: 6,
                border: 'none',
                 fontSize: 13, fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                background: active ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'rgba(255,255,255,0.45)',
              }}
            >
              <Icon size={13} strokeWidth={active ? 2.2 : 1.8} className="xps-icon" />
              <span className={active ? 'xps-electric-text' : ''}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

      {sidebarVisible && (
        <button
          onClick={onToggleSidebar}
          className="xps-electric-hover"
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex', cursor: 'pointer', position: 'relative' }}
          title="Toggle sidebar"
        >
          <PanelLeft size={16} className="xps-icon" />
        </button>
      )}

      {page === 'workspace' && (
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
          {label}
        </span>
      )}

       <div style={{ flex: 1, maxWidth: 520, position: 'relative' }}>
        <Search size={13} className="xps-icon" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={page === 'admin' ? 'Search integrations, capabilities…' : 'Search leads, companies, proposals…'}
          style={{
            width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
             borderRadius: 10, padding: '9px 14px 9px 34px',
             color: 'var(--text-primary)', fontSize: 14, outline: 'none',
          }}
        />
      </div>

      <div style={{ flex: 1 }} />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
         borderRadius: 99, padding: '5px 12px', fontSize: 12, fontWeight: 700,
        color: modeColor,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: modeColor, display: 'inline-block' }} />
        {modeLabel}
      </div>

      <button
        className="xps-electric-hover"
        onClick={() => requestAppShellNavigation({ page: 'admin', adminSection: 'system' })}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 4, position: 'relative', cursor: 'pointer' }}
      >
        <Bell size={15} className="xps-icon" />
        <span style={{ position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: '50%' }} className="xps-electric-accent" />
      </button>

      {typeof userContext.location === 'string' && userContext.location.length > 0 && (
         <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 13 }}>
          <MapPin size={12} className="xps-icon" />
          {userContext.location}
        </div>
      )}

      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 11, flexShrink: 0, overflow: 'hidden',
        position: 'relative',
      }}>
        <div className="xps-electric-accent" style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />
        <span style={{ position: 'relative', color: '#0a0b0c', zIndex: 1 }}>{userContext.avatar || 'XP'}</span>
      </div>
    </header>
  );
}
