import React, { useState } from 'react';

const GOLD = '#d4a843';
const API_URL = import.meta.env.VITE_API_URL || '';

const INIT_JOBS = [
  { id: 'JOB-001', url: 'https://acehw.com', status: 'completed', started: '10 min ago', duration: '4s', items: 12, error: null },
  { id: 'JOB-002', url: 'https://tbbrewing.com', status: 'completed', started: '25 min ago', duration: '3s', items: 8, error: null },
  { id: 'JOB-003', url: 'https://sunshineauto.com', status: 'failed', started: '1 hr ago', duration: '—', items: 0, error: 'Target returned 403 Forbidden' },
  { id: 'JOB-004', url: 'https://palmmed.org', status: 'queued', started: '—', duration: '—', items: 0, error: null },
];

function StatusBadge({ status }) {
  const map = {
    completed: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'rgba(34,197,94,0.25)', label: '✓ Completed' },
    failed: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)', label: '✗ Failed' },
    queued: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)', label: '[...] Queued' },
    running: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)', label: '⚡ Running' },
  };
  const s = map[status] || map.queued;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

export default function Scraper() {
  const [jobs, setJobs] = useState(INIT_JOBS);
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const addJob = async () => {
    if (!url.trim()) return;
    const id = `JOB-${String(jobs.length + 1).padStart(3, '0')}`;
    const newJob = { id, url, status: 'running', started: 'just now', duration: '—', items: 0, error: null };
    setJobs(prev => [newJob, ...prev]);
    setUrl('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newJob.url, prompt }),
      });
      const data = await res.json();
      if (data.error) {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'failed', error: data.error, duration: '—' } : j));
      } else {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'completed', duration: '3s', items: data.summary?.split('\n').length || 5 } : j));
        setResult(data.summary);
        setSelected(id);
      }
    } catch (err) {
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'failed', error: err.message } : j));
    } finally {
      setLoading(false);
    }
  };

  const retry = (id) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'queued', error: null } : j));
  };

  return (
    <div>
      <div className="page-heading">Scraper Control</div>
      <div className="page-sub">Web intelligence extraction and monitoring</div>

      <div className="scraper-layout">
        {/* Left: Config + Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* New Job */}
          <div className="chart-card">
            <div className="chart-title" style={{ marginBottom: 14 }}>New Scrape Job</div>
            <div className="form-group">
              <label className="form-label">Target URL</label>
              <input className="xps-input" type="url" placeholder="https://example.com" value={url} onChange={e => setUrl(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Extraction Prompt</label>
              <input className="xps-input" placeholder="What data to extract..." value={prompt} onChange={e => setPrompt(e.target.value)} />
            </div>
            <button className="btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={addJob} disabled={loading}>
              {loading ? '[...] Running...' : 'Start Job'}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { value: jobs.filter(j => j.status === 'completed').length, label: 'Completed', color: '#4ade80' },
              { value: jobs.filter(j => j.status === 'failed').length, label: 'Failed', color: '#f87171' },
              { value: jobs.filter(j => j.status === 'running').length, label: 'Running', color: '#60a5fa' },
              { value: jobs.filter(j => j.status === 'queued').length, label: 'Queued', color: '#fbbf24' },
            ].map(s => (
              <div key={s.label} className="kpi-card" style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div className="kpi-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Job Queue + Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Queue */}
          <div className="chart-card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="chart-title" style={{ margin: 0 }}>Job Queue</span>
              <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => setJobs(INIT_JOBS)}>Reset</button>
            </div>
            <table className="xps-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 18 }}>JOB ID</th>
                  <th>URL</th>
                  <th>STATUS</th>
                  <th>ITEMS</th>
                  <th style={{ paddingRight: 18 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id} onClick={() => setSelected(j.id)} style={{ cursor: 'pointer', background: selected === j.id ? 'rgba(212,168,67,0.04)' : undefined }}>
                    <td style={{ paddingLeft: 18, fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{j.id}</td>
                    <td style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.url}</td>
                    <td><StatusBadge status={j.status} /></td>
                    <td style={{ fontSize: 13 }}>{j.items > 0 ? j.items : '—'}</td>
                    <td style={{ paddingRight: 18 }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {j.status === 'failed' && (
                          <button className="btn-outline" style={{ fontSize: 10, padding: '3px 8px' }} onClick={e => { e.stopPropagation(); retry(j.id); }}>Retry</button>
                        )}
                        {j.status === 'completed' && (
                          <button className="btn-outline" style={{ fontSize: 10, padding: '3px 8px' }}>View</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Result Viewer */}
          {result && selected && (
            <div className="chart-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span className="chart-title" style={{ margin: 0 }}>Extraction Result</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{selected}</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.8)', maxHeight: 240, overflow: 'auto' }}>
                {result}
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button className="btn-gold" style={{ fontSize: 12, padding: '7px 14px' }}>Save to Knowledge Base</button>
                <button className="btn-outline" style={{ fontSize: 12, padding: '7px 14px' }}>Export</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
