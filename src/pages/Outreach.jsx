import React, { useState } from 'react';
import Panel from '../components/ui/Panel.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { Plus, Send } from 'lucide-react';

const GOLD = '#c49e3c';

const sequences = [
  { id: 1, name: 'Warehouse Cold Outreach', status: 'active',  leads: 14, opens: '62%', replies: '18%' },
  { id: 2, name: 'Healthcare Intro Sequence', status: 'draft', leads: 0,  opens: '—',   replies: '—' },
  { id: 3, name: 'Follow-Up: Stale Leads',   status: 'active', leads: 8,  opens: '74%', replies: '22%' },
];

export default function Outreach() {
  const [items, setItems] = useState(sequences);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Outreach</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>AI-drafted email sequences and cadences</p>
        </div>
        <button
          onClick={() => setItems(prev => [{ id: Date.now(), name: 'New Operator Sequence', status: 'draft', leads: 0, opens: '—', replies: '—' }, ...prev])}
          className="xps-electric-hover"
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: GOLD, color: '#0a0b0c', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 700, fontSize: 13 }}
        >
          <Plus size={14} /> New Sequence
        </button>
      </div>

      <Panel title="Active Sequences" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {items.map((seq, i) => (
            <div key={seq.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(196,158,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Send size={15} color={GOLD} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{seq.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{seq.leads} leads enrolled</div>
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: GOLD, fontWeight: 600 }}>{seq.opens}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Open rate</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{seq.replies}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Reply rate</div>
                </div>
              </div>
              <StatusBadge status={seq.status} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Gmail Integration" subtitle="Send directly from your connected inbox">
        <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
          Gmail status: <strong style={{ color: '#6b7280' }}>missing</strong> — connect Gmail OAuth to enable direct sending.
        </div>
      </Panel>
    </div>
  );
}
