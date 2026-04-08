import React from 'react';
import Panel from '../components/ui/Panel.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { xpsSystemStatus } from '../data/synthetic.js';
import { pageChangeLog } from '../data/synthetic.js';
import { Activity } from 'lucide-react';

const GOLD = '#c49e3c';

const systems = [
  { key: 'adminControlPlane', label: 'Admin Control Plane', route: '/xps/admin' },
  { key: 'visionCortex',      label: 'Vision Cortex',       route: '/xps/vision' },
  { key: 'autoBuilder',       label: 'Auto Builder',        route: '/xps/builder' },
  { key: 'intelCore',         label: 'Intel Core',          route: '/xps/intel' },
  { key: 'sandbox',           label: 'Sandbox',             route: '/xps/sandbox' },
  { key: 'quarantine',        label: 'Quarantine',          route: '/xps/quarantine' },
];

export default function Admin() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Admin</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Platform administration and XPS system health overview</p>
      </div>

      {/* System health grid */}
      <Panel title="XPS System Health" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {systems.map(s => {
            const st = xpsSystemStatus[s.key];
            return (
              <div key={s.key} style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{s.label}</span>
                  <StatusBadge status={st.status} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  v{st.version} · synced {st.lastSync}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Orchestrator change log */}
      <Panel title="Orchestrator Change Log" subtitle="Recent prompt-driven actions">
        {pageChangeLog.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
            No changes logged yet. Use the AI Orchestrator to trigger actions.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {pageChangeLog.slice(0, 10).map((entry, i) => (
              <div key={entry.id} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < Math.min(pageChangeLog.length, 10) - 1 ? '1px solid var(--border)' : 'none', fontSize: 12 }}>
                <Activity size={13} style={{ flexShrink: 0, marginTop: 1, color: GOLD }} />
                <div>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{entry.action}</span>
                  {' '}<span style={{ color: 'var(--text-muted)' }}>→ {entry.surface}</span>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{entry.detail}</div>
                </div>
                <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>
                  {new Date(entry.ts).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
