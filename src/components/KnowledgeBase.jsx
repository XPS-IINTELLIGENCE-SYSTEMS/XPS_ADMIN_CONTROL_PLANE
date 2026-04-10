import React, { useState } from 'react';

const GOLD = '#d4a843';

const articles = [
  { icon: '🏭', title: 'Floor Coating Types & Applications', desc: 'Epoxy, urethane, and polyaspartic systems for industrial floors', tags: ['Product', 'Technical'], updated: '2 days ago' },
  { icon: '💼', title: 'Sales Objection Playbook', desc: 'Scripts and responses for the 15 most common objections', tags: ['Sales', 'Playbook'], updated: '1 week ago' },
  { icon: '📊', title: 'Competitive Pricing Matrix', desc: 'Current market pricing vs XPS positioning across verticals', tags: ['Competitive', 'Pricing'], updated: '3 days ago' },
  { icon: '🎯', title: 'Territory Coverage Guide — Florida', desc: 'Territory boundaries, key accounts, and coverage strategy', tags: ['Territory', 'Strategy'], updated: '5 days ago' },
  { icon: '📝', title: 'Proposal Writing Best Practices', desc: 'Proven templates and copy patterns that close deals', tags: ['Proposals', 'Templates'], updated: '1 week ago' },
  { icon: '🔬', title: 'Technical Spec Sheets Library', desc: 'Full product specification documents for all XPS systems', tags: ['Technical', 'Product'], updated: 'Today' },
  { icon: '📞', title: 'Cold Outreach Scripts', desc: 'Phone and email scripts for each vertical and stage', tags: ['Outreach', 'Sales'], updated: '4 days ago' },
  { icon: '🏆', title: 'Case Studies & Win Reports', desc: 'Documented wins with ROI data for customer proof', tags: ['Case Studies'], updated: '1 week ago' },
  { icon: '[A]', title: 'CRM Workflow SOPs', desc: 'Standard operating procedures for pipeline management', tags: ['Process', 'CRM'], updated: '2 weeks ago' },
];

export default function KnowledgeBase() {
  const [search, setSearch] = useState('');

  const filtered = articles.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="page-heading">Knowledge Base</div>
          <div className="page-sub" style={{ marginBottom: 0 }}>Sales intelligence, playbooks, and product resources</div>
        </div>
        <button className="btn-gold">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Article
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 440, marginBottom: 24 }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input className="xps-input" style={{ paddingLeft: 32 }} placeholder="Search knowledge base..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Cards */}
      <div className="kb-grid">
        {filtered.map((a) => (
          <div key={a.title} className="chart-card" style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(212,168,67,0.3)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{a.title}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 12, lineHeight: 1.5 }}>{a.desc}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {a.tags.map(t => (
                <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)', color: GOLD }}>
                  {t}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Updated {a.updated}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
