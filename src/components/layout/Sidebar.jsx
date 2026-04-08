import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Target, Bot, FlaskConical,
  Send, FileText, BarChart2, BookOpen, Shield, Plug,
  Settings, ChevronRight, Zap, Eye, Wrench, Brain,
  FlaskRound, Lock, Activity,
} from 'lucide-react';

const GOLD = '#c49e3c';

const sections = [
  {
    label: 'MAIN',
    items: [
      { to: '/dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
      { to: '/crm',         label: 'CRM',          icon: Users },
      { to: '/leads',       label: 'Leads',        icon: Target },
      { to: '/ai-assistant',label: 'AI Assistant', icon: Bot },
      { to: '/research',    label: 'Research Lab', icon: FlaskConical },
      { to: '/outreach',    label: 'Outreach',     icon: Send },
      { to: '/proposals',   label: 'Proposals',    icon: FileText },
      { to: '/analytics',   label: 'Analytics',    icon: BarChart2 },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { to: '/knowledge',   label: 'Knowledge Base', icon: BookOpen },
      { to: '/competition', label: 'Competition',    icon: Shield },
      { to: '/connectors',  label: 'Connectors',     icon: Plug },
    ],
  },
  {
    label: 'XPS SYSTEMS',
    items: [
      { to: '/xps/admin',   label: 'Admin Control Plane', icon: Activity },
      { to: '/xps/vision',  label: 'Vision Cortex',       icon: Eye },
      { to: '/xps/builder', label: 'Auto Builder',        icon: Wrench },
      { to: '/xps/intel',   label: 'Intel Core',          icon: Brain },
      { to: '/xps/sandbox', label: 'Sandbox',             icon: FlaskRound },
      { to: '/xps/quarantine', label: 'Quarantine',       icon: Lock },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/admin',    label: 'Admin',    icon: Zap },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside style={{
      width: collapsed ? 56 : 220,
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
        <div style={{
          width: 28, height: 28, background: GOLD, borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
            <path d="M7 1L1 4.5V8.5C1 11.8 3.7 14.8 7 16C10.3 14.8 13 11.8 13 8.5V4.5L7 1Z" fill="#0a0b0c"/>
          </svg>
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 0.5, color: 'var(--text-primary)', lineHeight: 1.2 }}>XPS INTELLIGENCE</div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1.2, lineHeight: 1 }}>COMMAND CENTER</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {sections.map(section => (
          <div key={section.label} style={{ marginBottom: 4 }}>
            {!collapsed && (
              <div style={{
                fontSize: 10, fontWeight: 600, letterSpacing: 1.2,
                color: 'var(--text-muted)', padding: '12px 16px 4px',
                userSelect: 'none',
              }}>
                {section.label}
              </div>
            )}
            {section.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: collapsed ? '9px 14px' : '8px 16px',
                  margin: '1px 6px',
                  borderRadius: 'var(--radius-sm)',
                  color: isActive ? GOLD : 'var(--text-secondary)',
                  background: isActive ? 'var(--bg-active)' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 13,
                  textDecoration: 'none',
                  transition: 'background 0.15s, color 0.15s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                })}
                title={collapsed ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={15} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
                    {!collapsed && <span>{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
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
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ChevronRight size={14} style={{ transform: collapsed ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s' }} />
      </button>
    </aside>
  );
}
