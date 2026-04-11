import React from 'react';
import {
  BookOpen,
  Bot,
  LayoutDashboard,
  Users,
  Target,
  FlaskConical,
  Send,
  FileText,
  BarChart2,
  Plug,
  Shield,
  Settings,
  ChevronRight,
  Eye,
} from 'lucide-react';

const BRAND_LOGO = '/brand/xps-shield-wings.png';

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
    label: 'OVERVIEW',
    items: [
      { id: 'workspace', label: 'Workspace', icon: Bot },
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'crm', label: 'CRM', icon: Users },
      { id: 'leads', label: 'Leads', icon: Target },
    ],
  },
  {
    label: 'WORKFLOW',
    items: [
      { id: 'research', label: 'Research Lab', icon: FlaskConical },
      { id: 'outreach', label: 'Outreach', icon: Send },
      { id: 'proposals', label: 'Proposals', icon: FileText },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
      { id: 'competition', label: 'Competition', icon: Eye },
      { id: 'analytics', label: 'Analytics', icon: BarChart2 },
      { id: 'connectors', label: 'Connectors', icon: Plug },
    ],
  },
  {
    label: 'CONTROL',
    items: [
      { id: 'admin', label: 'Admin', icon: Shield },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, activePanel, onNavigate }) {
  return (
    <aside
      style={{
        width: collapsed ? 68 : 'var(--sidebar-w)',
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
      }}
    >
      <div
        style={{
          minHeight: 'var(--header-h)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: collapsed ? '0 13px' : '0 18px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
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
            <div className="xps-silver-text" style={{ fontWeight: 800, fontSize: 15, letterSpacing: 0.8, lineHeight: 1.1 }}>
              XPS INTELLIGENCE
            </div>
            <div className="xps-gold-text" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.8, lineHeight: 1, marginTop: 3 }}>
              SALES INTELLIGENCE
            </div>
          </div>
        )}
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {sections.map((section) => (
          <div key={section.label} style={{ marginBottom: 8 }}>
            {!collapsed && (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.4,
                  color: 'var(--text-muted)',
                  padding: '12px 18px 6px',
                  userSelect: 'none',
                }}
              >
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
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
                    padding: collapsed ? '12px 17px' : '11px 18px',
                    margin: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: isActive ? 'var(--bg-active)' : 'transparent',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: 14,
                    border: 'none',
                    width: 'calc(100% - 16px)',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(event) => {
                    if (!isActive) event.currentTarget.style.background = 'var(--bg-hover)';
                  }}
                  onMouseLeave={(event) => {
                    if (!isActive) event.currentTarget.style.background = 'transparent';
                  }}
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

      <button
        onClick={onToggle}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-end',
          padding: '12px 16px',
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border)',
          cursor: 'pointer',
          width: '100%',
        }}
      >
        <ChevronRight size={14} style={{ transform: collapsed ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s' }} />
      </button>
    </aside>
  );
}
