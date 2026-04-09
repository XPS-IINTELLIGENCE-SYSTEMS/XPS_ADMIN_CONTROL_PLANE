import React from 'react';
import Panel from '../components/ui/Panel.jsx';
import ConnectorBadge from '../components/ui/ConnectorBadge.jsx';
import { connectors } from '../data/connectors.js';

export default function Connectors() {
  const grouped = connectors.reduce((acc, c) => {
    if (!acc[c.category]) acc[c.category] = [];
    acc[c.category].push(c);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Connector Reality Matrix</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
          Live status of all external integrations. Never hallucinated — only truthful runtime labels.
        </p>
      </div>

      {/* Status legend */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
        {[
          { label: 'Connected (RW)',    color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
          { label: 'Connected (R only)',color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Referenced Only',  color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
          { label: 'Blocked',          color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
          { label: 'Missing',          color: '#6b7280', bg: 'rgba(107,114,128,0.1)' },
        ].map(s => (
          <span key={s.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: s.bg, color: s.color, borderRadius: 99, padding: '4px 12px', fontSize: 12, fontWeight: 500 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {connectors.map(c => (
          <div key={c.id} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '16px 20px',
            display: 'grid', gridTemplateColumns: '40px 1fr auto',
            gap: 16, alignItems: 'center',
          }}>
            {/* Icon */}
            <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--bg-card-alt)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              {c.icon}
            </div>

            {/* Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-card-alt)', padding: '1px 8px', borderRadius: 4 }}>{c.category}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{c.role}</div>
              {c.note && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{c.note}</div>}
              {c.lastAttempt && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Last attempt: {c.lastAttempt}</div>
              )}
            </div>

            {/* Status badge */}
            <ConnectorBadge status={c.status} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 18px', fontSize: 12, color: 'var(--text-muted)' }}>
        To activate a connector: add the required credentials to your environment and redeploy. See <code style={{ color: 'var(--gold)' }}>.env.example</code> for all required keys.
      </div>
    </div>
  );
}
