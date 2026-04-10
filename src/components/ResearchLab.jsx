import React, { useState } from 'react';

const GOLD = '#d4a843';
const API_URL = import.meta.env.VITE_API_URL || '';

const recentResearch = [
  { company: 'Ace Hardware Distribution', date: '2 hr ago', insight: 'Fleet of 12 forklifts — floor maintenance likely outsourced', score: 92 },
  { company: 'Tampa Bay Brewing Co.', date: 'Yesterday', insight: 'New expansion into 3 additional brewing facilities', score: 87 },
  { company: 'Gulf Coast Logistics', date: '2 days ago', insight: 'Recently renewed warehouse lease for 5-year term', score: 81 },
];

export default function ResearchLab() {
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (!url.trim()) return;
    setResult('');
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, prompt: prompt || 'Extract company name, industry, size, services/products, and any signals that indicate they may need floor polishing or coating services.' }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-heading">Research Lab</div>
      <div className="page-sub">AI-powered company and market intelligence</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Research Form */}
        <div>
          <div className="chart-card" style={{ marginBottom: 16 }}>
            <div className="chart-title" style={{ marginBottom: 16 }}>Research a Company</div>
            <div className="form-group">
              <label className="form-label">Company Website URL</label>
              <input
                className="xps-input"
                type="url"
                placeholder="https://company.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Research Prompt (optional)</label>
              <input
                className="xps-input"
                placeholder="Custom research prompt..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
              />
            </div>
            <button className="btn-gold" onClick={run} disabled={loading}>
              {loading ? '[...] Researching...' : 'Research Company'}
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: 16, color: '#f87171', fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {result && (
            <div className="chart-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div className="chart-title" style={{ margin: 0 }}>Research Results</div>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{url}</span>
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>
                {result}
              </div>
              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                <button className="btn-gold" style={{ fontSize: 12, padding: '7px 14px' }}>Save to Knowledge Base</button>
                <button className="btn-outline" style={{ fontSize: 12, padding: '7px 14px' }}>Add to Lead</button>
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="chart-card" style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔭</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Enter a URL to research</div>
              <div style={{ fontSize: 12 }}>AI will extract company intelligence, signals, and potential value</div>
            </div>
          )}
        </div>

        {/* Recent Research */}
        <div>
          <div className="chart-card">
            <div className="chart-title" style={{ marginBottom: 14 }}>Recent Research</div>
            {recentResearch.map((r) => (
              <div key={r.company} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{r.company}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{r.date}</span>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 6, lineHeight: 1.4 }}>{r.insight}</div>
                <span style={{ fontSize: 11, color: GOLD }}>Score: {r.score}</span>
              </div>
            ))}
          </div>

          {/* Quick Research Tools */}
          <div className="chart-card" style={{ marginTop: 16 }}>
            <div className="chart-title" style={{ marginBottom: 12 }}>Quick Research</div>
            {[
              { label: '🏢 Company Profile', prompt: 'Give me a full company profile including size, industry, key people, and recent news.' },
              { label: '💰 Buying Signals', prompt: 'What buying signals suggest this company needs floor coating or polishing services?' },
              { label: '👥 Decision Makers', prompt: 'Who are the likely decision makers for facility maintenance purchasing?' },
              { label: '🏆 Competitor Presence', prompt: 'What competitors might already be serving this company?' },
            ].map((q) => (
              <button
                key={q.label}
                className="btn-outline"
                style={{ width: '100%', marginBottom: 8, justifyContent: 'flex-start', fontSize: 12 }}
                onClick={() => setPrompt(q.prompt)}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
