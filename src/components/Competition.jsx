import React from 'react';
import { AlertTriangle, Zap, CheckCircle } from 'lucide-react';

const GOLD = '#d4a843';

const competitors = [
  {
    name: 'ArmorThane', market: 'National', strength: 'Brand Recognition', weakness: 'Higher Price Point',
    coverage: 'FL/SE', threat: 'High', pricing: '$12–18/sqft',
  },
  {
    name: 'Penntek', market: 'Regional', strength: 'Warranty Terms', weakness: 'Limited Colors',
    coverage: 'Southeast', threat: 'Medium', pricing: '$10–15/sqft',
  },
  {
    name: 'GarageFloorCoating.com', market: 'Residential', strength: 'Online Presence', weakness: 'No B2B',
    coverage: 'National DTC', threat: 'Low', pricing: '$7–12/sqft',
  },
  {
    name: 'Florock Polymer Flooring', market: 'Industrial', strength: 'Industrial Spec', weakness: 'Slow Install',
    coverage: 'Multi-state', threat: 'High', pricing: '$14–22/sqft',
  },
  {
    name: 'Elite Crete Systems', market: 'Commercial', strength: 'Decorative Range', weakness: 'Dealer Network',
    coverage: 'FL Only', threat: 'Medium', pricing: '$11–17/sqft',
  },
];

function ThreatBadge({ level }) {
  const styles = {
    High: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
    Medium: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
    Low: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'rgba(34,197,94,0.25)' },
  };
  const s = styles[level];
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {level}
    </span>
  );
}

export default function Competition() {
  return (
    <div>
      <div className="page-heading">Competition</div>
      <div className="page-sub">Competitive intelligence and market positioning</div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: AlertTriangle, label: 'High Threat', value: '2 competitors', color: '#ef4444' },
          { icon: Zap, label: 'Medium Threat', value: '2 competitors', color: '#fbbf24' },
          { icon: CheckCircle, label: 'Low Threat', value: '1 competitor', color: '#22c55e' },
        ].map((s) => {
          const Icon = s.icon;
          return (
          <div key={s.label} className="kpi-card">
            <div style={{ marginBottom: 8 }}>
              <Icon size={22} className="xps-icon" />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div className="kpi-label">{s.label}</div>
          </div>
        );
        })}
      </div>

      {/* Competitor Table */}
      <div className="chart-card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="chart-title" style={{ margin: 0 }}>Competitor Overview</div>
        </div>
        <table className="xps-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>COMPANY</th>
              <th>MARKET</th>
              <th>STRENGTH</th>
              <th>WEAKNESS</th>
              <th>COVERAGE</th>
              <th>PRICING</th>
              <th style={{ paddingRight: 20 }}>THREAT</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((c) => (
              <tr key={c.name}>
                <td style={{ paddingLeft: 20, fontWeight: 600 }}>{c.name}</td>
                <td style={{ color: 'rgba(255,255,255,0.6)' }}>{c.market}</td>
                <td style={{ color: GOLD, fontSize: 12 }}>{c.strength}</td>
                <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{c.weakness}</td>
                <td style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{c.coverage}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{c.pricing}</td>
                <td style={{ paddingRight: 20 }}><ThreatBadge level={c.threat} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
