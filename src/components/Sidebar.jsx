import React from 'react';

const gold = '#d4a843';
const bgBase = '#0a0a0a';

// ── SVG icon set (inline, stroke-based to match XPS screenshot aesthetic) ──
const icons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="6" height="6" rx="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5"/>
    </svg>
  ),
  workspace: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="14" height="10" rx="2"/>
      <path d="M5 15h6M8 11v4"/>
    </svg>
  ),
  bytebot: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="12" height="8" rx="2"/>
      <path d="M5 9h.01M11 9h.01M6 12h4"/>
      <path d="M5 5V3.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V5"/>
      <path d="M2 9H1M15 9h-1"/>
    </svg>
  ),
  leads: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="5" r="3"/>
      <path d="M1.5 14c0-3.038 2.91-5.5 6.5-5.5s6.5 2.462 6.5 5.5"/>
      <path d="M12 2l1 1.5L14.5 2"/>
    </svg>
  ),
  research: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="4.5"/>
      <path d="M10.5 10.5L14 14"/>
    </svg>
  ),
  analytics: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12L5 7l3 3 3-4 3 2"/>
      <path d="M1 14h14"/>
    </svg>
  ),
  connectors: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4" cy="4" r="2.5"/>
      <circle cx="12" cy="12" r="2.5"/>
      <path d="M6.5 4h3a2 2 0 0 1 2 2v2"/>
      <path d="M4 6.5v3a2 2 0 0 0 2 2h2"/>
    </svg>
  ),
  admin: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="2.5"/>
      <path d="M8 1v1.5M8 13.5V15M15 8h-1.5M2.5 8H1M12.95 3.05l-1.06 1.06M4.11 11.89l-1.06 1.06M12.95 12.95l-1.06-1.06M4.11 4.11L3.05 3.05"/>
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 1.5h3l.5 2a5.5 5.5 0 0 1 1.2.7l1.8-.8 2.1 2.1-.8 1.8c.28.38.52.78.7 1.2l2 .5v3l-2 .5a5.5 5.5 0 0 1-.7 1.2l.8 1.8-2.1 2.1-1.8-.8c-.38.28-.78.52-1.2.7l-.5 2h-3l-.5-2a5.5 5.5 0 0 1-1.2-.7l-1.8.8L.9 12.3l.8-1.8A5.5 5.5 0 0 1 1 9.3L-1 8.8v-3l2-.5c.18-.42.42-.82.7-1.2L1 2.3l2.1-2.1 1.8.8c.38-.28.78-.52 1.2-.7l.4-1.8z"/>
      <circle cx="8" cy="8" r="2.5"/>
    </svg>
  ),
  status: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M8 5v3l2 2"/>
    </svg>
  ),
  outreach: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z"/>
      <path d="M1 4l7 5 7-5"/>
    </svg>
  ),
  scraper: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M8 1.5C8 1.5 5 5 5 8s3 6.5 3 6.5M8 1.5C8 1.5 11 5 11 8s-3 6.5-3 6.5M1.5 8h13"/>
    </svg>
  ),
};

const NAV = [
  {
    section: 'MAIN',
    items: [
      { id: 'dashboard',  label: 'Dashboard',  icon: 'dashboard' },
      { id: 'workspace',  label: 'Workspace',  icon: 'workspace' },
      { id: 'bytebot',    label: 'ByteBot',    icon: 'bytebot'   },
      { id: 'research',   label: 'Research',   icon: 'research'  },
      { id: 'scraper',    label: 'Scraper',    icon: 'scraper'   },
      { id: 'outreach',   label: 'Outreach',   icon: 'outreach'  },
      { id: 'analytics',  label: 'Analytics',  icon: 'analytics' },
    ],
  },
  {
    section: 'CONTROL',
    items: [
      { id: 'connectors', label: 'Connectors', icon: 'connectors' },
      { id: 'admin',      label: 'Admin',      icon: 'admin'      },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { id: 'status',   label: 'Status',   icon: 'status'   },
      { id: 'settings', label: 'Settings', icon: 'settings' },
    ],
  },
];

export default function Sidebar({ activePanel, onSelect }) {
  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      height: '100%',
      background: '#0f0f0f',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Brand lockup */}
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        <div style={{
          width: 34, height: 34,
          background: gold,
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 10px rgba(212,168,67,0.3)',
        }}>
          <svg width="18" height="20" viewBox="0 0 20 22" fill="none">
            <path d="M10 1L2 5V10C2 14.97 5.4 19.45 10 21C14.6 19.45 18 14.97 18 10V5L10 1Z" fill={bgBase} />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.6, color: '#fff' }}>XPS INTELLIGENCE</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.8, marginTop: 1 }}>COMMAND CENTER</div>
        </div>
      </div>

      {/* Nav sections */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {NAV.map(({ section, items }) => (
          <div key={section} style={{ marginBottom: 4 }}>
            <div style={{
              padding: '10px 16px 4px',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 1.6,
              color: 'rgba(255,255,255,0.28)',
            }}>
              {section}
            </div>
            {items.map(({ id, label, icon }) => {
              const isActive = activePanel === id;
              return (
                <button
                  key={id}
                  onClick={() => onSelect(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 12px',
                    margin: '1px 6px',
                    maxWidth: 'calc(100% - 12px)',
                    background: isActive ? gold : 'transparent',
                    color: isActive ? bgBase : 'rgba(255,255,255,0.65)',
                    border: 'none',
                    borderRadius: 7,
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s, color 0.15s',
                    letterSpacing: 0.1,
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ opacity: isActive ? 1 : 0.7, display: 'flex', flexShrink: 0 }}>
                    {icons[icon]}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Runtime mode indicator */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '6px 10px',
          background: 'rgba(212,168,67,0.08)',
          border: '1px solid rgba(212,168,67,0.2)',
          borderRadius: 7,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 6px #fbbf24' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.8 }}>SYNTHETIC MODE</span>
        </div>
      </div>
    </aside>
  );
}
