import React from 'react';
import StatCard from '../components/ui/StatCard.jsx';
import Panel from '../components/ui/Panel.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { crmStats, pipelineStages } from '../data/synthetic.js';
import { Users } from 'lucide-react';

export default function CRM() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>CRM Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>Customer relationship management and pipeline overview</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {crmStats.map(s => <StatCard key={s.id} {...s} />)}
      </div>

      {/* Pipeline stages */}
      <Panel title="Pipeline Stages" style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
          {pipelineStages.map(stage => (
            <div key={stage.stage} style={{
              background: 'var(--bg-card-alt)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '16px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{stage.stage}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{stage.count}</div>
              <div style={{ fontSize: 13, color: 'var(--gold)', fontWeight: 600, marginTop: 4 }}>{stage.value}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Recent contacts placeholder */}
      <Panel title="Recent Contacts" subtitle="Latest activity across all contacts">
        <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>
          <div style={{ marginBottom: 10 }}>
            <Users size={28} className="xps-icon" />
          </div>
          Connect HubSpot or Google Sheets to load live contact data.
          <br /><span style={{ fontSize: 11, marginTop: 4, display: 'block' }}>Status: <strong>missing</strong> — no connector active</span>
        </div>
      </Panel>
    </div>
  );
}
