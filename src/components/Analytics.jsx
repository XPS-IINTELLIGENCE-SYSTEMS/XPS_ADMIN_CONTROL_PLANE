import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

const GOLD = '#d4a843';

const monthlyRevenue = [
  { m: 'Jul', rev: 320000, leads: 38 },
  { m: 'Aug', rev: 340000, leads: 42 },
  { m: 'Sep', rev: 350000, leads: 45 },
  { m: 'Oct', rev: 390000, leads: 51 },
  { m: 'Nov', rev: 420000, leads: 54 },
  { m: 'Dec', rev: 450000, leads: 49 },
  { m: 'Jan', rev: 480000, leads: 58 },
  { m: 'Feb', rev: 510000, leads: 62 },
  { m: 'Mar', rev: 620000, leads: 71 },
];

const closeRateData = [
  { m: 'Jul', rate: 28 }, { m: 'Aug', rate: 30 }, { m: 'Sep', rate: 31 },
  { m: 'Oct', rate: 33 }, { m: 'Nov', rate: 32 }, { m: 'Dec', rate: 35 },
  { m: 'Jan', rate: 33 }, { m: 'Feb', rate: 34 }, { m: 'Mar', rate: 34.2 },
];

const verticals = [
  { name: 'Warehouse', value: 34, color: GOLD },
  { name: 'Automotive', value: 22, color: '#c98b1e' },
  { name: 'Healthcare', value: 18, color: '#9ca3af' },
  { name: 'Retail', value: 15, color: '#6b7280' },
  { name: 'Other', value: 11, color: '#4b5563' },
];

const ttStyle = { background: '#1a1d21', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 };
const ttLabel = { color: 'rgba(255,255,255,0.5)', fontSize: 12 };
const ttItem = { color: GOLD };

export default function Analytics() {
  return (
    <div>
      <div className="page-heading">Analytics</div>
      <div className="page-sub">Sales performance insights across your territory</div>

      {/* KPI strip */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        {[
          { value: '$4.2M', label: 'Total Pipeline', trend: '+8.7%', up: true },
          { value: '34.2%', label: 'Close Rate', trend: '-1.3%', up: false },
          { value: '47 days', label: 'Avg Deal Cycle', trend: '-3 days', up: true },
          { value: '$18.2K', label: 'Avg Deal Size', trend: '+12.4%', up: true },
        ].map((k) => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-top">
              <div />
              <div className={`kpi-trend ${k.up ? 'up' : 'down'}`}>{k.up ? '↑' : '↓'} {k.trend}</div>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="analytics-grid">
        {/* Revenue Trend */}
        <div className="chart-card">
          <div className="chart-title">Revenue Pipeline Trend</div>
          <div className="chart-sub">Monthly pipeline value</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="m" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `$${v / 1000}K`} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ttStyle} labelStyle={ttLabel} itemStyle={ttItem} formatter={(v) => [`$${(v/1000).toFixed(0)}K`, 'Pipeline']} />
              <Line type="monotone" dataKey="rev" stroke={GOLD} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Close Rate */}
        <div className="chart-card">
          <div className="chart-title">Close Rate %</div>
          <div className="chart-sub">Monthly win rate trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={closeRateData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="m" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ttStyle} labelStyle={ttLabel} itemStyle={{ color: '#22c55e' }} formatter={(v) => [`${v}%`, 'Close Rate']} />
              <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Leads by Month Bar */}
        <div className="chart-card">
          <div className="chart-title">New Leads per Month</div>
          <div className="chart-sub">Lead acquisition velocity</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="m" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={ttStyle} labelStyle={ttLabel} itemStyle={ttItem} />
              <Bar dataKey="leads" fill={GOLD} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vertical Breakdown */}
        <div className="chart-card">
          <div className="chart-title">Pipeline by Vertical</div>
          <div className="chart-sub">Deal distribution</div>
          <PieChart width={280} height={140}>
            <Pie data={verticals} cx="50%" cy="50%" innerRadius={42} outerRadius={62} paddingAngle={2} dataKey="value">
              {verticals.map((v, i) => <Cell key={i} fill={v.color} />)}
            </Pie>
          </PieChart>
          {verticals.map((v) => (
            <div key={v.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: v.color }} />
                <span style={{ color: 'rgba(255,255,255,0.7)' }}>{v.name}</span>
              </div>
              <span style={{ fontWeight: 600 }}>{v.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
