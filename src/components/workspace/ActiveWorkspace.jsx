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
    case 'code':             return <CodeBody obj={obj} />;
    case 'log':              return <LogBody obj={obj} />;
    case 'search':           return <RichBody obj={obj} accentColor='#60a5fa' />;
    case 'scrape':           return <ScrapeBody obj={obj} />;
    case 'data':             return <DataBody obj={obj} />;
    case 'artifact':         return <RichBody obj={obj} accentColor='#c084fc' />;
    case 'ui':
    case 'component':        return <UIBody obj={obj} />;
    case 'preview':          return <PreviewBody obj={obj} />;
    case 'image':
    case 'photo':            return <ImageBody obj={obj} />;
    case 'video':            return <VideoBody obj={obj} />;
    case 'artifact_bundle':  return <ArtifactBundleBody obj={obj} />;
    case 'workflow':         return <WorkflowBody obj={obj} />;
    case 'connector_action': return <ConnectorActionBody obj={obj} />;
    case 'agent_run':        return <AgentRunBody obj={obj} />;
    case 'runtime_state':    return <RuntimeStateBody obj={obj} />;
    case 'report':
    default:                 return <RichBody obj={obj} accentColor={GOLD} />;
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

      {obj.progress > 0 && obj.progress < 100 && (
        <>
          <Divider />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 60, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <div style={{ width: `${obj.progress}%`, height: '100%', background: GOLD, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{obj.progress}%</span>
          </div>
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
        OBJECTS: CODE · SEARCH · SCRAPE · REPORT · DATA · LOG · UI · IMAGE · VIDEO · AGENT RUN · WORKFLOW · RUNTIME STATE
      </div>
    </div>
  );
}

// ── UI/Component body ─────────────────────────────────────────────────────────

function UIBody({ obj }) {
  const { updateObject } = useWorkspace();
  const running = obj.status === RUN_STATUS.RUNNING;
  const [tab, setTab] = useState('code');

  // Detect HTML content for live preview
  const hasHtml = obj.content.includes('<') && (obj.content.includes('</') || obj.content.includes('/>'));
  const codeContent = obj.content.replace(/^```\w*\n?/, '').replace(/```$/, '');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tab strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        padding: '6px 14px',
        background: '#1a1a1a',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 5, marginRight: 12 }}>
          {['#f87171', '#fbbf24', '#4ade80'].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.7 }} />
          ))}
        </div>
        {['code', 'preview'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? 'rgba(255,255,255,0.08)' : 'none',
            border: 'none',
            color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.8,
            padding: '4px 10px',
            borderRadius: 4,
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}>
            {t}
          </button>
        ))}
        {running && <RunningPulse />}
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          {obj.agent ? `${obj.agent} · ` : ''}ui output
        </span>
      </div>

      {running && !obj.content ? (
        <RunningPlaceholder label="Building UI…" />
      ) : tab === 'preview' && hasHtml ? (
        <div style={{ flex: 1, overflow: 'hidden', padding: '16px 20px', background: '#fff' }}>
          <iframe
            srcDoc={codeContent}
            style={{ width: '100%', height: '100%', border: 'none' }}
            sandbox="allow-scripts"
            title="UI Preview"
          />
        </div>
      ) : (
        <textarea
          value={obj.content}
          onChange={e => updateObject(obj.id, e.target.value)}
          spellCheck={false}
          style={{
            flex: 1,
            background: '#0e0e16',
            border: 'none',
            color: '#c9b1ff',
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

// ── Preview body ──────────────────────────────────────────────────────────────

function PreviewBody({ obj }) {
  const running = obj.status === RUN_STATUS.RUNNING;
  const url = obj.meta?.url || (obj.content.startsWith('http') ? obj.content.trim() : null);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
        background: '#1a1a1a', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>👁️ {obj.agent ? `${obj.agent} · ` : ''}preview</span>
        {running && <RunningPulse />}
      </div>
      {running && !obj.content ? (
        <RunningPlaceholder label="Loading preview…" />
      ) : url ? (
        <iframe src={url} style={{ flex: 1, border: 'none' }} title="Preview" sandbox="allow-scripts allow-same-origin" />
      ) : (
        <RichBody obj={obj} accentColor='#a78bfa' />
      )}
    </div>
  );
}

// ── Image body ────────────────────────────────────────────────────────────────

function ImageBody({ obj }) {
  const running = obj.status === RUN_STATUS.RUNNING;
  const imgUrl = obj.meta?.url || (obj.content.startsWith('http') ? obj.content.trim() : null);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {running && !imgUrl ? (
        <RunningPlaceholder label="Generating image…" />
      ) : imgUrl ? (
        <div style={{
          background: '#161616',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <img
            src={imgUrl}
            alt={obj.title}
            style={{ width: '100%', maxHeight: 500, objectFit: 'contain', display: 'block' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div style={{ padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            {obj.title}
          </div>
        </div>
      ) : (
        <RichBody obj={obj} accentColor='#f472b6' />
      )}
    </div>
  );
}

// ── Video body ────────────────────────────────────────────────────────────────

function VideoBody({ obj }) {
  const videoUrl = obj.meta?.url || (obj.content.startsWith('http') ? obj.content.trim() : null);
  const running  = obj.status === RUN_STATUS.RUNNING;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      {running && !videoUrl ? (
        <RunningPlaceholder label="Processing video…" />
      ) : videoUrl ? (
        <div style={{
          background: '#161616',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <video controls style={{ width: '100%', maxHeight: 480 }}>
            <source src={videoUrl} />
            Your browser does not support video playback.
          </video>
          <div style={{ padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{obj.title}</div>
        </div>
      ) : (
        <RichBody obj={obj} accentColor='#fb923c' />
      )}
    </div>
  );
}

// ── Artifact bundle body ──────────────────────────────────────────────────────

function ArtifactBundleBody({ obj }) {
  const running   = obj.status === RUN_STATUS.RUNNING;
  const artifacts = obj.meta?.artifacts || [];
  const [selected, setSelected] = useState(0);

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
      {/* Artifact list sidebar */}
      <div style={{
        width: 200,
        flexShrink: 0,
        borderRight: '1px solid rgba(255,255,255,0.07)',
        overflowY: 'auto',
        padding: '10px 0',
        background: '#101010',
      }}>
        <div style={{ padding: '4px 12px', fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, marginBottom: 4 }}>
          ARTIFACTS ({artifacts.length})
        </div>
        {artifacts.map((art, i) => (
          <div
            key={i}
            onClick={() => setSelected(i)}
            style={{
              padding: '7px 12px',
              background: selected === i ? 'rgba(212,168,67,0.08)' : 'transparent',
              cursor: 'pointer',
              borderLeft: selected === i ? `2px solid ${GOLD}` : '2px solid transparent',
            }}
          >
            <div style={{ fontSize: 11, color: selected === i ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
              {art.title || `Artifact ${i + 1}`}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{art.type}</div>
          </div>
        ))}
        {artifacts.length === 0 && (
          <div style={{ padding: '8px 12px', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
            {running ? 'Collecting…' : 'No artifacts'}
          </div>
        )}
      </div>

      {/* Artifact content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {artifacts[selected] ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
            <div style={{
              background: '#161616',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
              padding: '14px 18px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, marginBottom: 10, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {artifacts[selected].type} · {artifacts[selected].title}
              </div>
              <RenderContent content={artifacts[selected].content || ''} />
            </div>
          </div>
        ) : (
          running ? <RunningPlaceholder label="Gathering artifacts…" /> : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
              Select an artifact
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── Workflow body ─────────────────────────────────────────────────────────────

function WorkflowBody({ obj }) {
  const running = obj.status === RUN_STATUS.RUNNING;
  const steps   = obj.steps || obj.meta?.steps || [];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      <div style={{
        background: '#161616',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        padding: '18px 22px',
        maxWidth: 700,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 6px #a78bfa' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', letterSpacing: 1, textTransform: 'uppercase' }}>
            {obj.agent ? `${obj.agent} · ` : ''}workflow
          </span>
          {running && <RunningPulse />}
        </div>

        {steps.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {steps.map((step, i) => {
              const color = step.status === 'complete' ? GREEN
                : step.status === 'error' ? RED
                : step.status === 'running' ? GOLD
                : 'rgba(255,255,255,0.25)';
              const icon = step.status === 'complete' ? '✓'
                : step.status === 'error' ? '✗'
                : step.status === 'running' ? '▶'
                : '○';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <span style={{ color, fontSize: 12, minWidth: 14, fontWeight: 700, marginTop: 1 }}>{icon}</span>
                  <div>
                    <span style={{ fontSize: 12, color, fontWeight: 500 }}>Step {step.step}: {step.label}</span>
                    {step.action && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>{step.action}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <RenderContent content={obj.content} />
      </div>
    </div>
  );
}

// ── Connector action body ─────────────────────────────────────────────────────

function ConnectorActionBody({ obj }) {
  const running    = obj.status === RUN_STATUS.RUNNING;
  const connectors = obj.meta?.connectors || {};
  const mode       = obj.meta?.mode || 'synthetic';

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      <div style={{
        background: '#0e1a14',
        border: '1px solid rgba(74,222,128,0.15)',
        borderRadius: 12,
        padding: '18px 22px',
        maxWidth: 700,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: 1, textTransform: 'uppercase' }}>
            🔌 CONNECTOR ACTION {running && '· running…'}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: modeColor(mode), fontWeight: 600 }}>
            {mode.toUpperCase()}
          </span>
        </div>

        {Object.entries(connectors).length > 0 && (
          <div style={{ marginBottom: 14 }}>
            {Object.entries(connectors).map(([name, info]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: info.mode === 'live' ? GREEN : info.mode === 'blocked' ? RED : '#fbbf24' }}>
                  {info.mode === 'live' ? '✓' : info.mode === 'blocked' ? '⛔' : '~'}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{name}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{info.status}</span>
                <span style={{ fontSize: 10, color: modeColor(info.mode), fontWeight: 600, marginLeft: 'auto' }}>
                  {(info.mode || '').toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}

        <RenderContent content={obj.content} />
      </div>
    </div>
  );
}

// ── Agent run body ────────────────────────────────────────────────────────────

function AgentRunBody({ obj }) {
  const running   = obj.status === RUN_STATUS.RUNNING;
  const steps     = obj.steps || obj.meta?.steps || [];
  const artifacts = obj.meta?.artifacts || [];
  const mode      = obj.meta?.mode || 'synthetic';
  const summary   = obj.meta?.summary || '';
  const progress  = obj.progress || 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Run header */}
      <div style={{
        padding: '10px 20px',
        background: '#111',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase' }}>
          🤖 {obj.agent ? `${obj.agent} · ` : ''}agent run
        </span>
        <span style={{ fontSize: 10, color: modeColor(mode), fontWeight: 600 }}>{mode.toUpperCase()}</span>
        {running && <RunningPulse />}
        {progress > 0 && progress < 100 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
            <div style={{ width: 80, height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: GOLD, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{progress}%</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Steps */}
        {steps.length > 0 && (
          <div style={{
            background: '#111',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            padding: '12px 16px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>
              Execution Plan
            </div>
            {steps.map((step, i) => {
              const color = step.status === 'complete' ? GREEN
                : step.status === 'error' ? RED
                : step.status === 'running' ? GOLD
                : step.status === 'skipped' ? 'rgba(255,255,255,0.2)'
                : 'rgba(255,255,255,0.4)';
              const icon = step.status === 'complete' ? '✓'
                : step.status === 'error' ? '✗'
                : step.status === 'running' ? '▶'
                : step.status === 'skipped' ? '–'
                : '○';
              return (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'flex-start' }}>
                  <span style={{ color, fontSize: 12, fontWeight: 700, minWidth: 14, marginTop: 1 }}>{icon}</span>
                  <span style={{ fontSize: 12, color, flex: 1 }}>
                    Step {step.step}: {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Result */}
        {(obj.content || summary) && !running && (
          <div style={{
            background: '#161616',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '14px 18px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' }}>
              Result
            </div>
            <RenderContent content={obj.content || summary} />
          </div>
        )}

        {/* Artifacts */}
        {artifacts.length > 0 && (
          <div style={{
            background: '#161616',
            border: '1px solid rgba(192,132,252,0.2)',
            borderRadius: 10,
            padding: '14px 18px',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#c084fc', letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' }}>
              Artifacts ({artifacts.length})
            </div>
            {artifacts.map((art, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: '#c084fc', fontWeight: 600, marginBottom: 4 }}>
                  📦 {art.title || `Artifact ${i + 1}`} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>({art.type})</span>
                </div>
                {art.content && (
                  <div style={{
                    background: '#0d0d0d',
                    borderRadius: 6,
                    padding: '8px 12px',
                    fontFamily: "'JetBrains Mono','Courier New',monospace",
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.7)',
                    whiteSpace: 'pre-wrap',
                    maxHeight: 200,
                    overflowY: 'auto',
                  }}>
                    {art.content.slice(0, 500)}
                    {art.content.length > 500 ? '\n…' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {running && <RunningPlaceholder label={`${obj.agent ?? 'Agent'} running…`} />}
      </div>
    </div>
  );
}

// ── Runtime state body ────────────────────────────────────────────────────────

function RuntimeStateBody({ obj }) {
  const connectors = obj.meta?.connectors || {};
  const blocked    = obj.meta?.blocked || [];
  const mode       = obj.meta?.mode || 'synthetic';

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      <div style={{
        background: '#0e0e18',
        border: '1px solid rgba(212,168,67,0.15)',
        borderRadius: 12,
        padding: '18px 22px',
        maxWidth: 700,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, boxShadow: `0 0 6px ${GOLD}` }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 1, textTransform: 'uppercase' }}>
            ⚙️ Runtime State
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: modeColor(mode), fontWeight: 600 }}>
            {mode.toUpperCase()}
          </span>
        </div>

        {/* Connector grid */}
        {Object.entries(connectors).length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' }}>
              Connectors
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
              {Object.entries(connectors).map(([name, info]) => {
                const c = info.mode === 'live' ? GREEN : info.mode === 'blocked' ? RED : '#fbbf24';
                return (
                  <div key={name} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${c}22`,
                    borderRadius: 8,
                    padding: '8px 10px',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 3 }}>{name}</div>
                    <div style={{ fontSize: 10, color: c, fontWeight: 600 }}>{(info.mode || 'unknown').toUpperCase()}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{info.status}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Blocked capabilities */}
        {blocked.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: RED, letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' }}>
              ⛔ Blocked Capabilities ({blocked.length})
            </div>
            {blocked.map((b, i) => (
              <div key={i} style={{
                background: 'rgba(239,68,68,0.05)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 6,
              }}>
                <div style={{ fontSize: 12, color: '#fca5a5', fontWeight: 600 }}>{b.capability}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{b.reason}</div>
                {b.required_env?.length > 0 && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                    Requires: {b.required_env.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <RenderContent content={obj.content} />
      </div>
    </div>
  );
}

// ── Mode colour helper ────────────────────────────────────────────────────────

function modeColor(mode) {
  if (mode === 'live')      return GREEN;
  if (mode === 'blocked')   return RED;
  if (mode === 'local')     return '#60a5fa';
  return '#fbbf24'; // synthetic
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
