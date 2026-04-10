import React from 'react';
import Panel from '../components/ui/Panel.jsx';
import { BookOpen, Search } from 'lucide-react';

const GOLD = '#c49e3c';

const articles = [
  { id: 1, title: 'XPS Product Catalogue 2026',        category: 'Products',   updated: '1d ago' },
  { id: 2, title: 'Objection Handling — Warehouse',     category: 'Sales',      updated: '3d ago' },
  { id: 3, title: 'Territory Pricing Guide — SE FL',    category: 'Pricing',    updated: '5d ago' },
  { id: 4, title: 'Application Specs: EpoxyShield Pro', category: 'Technical',  updated: '1w ago' },
  { id: 5, title: 'New Client Onboarding Process',      category: 'Process',    updated: '2w ago' },
];

export default function KnowledgeBase() {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Knowledge Base</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Product docs, playbooks, and sales resources</p>
      </div>

      <div style={{ position: 'relative', maxWidth: 420, marginBottom: 24 }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input placeholder="Search knowledge base…" style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px 9px 30px', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
      </div>

      <Panel title="Articles">
        {articles.map((a, i) => (
          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < articles.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: 'rgba(196,158,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={14} color={GOLD} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{a.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{a.category} · {a.updated}</div>
            </div>
          </div>
        ))}
      </Panel>

      <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 16px' }}>
        Google Drive: <strong style={{ color: '#6b7280' }}>missing</strong> — connect to sync full document library.
      </div>
    </div>
  );
}
