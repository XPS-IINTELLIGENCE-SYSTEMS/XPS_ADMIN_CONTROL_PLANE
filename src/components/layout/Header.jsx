import React, { useEffect, useMemo, useState } from 'react';
import { Blocks, KeyRound, LayoutDashboard, PanelLeft, Plug } from 'lucide-react';
import { userContext } from '../../data/synthetic.js';
import { getConnectionPrefs, subscribeConnectionPrefs } from '../../lib/connectionPrefs.js';
import { resolveClientProviderState } from '../../lib/providerState.js';

const panelLabels = {
  overview: 'Overview',
  workspace: 'Workspace',
  connectors: 'Connectors',
  access: 'Access',
};

const panelDescriptions = {
  overview: 'Single operational surface for runtime, workspace, connectors, and sign-in access.',
  workspace: 'Interactive center surface with editable outputs and working quick actions.',
  connectors: 'One place to add, modify, remove, and review connector inputs.',
  access: 'Direct routes back to the sign-in screen and real external sign-in pages.',
};

const topNavItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'workspace', label: 'Workspace', icon: Blocks },
  { id: 'connectors', label: 'Connectors', icon: Plug },
  { id: 'access', label: 'Access', icon: KeyRound },
];

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

export default function Header({ activePanel, onOpenLogin, onNavigate, onToggleSidebar, sidebarVisible }) {
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

  const sectionNote = useMemo(() => {
    if (activePanel === 'connectors') return 'Connector CRUD and runtime inputs are centralized below.';
    if (activePanel === 'access') return 'Use the header button or access panel for the real sign-in entry points.';
    if (activePanel === 'workspace') return 'Use quick actions in the center to create and edit outputs.';
    return 'Keep the chat on the right and everything operational in the center.';
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
            CONTROL CENTER
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

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }} className="truncate">
          {description}
        </div>
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflowX: 'auto' }}>
        {topNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePanel === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className="xps-electric-hover"
              data-active={isActive ? 'true' : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: isActive ? 'var(--bg-active)' : 'var(--bg-card)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <Icon size={13} className="xps-icon" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 240 }} className="truncate">
        {sectionNote}
      </div>

      <button
        onClick={onOpenLogin}
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
        <KeyRound size={14} className="xps-icon" />
        Sign In
      </button>

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
