import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const GOLD = '#d4a843';
const GOLD_DIM = 'rgba(212,168,67,0.18)';

const revenueData = [
  { month: 'Jul', value: 320000 },
  { month: 'Aug', value: 340000 },
  { month: 'Sep', value: 350000 },
  { month: 'Oct', value: 390000 },
  { month: 'Nov', value: 420000 },
  { month: 'Dec', value: 450000 },
  { month: 'Jan', value: 480000 },
  { month: 'Feb', value: 510000 },
  { month: 'Mar', value: 620000 },
];

const pipelineStages = [
  { name: 'Prospecting', value: 420, color: GOLD },
  { name: 'Qualified', value: 310, color: '#c98b1e' },
  { name: 'Proposal', value: 180, color: '#9ca3af' },
  { name: 'Negotiation', value: 90, color: '#6b7280' },
  { name: 'Closed Won', value: 140, color: '#22c55e' },
];

const topLeads = [
  { company: 'Ace Hardware Distribution', contact: 'Robert Chen', stage: 'Proposal', value: '$45,000', score: 92 },
  { company: 'Tampa Bay Brewing Co.', contact: 'Sarah Mills', stage: 'Qualified', value: '$28,000', score: 87 },
  { company: 'Gulf Coast Logistics', contact: 'Diana Patel', stage: 'Prospecting', value: '$62,000', score: 84 },
  { company: 'Palm Medical Center', contact: 'Dr. James Liu', stage: 'Negotiation', value: '$38,000', score: 79 },
];

const recentActivity = [
  { color: GOLD, text: 'Robert Chen opened the Ace Hardware proposal', time: '2 min ago' },
  { color: '#22c55e', text: 'Tampa Bay Brewing Co. moved to Qualified stage', time: '18 min ago' },
  { color: '#3b82f6', text: 'New lead added: Seminole School District', time: '1 hr ago' },
  { color: '#9ca3af', text: 'Follow-up scheduled with Gulf Coast Logistics', time: '3 hr ago' },
  { color: '#ef4444', text: 'Metro Fitness Chain proposal expired', time: '5 hr ago' },
];

const fmtDollar = (v) => `$${(v / 1000).toFixed(0)}K`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1d21', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div style={{ color: GOLD, fontWeight: 700 }}>{fmtDollar(payload[0].value)}</div>
    </div>
  );
};

export default function Dashboard() {
  return (
    <div>
      <div className="page-heading">Good morning, Marcus</div>
      <div className="page-sub">Here's your sales intelligence briefing for today.</div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard icon="👤" trend="+12.4%" up value="2,847" label="Active Leads" />
        <KpiCard icon="💵" trend="+8.7%" up value="$4.2M" label="Pipeline Value" />
        <KpiCard icon="📄" trend="+23.1%" up value="342" label="Proposals Sent" />
        <KpiCard icon="🎯" trend="-1.3%" up={false} value="34.2%" label="Close Rate" />
      </div>

      {/* Charts */}
      <div className="chart-grid">
        {/* Revenue Pipeline */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="chart-title">Revenue Pipeline</div>
              <div className="chart-sub">Monthly pipeline value trend</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="9" y2="15"/><line x1="12" y1="6" x2="12" y2="15"/><line x1="15" y1="12" x2="15" y2="15"/>
            </svg>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GOLD} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={GOLD} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtDollar} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke={GOLD} strokeWidth={2} fill="url(#goldGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline Stages Donut */}
        <div className="chart-card">
          <div className="chart-title">Pipeline Stages</div>
          <div className="chart-sub">Lead distribution by stage</div>
          <div style={{ position: 'relative', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineStages}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pipelineStages.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: 8 }}>
            {pipelineStages.map((s) => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{s.name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16 }}>
        {/* Top Leads */}
        <div className="chart-card">
          <div className="chart-title">Top Leads</div>
          <div className="chart-sub" style={{ marginBottom: 12 }}>Highest priority accounts</div>
          <table className="xps-table">
            <thead>
              <tr>
                <th>COMPANY</th>
                <th>CONTACT</th>
                <th>STAGE</th>
                <th style={{ textAlign: 'right' }}>VALUE</th>
              </tr>
            </thead>
            <tbody>
              {topLeads.map((l) => (
                <tr key={l.company}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{l.company}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Score: <span style={{ color: GOLD }}>{l.score}</span></div>
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.7)' }}>{l.contact}</td>
                  <td><StageBadge stage={l.stage} /></td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{l.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        <div className="chart-card">
          <div className="chart-title">Recent Activity</div>
          <div className="chart-sub" style={{ marginBottom: 12 }}>Latest pipeline events</div>
          {recentActivity.map((a, i) => (
            <div key={i} className="activity-item">
              <div className="act-dot" style={{ background: a.color }} />
              <div>
                <div className="act-text">{a.text}</div>
                <div className="act-time">{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, trend, up, value, label }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <div className="kpi-icon" style={{ fontSize: 18 }}>{icon}</div>
        <div className={`kpi-trend ${up ? 'up' : 'down'}`}>
          {up ? '↑' : '↓'} {trend}
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

export function StageBadge({ stage }) {
  const map = {
    'Proposal': 'stage-proposal',
    'Qualified': 'stage-qualified',
    'Prospecting': 'stage-prospecting',
    'Negotiation': 'stage-negotiation',
    'Closed Won': 'stage-won',
    'New': 'stage-new',
    'Contacted': 'stage-contacted',
  };
  return <span className={`stage-badge ${map[stage] || 'stage-prospecting'}`}>{stage}</span>;
}
