import React from 'react';
import { Users, DollarSign, FileText, Target, ClipboardList, Zap } from 'lucide-react';
import { useWorkspace, OBJ_TYPE, RUN_STATUS } from '../../lib/workspaceEngine.jsx';
import { requestAppShellNavigation } from '../../lib/appShellEvents.js';

const gold = '#d4a843';

// Zero-state metric card
function MetricCard({ icon: Icon, label, note, onClick }) {
  return (
    <button
      onClick={onClick}
      className="xps-electric-hover"
      style={{
      background: '#161616',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      minWidth: 0,
      textAlign: 'left',
      cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Icon size={22} className="xps-icon" style={{ opacity: 0.7 }} />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.6 }}>NO LIVE DATA</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: -0.5 }}>—</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{label}</div>
      {note && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>{note}</div>}
    </button>
  );
}

// Empty chart placeholder
function ChartPlaceholder({ title, subtitle, height = 200, onClick }) {
  return (
    <button
      onClick={onClick}
      className="xps-electric-hover"
      style={{
      background: '#161616',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '18px 20px',
      height,
      display: 'flex',
      flexDirection: 'column',
      textAlign: 'left',
      cursor: 'pointer',
      width: '100%',
    }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: 8,
      }}>
        <svg width="32" height="24" viewBox="0 0 32 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 20L8 12l4 4 6-8 6 4"/>
          <path d="M2 22h28"/>
        </svg>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.6 }}>AWAITING DATA SYNC</span>
      </div>
    </button>
  );
}

export default function DashboardPanel() {
  const { createObject } = useWorkspace();

  const openWorkspaceObject = (type, title, content) => {
    createObject({ type, title, content, status: RUN_STATUS.DONE });
    requestAppShellNavigation({ page: 'workspace', panel: 'workspace' });
  };

  return (
    <div style={{ padding: '28px 28px', overflowY: 'auto', height: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#fff' }}>Command Center</h1>
        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          Awaiting configuration — connect data sources to activate your intelligence briefing
        </p>
      </div>

      {/* Metric cards row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
        marginBottom: 20,
      }}>
        <MetricCard icon={Users} label="Active Leads" note="Open lead briefing" onClick={() => openWorkspaceObject(OBJ_TYPE.REPORT, 'Lead Briefing', 'Lead pipeline is awaiting CRM sync. Open Admin → GitHub/Supabase/HubSpot to configure live inputs.')} />
        <MetricCard icon={DollarSign} label="Pipeline Value" note="Open revenue summary" onClick={() => openWorkspaceObject(OBJ_TYPE.DATA, 'Pipeline Summary', '{\n  \"status\": \"awaiting_sync\",\n  \"source\": \"crm\"\n}')} />
        <MetricCard icon={FileText} label="Proposals Sent" note="Open proposal workspace" onClick={() => requestAppShellNavigation({ page: 'workspace', panel: 'proposals' })} />
        <MetricCard icon={Target} label="Close Rate" note="Open analytics workspace" onClick={() => requestAppShellNavigation({ page: 'workspace', panel: 'analytics' })} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, marginBottom: 20 }}>
        <ChartPlaceholder title="Revenue Pipeline" subtitle="Open pipeline data panel" height={260} onClick={() => openWorkspaceObject(OBJ_TYPE.DATA, 'Revenue Pipeline Snapshot', '{\n  \"state\": \"awaiting_live_data\",\n  \"next_action\": \"connect_crm\"\n}')} />
        <ChartPlaceholder title="Pipeline Stages" subtitle="Open stage status panel" height={260} onClick={() => openWorkspaceObject(OBJ_TYPE.REPORT, 'Stage Status', 'Stage distribution is waiting for a live CRM connector.')} />
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <button className="xps-electric-hover" onClick={() => requestAppShellNavigation({ page: 'workspace', panel: 'workspace' })} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#f8fafc', fontWeight: 700 }}>Open Workspace</button>
        <button className="xps-electric-hover" onClick={() => requestAppShellNavigation({ page: 'workspace', panel: 'connectors' })} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#f8fafc', fontWeight: 700 }}>Connector Matrix</button>
        <button className="xps-electric-hover" onClick={() => requestAppShellNavigation({ page: 'admin', adminSection: 'integrations' })} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(212,168,67,0.35)', background: 'rgba(212,168,67,0.12)', color: gold, fontWeight: 700 }}>Open Admin Control Plane</button>
      </div>

      {/* Lower row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <EmptyTable title="Top Leads" columns={['Company', 'Score', 'Stage', 'Value']} />
        <EmptyFeed title="Recent Activity" />
      </div>
    </div>
  );
}

function EmptyTable({ title, columns }) {
  return (
    <div style={{
      background: '#161616',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '18px 20px',
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 14 }}>{title}</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
        gap: 0,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 8,
        marginBottom: 12,
      }}>
        {columns.map(c => (
          <div key={c} style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>{c}</div>
        ))}
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px 0',
        gap: 6,
      }}>
        <ClipboardList size={20} className="xps-icon" style={{ opacity: 0.4 }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.6 }}>NO LIVE DATA</span>
      </div>
    </div>
  );
}

function EmptyFeed({ title }) {
  return (
    <div style={{
      background: '#161616',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '18px 20px',
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 14 }}>{title}</div>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '32px 0',
        gap: 8,
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: 8,
      }}>
        <Zap size={24} className="xps-icon" style={{ opacity: 0.3 }} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.6 }}>AWAITING SYNC</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>Connect data sources to see activity</span>
      </div>
    </div>
  );
}
