import React, { useState } from 'react';
import {
  Square,
  Code2,
  Globe,
  Search,
  Image,
  Table,
  FileText,
} from 'lucide-react';

const gold = '#d4a843';
const BRAND_LOGO = '/brand/xps-shield-wings.jpg';

// Panel types that can appear in the workspace canvas
const PANEL_TYPES = [
  { id: 'blank',   label: 'Blank Canvas',   icon: Square, desc: 'Empty editor surface' },
  { id: 'code',    label: 'Code Output',    icon: Code2, desc: 'Generated code / scripts' },
  { id: 'scrape',  label: 'Scrape Result',  icon: Globe, desc: 'Web scraping output' },
  { id: 'search',  label: 'Search Results', icon: Search, desc: 'Research / web search' },
  { id: 'image',   label: 'Image Output',   icon: Image, desc: 'AI image generation result' },
  { id: 'data',    label: 'Structured Data',icon: Table, desc: 'JSON / table data output' },
  { id: 'report',  label: 'Report',         icon: FileText, desc: 'AI-generated report' },
];

export default function WorkspacePanel({ workspaceContent }) {
  const [activeType, setActiveType] = useState('blank');
  const [codeContent, setCodeContent] = useState('');

  // If a workspace action was triggered from chat, show it
  const hasExternalContent = workspaceContent && workspaceContent.content;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Workspace toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 18px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: '#111',
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.2, color: 'rgba(255,255,255,0.3)', marginRight: 4, whiteSpace: 'nowrap' }}>VIEW AS</span>
        {PANEL_TYPES.map(pt => (
          (() => {
            const Icon = pt.icon;
            return (
          <button
            key={pt.id}
            onClick={() => setActiveType(pt.id)}
            className="xps-electric-hover"
            data-active={activeType === pt.id ? 'true' : undefined}
            style={{
              position: 'relative',
              padding: '4px 12px',
              background: activeType === pt.id ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${activeType === pt.id ? 'rgba(212,168,67,0.35)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 6,
              color: activeType === pt.id ? gold : 'rgba(255,255,255,0.5)',
              fontSize: 12,
              fontWeight: activeType === pt.id ? 600 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <Icon size={13} className="xps-icon" />
            {pt.label}
          </button>
            );
          })()
        ))}
      </div>

      {/* Canvas area */}
      <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
        {hasExternalContent ? (
          <AIOutputRenderer content={workspaceContent.content} agent={workspaceContent.agent} />
        ) : activeType === 'blank' ? (
          <BlankCanvas />
        ) : activeType === 'code' ? (
          <CodeCanvas value={codeContent} onChange={setCodeContent} />
        ) : (
          <EmptyViewPlaceholder type={PANEL_TYPES.find(p => p.id === activeType)} />
        )}
      </div>
    </div>
  );
}

function BlankCanvas() {
  return (
    <div style={{
      height: '100%', minHeight: 400,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 14,
    }}>
      <div
        className="xps-logo xps-electric-border"
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img src={BRAND_LOGO} alt="XPS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>XPS Command Workspace</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', maxWidth: 380, lineHeight: 1.6 }}>
          Use the agent rail to the right to send commands.<br/>
          Results, code, search outputs, and AI artifacts will render here.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['Search the web', 'Generate code', 'Scrape a URL', 'Analyze data', 'Draft a report'].map(hint => (
          <span key={hint} style={{
            padding: '5px 12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 99,
            fontSize: 12,
            color: 'rgba(255,255,255,0.4)',
          }}>
            {hint}
          </span>
        ))}
      </div>
    </div>
  );
}

function CodeCanvas({ value, onChange }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px',
        background: '#1a1a1a',
        borderRadius: '10px 10px 0 0',
        border: '1px solid rgba(255,255,255,0.08)',
        borderBottom: 'none',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#f87171','#fbbf24','#4ade80'].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />
          ))}
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>code-output.txt</span>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="// Code or text output will appear here\n// You can also type or paste directly"
        style={{
          flex: 1,
          minHeight: 400,
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '0 0 10px 10px',
          color: 'rgba(255,255,255,0.85)',
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          padding: '14px 16px',
          resize: 'none',
          lineHeight: 1.7,
          outline: 'none',
        }}
      />
    </div>
  );
}

function AIOutputRenderer({ content, agent }) {
  // Detect if content has code blocks
  const hasCode = content.includes('```');

  return (
    <div style={{
      background: '#161616',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12,
      padding: '18px 20px',
      maxWidth: 860,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: gold, boxShadow: `0 0 6px ${gold}`,
        }} />
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: gold }}>
          AI OUTPUT — {agent?.toUpperCase() || 'AGENT'}
        </span>
      </div>
      <div style={{
        fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        fontFamily: hasCode ? "'JetBrains Mono','Fira Code','Courier New',monospace" : 'inherit',
      }}>
        {content}
      </div>
    </div>
  );
}

function EmptyViewPlaceholder({ type }) {
  if (!type) return null;
  return (
      <div style={{
        height: '100%', minHeight: 300,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 10,
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: 12,
      }}>
      {(() => {
        const Icon = type.icon || Square;
        return <Icon size={32} className="xps-icon" style={{ opacity: 0.5 }} />;
      })()}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>{type.label}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>{type.desc}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 6 }}>
          Trigger from agent rail to populate
        </div>
      </div>
    </div>
  );
}
