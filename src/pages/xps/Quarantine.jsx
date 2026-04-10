import React from 'react';
import Panel from '../../components/ui/Panel.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { quarantineItems } from '../../data/synthetic.js';
import { Lock, AlertTriangle } from 'lucide-react';

export default function Quarantine() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 6 }}>XPS CANONICAL SYSTEM</div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Quarantine</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <AlertTriangle size={14} color="var(--red)" />
          <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>Explicitly blocked, unsafe, or unresolved work only.</p>
        </div>
      </div>

      <Panel title="Quarantine Queue" subtitle={`${quarantineItems.length} items currently blocked`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {quarantineItems.map((q, i) => (
            <div key={q.id} style={{ padding: '14px 0', borderBottom: i < quarantineItems.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lock size={13} color="var(--red)" />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{q.name}</span>
                </div>
                <StatusBadge status={q.severity} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 40 }}>{q.reason}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 40, marginTop: 4 }}>{q.id} · in quarantine since {q.since}</div>
            </div>
          ))}
        </div>
      </Panel>

      <div style={{ marginTop: 16, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius)', padding: '14px 18px', fontSize: 12, color: 'var(--red)' }}>
        Items in quarantine must be reviewed by an operator before being released, rejected, or re-routed. No automatic promotion occurs from this surface.
      </div>
    </div>
  );
}
