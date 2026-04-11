import React from 'react';
import Panel from '../components/ui/Panel.jsx';
import { Shield } from 'lucide-react';

const GOLD = '#c49e3c';

const competitors = [];

export default function Competition() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Competition</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Competitive intelligence and market positioning</p>
      </div>

      <Panel title="Competitor Landscape" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {competitors.map((c, i) => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: i < competitors.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={14} color="#ef4444" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.verticals}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: GOLD }}>{c.share}</div>
                <div style={{ fontSize: 10, color: c.trend === 'up' ? 'var(--red)' : c.trend === 'down' ? 'var(--green)' : 'var(--text-muted)' }}>
                  {c.trend === 'up' ? '↑ gaining' : c.trend === 'down' ? '↓ losing' : '→ flat'}
                </div>
              </div>
            </div>
          ))}
          {competitors.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              No competitor records loaded yet. Connect a live source to enable market tracking.
            </div>
          )}
        </div>
      </Panel>

      <Panel title="Intelligence Feed" subtitle="Recent competitor signals">
        <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
          Connect Google Sheets or Airtable to enable live competitor signal monitoring.
        </div>
      </Panel>
    </div>
  );
}
