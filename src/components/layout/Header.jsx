import React, { useEffect, useMemo, useState } from 'react';
import { House, PanelLeft, Search, Shield, MapPin } from 'lucide-react';
import { userContext } from '../../data/synthetic.js';
import { getConnectionPrefs, subscribeConnectionPrefs } from '../../lib/connectionPrefs.js';
import { resolveClientProviderState } from '../../lib/providerState.js';

const panelLabels = {
  dashboard: 'Dashboard',
  crm: 'CRM',
  leads: 'Leads',
  'ai-assistant': 'AI Assistant',
  research: 'Research Lab',
  outreach: 'Outreach',
  proposals: 'Proposals',
  analytics: 'Analytics',
  connectors: 'Connectors',
  admin: 'Admin',
  settings: 'Settings',
};

const panelDescriptions = {
  dashboard: 'Daily revenue, pipeline, and account priorities.',
  crm: 'Pipeline visibility and customer relationship activity.',
  leads: 'Lead scoring, qualification, and territory coverage.',
  'ai-assistant': 'Live sales drafting, research, and next-step support.',
  research: 'Market intelligence and company research workspace.',
  outreach: 'Sequencing, cadence performance, and follow-up prep.',
  proposals: 'Proposal progress, approvals, and active opportunities.',
  analytics: 'Performance metrics and revenue intelligence.',
  connectors: 'Live system status and routing preferences.',
  admin: 'Focused controls for runtime, access, and governance.',
  settings: 'Workspace defaults and credential readiness.',
};

const BRAND_LOGO = '/brand/xps-shield-wings.png';
const API_URL = import.meta.env.VITE_API_URL || import.meta.env.API_URL || '';

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

export default function Header({ activePanel, onGoHome, onOpenAdmin, onToggleSidebar, sidebarVisible }) {
  const [search, setSearch] = useState('');
  const [apiStatus, setApiStatus] = useState(null);
  const [connectionPrefs, setConnectionPrefs] = useState(getConnectionPrefs());
  const label = panelLabels[activePanel] || 'XPS Intelligence';
  const description = panelDescriptions[activePanel] || 'Focused sales intelligence workspace.';
  const runtimeState = resolveClientProviderState(apiStatus, connectionPrefs).llm;
  const modeColor = runtimeState.active === 'none'
    ? '#eab308'
    : runtimeState.active === 'ollama'
      ? '#60a5fa'
      : '#22c55e';
  const modeLabel = runtimeState.active === 'none'
    ? 'Synthetic fallback'
    : runtimeState.active === 'ollama'
      ? 'Ollama local'
      : `${String(runtimeState.active).toUpperCase()} live`;

  useEffect(() => {
    fetch(`${API_URL}/api/status`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setApiStatus(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setConnectionPrefs(getConnectionPrefs());
    return subscribeConnectionPrefs(setConnectionPrefs);
  }, []);

  const placeholder = useMemo(() => {
    if (activePanel === 'connectors') return 'Search connectors, providers, or deployment targets…';
    if (activePanel === 'admin') return 'Search controls, governance, or access settings…';
    return 'Search accounts, leads, proposals, or territories…';
  }, [activePanel]);

  return (
    <header
      style={{
        minHeight: 'var(--header-h)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '0 18px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-sidebar)',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 9,
      }}
    >
      <div className="xps-brand-lockup" style={{ flexShrink: 0 }}>
        <BrandLogo />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span className="xps-silver-text" style={{ fontWeight: 800, fontSize: 16, letterSpacing: 1.1, whiteSpace: 'nowrap' }}>
            XPS INTELLIGENCE
          </span>
          <span className="xps-gold-text" style={{ fontWeight: 700, fontSize: 10, letterSpacing: 2, whiteSpace: 'nowrap', marginTop: 3 }}>
            PREMIUM SALES WORKFLOW
          </span>
        </div>
      </div>

      <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />

      {sidebarVisible && (
        <button
          onClick={onToggleSidebar}
          className="xps-electric-hover"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            padding: 4,
            borderRadius: 4,
            display: 'flex',
            cursor: 'pointer',
            position: 'relative',
          }}
          title="Toggle sidebar"
        >
          <PanelLeft size={16} className="xps-icon" />
        </button>
      )}

      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }} className="truncate">
          {description}
        </div>
      </div>

      <div style={{ flex: 1, maxWidth: 520, position: 'relative', marginLeft: 8 }}>
        <Search size={13} className="xps-icon" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '9px 14px 9px 34px',
            color: 'var(--text-primary)',
            fontSize: 14,
            outline: 'none',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 99,
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 700,
          color: modeColor,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: modeColor, display: 'inline-block' }} />
        {modeLabel}
      </div>

      <button
        onClick={onGoHome}
        className="xps-electric-hover"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <House size={14} className="xps-icon" />
        Home
      </button>

      <button
        onClick={onOpenAdmin}
        className="xps-electric-hover"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <Shield size={14} className="xps-icon" />
        Admin
      </button>

      {typeof userContext.location === 'string' && userContext.location.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 13, whiteSpace: 'nowrap' }}>
          <MapPin size={12} className="xps-icon" />
          {userContext.location}
        </div>
      )}

      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 11,
          flexShrink: 0,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div className="xps-electric-accent" style={{ position: 'absolute', inset: 0, borderRadius: '50%' }} />
        <span style={{ position: 'relative', color: '#0a0b0c', zIndex: 1 }}>{userContext.avatar || 'XP'}</span>
      </div>
    </header>
  );
}
