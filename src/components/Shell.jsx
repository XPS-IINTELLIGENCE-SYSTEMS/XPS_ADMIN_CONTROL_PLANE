import React from 'react';

const NAV = [
  {
    section: 'MAIN',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
      { id: 'crm', label: 'CRM', icon: <CRMIcon /> },
      { id: 'leads', label: 'Leads', icon: <LeadsIcon /> },
      { id: 'ai-assistant', label: 'AI Assistant', icon: <AIIcon /> },
      { id: 'research', label: 'Research Lab', icon: <ResearchIcon /> },
      { id: 'outreach', label: 'Outreach', icon: <OutreachIcon /> },
      { id: 'proposals', label: 'Proposals', icon: <ProposalsIcon /> },
      { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
    ],
  },
  {
    section: 'INTELLIGENCE',
    items: [
      { id: 'knowledge', label: 'Knowledge Base', icon: <KBIcon /> },
      { id: 'competition', label: 'Competition', icon: <CompIcon /> },
      { id: 'connectors', label: 'Connectors', icon: <ConnIcon /> },
    ],
  },
  {
    section: 'OPERATOR',
    items: [
      { id: 'editor', label: 'Editor / Workspace', icon: <EditorIcon /> },
      { id: 'scraper', label: 'Scraper Control', icon: <ScraperIcon /> },
      { id: 'workflows', label: 'Workflow Builder', icon: <WorkflowIcon /> },
      { id: 'logs', label: 'Job Logs', icon: <LogsIcon /> },
      { id: 'artifacts', label: 'Artifacts', icon: <ArtifactsIcon /> },
    ],
  },
  {
    section: 'SYSTEM',
    items: [
      { id: 'admin', label: 'Admin', icon: <AdminIcon /> },
      { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
    ],
  },
];

const FULL_HEIGHT_PAGES = new Set(['ai-assistant', 'editor']);

export default function Shell({ page, setPage, children }) {
  const isFullHeight = FULL_HEIGHT_PAGES.has(page);
  return (
    <div className="xps-shell">
      {/* ── Sidebar ── */}
      <aside className="xps-sidebar">
        <div className="xps-logo">
          <div className="xps-logo-icon">
            <svg width="18" height="20" viewBox="0 0 20 22" fill="none">
              <path d="M10 1L2 5V10C2 14.97 5.4 19.45 10 21C14.6 19.45 18 14.97 18 10V5L10 1Z" fill="#0d0d0d" />
            </svg>
          </div>
          <div className="xps-logo-text">
            <div className="xps-logo-name">XPS INTELLIGENCE</div>
            <div className="xps-logo-sub">Command Center</div>
          </div>
        </div>

        {NAV.map(({ section, items }) => (
          <div key={section} className="xps-nav-section">
            <div className="xps-nav-label">{section}</div>
            {items.map(({ id, label, icon }) => (
              <div
                key={id}
                className={`xps-nav-item${page === id ? ' active' : ''}`}
                onClick={() => setPage(id)}
              >
                <span className="xps-nav-icon">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        ))}
      </aside>

      {/* ── Main ── */}
      <div className="xps-main">
        {/* Header */}
        <header className="xps-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'rgba(255,255,255,0.4)', cursor: 'pointer', flexShrink: 0 }}>
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>

          <span className="xps-header-title">{pageTitle(page)}</span>

          <div className="xps-search">
            <svg className="xps-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input placeholder="Search leads, companies, proposals..." />
          </div>

          <div className="xps-header-actions">
            <button className="xps-icon-btn" title="Favorites">
              <StarIcon />
            </button>
            <button className="xps-icon-btn" title="Notifications">
              <BellIcon />
              <span className="xps-notif-dot" />
            </button>
            <div className="xps-location">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              Tampa, FL
            </div>
            <div className="xps-avatar">MR</div>
          </div>
        </header>

        {/* Content */}
        <div className={isFullHeight ? 'xps-content-full' : 'xps-content'}>
          {children}
        </div>
      </div>
    </div>
  );
}

function pageTitle(page) {
  const map = {
    dashboard: 'Dashboard', crm: 'CRM', leads: 'Leads', 'ai-assistant': 'AI Assistant',
    research: 'Research Lab', outreach: 'Outreach', proposals: 'Proposals', analytics: 'Analytics',
    knowledge: 'Knowledge Base', competition: 'Competition', connectors: 'Connectors',
    editor: 'Editor / Workspace', scraper: 'Scraper Control', workflows: 'Workflow Builder',
    logs: 'Job Logs', artifacts: 'Artifacts', admin: 'Admin', settings: 'Settings',
  };
  return map[page] || page;
}

/* ── Icons (inline SVG) ── */
function HomeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function CRMIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function LeadsIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function AIIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/></svg>;
}
function ResearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
}
function OutreachIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}
function ProposalsIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
}
function AnalyticsIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function KBIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
}
function CompIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
}
function ConnIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
}
function EditorIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
}
function ScraperIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}
function WorkflowIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M6 9v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9"/></svg>;
}
function LogsIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><polyline points="14 2 14 8 20 8"/></svg>;
}
function ArtifactsIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
}
function AdminIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function SettingsIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}
function StarIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function BellIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}
