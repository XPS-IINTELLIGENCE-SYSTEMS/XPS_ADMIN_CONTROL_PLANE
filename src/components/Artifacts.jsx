import React, { useState } from 'react';

const GOLD = '#d4a843';

const ARTIFACTS = [
  { id: 'ART-001', name: 'Gulf Coast Logistics Follow-up Email', type: 'Email', size: '2.1 KB', created: '2 hr ago', tags: ['outreach', 'follow-up'], content: 'Subject: Quick Update on Your Warehouse Floor Project — New Options Available\n\nHi Diana,\n\nI hope this week is treating you well. I wanted to circle back on our conversation about upgrading your warehouse floor at the Jacksonville facility.\n\nWe have a new polyaspartic coating option that can be installed over a single weekend with zero downtime. Given your high-traffic operations, this could be a significant advantage.\n\nWould you have 15 minutes this week for a quick call?\n\nBest regards,\nMarcus Rodriguez\nXPS Intelligence' },
  { id: 'ART-002', name: 'Pipeline Analysis Q2 2026', type: 'Report', size: '8.4 KB', created: 'Yesterday', tags: ['pipeline', 'analysis'], content: 'Q2 2026 Pipeline Analysis\n\nTotal Pipeline: $4.2M (↑8.7%)\nActive Leads: 2,847\nProposals Sent: 342\nClose Rate: 34.2%\n\nKey Insights:\n1. Warehouse vertical driving 34% of pipeline value\n2. Tampa Bay region showing 12% stronger close rates\n3. Proposals over $50K taking avg 12 days longer to close\n\nRecommendation: Focus Q2 effort on mid-market warehouse accounts ($25K–$50K range) in the Tampa corridor.' },
  { id: 'ART-003', name: 'Ace Hardware Proposal v3', type: 'Proposal', size: '15.2 KB', created: '2 days ago', tags: ['proposal', 'ace-hardware'], content: 'XPS Intelligence — Proposal\nACE HARDWARE DISTRIBUTION\n\nProposed Solution: Full warehouse floor coating system\nScope: 24,000 sqft distribution center\nSystem: Polyaspartic + epoxy primer\nTimeline: 3-day installation (weekend)\n\nInvestment: $45,000\nGuarantee: 10-year warranty\nROI: Floor maintenance cost reduction of ~$8,000/year\n\nNext Steps: Review and sign by April 17, 2026' },
  { id: 'ART-004', name: 'Territory Coverage Map Notes', type: 'Notes', size: '3.7 KB', created: '3 days ago', tags: ['territory', 'strategy'], content: 'Southeast FL Territory Notes\n\nTop MSAs: Tampa, Orlando, Jacksonville, Miami, Fort Lauderdale\nCurrent Coverage: 34 accounts\nWhite Space: Medical facilities in Broward County\n\nPriority Targets:\n- Palm Beach County warehouse corridor\n- Alachua County industrial parks\n- Sarasota auto dealership row' },
  { id: 'ART-005', name: 'Competitive Analysis — ArmorThane', type: 'Research', size: '5.1 KB', created: '5 days ago', tags: ['competition', 'research'], content: 'ArmorThane Competitive Intelligence\n\nMarket Position: National, premium brand\nPricing: $12–18/sqft (15–20% above XPS)\nStrength: Brand recognition in retail segment\nWeakness: Longer lead times (3–4 weeks), limited local service\n\nXPS Advantage: Local presence, faster turnaround, comparable warranty\n\nTalk Track: "We offer the same quality at competitive pricing, with local crews that can start in 7 days vs their 3–4 week backlog."' },
];

const TYPE_COLORS = {
  Email: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
  Report: { bg: 'rgba(212,168,67,0.12)', color: GOLD, border: 'rgba(212,168,67,0.25)' },
  Proposal: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', border: 'rgba(34,197,94,0.25)' },
  Notes: { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', border: 'rgba(168,85,247,0.25)' },
  Research: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
};

function TypeBadge({ type }) {
  const s = TYPE_COLORS[type] || TYPE_COLORS.Notes;
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{type}</span>;
}

export default function Artifacts() {
  const [selected, setSelected] = useState(ARTIFACTS[0]);
  const [search, setSearch] = useState('');

  const filtered = ARTIFACTS.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase()) ||
    a.tags.some(t => t.includes(search.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="page-heading">Artifacts</div>
          <div className="page-sub" style={{ marginBottom: 0 }}>Agent-generated outputs, reports, and files</div>
        </div>
        <button className="btn-gold">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Artifact
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="xps-input" style={{ paddingLeft: 32 }} placeholder="Search artifacts..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Artifact Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(a => (
              <div key={a.id}
                onClick={() => setSelected(a)}
                style={{ padding: '12px 14px', borderRadius: 10, cursor: 'pointer', border: `1px solid ${selected?.id === a.id ? 'rgba(212,168,67,0.3)' : 'rgba(255,255,255,0.07)'}`, background: selected?.id === a.id ? 'rgba(212,168,67,0.05)' : 'var(--card-bg)', transition: 'all 0.15s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                  <TypeBadge type={a.type} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{a.created}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{a.size}</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                  {a.tags.map(t => (
                    <span key={t} style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        {selected ? (
          <div className="chart-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <TypeBadge type={selected.type} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{selected.id}</span>
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{selected.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{selected.size} · Created {selected.created}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-outline" style={{ fontSize: 12, padding: '6px 12px' }}>Copy</button>
                <button className="btn-gold" style={{ fontSize: 12, padding: '6px 14px' }}>Export</button>
              </div>
            </div>

            <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 20, fontSize: 13.5, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.85)', overflow: 'auto' }}>
              {selected.content}
            </div>

            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <button className="btn-outline" style={{ fontSize: 12 }}>Send to Lead</button>
              <button className="btn-outline" style={{ fontSize: 12 }}>Add to Knowledge Base</button>
              <button className="btn-outline" style={{ fontSize: 12 }}>Use as Template</button>
            </div>
          </div>
        ) : (
          <div className="chart-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'rgba(255,255,255,0.3)', minHeight: 300 }}>
            <div style={{ fontSize: 40 }}>📦</div>
            <div style={{ fontSize: 14 }}>Select an artifact to preview</div>
          </div>
        )}
      </div>
    </div>
  );
}
