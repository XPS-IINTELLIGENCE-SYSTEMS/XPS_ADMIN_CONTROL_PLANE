import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import StatCard from '../components/ui/StatCard.jsx';
import Panel from '../components/ui/Panel.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import {
  dashboardStats, revenueData, donutData, recentActivity, leads, userContext,
} from '../data/synthetic.js';
import { Star, MapPin } from 'lucide-react';

const GOLD = '#c49e3c';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ color: GOLD, fontWeight: 600 }}>${(payload[0].value / 1000).toFixed(0)}K</div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
          Good morning, {userContext.name}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>
          Here's your sales intelligence briefing for today.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {dashboardStats.map(s => (
          <StatCard key={s.id} {...s} />
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, marginBottom: 24 }}>
        {/* Revenue Pipeline */}
        <Panel title="Revenue Pipeline" subtitle="Monthly pipeline value trend">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="areaGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GOLD} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={GOLD} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${v/1000}K`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" stroke={GOLD} strokeWidth={2} fill="url(#areaGold)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        {/* Pipeline Stages donut */}
        <Panel title="Pipeline Stages" subtitle="Lead distribution by stage">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value">
                {donutData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {donutData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                </div>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d.value}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Top Leads */}
        <Panel title="Top Leads" subtitle="Highest-scored active leads">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {leads.slice(0, 5).map((lead, i) => (
              <div key={lead.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 0',
                borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 6, background: 'var(--bg-card-alt)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, flexShrink: 0, border: '1px solid var(--border)',
                }}>🏢</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }} className="truncate">{lead.company}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 6, marginTop: 2 }}>
                    <span>{lead.contact}</span>
                    <span>·</span>
                    <span>{lead.vertical}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <StatusBadge status={lead.stage} />
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, marginTop: 4 }}>{lead.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Recent Activity */}
        <Panel title="Recent Activity">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {recentActivity.map((item, i) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '10px 0',
                borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: item.color,
                  flexShrink: 0, marginTop: 5,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.text}</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>{item.time}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
