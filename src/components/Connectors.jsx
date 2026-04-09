import React, { useState } from 'react';

const CONNECTORS = [
  { id: 'github', name: 'GitHub', emoji: '🐙', desc: 'Code repositories, deployments, and CI/CD pipelines', connected: true, detail: 'XPS-IINTELLIGENCE-SYSTEMS' },
  { id: 'supabase', name: 'Supabase', emoji: '⚡', desc: 'Database, auth, and real-time subscriptions', connected: true, detail: 'xps-prod.supabase.co' },
  { id: 'vercel', name: 'Vercel', emoji: '▲', desc: 'Frontend deployments and serverless functions', connected: true, detail: 'xps-admin-control-plane' },
  { id: 'google-drive', name: 'Google Drive', emoji: '📁', desc: 'File storage, documents, and shared resources', connected: false, detail: '' },
  { id: 'groq', name: 'Groq', emoji: '🧠', desc: 'Ultra-fast LLM inference for AI assistant', connected: false, detail: '' },
  { id: 'redis', name: 'Redis', emoji: '🔴', desc: 'Job queues, caching, and session state', connected: false, detail: '' },
  { id: 'openai', name: 'OpenAI', emoji: '🤖', desc: 'GPT-4o for reasoning, chat, and content generation', connected: false, detail: '' },
  { id: 'google-cloud', name: 'Google Cloud', emoji: '☁️', desc: 'GCS storage, BigQuery, and service account APIs', connected: false, detail: '' },
  { id: 'zapier', name: 'Zapier', emoji: '⚡', desc: 'Workflow automation and third-party integrations', connected: false, detail: '' },
];

export default function Connectors() {
  const [connectors, setConnectors] = useState(CONNECTORS);

  const toggle = (id) => {
    setConnectors(prev => prev.map(c => c.id === id ? { ...c, connected: !c.connected } : c));
  };

  return (
    <div>
      <div className="page-heading">Connectors</div>
      <div className="page-sub">Connect external services and data sources to XPS Intelligence</div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div className="kpi-card" style={{ flex: 1, maxWidth: 200 }}>
          <div className="kpi-value">{connectors.filter(c => c.connected).length}</div>
          <div className="kpi-label">Connected</div>
        </div>
        <div className="kpi-card" style={{ flex: 1, maxWidth: 200 }}>
          <div className="kpi-value">{connectors.filter(c => !c.connected).length}</div>
          <div className="kpi-label">Available</div>
        </div>
      </div>

      <div className="connectors-grid">
        {connectors.map((c) => (
          <div key={c.id} className="connector-card">
            <div className="conn-header">
              <div className="conn-logo" style={{ background: c.connected ? 'rgba(212,168,67,0.1)' : 'rgba(255,255,255,0.05)', fontSize: 22 }}>
                {c.emoji}
              </div>
              <span className={`conn-status ${c.connected ? 'conn-connected' : 'conn-disconnected'}`}>
                {c.connected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <div className="conn-name">{c.name}</div>
            <div className="conn-desc">{c.desc}</div>
            {c.connected && c.detail && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', marginBottom: 12, padding: '4px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 4 }}>
                {c.detail}
              </div>
            )}
            <button
              className={`conn-btn ${c.connected ? 'connected' : ''}`}
              onClick={() => toggle(c.id)}
            >
              {c.connected ? '✓ Disconnect' : '+ Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
