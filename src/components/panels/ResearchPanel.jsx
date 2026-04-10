import React, { useState } from 'react';
import { Search, XCircle } from 'lucide-react';

const gold = '#d4a843';
const API_URL = import.meta.env.API_URL || '';

export default function ResearchPanel() {
  const [query, setQuery]     = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data);
    } catch (err) {
      // Log actual error before showing synthetic fallback
      console.warn('[ResearchPanel] Search failed, using synthetic fallback:', err.message);
      // Synthetic fallback
      setResult({
        query: query.trim(),
        summary: `[Synthetic] Research query received: "${query.trim()}"\n\nNo live search backend configured. Add OPENAI_API_KEY and configure /api/search to enable live web research.`,
        sources: [],
        mode: 'synthetic',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 28px' }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Research Lab</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          AI-powered web research and competitive intelligence
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Research query… e.g. 'XPS epoxy competitors in Florida'"
          style={{
            flex: 1, padding: '10px 14px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: '#fff', fontSize: 13,
          }}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            padding: '10px 20px',
            background: (!loading && query.trim()) ? gold : 'rgba(255,255,255,0.06)',
            border: 'none', borderRadius: 8,
            color: (!loading && query.trim()) ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
            fontSize: 13, fontWeight: 700,
            cursor: (!loading && query.trim()) ? 'pointer' : 'not-allowed',
          }}
        >
          {loading ? 'Searching…' : 'Research'}
        </button>
      </form>

      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, color: '#f87171', fontSize: 13 }}>
          <XCircle size={12} className="xps-icon" style={{ marginRight: 6 }} />
          {error}
        </div>
      )}

      {result && (
        <div style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: result.mode === 'synthetic' ? '#fbbf24' : '#4ade80' }} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: result.mode === 'synthetic' ? '#fbbf24' : '#4ade80' }}>
              {result.mode === 'synthetic' ? 'SYNTHETIC' : 'LIVE'} — {result.query}
            </span>
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {result.summary}
          </div>
          {result.sources && result.sources.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>SOURCES</div>
              {result.sources.map((src, i) => (
                <div key={i} style={{ fontSize: 12, color: '#60a5fa', marginBottom: 4 }}>
                  <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>
                    {src.title || src.url}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <EmptyState />
      )}
    </div>
  );
}

function EmptyState() {
  const suggestions = [
    'XPS epoxy flooring market size 2025',
    'Top floor coating competitors in Southeast US',
    'Commercial warehouse floor coating trends',
    'Epoxy flooring lead generation strategies',
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: 'rgba(255,255,255,0.25)', marginBottom: 4 }}>SUGGESTED QUERIES</div>
      {suggestions.map(s => (
        <div key={s} style={{
          padding: '10px 14px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8, fontSize: 13,
          color: 'rgba(255,255,255,0.4)', cursor: 'default',
        }}>
          <Search size={12} className="xps-icon" style={{ marginRight: 6 }} />
          {s}
        </div>
      ))}
    </div>
  );
}
