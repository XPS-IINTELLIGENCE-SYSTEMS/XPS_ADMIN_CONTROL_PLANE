import React, { useState, useEffect } from 'react';

const gold = '#d4a843';
const API_URL = import.meta.env.API_URL || '';

export default function StatusPanel() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const checks = {
      ui_loaded:      typeof window !== 'undefined',
      supabase_config: !!(import.meta.env.SUPABASE_URL) && !!(import.meta.env.SUPABASE_ANON_KEY),
      api_health:     false,
      llm_provider:   false,
    };
      try {
        const r = await fetch(`${API_URL}/api/health`);
        if (r.ok) {
          const data = await r.json();
          checks.api_health  = data.status === 'ok' && data.apiRoutes === true;
          checks.llm_provider = data.llm?.active && data.llm.active !== 'none';
        }
      } catch { /* offline */ }
    setHealth(checks);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const checkLabels = {
    ui_loaded:       'UI Shell Loaded',
    supabase_config: 'Supabase Config Present',
    api_health:      '/api/health Responding',
    llm_provider:    'LLM Provider Configured',
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 28px' }}>
      <div style={{ marginBottom: 22, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>System Status</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Deployment health and service checks</p>
        </div>
        <button
          onClick={refresh}
          style={{
            padding: '8px 16px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
            color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer',
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Running checks…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(checkLabels).map(([key, label]) => {
            const ok = health?.[key];
            return (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                background: '#161616',
                border: `1px solid ${ok ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 10,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: ok ? '#4ade80' : 'rgba(255,255,255,0.15)',
                  boxShadow: ok ? '0 0 6px #4ade80' : 'none',
                  flexShrink: 0,
                }} />
                <span style={{ flex: 1, fontSize: 13, color: ok ? '#fff' : 'rgba(255,255,255,0.45)' }}>{label}</span>
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: 0.6,
                  color: ok ? '#4ade80' : 'rgba(255,255,255,0.3)',
                }}>
                  {ok ? 'OK' : 'NOT CONFIGURED'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Runtime environment summary */}
      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>RUNTIME ENVIRONMENT</div>
        <div style={{
          background: '#161616', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, padding: '14px 16px',
          fontFamily: "'JetBrains Mono','Courier New',monospace",
          fontSize: 12, lineHeight: 1.8,
        }}>
          {[
            { key: 'SUPABASE_URL', value: import.meta.env.SUPABASE_URL, ok: !!import.meta.env.SUPABASE_URL },
            { key: 'SUPABASE_ANON_KEY', value: import.meta.env.SUPABASE_ANON_KEY, ok: !!import.meta.env.SUPABASE_ANON_KEY },
            { key: 'API_URL', value: import.meta.env.API_URL || '(relative /api)', ok: true },
            { key: 'BASE_PATH', value: import.meta.env.BASE_PATH || '/', ok: true },
            { key: 'MODE', value: import.meta.env.MODE || 'production', ok: true },
          ].map(({ key, value, ok }) => (
            <div key={key}>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>{key}: </span>
              <span style={{ color: ok ? '#4ade80' : '#f87171' }}>{value || 'not set'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
