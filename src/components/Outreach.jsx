import React, { useState } from 'react';

const GOLD = '#d4a843';

const campaigns = [
  { name: 'Floor Polishing Upgrade — Tampa Area', status: 'Active', sent: 248, opened: 41, replied: 12, sequence: 3 },
  { name: 'Warehouse Efficiency Q2 Promo', status: 'Active', sent: 182, opened: 37, replied: 8, sequence: 2 },
  { name: 'Healthcare Facilities Outreach', status: 'Paused', sent: 97, opened: 22, replied: 4, sequence: 1 },
  { name: 'Auto Dealer Network Campaign', status: 'Draft', sent: 0, opened: 0, replied: 0, sequence: 4 },
];

export default function Outreach() {
  const [tab, setTab] = useState('campaigns');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="page-heading">Outreach</div>
          <div className="page-sub" style={{ marginBottom: 0 }}>Manage email campaigns and follow-up sequences</div>
        </div>
        <button className="btn-gold">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        {[
          { value: '527', label: 'Emails Sent', trend: '+24 today' },
          { value: '38.4%', label: 'Open Rate', trend: '+2.1%' },
          { value: '9.8%', label: 'Reply Rate', trend: '+0.4%' },
          { value: '4', label: 'Active Campaigns', trend: '' },
        ].map((k) => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
            {k.trend && <div style={{ fontSize: 11, color: GOLD, marginTop: 6 }}>{k.trend}</div>}
          </div>
        ))}
      </div>

      {/* Campaigns Table */}
      <div className="chart-card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="chart-title" style={{ margin: 0 }}>Campaigns</div>
        </div>
        <table className="xps-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>CAMPAIGN</th>
              <th>STATUS</th>
              <th>SENT</th>
              <th>OPENED</th>
              <th>REPLIED</th>
              <th>SEQUENCE</th>
              <th style={{ paddingRight: 20 }}></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.name}>
                <td style={{ paddingLeft: 20, fontWeight: 600, fontSize: 13 }}>{c.name}</td>
                <td>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                    background: c.status === 'Active' ? 'rgba(34,197,94,0.12)' : c.status === 'Paused' ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.06)',
                    color: c.status === 'Active' ? '#4ade80' : c.status === 'Paused' ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                    border: `1px solid ${c.status === 'Active' ? 'rgba(34,197,94,0.25)' : c.status === 'Paused' ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                    {c.status}
                  </span>
                </td>
                <td>{c.sent}</td>
                <td>
                  {c.sent > 0 ? (
                    <span style={{ color: GOLD }}>{((c.opened / c.sent) * 100).toFixed(1)}%</span>
                  ) : '—'}
                </td>
                <td>
                  {c.sent > 0 ? (
                    <span style={{ color: '#22c55e' }}>{((c.replied / c.sent) * 100).toFixed(1)}%</span>
                  ) : '—'}
                </td>
                <td>Step {c.sequence}</td>
                <td style={{ paddingRight: 20 }}>
                  <button className="btn-outline" style={{ padding: '5px 12px', fontSize: 12 }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
