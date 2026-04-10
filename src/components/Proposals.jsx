import React, { useState } from 'react';
import { StageBadge } from './Dashboard.jsx';

const GOLD = '#d4a843';

const proposals = [
  { id: 'PRO-001', company: 'Ace Hardware Distribution', contact: 'Robert Chen', value: '$45,000', stage: 'Proposal', created: 'Apr 3', expires: 'Apr 17', viewed: true },
  { id: 'PRO-002', company: 'Tampa Bay Brewing Co.', contact: 'Sarah Mills', value: '$28,000', stage: 'Qualified', created: 'Apr 5', expires: 'Apr 19', viewed: false },
  { id: 'PRO-003', company: 'Gulf Coast Logistics', contact: 'Diana Patel', value: '$62,000', stage: 'Negotiation', created: 'Mar 28', expires: 'Apr 11', viewed: true },
  { id: 'PRO-004', company: 'Palm Medical Center', contact: 'Dr. James Liu', value: '$33,000', stage: 'Proposal', created: 'Apr 1', expires: 'Apr 15', viewed: false },
  { id: 'PRO-005', company: 'Sunshine Auto Group', contact: 'Mike Torres', value: '$62,000', stage: 'Proposal', created: 'Apr 6', expires: 'Apr 20', viewed: false },
];

export default function Proposals() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="page-heading">Proposals</div>
          <div className="page-sub" style={{ marginBottom: 0 }}>Track and manage your active proposals</div>
        </div>
        <button className="btn-gold">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Proposal
        </button>
      </div>

      {/* Stats */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        {[
          { value: '342', label: 'Total Sent', trend: '+23.1%' },
          { value: '18', label: 'Active', trend: '' },
          { value: '$230K', label: 'Pending Value', trend: '' },
          { value: '34.2%', label: 'Accept Rate', trend: '+1.2%' },
        ].map((k) => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-top"><div /><div style={{ fontSize: 11, color: GOLD }}>{k.trend}</div></div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="chart-card" style={{ padding: 0 }}>
        <table className="xps-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>ID</th>
              <th>COMPANY</th>
              <th>CONTACT</th>
              <th>VALUE</th>
              <th>STAGE</th>
              <th>CREATED</th>
              <th>EXPIRES</th>
              <th>VIEWED</th>
              <th style={{ paddingRight: 20 }}></th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((p) => (
              <tr key={p.id}>
                <td style={{ paddingLeft: 20, color: 'rgba(255,255,255,0.45)', fontSize: 12, fontFamily: 'monospace' }}>{p.id}</td>
                <td style={{ fontWeight: 600 }}>{p.company}</td>
                <td style={{ color: 'rgba(255,255,255,0.7)' }}>{p.contact}</td>
                <td style={{ fontWeight: 600, color: GOLD }}>{p.value}</td>
                <td><StageBadge stage={p.stage} /></td>
                <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{p.created}</td>
                <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{p.expires}</td>
                <td>
                  {p.viewed
                    ? <span style={{ color: '#4ade80', fontSize: 12 }}>Viewed</span>
                    : <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Not viewed</span>}
                </td>
                <td style={{ paddingRight: 20 }}>
                  <button className="btn-outline" style={{ padding: '5px 12px', fontSize: 12 }}>Open</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
