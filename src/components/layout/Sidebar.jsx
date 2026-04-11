import React from 'react';
import {
  LayoutDashboard, Users, Target, Bot, FlaskConical,
  Send, FileText, BarChart2, BookOpen, Shield, Plug,
  Settings, ChevronRight, Zap, Eye, Wrench, Brain,
  FlaskRound, Lock, Activity, Code2, Globe, Layers,
  ScrollText, Package,
} from 'lucide-react';

const BRAND_LOGO = '/brand/xps-shield-wings.png';

// A simple inline gradient text for active sidebar items
function GradAccent() {
  return (
    <span
      className="xps-electric-accent"
      style={{
        display: 'inline-block',
        width: 3,
        height: 3,
        borderRadius: '50%',
        marginLeft: 'auto',
        flexShrink: 0,
      }}
    />
  );
}

const sections = [
  {
    label: 'MAIN',
    items: [
      { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
      { id: 'crm',          label: 'CRM',          icon: Users },
      { id: 'leads',        label: 'Leads',        icon: Target },
      { id: 'bytebot',      label: 'ByteBot',      icon: Bot },
      { id: 'research',     label: 'Research Lab', icon: FlaskConical },
      { id: 'outreach',     label: 'Outreach',     icon: Send },
      { id: 'proposals',    label: 'Proposals',    icon: FileText },
      { id: 'analytics',    label: 'Analytics',    icon: BarChart2 },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { id: 'knowledge',    label: 'Knowledge Base', icon: BookOpen },
      { id: 'competition',  label: 'Competition',    icon: Shield },
      { id: 'connectors',   label: 'Connectors',     icon: Plug },
    ],
  },
  {
    label: 'OPERATOR',
    items: [
      { id: 'workspace',    label: 'Editor / Workspace', icon: Code2 },
      { id: 'scraper',      label: 'Scraper Control',    icon: Globe },
      { id: 'workflows',    label: 'Workflow Builder',   icon: Layers },
      { id: 'logs',         label: 'Job Logs',           icon: ScrollText },
      { id: 'artifacts',    label: 'Artifacts',          icon: Package },
    ],
  },
  {
    label: 'XPS SYSTEMS',
    items: [
      { id: 'xps-admin',    label: 'Admin Control Plane', icon: Activity },
      { id: 'xps-vision',   label: 'Vision Cortex',       icon: Eye },
      { id: 'xps-builder',  label: 'Auto Builder',        icon: Wrench },
      { id: 'xps-intel',    label: 'Intel Core',          icon: Brain },
      { id: 'xps-sandbox',  label: 'Sandbox',             icon: FlaskRound },
      { id: 'xps-quarantine', label: 'Quarantine',        icon: Lock },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { id: 'admin',     label: 'Admin',    icon: Zap },
      { id: 'settings',  label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, activePanel, onNavigate }) {
  return (
    <aside style={{
      width: collapsed ? 64 : 'var(--sidebar-w)',
      minHeight: '100vh',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.2s',
      overflow: 'hidden',
      flexShrink: 0,
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{
        height: 'var(--header-h)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: collapsed ? '0 14px' : '0 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div
          className="xps-logo xps-brand-logo-glow"
          style={{
            width: 42,
            height: 42,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <img
            src={BRAND_LOGO}
            alt="XPS"
            data-testid="brand-logo-sidebar"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        {!collapsed && (
          <div>
            <div className="xps-silver-text" style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.6, lineHeight: 1.1 }}>XPS INTELLIGENCE</div>
            <div className="xps-gold-text" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.6, lineHeight: 1, marginTop: 3 }}>COMMAND CENTER</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {sections.map(section => (
          <div key={section.label} style={{ marginBottom: 4 }}>
            {!collapsed && (
              <div style={{
                 fontSize: 11, fontWeight: 700, letterSpacing: 1.3,
                color: 'var(--text-muted)', padding: '12px 16px 4px',
                userSelect: 'none',
              }}>
                {section.label}
              </div>
            )}
            {section.items.map(item => {
              const isActive = activePanel === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={collapsed ? item.label : undefined}
                  className="xps-electric-hover"
                  data-active={isActive ? 'true' : undefined}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                     padding: collapsed ? '11px 16px' : '10px 18px',
                    margin: '1px 6px',
                    borderRadius: 'var(--radius-sm)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: isActive ? 'var(--bg-active)' : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                     fontSize: 14,
                    border: 'none',
                    cursor: 'pointer',
                    width: 'calc(100% - 12px)',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} className="xps-icon" style={{ flexShrink: 0 }} />
                  {!collapsed && (
                    <>
                      <span className={isActive ? 'xps-electric-text' : ''}>{item.label}</span>
                      {isActive && <GradAccent />}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-end',
          padding: '12px 16px',
          background: 'none', border: 'none',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border)',
          fontSize: 12,
          cursor: 'pointer',
          transition: 'color 0.15s',
          width: '100%',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ChevronRight size={14} style={{ transform: collapsed ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s' }} />
      </button>
    </aside>
  );
}
