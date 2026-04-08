import React from 'react';
import Panel from '../../components/ui/Panel.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { autoBuilderData } from '../../data/synthetic.js';

const GOLD = '#c49e3c';

export default function AutoBuilder() {
  const { artifacts, buildBacklog } = autoBuilderData;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 6 }}>XPS CANONICAL SYSTEM</div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Auto Builder</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Artifact factory, prompt factory, canonical docs maintenance</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Panel title="Artifact Registry">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {artifacts.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < artifacts.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{a.id} · {a.type} · {a.updated}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Build Backlog">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {buildBacklog.map((b, i) => (
              <div key={b.id} style={{ padding: '11px 0', borderBottom: i < buildBacklog.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{b.task}</span>
                  <StatusBadge status={b.status} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {b.id} · {b.assigned} · priority: <span style={{ color: b.priority === 'high' ? 'var(--red)' : b.priority === 'medium' ? 'var(--yellow)' : 'var(--text-muted)' }}>{b.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
