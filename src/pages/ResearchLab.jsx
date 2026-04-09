import React from 'react';
import Panel from '../components/ui/Panel.jsx';
import { FlaskConical } from 'lucide-react';

export default function ResearchLab() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Research Lab</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>AI-powered company and market intelligence</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Panel title="Company Lookup" subtitle="Research any company with AI">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input placeholder="Enter company name or domain…" style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
            <button style={{ background: 'var(--gold)', color: '#0a0b0c', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, fontSize: 13 }}>Research with AI</button>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>Connects to Google Drive, Sheets when live</div>
          </div>
        </Panel>
        <Panel title="Market Intelligence" subtitle="Vertical and territory analysis">
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
            <FlaskConical size={28} style={{ marginBottom: 8, color: 'var(--gold)' }} />
            <div>Select a vertical or territory to generate an AI intelligence brief.</div>
          </div>
        </Panel>
        <Panel title="Competitive Analysis" subtitle="Monitor competitor activity">
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Competitor monitoring requires connected data sources.</div>
        </Panel>
        <Panel title="Recent Research" subtitle="Saved intelligence reports">
          <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>No saved research yet. Run a lookup to get started.</div>
        </Panel>
      </div>
    </div>
  );
}
