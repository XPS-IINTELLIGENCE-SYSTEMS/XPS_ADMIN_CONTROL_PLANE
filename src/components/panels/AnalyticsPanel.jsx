import React from 'react';

const gold = '#d4a843';

function MetricCard({ icon, label }) {
  return (
    <div style={{
      background: '#161616', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '20px 22px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 20, opacity: 0.5 }}>{icon}</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.6 }}>NO LIVE DATA</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.15)', marginBottom: 4 }}>—</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{label}</div>
    </div>
  );
}

function ChartPlaceholder({ title, subtitle, height = 180 }) {
  return (
    <div style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 18px', height }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{title}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{
        flex: 1, height: 'calc(100% - 52px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 6,
        flexDirection: 'column', gap: 6,
      }}>
        <svg width="28" height="20" viewBox="0 0 28 20" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 16L6 10l4 4 6-8 6 4"/>
        </svg>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', letterSpacing: 0.6 }}>AWAITING DATA</span>
      </div>
    </div>
  );
}

export default function AnalyticsPanel() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 28px' }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Analytics</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Performance metrics and intelligence reporting — awaiting live data sync
        </p>
      </div>

      {/* Zero-state notice */}
      <div style={{
        marginBottom: 20, padding: '10px 16px',
        background: 'rgba(212,168,67,0.06)',
        border: '1px solid rgba(212,168,67,0.18)',
        borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.4)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ color: gold }}>◈</span>
        All analytics zeroed — connect data sources via Connectors to populate dashboards
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        <MetricCard icon="📈" label="Total Revenue" />
        <MetricCard icon="🎯" label="Conversion Rate" />
        <MetricCard icon="👥" label="Leads Processed" />
        <MetricCard icon="⚡" label="Avg Response Time" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <ChartPlaceholder title="Revenue Trend" subtitle="Monthly performance" height={200} />
        <ChartPlaceholder title="Lead Funnel" subtitle="Stage conversion" height={200} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <ChartPlaceholder title="Agent Activity" subtitle="Runs per agent" height={160} />
        <ChartPlaceholder title="Search Volume" subtitle="Queries over time" height={160} />
        <ChartPlaceholder title="Scrape Jobs" subtitle="Jobs completed" height={160} />
      </div>
    </div>
  );
}
