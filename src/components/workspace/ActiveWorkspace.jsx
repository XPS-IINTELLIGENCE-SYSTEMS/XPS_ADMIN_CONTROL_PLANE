/**
 * ActiveWorkspace — the real center workspace renderer.
 *
 * Renders a tabbed, live workspace where each tab is a workspace object managed
 * by the workspace engine.  The right-rail (ChatRail) creates/updates objects via
 * structured dispatch actions; this component simply renders whatever state the
 * engine holds: code editors, live logs, search results, scrape output, reports,
 * structured data, and artifacts.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useWorkspace, OBJ_TYPE_META, RUN_STATUS } from '../../lib/workspaceEngine.jsx';

const GOLD   = '#d4a843';
const RED    = '#ef4444';
const GREEN  = '#4ade80';

// ── Status dot colours ────────────────────────────────────────────────────────

const STATUS_COLOR = {
  [RUN_STATUS.IDLE]:    'rgba(255,255,255,0.25)',
  [RUN_STATUS.RUNNING]: GOLD,
  [RUN_STATUS.DONE]:    GREEN,
  [RUN_STATUS.ERROR]:   RED,
};

const STATUS_LABEL = {
  [RUN_STATUS.IDLE]:    'idle',
  [RUN_STATUS.RUNNING]: 'running…',
  [RUN_STATUS.DONE]:    'done',
  [RUN_STATUS.ERROR]:   'error',
};

// ── Main component ────────────────────────────────────────────────────────────

export default function ActiveWorkspace() {
  const { objects, activeId, setActive, closeObject } = useWorkspace();
  const activeObj = objects.find(o => o.id === activeId) ?? null;

  if (objects.length === 0) {
    return <EmptyState />;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Tab bar ── */}
      <TabBar objects={objects} activeId={activeId} onSelect={setActive} onClose={closeObject} />

      {/* ── Object body ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeObj ? <ObjectBody obj={activeObj} /> : null}
      </div>

      {/* ── Status bar ── */}
      {activeObj && <StatusBar obj={activeObj} />}
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar({ objects, activeId, onSelect, onClose }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      flexShrink: 0,
      overflowX: 'auto',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      background: '#111',
    }}>
      {objects.map(obj => {
        const meta  = OBJ_TYPE_META[obj.type] ?? { label: obj.type, icon: '◻' };
        const color = STATUS_COLOR[obj.status];
        const active = obj.id === activeId;
        return (
          <div
            key={obj.id}
            onClick={() => onSelect(obj.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px 8px 12px',
              borderRight: '1px solid rgba(255,255,255,0.07)',
              background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
              borderBottom: active ? `2px solid ${GOLD}` : '2px solid transparent',
              cursor: 'pointer',
              flexShrink: 0,
              minWidth: 0,
              maxWidth: 220,
              transition: 'background 0.12s',
            }}
          >
            {/* Running pulse or status dot */}
            {obj.status === RUN_STATUS.RUNNING ? (
              <RunningPulse />
            ) : (
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: color,
                flexShrink: 0,
              }} />
            )}

            <span style={{ fontSize: 12, opacity: 0.55, flexShrink: 0 }}>{meta.icon}</span>

            <span style={{
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              color: active ? '#fff' : 'rgba(255,255,255,0.55)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
              minWidth: 0,
            }}>
              {obj.title}
            </span>

            <button
              onClick={e => { e.stopPropagation(); onClose(obj.id); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: 1,
                padding: '0 2px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
              }}
              title="Close tab"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Object body dispatcher ────────────────────────────────────────────────────

function ObjectBody({ obj }) {
  switch (obj.type) {
    case 'code':     return <CodeBody obj={obj} />;
    case 'log':      return <LogBody obj={obj} />;
    case 'search':   return <RichBody obj={obj} accentColor='#60a5fa' />;
    case 'scrape':   return <ScrapeBody obj={obj} />;
    case 'data':     return <DataBody obj={obj} />;
    case 'artifact': return <RichBody obj={obj} accentColor='#c084fc' />;
    case 'report':
    default:         return <RichBody obj={obj} accentColor={GOLD} />;
  }
}

// ── Code body ─────────────────────────────────────────────────────────────────

function CodeBody({ obj }) {
  const { updateObject } = useWorkspace();
  const running = obj.status === RUN_STATUS.RUNNING;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Editor chrome */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        background: '#1a1a1a',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#f87171', '#fbbf24', '#4ade80'].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.7 }} />
          ))}
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>
          {obj.agent ? `${obj.agent} · ` : ''}code output
        </span>
        {running && <RunningPulse />}
      </div>

      {running && !obj.content ? (
        <RunningPlaceholder label="Agent generating code…" />
      ) : (
        <textarea
          value={obj.content}
          onChange={e => updateObject(obj.id, e.target.value)}
          spellCheck={false}
          style={{
            flex: 1,
            background: '#141414',
            border: 'none',
            color: 'rgba(255,255,255,0.88)',
            fontSize: 13,
            fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
            padding: '14px 18px',
            resize: 'none',
            lineHeight: 1.7,
            outline: 'none',
          }}
        />
      )}
    </div>
  );
}

// ── Rich body (report / search / artifact) ────────────────────────────────────

function RichBody({ obj, accentColor }) {
  const running = obj.status === RUN_STATUS.RUNNING;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      {running && !obj.content ? (
        <RunningPlaceholder label={`${obj.agent ?? 'Agent'} working…`} />
      ) : (
        <div style={{
          background: '#161616',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '18px 22px',
          maxWidth: 900,
        }}>
          {/* Header pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: accentColor, textTransform: 'uppercase' }}>
              {obj.agent ? `${obj.agent} · ` : ''}{OBJ_TYPE_META[obj.type]?.label ?? obj.type}
            </span>
            {running && <RunningPulse />}
          </div>

          <RenderContent content={obj.content} />
        </div>
      )}
    </div>
  );
}

// ── Scrape body ───────────────────────────────────────────────────────────────

function ScrapeBody({ obj }) {
  const running = obj.status === RUN_STATUS.RUNNING;
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      {running && !obj.content ? (
        <RunningPlaceholder label="Scraper running…" />
      ) : (
        <div style={{
          background: '#0e1a14',
          border: '1px solid rgba(74,222,128,0.15)',
          borderRadius: 12,
          padding: '18px 22px',
          maxWidth: 900,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, boxShadow: `0 0 6px ${GREEN}` }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: GREEN, textTransform: 'uppercase' }}>
              SCRAPE OUTPUT {running && '· running…'}
            </span>
          </div>
          <pre style={{
            fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
            fontSize: 12,
            color: 'rgba(255,255,255,0.8)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.65,
            margin: 0,
          }}>
            {obj.content}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Data body ─────────────────────────────────────────────────────────────────

function DataBody({ obj }) {
  const running = obj.status === RUN_STATUS.RUNNING;
  let parsed = null;
  let parseError = false;

  if (obj.content) {
    try {
      const jsonMatch = obj.content.match(/```(?:json)?\s*([\s\S]+?)```/) || [null, obj.content];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch {
      parseError = true;
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      {running && !obj.content ? (
        <RunningPlaceholder label="Fetching data…" />
      ) : parseError || parsed === null ? (
        <RichBody obj={obj} accentColor='#fbbf24' />
      ) : Array.isArray(parsed) ? (
        <DataTable rows={parsed} />
      ) : (
        <JsonViewer data={parsed} />
      )}
    </div>
  );
}

function DataTable({ rows }) {
  if (!rows.length) return <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Empty dataset</span>;
  const cols = Object.keys(rows[0]);
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c} style={{ padding: '8px 14px', background: 'rgba(212,168,67,0.1)', color: GOLD, fontWeight: 600, textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap', fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
              {cols.map(c => (
                <td key={c} style={{ padding: '7px 14px', color: 'rgba(255,255,255,0.8)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {String(row[c] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JsonViewer({ data }) {
  return (
    <pre style={{
      background: '#141414',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: '16px 18px',
      fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
      fontSize: 12,
      color: 'rgba(255,255,255,0.8)',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      lineHeight: 1.65,
    }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

// ── Log body ──────────────────────────────────────────────────────────────────

function LogBody({ obj }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [obj.logs.length]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }}>
      {/* Header content if any */}
      {obj.content && (
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>
          {obj.content}
        </div>
      )}

      {/* Log lines */}
      {obj.logs.map((entry, i) => (
        <LogLine key={i} entry={entry} />
      ))}

      {obj.status === RUN_STATUS.RUNNING && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <RunningPulse />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>running…</span>
        </div>
      )}

      {obj.logs.length === 0 && obj.status !== RUN_STATUS.RUNNING && (
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>No log entries yet.</span>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function LogLine({ entry }) {
  const ts = new Date(entry.ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const lower = entry.line.toLowerCase();
  const isErr  = lower.startsWith('error') || lower.startsWith('err ') || lower.includes('[error]');
  const isWarn = lower.startsWith('warn') || lower.includes('[warn]');
  const isDone = lower.startsWith('✓') || lower.includes('done') || lower.includes('complete') || lower.includes('[done]');

  const color = isErr ? RED : isWarn ? '#fbbf24' : isDone ? GREEN : 'rgba(255,255,255,0.72)';

  return (
    <div style={{ display: 'flex', gap: 10, fontSize: 12, lineHeight: 1.55, marginBottom: 2 }}>
      <span style={{ color: 'rgba(255,255,255,0.2)', flexShrink: 0 }}>{ts}</span>
      <span style={{ color, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{entry.line}</span>
    </div>
  );
}

// ── Content renderer (handles code blocks + plain text) ───────────────────────

function RenderContent({ content }) {
  if (!content) return null;

  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const inner = part.replace(/^```\w*\n?/, '').replace(/```$/, '');
          return (
            <pre key={i} style={{
              background: '#0d0d0d',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '12px 14px',
              fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
              fontSize: 12,
              overflowX: 'auto',
              margin: '10px 0',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.88)',
            }}>
              {inner}
            </pre>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

// ── Status bar ────────────────────────────────────────────────────────────────

function StatusBar({ obj }) {
  const color  = STATUS_COLOR[obj.status];
  const label  = STATUS_LABEL[obj.status];
  const updAgo = Math.round((Date.now() - obj.updatedAt) / 1000);
  const updStr = updAgo < 5 ? 'just now' : updAgo < 60 ? `${updAgo}s ago` : `${Math.round(updAgo / 60)}m ago`;
  const meta   = OBJ_TYPE_META[obj.type] ?? { label: obj.type, icon: '' };

  return (
    <div style={{
      height: 26,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '0 16px',
      background: '#0c0c0c',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      flexShrink: 0,
    }}>
      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {obj.status === RUN_STATUS.RUNNING
          ? <RunningPulse />
          : <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
        }
        <span style={{ fontSize: 10, color, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</span>
      </div>

      <Divider />

      {/* Type */}
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{meta.icon} {meta.label}</span>

      {obj.agent && (
        <>
          <Divider />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{obj.agent}</span>
        </>
      )}

      {obj.logs.length > 0 && (
        <>
          <Divider />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{obj.logs.length} log lines</span>
        </>
      )}

      <Divider />
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>updated {updStr}</span>
    </div>
  );
}

function Divider() {
  return <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />;
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 18,
      padding: 40,
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: 18,
        background: 'rgba(212,168,67,0.07)',
        border: '1px solid rgba(212,168,67,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 32,
      }}>
        🛡️
      </div>

      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
          XPS Workspace
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
          The workspace is live and ready. Use the agent rail on the right to send a command —
          results, code, reports, logs, and artifacts will appear here as real objects you can
          inspect and edit.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
        {[
          { label: 'Generate code',    hint: '"Write a Python scraper for…"' },
          { label: 'Search the web',   hint: '"Research competitors in…"' },
          { label: 'Scrape a URL',     hint: '"Scrape products from…"' },
          { label: 'Analyze data',     hint: '"Summarize this dataset…"' },
          { label: 'Draft a report',   hint: '"Write a proposal for…"' },
        ].map(({ label, hint }) => (
          <div
            key={label}
            title={hint}
            style={{
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 99,
              fontSize: 12,
              color: 'rgba(255,255,255,0.45)',
              cursor: 'default',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.5 }}>
        OBJECT TYPES: CODE · SEARCH · SCRAPE · REPORT · DATA · LOG · ARTIFACT
      </div>
    </div>
  );
}

// ── Running indicators ────────────────────────────────────────────────────────

function RunningPulse() {
  return (
    <span style={{
      display: 'inline-block',
      width: 7,
      height: 7,
      borderRadius: '50%',
      background: GOLD,
      boxShadow: `0 0 5px ${GOLD}`,
      animation: 'ws-pulse 1s ease-in-out infinite',
      flexShrink: 0,
    }}>
      <style>{`
        @keyframes ws-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </span>
  );
}

function RunningPlaceholder({ label }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      padding: 40,
      height: '100%',
    }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: GOLD,
            animation: `ws-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
        <style>{`
          @keyframes ws-bounce {
            0%, 80%, 100% { transform: scale(0.5); opacity: 0.3; }
            40% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
    </div>
  );
}
