import React, { useState, useRef, useEffect } from 'react';

const GOLD = '#d4a843';
const API_URL = import.meta.env.VITE_API_URL || '';

const TABS = ['Prompt', 'Workflow', 'Browser', 'Scraper', 'Data', 'Chart', 'UI Builder', 'Logs', 'Output'];

const WORKFLOW_STEPS = [
  { id: 1, type: 'trigger', label: 'New Lead Added', status: 'ready' },
  { id: 2, type: 'action', label: 'Research Company (AI)', status: 'ready' },
  { id: 3, type: 'condition', label: 'Score ≥ 70?', status: 'ready' },
  { id: 4, type: 'action', label: 'Assign to Rep', status: 'ready' },
  { id: 5, type: 'action', label: 'Send Welcome Email', status: 'ready' },
];

const LOG_ENTRIES = [
  { ts: '04:00:12', level: 'info', msg: 'Orchestration agent started (session: xps-2026-04-09)' },
  { ts: '04:00:13', level: 'success', msg: 'Loaded pipeline context: 47 active leads, 8 proposals' },
  { ts: '04:00:14', level: 'info', msg: 'Tool registry: scraper, chat, research, workflow — all online' },
  { ts: '04:00:18', level: 'info', msg: 'Checking follow-up queue...' },
  { ts: '04:00:19', level: 'warn', msg: 'Gulf Coast Logistics: 8 days no contact — flagged for follow-up' },
  { ts: '04:00:19', level: 'warn', msg: 'Metro Fitness Chain: proposal expired Apr 7 — requires renewal action' },
  { ts: '04:00:20', level: 'success', msg: 'Briefing generated for Marcus Rodriguez' },
  { ts: '04:00:21', level: 'info', msg: 'Agent ready. Awaiting operator input.' },
];

export default function Editor() {
  const [tab, setTab] = useState('Prompt');
  const [prompt, setPrompt] = useState(`You are an XPS Intelligence orchestration agent.

Your task: Review the current pipeline and identify the 3 highest-value opportunities for immediate action. For each opportunity:
1. State the company name and current stage
2. Identify the specific action to take
3. Provide the outreach message or next step

Context:
- Territory: Southeast FL
- Active Leads: 47
- Pending Proposals: 8
- Follow-ups Due: 5`);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState(LOG_ENTRIES);
  const logsRef = useRef(null);

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  const runPrompt = async () => {
    setRunning(true);
    setOutput('');
    setTab('Output');
    const ts = () => new Date().toISOString().slice(11, 19);
    setLogs(prev => [...prev, { ts: ts(), level: 'info', msg: `Executing prompt (${prompt.length} chars)` }]);
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      const reply = data.reply || data.error || 'No response';
      setOutput(reply);
      setLogs(prev => [...prev, { ts: ts(), level: 'success', msg: 'Execution complete — output ready' }]);
    } catch (err) {
      setOutput(`Error: ${err.message}`);
      setLogs(prev => [...prev, { ts: ts(), level: 'error', msg: `Execution failed: ${err.message}` }]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="editor-layout">
      {/* Tabs */}
      <div className="editor-tabs">
        {TABS.map(t => (
          <button key={t} className={`editor-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', paddingRight: 0 }}>
          <button className="btn-outline" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => setLogs(LOG_ENTRIES)}>
            Reset
          </button>
          <button className="btn-gold" style={{ fontSize: 12, padding: '5px 14px' }} onClick={runPrompt} disabled={running}>
            {running ? 'Running...' : 'Run'}
          </button>
        </div>
      </div>

      <div className="editor-body">
        {/* Center Panel */}
        <div className="editor-center">
          {tab === 'Prompt' && (
            <>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>PROMPT EDITOR</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{prompt.length} chars</span>
              </div>
              <textarea
                className="editor-textarea"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                spellCheck={false}
              />
              <div className="editor-toolbar">
                <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }}>Templates</button>
                <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }}>Variables</button>
                <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }}>Context</button>
                <span style={{ flex: 1 }} />
                <button className="btn-gold" style={{ fontSize: 11, padding: '5px 14px' }} onClick={runPrompt} disabled={running}>
                  {running ? '[...]' : 'Execute'}
                </button>
              </div>
            </>
          )}

          {tab === 'Workflow' && (
            <div style={{ padding: 20, overflow: 'auto', flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, color: 'rgba(255,255,255,0.7)' }}>Lead Onboarding Workflow</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
                {WORKFLOW_STEPS.map((step, i) => (
                  <React.Fragment key={step.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                        background: step.type === 'trigger' ? 'rgba(212,168,67,0.15)' : step.type === 'condition' ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)',
                        border: `1px solid ${step.type === 'trigger' ? 'rgba(212,168,67,0.3)' : step.type === 'condition' ? 'rgba(168,85,247,0.3)' : 'rgba(59,130,246,0.3)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                      }}>
                        {step.type === 'trigger' ? 'T' : step.type === 'condition' ? '?' : 'A'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>{step.type}</div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{step.label}</div>
                      </div>
                      <span style={{ fontSize: 11, color: '#4ade80', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 20, border: '1px solid rgba(34,197,94,0.2)' }}>
                        {step.status}
                      </span>
                    </div>
                    {i < WORKFLOW_STEPS.length - 1 && (
                      <div style={{ width: 2, height: 20, background: 'rgba(255,255,255,0.07)', marginLeft: 17 }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <button className="btn-gold" style={{ marginTop: 24, fontSize: 12 }}>+ Add Step</button>
            </div>
          )}

          {tab === 'Browser' && (
            <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Browser / Web Agent</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="xps-input" placeholder="https://..." style={{ flex: 1 }} />
                <button className="btn-gold" style={{ fontSize: 12 }}>Navigate</button>
              </div>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ fontSize: 32 }}>[W]</div>
                <div style={{ fontSize: 13 }}>Enter a URL to browse via the orchestration agent</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['Search Google', 'Browse LinkedIn', 'Check Competitor Site', 'Read News'].map(a => (
                    <button key={a} className="btn-outline" style={{ fontSize: 11, padding: '5px 12px' }}>{a}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'Data' && (
            <div style={{ padding: 20, flex: 1, overflow: 'auto' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'rgba(255,255,255,0.7)' }}>Pipeline Data Snapshot</div>
              <table className="xps-table">
                <thead>
                  <tr><th>FIELD</th><th>VALUE</th><th>UPDATED</th></tr>
                </thead>
                <tbody>
                  {[
                    ['Active Leads', '2,847', '2 min ago'],
                    ['Pipeline Value', '$4.2M', '5 min ago'],
                    ['Proposals Sent', '342', '1 hr ago'],
                    ['Close Rate', '34.2%', '1 day ago'],
                    ['Avg Deal Size', '$18,200', '1 day ago'],
                    ['Avg Deal Cycle', '47 days', '1 day ago'],
                  ].map(([f, v, u]) => (
                    <tr key={f}><td style={{ color: 'rgba(255,255,255,0.5)' }}>{f}</td><td style={{ fontWeight: 600 }}>{v}</td><td style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{u}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'Chart' && (
            <div style={{ padding: 20, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: 32 }}>📊</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Chart Builder</div>
              <div style={{ fontSize: 12 }}>Compose custom charts from your pipeline data</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['Line', 'Bar', 'Pie', 'Donut', 'KPI Card'].map(t => (
                  <button key={t} className="btn-outline" style={{ fontSize: 11, padding: '6px 14px' }}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {tab === 'UI Builder' && (
            <div style={{ padding: 20, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: 32 }}>🎨</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>UI Generator</div>
              <div style={{ fontSize: 12 }}>Describe a UI component to generate it with AI</div>
              <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 480 }}>
                <input className="xps-input" placeholder="Describe the UI you want to generate..." />
                <button className="btn-gold" style={{ fontSize: 12, flexShrink: 0 }}>Generate</button>
              </div>
            </div>
          )}

          {tab === 'Logs' && (
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>RUNTIME LOGS</span>
                <button className="btn-outline" style={{ marginLeft: 'auto', fontSize: 10, padding: '3px 8px' }} onClick={() => setLogs(LOG_ENTRIES)}>Clear</button>
              </div>
              <div ref={logsRef} style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
                {logs.map((l, i) => (
                  <div key={i} className="log-line">
                    <span className="log-ts">{l.ts}</span>
                    <span className={`log-level-${l.level}`}>[{l.level.toUpperCase()}]</span>
                    <span className="log-msg">{l.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'Output' && (
            <>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>AGENT OUTPUT</span>
              </div>
              <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
                {running && <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>[...] Agent is processing…</div>}
                {output && (
                  <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.9)' }}>
                    {output}
                  </div>
                )}
                {!running && !output && (
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>No output yet. Run a prompt to see results here.</div>
                )}
              </div>
              {output && (
                <div className="editor-toolbar">
                  <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }}>Copy</button>
                  <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }}>Save as Artifact</button>
                  <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }}>Send to Lead</button>
                </div>
              )}
            </>
          )}

          {tab === 'Scraper' && <EmbeddedScraper API_URL={API_URL} onLog={(msg, level) => setLogs(prev => [...prev, { ts: new Date().toISOString().slice(11, 19), level, msg }])} />}
        </div>

        {/* Right Panel */}
        <div className="editor-right">
          {/* Agent Status */}
          <div className="chart-card">
            <div style={{ fontSize: 10, letterSpacing: 1.2, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 12 }}>Agent Status</div>
            <div style={{ display: 'flex', align: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', marginTop: 5 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>XPS Orchestration Agent</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Session: xps-2026-04-09</div>
              </div>
            </div>
            {[
              { label: 'Model', value: 'gpt-4o-mini' },
              { label: 'Context', value: 'Pipeline + Leads' },
              { label: 'Tools', value: '4 active' },
              { label: 'Memory', value: 'Session only' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 }}>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>{r.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>{r.value}</span>
              </div>
            ))}
          </div>

          {/* Quick Prompts */}
          <div className="chart-card">
            <div style={{ fontSize: 10, letterSpacing: 1.2, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 12 }}>Quick Prompts</div>
            {[
              'Analyze pipeline bottlenecks',
              'Draft follow-up for top 3 leads',
              'Generate weekly sales summary',
              'Identify at-risk deals',
              'Suggest next best actions',
            ].map(p => (
              <button key={p} className="btn-outline" style={{ width: '100%', marginBottom: 6, fontSize: 11, justifyContent: 'flex-start', padding: '7px 10px', textAlign: 'left' }} onClick={() => { setPrompt(p); setTab('Prompt'); }}>
                {p}
              </button>
            ))}
          </div>

          {/* Artifacts */}
          <div className="chart-card">
            <div style={{ fontSize: 10, letterSpacing: 1.2, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 12 }}>Recent Artifacts</div>
            {[
              { name: 'Gulf Coast Follow-up', type: 'Email', ts: '2 hr ago' },
              { name: 'Pipeline Analysis Q2', type: 'Report', ts: 'Yesterday' },
              { name: 'Ace Hardware Proposal v3', type: 'Proposal', ts: '2 days ago' },
            ].map(a => (
              <div key={a.name} style={{ padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{a.name}</div>
                <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.35)' }}>
                  <span>{a.type}</span><span>{a.ts}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmbeddedScraper({ API_URL, onLog }) {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult('');
    onLog(`Scraping ${url}`, 'info');
    try {
      const res = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setResult(data.summary || data.error);
      onLog(`Scrape complete: ${url}`, 'success');
    } catch (err) {
      setResult(`Error: ${err.message}`);
      onLog(`Scrape failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Web Scraper</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="xps-input" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} style={{ flex: 1 }} />
        <button className="btn-gold" style={{ fontSize: 12 }} onClick={run} disabled={loading}>{loading ? '...' : 'Scrape'}</button>
      </div>
      {result && (
        <div style={{ flex: 1, overflow: 'auto', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 14, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.8)' }}>
          {result}
        </div>
      )}
    </div>
  );
}
