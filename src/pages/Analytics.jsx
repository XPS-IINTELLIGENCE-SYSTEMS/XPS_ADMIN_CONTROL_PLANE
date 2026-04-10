import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Panel from '../components/ui/Panel.jsx';
import { revenueData, pipelineStages } from '../data/synthetic.js';

const GOLD = '#c49e3c';

export default function Analytics() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Analytics</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Performance metrics and revenue intelligence</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <Panel title="Revenue Trend" subtitle="Monthly pipeline value">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${v/1000}K`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="value" stroke={GOLD} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Pipeline by Stage" subtitle="Lead count per stage">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pipelineStages} barSize={24}>
              <XAxis dataKey="stage" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill={GOLD} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel title="Performance Summary">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            { label: 'Avg Deal Size',     value: '$36,400' },
            { label: 'Sales Cycle',       value: '18 days' },
            { label: 'Win Rate',          value: '34.2%' },
            { label: 'Leads / Rep / Mo.', value: '47' },
          ].map(m => (
            <div key={m.label} style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: GOLD }}>{m.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
