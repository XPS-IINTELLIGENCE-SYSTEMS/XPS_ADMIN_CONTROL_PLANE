import React from 'react';
import Panel from '../../components/ui/Panel.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { intelCoreData } from '../../data/synthetic.js';

const GOLD = '#c49e3c';

export default function IntelCore() {
  const { systemHealth, selfValidate, touchdownSummaries } = intelCoreData;

  const healthColor = systemHealth.score >= 90 ? 'var(--green)' : systemHealth.score >= 75 ? GOLD : 'var(--red)';

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 6 }}>XPS CANONICAL SYSTEM</div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Intel Core</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Discovery, dedupe, validation, evidence, packaging, safe-write</p>
      </div>

      {/* Health score */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 42, fontWeight: 800, color: healthColor, lineHeight: 1 }}>{systemHealth.score}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Health Score</div>
          </div>
          <div>
            <StatusBadge status={systemHealth.status} />
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Last check: {systemHealth.lastCheck}</div>
          </div>
        </div>

        <div style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Self-Validate Results</div>
          {selfValidate.map(c => (
            <div key={c.check} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 12 }}>
              <StatusBadge status={c.result} />
              <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{c.check}</span>
              {c.note && <span style={{ color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic' }}>{c.note}</span>}
            </div>
          ))}
        </div>
      </div>

      <Panel title="Touchdown Summaries" subtitle="Cycle completion records">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {touchdownSummaries.map((td, i) => (
            <div key={td.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto auto', gap: 14, padding: '11px 0', borderBottom: i < touchdownSummaries.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{td.ts}</span>
              <div>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{td.title}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{td.items} items</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{td.id}</span>
              <StatusBadge status={td.status} />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
