import React from 'react';
import Panel from '../../components/ui/Panel.jsx';
import StatusBadge from '../../components/ui/StatusBadge.jsx';
import { adminControlPlaneData } from '../../data/synthetic.js';

const GOLD = '#c49e3c';

export default function AdminControlPlane() {
  const { canonStatus, scheduleState, blockerQueue, runtimeLedger } = adminControlPlaneData;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: 'var(--text-muted)', marginBottom: 6 }}>XPS CANONICAL SYSTEM</div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Admin Control Plane</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Root canon, scheduler governance, connector truth, recovery, logs</p>
      </div>

      {/* Canon status + schedule */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, marginBottom: 16 }}>
        {/* Canon status */}
        <Panel title="Canon Status">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>State</span>
              <StatusBadge status={canonStatus.state} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Version</span>
              <span style={{ color: GOLD, fontWeight: 600 }}>{canonStatus.version}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Last Verified</span>
              <span style={{ color: 'var(--text-primary)' }}>{canonStatus.lastVerified}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Locked</span>
              <span style={{ color: canonStatus.locked ? 'var(--green)' : 'var(--red)' }}>{canonStatus.locked ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </Panel>

        {/* Schedule state */}
        <Panel title="Schedule State">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {scheduleState.map((job, i) => (
              <div key={job.job} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16, padding: '10px 0', borderBottom: i < scheduleState.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 13, alignItems: 'center' }}>
                <span style={{ fontWeight: 500 }}>{job.job}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>every {job.cadence}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>next {job.next}</span>
                <StatusBadge status={job.status} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Blocker queue + Runtime ledger */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Panel title="Blocker Queue" subtitle={`${blockerQueue.length} active blockers`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {blockerQueue.map((b, i) => (
              <div key={b.id} style={{ padding: '12px 0', borderBottom: i < blockerQueue.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 12, color: GOLD }}>{b.id}</span>
                  <StatusBadge status={b.severity} />
                </div>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{b.surface}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{b.reason}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Age: {b.age}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Runtime Ledger" subtitle="Recent system events">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {runtimeLedger.map((entry, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr auto auto', gap: 8, padding: '8px 0', borderBottom: i < runtimeLedger.length - 1 ? '1px solid var(--border)' : 'none', fontSize: 11, alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{entry.ts}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{entry.event}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{entry.surface}</span>
                <StatusBadge status={entry.status} />
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
