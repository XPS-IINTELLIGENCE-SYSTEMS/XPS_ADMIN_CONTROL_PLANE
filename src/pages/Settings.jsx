import React from 'react';
import Panel from '../components/ui/Panel.jsx';

export default function Settings() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Settings</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Platform configuration and environment</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Panel title="Environment Variables">
          <div style={{ fontFamily: 'monospace', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { key: 'SUPABASE_URL',     val: import.meta.env.SUPABASE_URL },
              { key: 'SUPABASE_ANON_KEY',val: import.meta.env.SUPABASE_ANON_KEY },
              { key: 'OPENAI_API_KEY',   val: import.meta.env.OPENAI_API_KEY },
              { key: 'GROQ_API_KEY',     val: import.meta.env.GROQ_API_KEY },
              { key: 'API_URL',          val: import.meta.env.API_URL },
            ].map(({ key, val }) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-card-alt)', borderRadius: 4 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{key}</span>
                <span style={{ color: val ? 'var(--green)' : 'var(--text-muted)' }}>{val ? '✓ set' : 'missing'}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Platform Info">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            {[
              { label: 'App Name',    val: 'XPS Admin Control Plane' },
              { label: 'Version',     val: '1.0.0' },
              { label: 'Stack',       val: 'Vite + React 18 + Vercel' },
              { label: 'AI Mode',     val: import.meta.env.OPENAI_API_KEY ? 'live' : 'synthetic' },
              { label: 'Build',       val: import.meta.env.MODE || 'development' },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{val}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
