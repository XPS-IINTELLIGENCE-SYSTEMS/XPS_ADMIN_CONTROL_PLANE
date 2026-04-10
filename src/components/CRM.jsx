import React from 'react';
import { StageBadge } from './Dashboard.jsx';
import { Users, Building, Star, MapPin } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const GOLD = '#d4a843';

const pipelineStageCards = [
  { name: 'New', count: 42, value: '$840K' },
  { name: 'Contacted', count: 38, value: '$720K' },
  { name: 'Qualified', count: 31, value: '$1.2M' },
  { name: 'Proposal', count: 24, value: '$2.1M' },
  { name: 'Negotiation', count: 12, value: '$1.8M' },
  { name: 'Closed Won', count: 87, value: '$1.7M' },
];

const barData = [
  { name: 'New', value: 42 },
  { name: 'Contacted', value: 38 },
  { name: 'Qualified', value: 31 },
  { name: 'Proposal', value: 24 },
  { name: 'Negotiation', value: 12 },
  { name: 'Won', value: 87 },
];

export default function CRM() {
  return (
    <div>
      <div className="page-heading">CRM Dashboard</div>
      <div className="page-sub">Customer relationship management and pipeline overview</div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <CrmKpi icon={Users} value="1,842" label="Total Contacts" />
        <CrmKpi icon={Building} value="647" label="Companies" />
        <CrmKpi icon={Star} value="234" label="Active Deals" />
        <CrmKpi icon={MapPin} value="$8.4M" label="Pipeline Value" />
      </div>

      {/* Pipeline Stages */}
      <div className="chart-card" style={{ marginBottom: 16 }}>
        <div className="chart-title" style={{ marginBottom: 16 }}>Pipeline Stages</div>
        <div className="pipeline-stages">
          {pipelineStageCards.map((s) => (
            <div key={s.name} className="pipeline-stage-card">
              <div className="psc-name">{s.name}</div>
              <div className="psc-count">{s.count}</div>
              <div className="psc-value">{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="chart-card">
        <div className="chart-title">Deal Distribution by Stage</div>
        <div className="chart-sub">Count of active deals per stage</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#1a1d21', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              itemStyle={{ color: GOLD }}
            />
            <Bar dataKey="value" fill={GOLD} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CrmKpi({ icon: Icon, value, label }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <div className="kpi-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} className="xps-icon" />
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}
