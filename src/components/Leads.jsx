import React, { useState } from 'react';
import { StageBadge } from './Dashboard.jsx';
import { Building, Star, MapPin } from 'lucide-react';

const GOLD = '#d4a843';

const leads = [
  { company: 'Ace Hardware Distribution', rating: 4.6, reviews: 128, contact: 'Robert Chen', email: 'robert@acehw.com', vertical: 'Retail', location: 'Tampa, FL', score: 92, stage: 'Proposal', value: '$45,000' },
  { company: 'Tampa Bay Brewing Co.', rating: 4.8, reviews: 89, contact: 'Sarah Mills', email: 'sarah@tbbrewing.com', vertical: 'Food & Bev', location: 'St. Petersburg, FL', score: 87, stage: 'Qualified', value: '$28,000' },
  { company: 'Sunshine Auto Group', rating: 4.2, reviews: 256, contact: 'Mike Torres', email: 'mike@sunshineauto.com', vertical: 'Automotive', location: 'Orlando, FL', score: 84, stage: 'Prospecting', value: '$62,000' },
  { company: 'Gulf Coast Logistics', rating: 4.4, reviews: 67, contact: 'Diana Patel', email: 'diana@gulfcoast.com', vertical: 'Warehouse', location: 'Jacksonville, FL', score: 81, stage: 'Prospecting', value: '$54,000' },
  { company: 'Palm Medical Center', rating: 4.7, reviews: 312, contact: 'Dr. James Liu', email: 'jliu@palmmed.org', vertical: 'Healthcare', location: 'Miami, FL', score: 79, stage: 'Qualified', value: '$33,000' },
  { company: 'Metro Fitness Chain', rating: 4.1, reviews: 145, contact: 'Lisa Wang', email: 'lisa@metrofit.com', vertical: 'Fitness', location: 'Fort Lauderdale, FL', score: 74, stage: 'Contacted', value: '$19,000' },
  { company: 'Coastal Warehousing Inc.', rating: 3.9, reviews: 42, contact: 'Tom Bradley', email: 'tom@coastalwh.com', vertical: 'Warehouse', location: 'Clearwater, FL', score: 68, stage: 'New', value: '$41,000' },
  { company: 'Seminole School District', rating: 4.3, reviews: 78, contact: 'Jennifer Adams', email: 'jadams@seminoleschools.edu', vertical: 'Education', location: 'Sanford, FL', score: 65, stage: 'New', value: '$27,500' },
];

export default function Leads() {
  const [search, setSearch] = useState('');

  const filtered = leads.filter(l =>
    l.company.toLowerCase().includes(search.toLowerCase()) ||
    l.contact.toLowerCase().includes(search.toLowerCase()) ||
    l.vertical.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="page-heading">Lead Intelligence</div>
          <div className="page-sub" style={{ marginBottom: 0 }}>8 active leads across all territories</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filter
          </button>
          <button className="btn-gold">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Lead
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 440, marginBottom: 20 }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          className="xps-input"
          style={{ paddingLeft: 32 }}
          placeholder="Search leads by company, contact, or vertical..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="chart-card" style={{ padding: 0 }}>
        <table className="xps-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>COMPANY</th>
              <th>CONTACT</th>
              <th>VERTICAL</th>
              <th>LOCATION</th>
              <th>SCORE</th>
              <th>STAGE</th>
              <th style={{ textAlign: 'right', paddingRight: 20 }}>VALUE</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.company} style={{ cursor: 'pointer' }}>
                <td style={{ paddingLeft: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Building size={13} className="xps-icon" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{l.company}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
                        <Star size={11} className="xps-icon" /> {l.rating} ({l.reviews})
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{l.contact}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{l.email}</div>
                </td>
                <td style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{l.vertical}</td>
                <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                      <MapPin size={11} className="xps-icon" />
                      {l.location}
                    </div>
                </td>
                <td>
                  <span style={{ color: GOLD, fontWeight: 700, fontSize: 14 }}>{l.score}</span>
                </td>
                <td><StageBadge stage={l.stage} /></td>
                <td style={{ textAlign: 'right', paddingRight: 20, fontWeight: 600 }}>{l.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
