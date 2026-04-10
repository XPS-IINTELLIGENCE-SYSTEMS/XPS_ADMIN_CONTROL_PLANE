import React, { useState, useRef, useEffect } from 'react';

const GOLD = '#d4a843';

const INIT_LOGS = [
  { id: 1, ts: '04:00:12.001', level: 'info', source: 'agent', msg: 'XPS Orchestration Agent started (session: xps-2026-04-09)' },
  { id: 2, ts: '04:00:12.210', level: 'success', source: 'agent', msg: 'Pipeline context loaded: 47 active leads, 8 proposals pending' },
  { id: 3, ts: '04:00:12.311', level: 'info', source: 'tool', msg: 'Tool registry online: scraper, chat, research, workflow' },
  { id: 4, ts: '04:00:14.089', level: 'info', source: 'workflow', msg: 'Workflow: Lead Onboarding — 5 steps registered' },
  { id: 5, ts: '04:00:18.442', level: 'warn', source: 'agent', msg: 'Gulf Coast Logistics: 8 days without contact — flagged' },
  { id: 6, ts: '04:00:18.500', level: 'warn', source: 'agent', msg: 'Metro Fitness Chain: proposal expired Apr 7 — action required' },
  { id: 7, ts: '04:00:19.001', level: 'info', source: 'scraper', msg: 'Job JOB-001 (acehw.com) completed in 4.2s — 12 items extracted' },
  { id: 8, ts: '04:00:19.800', level: 'error', source: 'scraper', msg: 'Job JOB-003 (sunshineauto.com) failed: 403 Forbidden' },
  { id: 9, ts: '04:00:20.100', level: 'success', source: 'agent', msg: 'Daily briefing generated for Marcus Rodriguez' },
  { id: 10, ts: '04:00:20.900', level: 'info', source: 'agent', msg: 'Agent ready. Waiting for operator input.' },
];

const JOB_RUNS = [
  { id: 'RUN-001', name: 'Daily Pipeline Sync', status: 'success', started: '04:00:12', duration: '8.9s', steps: 5 },
  { id: 'RUN-002', name: 'Lead Onboarding — Ace Hardware', status: 'success', started: '03:55:00', duration: '12.1s', steps: 5 },
  { id: 'RUN-003', name: 'Stale Lead Nurture Batch', status: 'partial', started: '03:40:00', duration: '45.2s', steps: 6 },
  { id: 'RUN-004', name: 'Scraper Job JOB-003', status: 'failed', started: '03:00:00', duration: '—', steps: 1 },
];

function LevelBadge({ level }) {
  const map = {
    info: { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)' },
    success: { color: '#4ade80', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.25)' },
    warn: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)' },
    error: { color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)' },
  };
  const s = map[level] || map.info;
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: s.bg, color: s.color, border: `1px solid ${s.border}`, letterSpacing: 0.5 }}>
      {level.toUpperCase()}
    </span>
  );
}

function RunStatus({ status }) {
  const map = {
    success: { color: '#4ade80', label: '✓ Success' },
    partial: { color: '#fbbf24', label: '⚠ Partial' },
    failed: { color: '#f87171', label: '✗ Failed' },
    running: { color: '#60a5fa', label: '⚡ Running' },
  };
  const s = map[status] || map.running;
  return <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>;
}

export default function JobLogs() {
  const [logs, setLogs] = useState(INIT_LOGS);
  const [filter, setFilter] = useState('all');
  const [selectedRun, setSelectedRun] = useState('RUN-001');
  const logsRef = useRef(null);

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  const filtered = filter === 'all' ? logs : logs.filter(l => l.level === filter);

  return (
    <div>
      <div className="page-heading">Job Logs</div>
      <div className="page-sub">Runtime traces, agent actions, and execution history</div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>
        {/* Run List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="chart-card" style={{ padding: 0 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 12, fontWeight: 600 }}>Run History</span>
            </div>
            {JOB_RUNS.map(run => (
              <div key={run.id}
                onClick={() => setSelectedRun(run.id)}
                style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: selectedRun === run.id ? 'rgba(212,168,67,0.05)' : 'transparent', borderLeft: selectedRun === run.id ? `2px solid ${GOLD}` : '2px solid transparent', transition: 'all 0.15s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{run.name}</span>
                  <RunStatus status={run.status} />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', gap: 10 }}>
                  <span>{run.id}</span>
                  <span>{run.started}</span>
                  <span>{run.duration}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="chart-card">
            <div style={{ fontSize: 10, letterSpacing: 1.2, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 12 }}>Session Stats</div>
            {[
              { label: 'Total Runs', value: JOB_RUNS.length },
              { label: 'Successful', value: JOB_RUNS.filter(r => r.status === 'success').length, color: '#4ade80' },
              { label: 'Partial', value: JOB_RUNS.filter(r => r.status === 'partial').length, color: '#fbbf24' },
              { label: 'Failed', value: JOB_RUNS.filter(r => r.status === 'failed').length, color: '#f87171' },
              { label: 'Total Logs', value: logs.length },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                <span style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</span>
                <span style={{ fontWeight: 700, color: s.color || 'rgba(255,255,255,0.9)' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Log Viewer */}
        <div className="chart-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 500 }}>
          {/* Toolbar */}
          <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>LOGS — {selectedRun}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              {['all', 'info', 'success', 'warn', 'error'].map(f => (
                <button key={f} className="btn-outline" style={{ fontSize: 10, padding: '3px 8px', borderColor: filter === f ? 'rgba(212,168,67,0.4)' : undefined, color: filter === f ? GOLD : undefined }} onClick={() => setFilter(f)}>
                  {f}
                </button>
              ))}
            </div>
            <button className="btn-outline" style={{ fontSize: 10, padding: '3px 8px' }} onClick={() => setLogs(INIT_LOGS)}>Reset</button>
          </div>

          {/* Log Lines */}
          <div ref={logsRef} style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
            {filtered.map(l => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.025)' }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginTop: 2 }}>{l.ts}</span>
                <LevelBadge level={l.level} />
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', flexShrink: 0, marginTop: 2, fontFamily: 'monospace' }}>[{l.source}]</span>
                <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{l.msg}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: '8px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, flexShrink: 0 }}>
            <button className="btn-outline" style={{ fontSize: 11, padding: '5px 12px' }}>Download Logs</button>
            <button className="btn-outline" style={{ fontSize: 11, padding: '5px 12px' }}>Export JSON</button>
          </div>
        </div>
      </div>
    </div>
  );
}
