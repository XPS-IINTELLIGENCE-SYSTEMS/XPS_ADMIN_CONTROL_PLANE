import React, { useState } from 'react';
import Panel from '../components/ui/Panel.jsx';
import StatusBadge from '../components/ui/StatusBadge.jsx';
import { leads } from '../data/synthetic.js';
import { Search, Plus, Filter, Star, MapPin, Building } from 'lucide-react';

const GOLD = '#c49e3c';

export default function Leads() {
  const [search, setSearch] = useState('');
  const [showQualifiedOnly, setShowQualifiedOnly] = useState(false);
  const [extraLeads, setExtraLeads] = useState([]);

  const filtered = [...extraLeads, ...leads].filter(l => {
    const matchesSearch = !search || l.company.toLowerCase().includes(search.toLowerCase()) ||
      l.contact.toLowerCase().includes(search.toLowerCase()) ||
      l.vertical.toLowerCase().includes(search.toLowerCase());
    const matchesStage = !showQualifiedOnly || ['Qualified', 'Proposal', 'Negotiation', 'Closed Won'].includes(l.stage);
    return matchesSearch && matchesStage;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Lead Intelligence</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 14 }}>{leads.length} active leads across all territories</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setShowQualifiedOnly(v => !v)}
            className="xps-electric-hover"
            style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', borderRadius: 8, padding: '8px 14px',
            fontSize: 13, fontWeight: 500,
          }}>
            <Filter size={13} /> {showQualifiedOnly ? 'Show All' : 'Qualified+'}
          </button>
          <button
            onClick={() => setExtraLeads(prev => [{
              id: `lead-${Date.now()}`,
              company: 'New Account Draft',
              contact: 'Operator Added',
              vertical: 'New Business',
              location: 'Remote',
              score: 72,
              stage: 'Qualified',
              value: '$12,000',
              email: 'draft@xps.local',
              rating: '4.8',
              reviews: '12 reviews',
            }, ...prev])}
            className="xps-electric-hover"
            style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: GOLD, border: 'none',
            color: '#0a0b0c', borderRadius: 8, padding: '8px 16px',
            fontSize: 13, fontWeight: 700,
          }}>
            <Plus size={14} /> Add Lead
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 420, marginBottom: 20 }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search leads by company, contact, or vertical…"
          style={{
            width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '9px 12px 9px 30px',
            color: 'var(--text-primary)', fontSize: 13, outline: 'none',
          }}
        />
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', overflow: 'hidden',
      }}>
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2.5fr 2fr 1.2fr 1.5fr 80px 1fr 100px',
          gap: 0, padding: '10px 20px',
          borderBottom: '1px solid var(--border)',
          fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
          color: 'var(--text-muted)', textTransform: 'uppercase',
        }}>
          <span>Company</span>
          <span>Contact</span>
          <span>Vertical</span>
          <span>Location</span>
          <span style={{ textAlign: 'center' }}>Score</span>
          <span>Stage</span>
          <span style={{ textAlign: 'right' }}>Value</span>
        </div>

        {filtered.map((lead, i) => (
          <div
            key={lead.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '2.5fr 2fr 1.2fr 1.5fr 80px 1fr 100px',
              gap: 0, padding: '14px 20px',
              borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: 'pointer',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Company */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 6, background: 'var(--bg-card-alt)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--border)', flexShrink: 0,
              }}>
                <Building size={14} className="xps-icon" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{lead.company}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                  <Star size={9} fill={GOLD} color={GOLD} />
                  {lead.rating} ({lead.reviews})
                </div>
              </div>
            </div>

            {/* Contact */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{lead.contact}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{lead.email}</div>
            </div>

            {/* Vertical */}
            <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>{lead.vertical}</div>

            {/* Location */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
              <MapPin size={11} style={{ flexShrink: 0 }} />
              {lead.location}
            </div>

            {/* Score */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{
                fontWeight: 700, fontSize: 14,
                color: lead.score >= 85 ? GOLD : lead.score >= 70 ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
                {lead.score}
              </span>
            </div>

            {/* Stage */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <StatusBadge status={lead.stage} />
            </div>

            {/* Value */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
              {lead.value}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No leads match your search.
          </div>
        )}
      </div>
    </div>
  );
}
