import React from 'react';
import Panel from '../../components/ui/Panel.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { sandboxItems } from '../../data/synthetic.js';
import { FlaskRound, AlertTriangle } from 'lucide-react';

const GOLD = '#c49e3c';

export default function Sandbox() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 6 }}>XPS CANONICAL SYSTEM</div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Sandbox</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <AlertTriangle size={14} color="#eab308" />
          <p style={{ color: '#eab308', fontSize: 13, margin: 0 }}>Explicitly experimental work only — never production.</p>
        </div>
      </div>

      <Panel title="Active Experiments">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {sandboxItems.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: i < sandboxItems.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(234,179,8,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FlaskRound size={14} color="#eab308" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.id} · started {s.started}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <StatusBadge status={s.risk} label={`risk: ${s.risk}`} />
                <StatusBadge status={s.status} />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div style={{ marginTop: 16, background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 'var(--radius)', padding: '14px 18px', fontSize: 12, color: '#eab308' }}>
        All outputs from Sandbox are tagged <strong>experimental</strong> and must pass Intel Core validation before promotion to any production surface.
      </div>
    </div>
  );
}
