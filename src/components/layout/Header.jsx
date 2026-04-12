import React, { useEffect, useMemo, useState } from 'react';
import { Blocks, KeyRound, LayoutDashboard, Menu, MessageSquare, PanelLeft, PanelRightClose, PanelRightOpen, Plug } from 'lucide-react';
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
  overview: 'Centered dashboard with zeroed ingestion, connector, and runtime status.',
  workspace: 'Editable workspace outputs stay in the center dashboard.',
  connectors: 'Groq, GPT, Supabase, GitHub, and Google Workspace connector setup.',
  access: 'Open the built-in sign-in and account pass-through entry points.',
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

export default function Header({
  activePanel,
  onOpenLogin,
  onNavigate,
  onToggleSidebar,
  sidebarVisible,
  isMobile,
  chatOpen,
  onToggleChat,
  onToggleNavigation,
}) {
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
    if (activePanel === 'connectors') return 'Keep connector truth in the center dashboard and use the right rail for live troubleshooting.';
    if (activePanel === 'access') return 'Use the open sign-in screen or jump to the real provider account pages.';
    if (activePanel === 'workspace') return 'Workspace artifacts stay centered while the chat agent remains pinned on the right.';
    return 'Left tools, centered dashboard, and a live chat rail on the right stay visible together.';
  }, [activePanel]);

  return (
    <header
      style={{
        minHeight: 'var(--header-h)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: isMobile ? '0 12px' : '0 18px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(12,13,17,0.94)',
        backdropFilter: 'blur(16px)',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {isMobile ? (
        <button
          type="button"
          onClick={onToggleNavigation}
          className="xps-electric-hover"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 10,
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            flexShrink: 0,
          }}
          aria-label="Open navigation"
        >
          <Menu size={17} className="xps-icon" />
        </button>
      ) : null}

      <div className="xps-brand-lockup" style={{ flexShrink: 0 }}>
        <BrandLogo />
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span className="xps-silver-text" style={{ fontWeight: 800, fontSize: 16, letterSpacing: 1.1, whiteSpace: 'nowrap' }}>
              XPS INTELLIGENCE
            </span>
            <span className="xps-gold-text" style={{ fontWeight: 700, fontSize: 10, letterSpacing: 2, whiteSpace: 'nowrap', marginTop: 3 }}>
              CONTROL PLANE
            </span>
          </div>
        )}
      </div>

      {!isMobile && <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />}

      {!isMobile && sidebarVisible && onToggleSidebar ? (
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
      ) : null}

      <div style={{ minWidth: 0, flex: 1, display: 'grid', gap: 2 }}>
        <div style={{ fontWeight: 700, fontSize: isMobile ? 13 : 14, color: 'var(--text-primary)' }}>{label}</div>
        {!isMobile ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }} className="truncate">
            {description}
          </div>
        ) : null}
      </div>

      {!isMobile ? (
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
      ) : null}

      {isMobile ? (
        <select
          aria-label="Dashboard section"
          value={activePanel}
          onChange={(event) => onNavigate?.(event.target.value)}
          style={{
            minWidth: 0,
            width: 128,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            color: 'var(--text-primary)',
            padding: '10px 12px',
            outline: 'none',
          }}
        >
          {topNavItems.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      ) : (
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
      )}

      {!isMobile ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 220 }} className="truncate">
          {sectionNote}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onToggleChat}
        className="xps-electric-hover"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: isMobile ? '10px 12px' : '8px 12px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: chatOpen ? 'var(--bg-active)' : 'var(--bg-card)',
          color: 'var(--text-primary)',
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
        aria-label={chatOpen ? 'Hide chat rail' : 'Show chat rail'}
      >
        {chatOpen ? <PanelRightClose size={15} className="xps-icon" /> : <PanelRightOpen size={15} className="xps-icon" />}
        {!isMobile ? 'Chat' : 'Chat'}
      </button>

      {!isMobile ? (
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
      ) : null}

      {!isMobile ? (
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
      ) : null}
    </header>
  );
}
