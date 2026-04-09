import React from 'react';

const gold = '#d4a843';

const CONFIG_SECTIONS = [
  {
    title: 'API Keys',
    icon: '🔑',
    items: [
      { label: 'OpenAI API Key', key: 'OPENAI_API_KEY', placeholder: 'sk-…', type: 'password', hint: 'Required for live chat, search, and scrape' },
      { label: 'Groq API Key',   key: 'GROQ_API_KEY',   placeholder: 'gsk_…', type: 'password', hint: 'Alternative LLM provider (free tier available)' },
    ],
  },
  {
    title: 'Supabase',
    icon: '🗄️',
    items: [
      { label: 'Supabase URL',      key: 'SUPABASE_URL',          placeholder: 'https://your-project.supabase.co', hint: 'Project Settings → API' },
      { label: 'Supabase Anon Key', key: 'SUPABASE_ANON_KEY',     placeholder: 'eyJ…', type: 'password', hint: 'Project Settings → API (public key)' },
    ],
  },
  {
    title: 'Runtime',
    icon: '⚙️',
    items: [
      { label: 'API Base URL', key: 'API_URL', placeholder: 'https://your-app.vercel.app', hint: 'Leave blank to use relative /api routes' },
    ],
  },
];

export default function AdminPanel() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 28px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Admin</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          System configuration and environment management
        </p>
      </div>

      {/* Auth bypass notice */}
      <div style={{
        marginBottom: 22, padding: '12px 16px',
        background: 'rgba(96,165,250,0.07)',
        border: '1px solid rgba(96,165,250,0.2)',
        borderRadius: 10,
        display: 'flex', alignItems: 'flex-start', gap: 10,
      }}>
        <span style={{ fontSize: 16 }}>🔓</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#60a5fa', marginBottom: 3 }}>Auth Bypassed — Dev Mode</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
            Authentication is disabled for development. The application boots directly into the operator shell.
            Auth is scaffolded in <code style={{ fontSize: 11 }}>src/lib/supabaseClient.js</code> — enable via <code style={{ fontSize: 11 }}>DEV_AUTH=false</code> when ready.
          </div>
        </div>
      </div>

      {/* Config sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {CONFIG_SECTIONS.map(section => (
          <div key={section.title} style={{
            background: '#161616',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span>{section.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{section.title}</span>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {section.items.map(item => (
                <div key={item.key}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{item.label}</label>
                    <code style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4 }}>
                      {item.key}
                    </code>
                  </div>
                  <input
                    type={item.type || 'text'}
                    placeholder={item.placeholder}
                    disabled
                    style={{
                      width: '100%', padding: '9px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 7, color: 'rgba(255,255,255,0.25)',
                      fontSize: 13, cursor: 'not-allowed',
                    }}
                  />
                  {item.hint && (
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{item.hint}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 18, padding: '12px 16px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6,
      }}>
        ⚙️ Set environment variables via <code>.env.local</code> (local dev) or Vercel project settings (production). See <code>.env.sample</code> for the full reference.
      </div>
    </div>
  );
}
