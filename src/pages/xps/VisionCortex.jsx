import React from 'react';
import Panel from '../../components/ui/Panel.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { visionCortexData } from '../../data/synthetic.js';

const GOLD = '#c49e3c';

export default function VisionCortex() {
  const { strategyBriefs, simulations, predictions } = visionCortexData;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 6 }}>XPS CANONICAL SYSTEM</div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Vision Cortex</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Strategy, sensing, simulation, prediction</p>
      </div>

      {/* Predictions row */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
        {predictions.map(p => (
          <div key={p.metric} style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{p.metric}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>{p.current}</span>
              <span style={{ fontSize: 11, color: GOLD }}>→ {p.predicted}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.horizon} · {p.confidence} confidence</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Panel title="Strategy Briefs">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {strategyBriefs.map((b, i) => (
              <div key={b.id} style={{ padding: '12px 0', borderBottom: i < strategyBriefs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{b.title}</span>
                  <StatusBadge status={b.status} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.id} · {b.updated} · priority: <span style={{ color: b.priority === 'high' ? 'var(--red)' : b.priority === 'medium' ? 'var(--yellow)' : 'var(--text-muted)' }}>{b.priority}</span></div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Simulations">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {simulations.map((s, i) => (
              <div key={s.id} style={{ padding: '12px 0', borderBottom: i < simulations.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 6 }}>{s.name}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Result: </span>
                    <span style={{ color: GOLD, fontWeight: 700 }}>{s.result}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Confidence: </span>
                    <span style={{ fontWeight: 600 }}>{s.confidence}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Runs: </span>
                    <span>{s.runs}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
