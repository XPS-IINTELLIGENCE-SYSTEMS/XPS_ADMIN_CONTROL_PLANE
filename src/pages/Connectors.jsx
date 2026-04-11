import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Panel from '../components/ui/Panel.jsx';
import { getConnectionPrefs, subscribeConnectionPrefs, updateConnectionPrefs } from '../lib/connectionPrefs.js';

const API_URL = import.meta.env.API_URL || '';

function statusTone(mode) {
  if (mode === 'live') return { color: '#22c55e', label: 'Live' };
  if (mode === 'local') return { color: '#60a5fa', label: 'Local' };
  if (mode === 'ingest-only') return { color: '#f59e0b', label: 'Ingest only' };
  return { color: '#ef4444', label: 'Blocked' };
}

function ConnectorPill({ mode }) {
  const tone = statusTone(mode);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '5px 10px', background: `${tone.color}14`, border: `1px solid ${tone.color}26`, color: tone.color, fontSize: 12, fontWeight: 700 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: tone.color }} />
      {tone.label}
    </span>
  );
}

function ConnectorCard({ title, mode, note }) {
  return (
    <div style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ fontWeight: 700 }}>{title}</div>
        <ConnectorPill mode={mode} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{note}</div>
    </div>
  );
}

export default function Connectors() {
  const [liveStatus, setLiveStatus] = useState(null);
  const [connectionPrefs, setConnectionPrefsState] = useState(getConnectionPrefs());

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/status`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setLiveStatus(await response.json());
    } catch {
      setLiveStatus(null);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    setConnectionPrefsState(getConnectionPrefs());
    return subscribeConnectionPrefs(setConnectionPrefsState);
  }, []);

  const providerCards = useMemo(() => {
    if (!liveStatus?.llm?.providers) return [];
    const providers = liveStatus.llm.providers;
    return [
      { title: 'Groq', mode: providers.groq?.configured ? 'live' : 'blocked', note: providers.groq?.configured ? `Fast live lane · ${providers.groq.model}` : providers.groq?.reason },
      { title: 'OpenAI', mode: providers.openai?.configured ? 'live' : 'blocked', note: providers.openai?.configured ? `Fallback drafting lane · ${providers.openai.model}` : providers.openai?.reason },
      { title: 'Gemini', mode: providers.gemini?.configured ? 'live' : 'blocked', note: providers.gemini?.configured ? `Workspace-aware lane · ${providers.gemini.model}` : providers.gemini?.reason },
      { title: 'Ollama', mode: providers.ollama?.configured ? 'local' : 'blocked', note: providers.ollama?.configured ? `Local runtime · ${providers.ollama.model}` : providers.ollama?.reason },
    ];
  }, [liveStatus]);

  const businessCards = useMemo(() => {
    if (!liveStatus) return [];
    return [
      { title: 'GitHub', mode: liveStatus.github?.mode, note: liveStatus.github?.configured ? `Repo target ${liveStatus.github.repo || 'available'}` : liveStatus.github?.reason },
      { title: 'Supabase', mode: liveStatus.supabase?.mode, note: liveStatus.supabase?.configured ? `Project ${liveStatus.supabase.projectUrl}` : liveStatus.supabase?.reason },
      { title: 'Vercel', mode: liveStatus.vercel?.mode, note: liveStatus.vercel?.configured ? 'Deployment controls available.' : liveStatus.vercel?.reason },
      { title: 'Google Workspace', mode: liveStatus.google?.mode, note: liveStatus.google?.configured ? 'Workspace lookup and sheets support available.' : liveStatus.google?.reason },
      { title: 'HubSpot', mode: liveStatus.hubspot?.mode, note: liveStatus.hubspot?.configured ? 'CRM read/write available.' : liveStatus.hubspot?.reason },
      { title: 'Airtable', mode: liveStatus.airtable?.mode, note: liveStatus.airtable?.configured ? 'Table sync available.' : liveStatus.airtable?.reason },
      { title: 'Browser worker', mode: liveStatus.browser?.mode, note: liveStatus.browser?.configured ? 'Research capture enabled.' : liveStatus.browser?.reason },
      { title: 'Twilio', mode: liveStatus.twilio?.mode, note: liveStatus.twilio?.reason || 'Voice lane available.' },
      { title: 'SendGrid', mode: liveStatus.sendgrid?.mode, note: liveStatus.sendgrid?.reason || 'Email lane available.' },
    ];
  }, [liveStatus]);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Connectors</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6, maxWidth: 760 }}>
          Centralized system status, provider routing, and deployment intent without extra control-plane clutter.
        </p>
      </div>

      <Panel title="Routing defaults" subtitle="Keep provider and deployment intent in one place" style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Preferred provider</span>
            <select value={connectionPrefs.providerPreference} onChange={(event) => updateConnectionPrefs({ providerPreference: event.target.value })} style={inputStyle()}>
              <option value="auto">Auto</option>
              <option value="groq">Groq</option>
              <option value="openai">OpenAI</option>
              <option value="gemini">Gemini</option>
              <option value="ollama">Ollama</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Runtime target</span>
            <select value={connectionPrefs.runtimeTarget} onChange={(event) => updateConnectionPrefs({ runtimeTarget: event.target.value })} style={inputStyle()}>
              <option value="local">Local</option>
              <option value="cloud">Cloud</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Deployment target</span>
            <select value={connectionPrefs.deploymentTarget} onChange={(event) => updateConnectionPrefs({ deploymentTarget: event.target.value })} style={inputStyle()}>
              <option value="preview">Preview</option>
              <option value="production">Production</option>
            </select>
          </label>
        </div>
        <label style={{ display: 'grid', gap: 8, marginTop: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Repo target</span>
          <input value={connectionPrefs.repoTarget} onChange={(event) => updateConnectionPrefs({ repoTarget: event.target.value })} placeholder="owner/repo" style={inputStyle()} />
        </label>
      </Panel>

      <Panel title="AI providers" subtitle="Preserve the live Groq path and keep fallback truth visible" style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
          {providerCards.map((card) => <ConnectorCard key={card.title} {...card} />)}
        </div>
      </Panel>

      <Panel title="Business systems" subtitle="Only the connectors that matter to the intended product">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
          {businessCards.map((card) => <ConnectorCard key={card.title} {...card} />)}
        </div>
      </Panel>
    </div>
  );
}

function inputStyle() {
  return {
    width: '100%',
    background: 'var(--bg-card-alt)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '11px 12px',
    color: 'var(--text-primary)',
    outline: 'none',
  };
}
