import React, { useState } from 'react';
import { PanelLeft, Search, Sparkles, Bell, MapPin } from 'lucide-react';
import { userContext } from '../../data/synthetic.js';
import { ORCHESTRATOR_MODE } from '../../lib/orchestrator.js';

const GOLD = '#c49e3c';

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

export default function Header({ activePanel, onToggleSidebar }) {
  const label = panelLabels[activePanel] || 'XPS Intelligence';
  const [search, setSearch] = useState('');

  const modeColor = ORCHESTRATOR_MODE === 'live' ? '#22c55e' : '#eab308';
  const modeLabel = ORCHESTRATOR_MODE === 'live' ? 'live' : 'synthetic';

  return (
    <header style={{
      height: 'var(--header-h)',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 20px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-sidebar)',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 9,
    }}>
      <button
        onClick={onToggleSidebar}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: 4, borderRadius: 4, display: 'flex', cursor: 'pointer' }}
        title="Toggle sidebar"
      >
        <PanelLeft size={16} />
      </button>

      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
        {label}
      </span>

      <div style={{ flex: 1, maxWidth: 480, position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search leads, companies, proposals…"
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

      <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 4, cursor: 'pointer' }}>
        <Sparkles size={15} />
      </button>

      <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 4, position: 'relative', cursor: 'pointer' }}>
        <Bell size={15} />
        <span style={{ position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: '50%', background: GOLD }} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12 }}>
        <MapPin size={12} />
        {userContext.location}
      </div>

      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: GOLD, color: '#0a0b0c',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 11, flexShrink: 0,
      }}>
        {userContext.avatar}
      </div>
    </header>
  );
}
