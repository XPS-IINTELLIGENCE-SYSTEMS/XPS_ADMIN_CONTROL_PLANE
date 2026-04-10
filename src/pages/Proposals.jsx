import React from 'react';
import Panel from '../components/ui/Panel.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { Plus, FileText } from 'lucide-react';

const GOLD = '#c49e3c';

const proposals = [
  { id: 1, company: 'Ace Hardware Distribution', contact: 'Robert Chen',   value: '$45,000', status: 'Proposal',     sent: '2d ago' },
  { id: 2, company: 'Gulf Coast Logistics',       contact: 'Diana Patel',   value: '$38,000', status: 'Qualified',    sent: '5d ago' },
  { id: 3, company: 'Palm Medical Center',        contact: 'Dr. James Liu', value: '$55,000', status: 'Negotiation',  sent: '1w ago' },
  { id: 4, company: 'Tampa Bay Brewing Co.',      contact: 'Sarah Mills',   value: '$28,000', status: 'Closed Won',   sent: '2w ago' },
];

export default function Proposals() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Proposals</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Track, create, and manage sales proposals</p>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: GOLD, color: '#0a0b0c', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 700, fontSize: 13 }}>
          <Plus size={14} /> New Proposal
        </button>
      </div>

      <Panel title="Active Proposals">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {proposals.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: i < proposals.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(196,158,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={14} color={GOLD} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{p.company}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{p.contact} · Sent {p.sent}</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: GOLD }}>{p.value}</div>
              <StatusBadge status={p.status} />
            </div>
          ))}
        </div>
      </Panel>

      <div style={{ marginTop: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px', fontSize: 13, color: 'var(--text-muted)' }}>
        Beautiful.ai integration: <strong style={{ color: '#6b7280' }}>missing</strong> — connect to enable deck generation.
        <br />Google Drive: <strong style={{ color: '#6b7280' }}>missing</strong> — connect to auto-archive proposals.
      </div>
    </div>
  );
}
