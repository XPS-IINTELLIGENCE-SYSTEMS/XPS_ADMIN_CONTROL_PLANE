import React, { useEffect, useState } from 'react';
import Panel from '../components/ui/Panel.jsx';
import { getConnectionPrefs, subscribeConnectionPrefs, updateConnectionPrefs, resetConnectionPrefs, maskSecret } from '../lib/connectionPrefs.js';

const readinessItems = [
  { label: 'Supabase', env: () => import.meta.env.SUPABASE_URL || import.meta.env.SUPABASE_ANON_KEY },
  { label: 'Groq', env: () => import.meta.env.GROQ_API_KEY },
  { label: 'OpenAI', env: () => import.meta.env.OPENAI_API_KEY },
  { label: 'GitHub', env: () => import.meta.env.GITHUB_TOKEN || import.meta.env.GITHUB_API_TOKEN },
  { label: 'Vercel', env: () => import.meta.env.VERCEL_TOKEN || import.meta.env.VERCEL_ACCESS_TOKEN },
  { label: 'Google', env: () => import.meta.env.GCP_PROJECT_ID || import.meta.env.GCP_SA_KEY },
];

export default function Settings() {
  const [connectionPrefs, setConnectionPrefsState] = useState(getConnectionPrefs());

  useEffect(() => {
    setConnectionPrefsState(getConnectionPrefs());
    return subscribeConnectionPrefs(setConnectionPrefsState);
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6, maxWidth: 760 }}>
          Workspace defaults and credential readiness, kept small and centralized.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 18 }}>
          <Panel title="Workspace defaults" subtitle="Preference controls that shape the live experience">
            <div style={{ display: 'grid', gap: 14 }}>
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
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Repo target</span>
                <input value={connectionPrefs.repoTarget} onChange={(event) => updateConnectionPrefs({ repoTarget: event.target.value })} placeholder="owner/repo" style={inputStyle()} />
              </label>
              <label style={{ display: 'grid', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Webhook URL</span>
                <input value={connectionPrefs.genericWebhookUrl} onChange={(event) => updateConnectionPrefs({ genericWebhookUrl: event.target.value })} placeholder="https://example.com/webhook" style={inputStyle()} />
              </label>
            </div>
          </Panel>

          <Panel title="Credential readiness" subtitle="Environment and saved key coverage at a glance">
            <div style={{ display: 'grid', gap: 10 }}>
              {readinessItems.map((item) => {
                const ready = !!item.env();
                return (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 10 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    <span style={{ color: ready ? '#22c55e' : 'var(--text-muted)', fontWeight: 700 }}>{ready ? 'Configured' : 'Missing'}</span>
                  </div>
                );
              })}
              <div style={{ display: 'grid', gap: 10, marginTop: 6 }}>
                <MetaRow label="Saved GitHub token" value={maskSecret(connectionPrefs.githubToken)} />
                <MetaRow label="Saved Groq key" value={maskSecret(connectionPrefs.groqApiKey)} />
                <MetaRow label="Saved OpenAI key" value={maskSecret(connectionPrefs.openaiApiKey)} />
                <MetaRow label="Saved Supabase URL" value={connectionPrefs.supabaseUrl || 'not set'} />
              </div>
            </div>
          </Panel>
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <Panel title="Platform profile" subtitle="Current app identity and deployment posture">
            <div style={{ display: 'grid', gap: 12, fontSize: 13 }}>
              <MetaRow label="App" value="XPS Intelligence" />
              <MetaRow label="Version" value="1.0.0" />
              <MetaRow label="Runtime target" value={connectionPrefs.runtimeTarget || 'local'} />
              <MetaRow label="Deployment target" value={connectionPrefs.deploymentTarget || 'preview'} />
              <MetaRow label="Mode" value={import.meta.env.MODE || 'development'} />
            </div>
          </Panel>

          <Panel title="Reset clutter" subtitle="Keep the workspace clean when experimenting with overrides">
            <div style={{ display: 'grid', gap: 10 }}>
              <button onClick={() => resetConnectionPrefs(null, { scope: 'session' })} style={buttonStyle(false)}>
                Clear session overrides
              </button>
              <button onClick={() => resetConnectionPrefs()} style={buttonStyle(true)}>
                Reset all saved connector preferences
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 10 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
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

function buttonStyle(primary) {
  return {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: primary ? 'none' : '1px solid var(--border)',
    background: primary ? '#d4a843' : 'transparent',
    color: primary ? '#090a0d' : 'var(--text-primary)',
    fontWeight: 700,
  };
}
