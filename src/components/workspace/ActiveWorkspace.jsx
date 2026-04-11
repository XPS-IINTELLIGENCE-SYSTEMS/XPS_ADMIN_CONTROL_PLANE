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
import {
  Plug, Ban, Package, Link, Camera, Image, Archive, Zap, FileImage, FileText,
  Palette, MoveUp, MoveDown, Trash2, CheckCircle, XCircle, Plus, LayoutGrid,
} from 'lucide-react';
import { useWorkspace, OBJ_TYPE_META, RUN_STATUS, OBJ_TYPE, genId } from '../../lib/workspaceEngine.jsx';
import { DEFAULT_UI_STATE, normalizeUiState, applyUiPatch, createHistoryEntry, createDefaultUiState, validateUiState } from '../../lib/uiMutations.js';
import { persistUiPreview, persistUiVersion, persistUiRollback } from '../../lib/supabasePersistence.js';
import { getGovernance, subscribeGovernance } from '../../lib/governance.js';
import { getConnectionPrefs } from '../../lib/connectionPrefs.js';
import { executeSendGridEmail, executeTwilioCall } from '../../lib/operatorActions.js';

const GOLD   = '#d4a843';
const RED    = '#ef4444';
const GREEN  = '#4ade80';
const BRAND_LOGO = '/brand/xps-shield-wings.png';

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
  const { objects, activeId, setActive, closeObject, createObject } = useWorkspace();
  const activeObj = objects.find(o => o.id === activeId) ?? null;

  if (objects.length === 0) {
    return <EmptyState createObject={createObject} setActive={setActive} />;
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
            className="xps-electric-hover"
            data-active={active ? 'true' : undefined}
            style={{
              position: 'relative',
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
              className="xps-electric-hover"
              style={{
                position: 'relative',
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
    case 'pre_stage':
    case 'stage':
    case 'hubspot_export':
    case 'airtable_export':
    case 'recovery_queue':   return <DataBody obj={obj} />;
    case 'runtime_ledger':   return <RichBody obj={obj} accentColor='#fbbf24' />;
    case 'ui':
    case 'component':        return <UIBody obj={obj} />;
    case 'preview':          return <PreviewBody obj={obj} />;
    case 'image':
    case 'photo':            return <ImageBody obj={obj} />;
    case 'video':            return <VideoBody obj={obj} />;
    case 'artifact_bundle':  return <ArtifactBundleBody obj={obj} />;
    case 'workflow':         return <WorkflowBody obj={obj} />;
    case 'site_mutation':    return <WorkflowBody obj={obj} />;
    case 'connector_action': return <ConnectorActionBody obj={obj} />;
    case 'agent_run':        return <AgentRunBody obj={obj} />;
    case 'runtime_state':    return <RuntimeStateBody obj={obj} />;
    // Phase 4 — browser + parallel
    case 'browser_session':    return <BrowserSessionBody obj={obj} />;
    case 'browser_result':     return <BrowserResultBody obj={obj} />;
    case 'page_snapshot':      return <PageSnapshotBody obj={obj} />;
    case 'evidence_bundle':    return <EvidenceBundleBody obj={obj} />;
    case 'parallel_run_group': return <ParallelRunGroupBody obj={obj} />;
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
  const { updateObject } = useWorkspace();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(obj.content || '');

  useEffect(() => {
    setDraft(obj.content || '');
  }, [obj.content]);

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
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="xps-electric-hover"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { updateObject(obj.id, draft); setEditing(false); }}
                    className="xps-electric-hover"
                    style={{
                      background: 'rgba(74,222,128,0.12)',
                      border: '1px solid rgba(74,222,128,0.3)',
                      color: '#4ade80',
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setDraft(obj.content || ''); setEditing(false); }}
                    className="xps-electric-hover"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {editing ? (
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              spellCheck={false}
              style={{
                width: '100%',
                minHeight: 240,
                background: '#0f0f0f',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '12px 14px',
                color: 'rgba(255,255,255,0.85)',
                fontSize: 13,
                lineHeight: 1.7,
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          ) : (
            <RenderContent content={obj.content} />
          )}
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
  const isDone = lower.includes('done') || lower.includes('complete');

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

function EmptyState({ createObject, setActive }) {
  const typeList = Object.values(OBJ_TYPE_META)
    .map(meta => meta.label.toUpperCase())
    .join(' · ');
  const QUICK_ACTIONS = [
    { label: 'New Code Object',  type: OBJ_TYPE.CODE,   title: 'Untitled Code',   content: '// Start coding here\n' },
    { label: 'New Report',       type: OBJ_TYPE.REPORT,  title: 'Untitled Report', content: '# Report\n\nStart writing...' },
    { label: 'New Data Object',  type: OBJ_TYPE.DATA,    title: 'Untitled Data',   content: '' },
    { label: 'New Log',          type: OBJ_TYPE.LOG,     title: 'Run Log',         content: '' },
    { label: 'New Workflow',     type: OBJ_TYPE.WORKFLOW, title: 'Workflow Runbook', content: '1. Define objective\n2. Stage connectors\n3. Execute\n4. Validate\n5. Roll back if needed' },
    { label: 'New UI Canvas',    type: OBJ_TYPE.UI,      title: 'UI Editor Canvas', content: 'Editable UI canvas', buildMeta: () => {
      const initial = createDefaultUiState();
      return { uiEditor: true, uiState: initial, history: [createHistoryEntry(initial, 'Initial UI state', 'seed')] };
    } },
  ];

  const handleCreate = (action) => {
    const id = genId();
    const meta = action.buildMeta ? action.buildMeta() : action.meta;
    createObject({ id, type: action.type, title: action.title, content: action.content, status: RUN_STATUS.IDLE, meta });
    setActive(id);
  };

  return (
    <div data-testid="workspace-empty-state" style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 18, padding: 40,
    }}>
      <div
        className="xps-logo"
        style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img src={BRAND_LOGO} alt="XPS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>

      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>
          XPS Workspace
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
          The workspace is live and ready. Use the agent rail on the right to send a command,
          or create an object directly to start building.
        </div>
      </div>

      {/* Quick create buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {QUICK_ACTIONS.map(action => (
          <button
            key={action.label}
            data-testid={`quick-create-${action.type}`}
            onClick={() => handleCreate(action)}
            style={{
              padding: '7px 16px',
              background: 'rgba(212,168,67,0.08)',
              border: '1px solid rgba(212,168,67,0.2)',
              borderRadius: 8, fontSize: 12, fontWeight: 600,
              color: '#d4a843', cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(212,168,67,0.14)';
              e.currentTarget.style.borderColor = 'rgba(212,168,67,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(212,168,67,0.08)';
              e.currentTarget.style.borderColor = 'rgba(212,168,67,0.2)';
            }}
          >
            + {action.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
        {[
          { label: 'Generate code',  hint: '"Write a Python scraper for…"' },
          { label: 'Search the web', hint: '"Research competitors in…"' },
          { label: 'Scrape a URL',   hint: '"Scrape products from…"' },
          { label: 'Draft a report', hint: '"Write a proposal for…"' },
        ].map(({ label, hint }) => (
          <div key={label} title={hint} style={{
            padding: '5px 12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 99, fontSize: 12, color: 'rgba(255,255,255,0.35)',
          }}>
            {label}
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', letterSpacing: 0.5 }}>
        {typeList}
      </div>
    </div>
  );
}

// ── UI/Component body ─────────────────────────────────────────────────────────

function UIBody({ obj }) {
  const { updateObject, patchObject, createObject } = useWorkspace();
  const running = obj.status === RUN_STATUS.RUNNING;
  const [tab, setTab] = useState('code');
  const [editorView, setEditorView] = useState('canvas');
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [draftState, setDraftState] = useState(normalizeUiState(obj.meta?.uiState || DEFAULT_UI_STATE));
  const [notice, setNotice] = useState(null);
  const [governance, setGovernanceState] = useState(getGovernance());
  const isEditor = obj.meta?.uiEditor || obj.meta?.uiState;

  useEffect(() => {
    const unsub = subscribeGovernance(setGovernanceState);
    return unsub;
  }, []);

  useEffect(() => {
    if (isEditor && !obj.meta?.uiState) {
      const initial = createDefaultUiState();
      const history = [createHistoryEntry(initial, 'Initial UI state', 'seed')];
      patchObject(obj.id, { meta: { ...obj.meta, uiEditor: true, uiState: initial, history } });
    }
  }, [isEditor, obj.id, obj.meta?.uiState]);

  const appliedState = normalizeUiState(obj.meta?.uiState || DEFAULT_UI_STATE);
  const previewState = obj.meta?.preview?.state ? normalizeUiState(obj.meta.preview.state) : null;
  const activeState = previewState || appliedState;
  const activeStateKey = [
    activeState.theme.primaryColor,
    activeState.theme.accentColor,
    activeState.theme.background,
    activeState.theme.fontFamily,
    activeState.theme.borderRadius,
    activeState.components.map(c => c.id).join('|'),
    previewState ? 'preview' : 'applied',
  ].join('|');
  const history = Array.isArray(obj.meta?.history) ? obj.meta.history : [];

  useEffect(() => {
    if (isEditor) {
      setDraftState(activeState);
    }
  }, [isEditor, obj.updatedAt, obj.meta?.preview?.id, activeStateKey]);

  useEffect(() => {
    if (!isEditor) return;
    if (!selectedComponentId || !draftState.components.find(c => c.id === selectedComponentId)) {
      setSelectedComponentId(draftState.components[0]?.id || null);
    }
  }, [isEditor, draftState.components, selectedComponentId]);

  const selectedComponent = draftState.components.find(c => c.id === selectedComponentId);
  const hasPreview = !!previewState;
  const previewMeta = obj.meta?.preview;

  const updateTheme = (patch) => {
    setDraftState(prev => applyUiPatch(prev, { theme: patch }));
    setNotice(null);
  };

  const updateSite = (patch) => {
    setDraftState(prev => applyUiPatch(prev, { site: patch }));
    setNotice(null);
  };

  const toggleFeatureFlag = (flag) => {
    setDraftState(prev => applyUiPatch(prev, { toggleFeatureFlag: flag }));
    setNotice(null);
  };

  const updateComponent = (patch) => {
    if (!selectedComponentId) return;
    setDraftState(prev => applyUiPatch(prev, { updateComponent: { id: selectedComponentId, patch } }));
    setNotice(null);
  };

  const addComponent = (type) => {
    setDraftState(prev => applyUiPatch(prev, { addComponent: type }));
    setNotice(null);
  };

  const moveComponent = (direction) => {
    if (!selectedComponentId) return;
    setDraftState(prev => applyUiPatch(prev, { moveComponent: { id: selectedComponentId, direction } }));
    setNotice(null);
  };

  const removeComponent = () => {
    if (!selectedComponentId) return;
    setDraftState(prev => applyUiPatch(prev, { removeComponentId: selectedComponentId }));
    setSelectedComponentId(null);
    setNotice(null);
  };

  const createPreview = (state, summary, source = 'manual') => {
    const validation = validateUiState(state);
    const previewId = genId();
    const nextPreview = {
      id: previewId,
      summary,
      source,
      createdAt: new Date().toISOString(),
      state,
      validation,
    };
    patchObject(obj.id, {
      meta: {
        ...obj.meta,
        uiEditor: true,
        uiState: appliedState,
        history: history.length ? history : [createHistoryEntry(appliedState, 'Initial UI state', 'seed')],
        preview: nextPreview,
      },
    });
    createObject({
      type: OBJ_TYPE.SITE_MUTATION,
      title: `Site Mutation Preview — ${summary}`,
      content: `Preview ready.\n\nSummary: ${summary}\nValidation: ${validation.summary}${validation.issues.length ? `\n${validation.issues.map(issue => `- ${issue}`).join('\n')}` : ''}`,
      status: validation.valid ? RUN_STATUS.DONE : RUN_STATUS.ERROR,
      meta: { stage: 'preview', summary, source, validation, targetId: obj.id, previewId },
    });
    createObject({
      type: OBJ_TYPE.PREVIEW,
      title: `UI Preview — ${summary}`,
      content: `${summary}\n\n${validation.summary}${validation.issues.length ? `\n${validation.issues.map(issue => `- ${issue}`).join('\n')}` : ''}`,
      status: RUN_STATUS.IDLE,
      meta: { previewType: 'ui', targetId: obj.id, previewId, summary, state, source, validation },
    });
    persistUiPreview({ previewId, targetId: obj.id, state, summary, source }).catch(() => {});
    setEditorView('preview');
  };

  const handlePreview = () => {
    if (!governance.allowUiEdits) {
      setNotice('UI edits are blocked by governance.');
      return;
    }
    createPreview(draftState, 'Manual UI preview', 'manual');
  };

  const handleApply = () => {
    if (governance.previewOnly || governance.requireApproval) {
      setNotice('Apply blocked by governance (preview-only or approval required).');
      return;
    }
    if (!previewMeta?.state) {
      setNotice('No preview ready to apply.');
      return;
    }
    if (previewMeta.validation && !previewMeta.validation.valid) {
      setNotice(`Apply blocked by validation. ${previewMeta.validation.issues.join(' ')}`);
      return;
    }
    const nextState = normalizeUiState(previewMeta.state);
    const updatedHistory = [...history, createHistoryEntry(nextState, previewMeta.summary || 'Apply preview', previewMeta.source || 'manual')];
    patchObject(obj.id, {
      meta: { ...obj.meta, uiState: nextState, history: updatedHistory, preview: null },
    });
    const latest = updatedHistory[updatedHistory.length - 1];
    persistUiVersion({
      versionId: latest.id,
      targetId: obj.id,
      state: nextState,
      summary: latest.summary,
      source: latest.source,
    }).catch(() => {});
    createObject({
      type: OBJ_TYPE.SITE_MUTATION,
      title: `Site Mutation Apply — ${previewMeta.summary || 'Apply preview'}`,
      content: `Applied governed mutation.\n\nSummary: ${previewMeta.summary || 'Apply preview'}\nValidation: ${previewMeta.validation?.summary || 'Validation passed.'}`,
      status: RUN_STATUS.DONE,
      meta: { stage: 'apply', summary: previewMeta.summary || 'Apply preview', source: previewMeta.source || 'manual', validation: previewMeta.validation || { valid: true, issues: [] }, targetId: obj.id },
    });
    if (previewMeta.source === 'rollback' && updatedHistory.length > 1) {
      persistUiRollback({
        rollbackId: genId(),
        targetId: obj.id,
        fromVersion: updatedHistory[updatedHistory.length - 2]?.id,
        toVersion: latest.id,
        summary: latest.summary,
      }).catch(() => {});
    }
    setNotice('Preview applied. Rollback available.');
  };

  const handleCancelPreview = () => {
    patchObject(obj.id, { meta: { ...obj.meta, preview: null } });
    setNotice('Preview cancelled.');
  };

  const handleRollbackPreview = (entry) => {
    if (!entry?.state) return;
    createPreview(normalizeUiState(entry.state), `Rollback to ${entry.summary || entry.id}`, 'rollback');
  };

  // Detect HTML content for live preview (non-editor UI objects)
  const hasHtml = obj.content.includes('<') && (obj.content.includes('</') || obj.content.includes('/>'));
  const codeContent = obj.content.replace(/^```\w*\n?/, '').replace(/```$/, '');

  if (!isEditor) {
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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        background: '#111',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <LayoutGrid size={14} style={{ color: GOLD }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 0.8, textTransform: 'uppercase' }}>
          UI Editor {hasPreview && '· Preview Pending'}
        </span>
        {hasPreview && <span style={{ fontSize: 10, color: '#fbbf24', marginLeft: 6 }}>Confirm to apply</span>}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button onClick={() => setEditorView('canvas')} style={editorTabStyle(editorView === 'canvas')}>Canvas</button>
          <button onClick={() => setEditorView('preview')} style={editorTabStyle(editorView === 'preview')}>Preview</button>
          <button onClick={() => setEditorView('history')} style={editorTabStyle(editorView === 'history')}>History</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', overflow: 'hidden' }}>
        <div style={{ background: (editorView === 'preview' ? (previewState || draftState) : draftState).theme.background, padding: 18, overflow: 'auto' }}>
          <UiCanvas
            state={editorView === 'preview' ? (previewState || draftState) : draftState}
            selectedId={selectedComponentId}
            onSelect={setSelectedComponentId}
            previewMode={hasPreview}
          />
        </div>

        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', background: '#0f0f0f', overflowY: 'auto' }}>
          {editorView === 'history' ? (
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' }}>
                Version History
              </div>
              {history.length === 0 && (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>No versions yet.</div>
              )}
              {history.slice().reverse().map(entry => (
                <div key={entry.id} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  marginBottom: 8,
                }}>
                  <div style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600 }}>{entry.summary}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{new Date(entry.ts).toLocaleString()}</div>
                  <button
                    onClick={() => handleRollbackPreview(entry)}
                    className="xps-electric-hover"
                    style={{
                      marginTop: 6,
                      padding: '4px 8px',
                      fontSize: 10,
                      borderRadius: 6,
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: '#ef4444',
                      background: 'rgba(239,68,68,0.08)',
                      cursor: 'pointer',
                    }}
                  >
                    Rollback Preview
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Site Mutation</div>
                <input
                  value={draftState.site.pageTitle || ''}
                  onChange={e => updateSite({ pageTitle: e.target.value })}
                  placeholder="Page title"
                  style={editorInputStyle}
                />
                <input
                  value={draftState.site.route || ''}
                  onChange={e => updateSite({ route: e.target.value })}
                  placeholder="/route"
                  style={editorInputStyle}
                />
                <textarea
                  value={draftState.site.description || ''}
                  onChange={e => updateSite({ description: e.target.value })}
                  placeholder="Page description"
                  style={{ ...editorInputStyle, minHeight: 56 }}
                />
                <input
                  value={draftState.site.effectPreset || ''}
                  onChange={e => updateSite({ effectPreset: e.target.value })}
                  placeholder="Effect preset"
                  style={editorInputStyle}
                />
                <input
                  value={(draftState.site.navItems || []).join(', ')}
                  onChange={e => updateSite({ navItems: e.target.value.split(',').map(item => item.trim()).filter(Boolean) })}
                  placeholder="Navigation items"
                  style={editorInputStyle}
                />
                <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                  {Object.entries(draftState.site.featureFlags || {}).map(([flag, enabled]) => (
                    <label key={flag} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                      <input
                        type="checkbox"
                        checked={!!enabled}
                        onChange={() => toggleFeatureFlag(flag)}
                        style={{ accentColor: GOLD }}
                      />
                      <span>{flag}</span>
                      <span style={{ marginLeft: 'auto', color: enabled ? GREEN : 'rgba(255,255,255,0.3)' }}>
                        {enabled ? 'enabled' : 'disabled'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Theme</div>
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Primary</label>
                <input type="color" value={draftState.theme.primaryColor} onChange={e => updateTheme({ primaryColor: e.target.value })} style={{ width: '100%', height: 32, marginBottom: 8 }} />
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Accent</label>
                <input type="color" value={draftState.theme.accentColor} onChange={e => updateTheme({ accentColor: e.target.value })} style={{ width: '100%', height: 32, marginBottom: 8 }} />
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Background</label>
                <input type="color" value={draftState.theme.background} onChange={e => updateTheme({ background: e.target.value })} style={{ width: '100%', height: 32, marginBottom: 8 }} />
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Font</label>
                <input
                  value={draftState.theme.fontFamily}
                  onChange={e => updateTheme({ fontFamily: e.target.value })}
                  style={editorInputStyle}
                />
                <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 8, display: 'block' }}>Border Radius</label>
                <input
                  type="number"
                  value={draftState.theme.borderRadius}
                  onChange={e => updateTheme({ borderRadius: Number(e.target.value) })}
                  style={editorInputStyle}
                />
              </div>

              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Components</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {['section', 'card', 'button', 'tabs'].map(type => (
                    <button
                      key={type}
                      onClick={() => addComponent(type)}
                      className="xps-electric-hover"
                      style={{
                        padding: '4px 8px',
                        fontSize: 10,
                        borderRadius: 6,
                        border: '1px solid rgba(212,168,67,0.3)',
                        background: 'rgba(212,168,67,0.12)',
                        color: GOLD,
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={10} style={{ marginRight: 4 }} /> {type}
                    </button>
                  ))}
                </div>

                {selectedComponent ? (
                  <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
                      Editing: {selectedComponent.type}
                    </div>
                    {(selectedComponent.type === 'card' || selectedComponent.type === 'section') && (
                      <>
                        <input
                          value={selectedComponent.title || ''}
                          onChange={e => updateComponent({ title: e.target.value })}
                          placeholder="Title"
                          style={editorInputStyle}
                        />
                        <textarea
                          value={selectedComponent.body || ''}
                          onChange={e => updateComponent({ body: e.target.value })}
                          placeholder="Body"
                          style={{ ...editorInputStyle, minHeight: 60 }}
                        />
                      </>
                    )}
                    {selectedComponent.type === 'button' && (
                      <input
                        value={selectedComponent.label || ''}
                        onChange={e => updateComponent({ label: e.target.value })}
                        placeholder="Button label"
                        style={editorInputStyle}
                      />
                    )}
                    {selectedComponent.type === 'tabs' && (
                      <input
                        value={(selectedComponent.tabs || []).join(', ')}
                        onChange={e => updateComponent({ tabs: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                        placeholder="Tabs (comma separated)"
                        style={editorInputStyle}
                      />
                    )}
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button onClick={() => moveComponent(-1)} style={miniActionStyle}><MoveUp size={12} /></button>
                      <button onClick={() => moveComponent(1)} style={miniActionStyle}><MoveDown size={12} /></button>
                      <button onClick={removeComponent} style={{ ...miniActionStyle, color: '#ef4444' }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Select a component to edit.</div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {!hasPreview && (
                  <button onClick={handlePreview} className="xps-electric-hover" style={primaryActionStyle}>
                    <CheckCircle size={12} /> Preview Changes
                  </button>
                )}
                {hasPreview && (
                  <>
                    <button onClick={handleApply} className="xps-electric-hover" style={primaryActionStyle}>
                      <CheckCircle size={12} /> Apply Preview
                    </button>
                    <button onClick={handleCancelPreview} className="xps-electric-hover" style={secondaryActionStyle}>
                      <XCircle size={12} /> Cancel Preview
                    </button>
                  </>
                )}
              </div>

              {notice && (
                <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
                  {notice}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const editorInputStyle = {
  width: '100%',
  padding: '7px 9px',
  borderRadius: 7,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)',
  color: '#e2e8f0',
  fontSize: 11,
  marginBottom: 8,
};

const editorTabStyle = (active) => ({
  background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  color: active ? '#fff' : 'rgba(255,255,255,0.45)',
  fontSize: 10,
  fontWeight: 600,
  padding: '4px 8px',
  cursor: 'pointer',
});

const miniActionStyle = {
  width: 26,
  height: 26,
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: 'rgba(255,255,255,0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const primaryActionStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid rgba(74,222,128,0.4)',
  background: 'rgba(74,222,128,0.12)',
  color: '#4ade80',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryActionStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid rgba(239,68,68,0.3)',
  background: 'rgba(239,68,68,0.08)',
  color: '#ef4444',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
};

function UiCanvas({ state, selectedId, onSelect, previewMode }) {
  const theme = state.theme;
  const site = state.site || {};
  return (
    <div style={{
      background: theme.surface,
      borderRadius: theme.borderRadius,
      border: `${theme.borderWidth}px ${theme.borderStyle} ${theme.borderColor}`,
      padding: 18,
      boxShadow: theme.shadow,
      fontFamily: theme.fontFamily,
      color: theme.textColor,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      transition: 'all 0.2s ease',
    }}>
      {previewMode && (
        <div style={{ fontSize: 10, color: '#fbbf24', letterSpacing: 0.6, textTransform: 'uppercase' }}>
          Preview Mode
        </div>
      )}
      <div style={{
        borderRadius: theme.borderRadius - 2,
        border: `1px solid ${theme.borderColor}`,
        padding: 12,
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: theme.primaryColor }}>{site.pageTitle}</div>
          <code style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{site.route}</code>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: theme.accentColor, textTransform: 'uppercase', letterSpacing: 0.7 }}>
            {site.effectPreset}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 6 }}>{site.description}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {(site.navItems || []).map((item) => (
            <span key={item} style={{
              padding: '4px 8px',
              borderRadius: 999,
              border: `1px solid ${theme.borderColor}`,
              fontSize: 10,
              color: 'rgba(255,255,255,0.72)',
            }}>
              {item}
            </span>
          ))}
        </div>
      </div>
      {state.components.map(component => {
        const isSelected = component.id === selectedId;
        const baseStyle = {
          borderRadius: theme.borderRadius - 2,
          border: isSelected ? `1px solid ${theme.primaryColor}` : `1px solid ${theme.borderColor}`,
          padding: 12,
          background: component.type === 'card' ? theme.gradient : 'rgba(255,255,255,0.03)',
          cursor: 'pointer',
        };
        if (component.type === 'section') {
          return (
            <div key={component.id} style={baseStyle} onClick={() => onSelect?.(component.id)}>
              <div style={{ fontSize: 14, fontWeight: 700, color: theme.primaryColor, marginBottom: 4 }}>{component.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{component.body}</div>
            </div>
          );
        }
        if (component.type === 'card') {
          return (
            <div key={component.id} style={baseStyle} onClick={() => onSelect?.(component.id)}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{component.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{component.body}</div>
            </div>
          );
        }
        if (component.type === 'button') {
          return (
            <button
              key={component.id}
              onClick={() => onSelect?.(component.id)}
              style={{
                alignSelf: 'flex-start',
                padding: '8px 16px',
                borderRadius: theme.borderRadius,
                border: `1px solid ${theme.primaryColor}`,
                background: theme.primaryColor,
                color: '#0a0a0a',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {component.label}
            </button>
          );
        }
        if (component.type === 'tabs') {
          return (
            <div key={component.id} style={{ display: 'flex', gap: 6 }} onClick={() => onSelect?.(component.id)}>
              {(component.tabs || []).map((tab, idx) => (
                <div
                  key={tab}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: `1px solid ${idx === component.active ? theme.primaryColor : theme.borderColor}`,
                    color: idx === component.active ? theme.primaryColor : 'rgba(255,255,255,0.6)',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}

// ── Preview body ──────────────────────────────────────────────────────────────

function PreviewBody({ obj }) {
  const { objects, patchObject } = useWorkspace();
  const [governance, setGovernanceState] = useState(getGovernance());
  useEffect(() => {
    const unsub = subscribeGovernance(setGovernanceState);
    return unsub;
  }, []);

  const running = obj.status === RUN_STATUS.RUNNING;
  const url = obj.meta?.url || (obj.content.startsWith('http') ? obj.content.trim() : null);
  const meta = obj.meta || {};

  if (meta.previewType === 'ui') {
    const target = objects.find(o => o.id === meta.targetId);
    const previewState = normalizeUiState(meta.state || target?.meta?.preview?.state || DEFAULT_UI_STATE);
    const history = Array.isArray(target?.meta?.history) ? target.meta.history : [];
    const summary = meta.summary || target?.meta?.preview?.summary || 'UI preview';
    const canApply = !!target && !governance.previewOnly && !governance.requireApproval;

    const handleApply = () => {
      if (!target) return;
      if (!canApply) return;
      const updatedHistory = [...history, createHistoryEntry(previewState, summary, meta.source || 'preview')];
      patchObject(target.id, {
        meta: {
          ...target.meta,
          uiState: previewState,
          history: updatedHistory,
          preview: null,
        },
      });
      const latest = updatedHistory[updatedHistory.length - 1];
      persistUiVersion({
        versionId: latest.id,
        targetId: target.id,
        state: previewState,
        summary: latest.summary,
        source: latest.source,
      }).catch(() => {});
      if (meta.source === 'rollback' && updatedHistory.length > 1) {
        persistUiRollback({
          rollbackId: genId(),
          targetId: target.id,
          fromVersion: updatedHistory[updatedHistory.length - 2]?.id,
          toVersion: latest.id,
          summary: latest.summary,
        }).catch(() => {});
      }
      patchObject(obj.id, { status: RUN_STATUS.DONE, meta: { ...meta, applied: true } });
    };

    const handleCancel = () => {
      if (target) patchObject(target.id, { meta: { ...target.meta, preview: null } });
      patchObject(obj.id, { status: RUN_STATUS.CANCELLED, meta: { ...meta, cancelled: true } });
    };

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
          background: '#1a1a1a', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
        }}>
          <Palette size={13} style={{ color: '#a78bfa' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>UI Preview</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{summary}</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: canApply ? '#4ade80' : '#fbbf24' }}>
            {canApply ? 'READY' : 'PREVIEW ONLY'}
          </span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 18, background: previewState.theme.background }}>
          <UiCanvas state={previewState} previewMode />
        </div>
        <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8 }}>
          <button onClick={handleApply} disabled={!canApply} style={{ ...primaryActionStyle, opacity: canApply ? 1 : 0.5 }}>
            <CheckCircle size={12} /> Confirm Apply
          </button>
          <button onClick={handleCancel} style={secondaryActionStyle}>
            <XCircle size={12} /> Cancel Preview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
        background: '#1a1a1a', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{obj.agent ? `${obj.agent} · ` : ''}preview</span>
        {running && <RunningPulse />}
      </div>
      {running && !obj.content ? (
        <RunningPlaceholder label="Loading preview…" />
      ) : url ? (
        <iframe src={url} style={{ flex: 1, border: 'none' }} title="Preview" sandbox="allow-scripts" />
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
              const label = step.status === 'complete' ? 'DONE'
                : step.status === 'error' ? 'ERROR'
                : step.status === 'running' ? 'RUN'
                : 'IDLE';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <span style={{ color, fontSize: 10, minWidth: 32, fontWeight: 700, marginTop: 1 }}>{label}</span>
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
  const { patchObject } = useWorkspace();
  const running    = obj.status === RUN_STATUS.RUNNING;
  const connectors = obj.meta?.connectors || {};
  const mode       = obj.meta?.mode || 'synthetic';
  const draft      = obj.meta?.draft || {};
  const connector  = obj.meta?.connector || null;
  const [executing, setExecuting] = useState(false);

  const executeDraft = async () => {
    if (!connector || executing) return;
    setExecuting(true);
    patchObject(obj.id, { status: RUN_STATUS.RUNNING, meta: { ...obj.meta, status: 'running' } });
    try {
      const credentials = buildRuntimeConnectorCredentials(getConnectionPrefs());
      const result = connector === 'sendgrid'
        ? await executeSendGridEmail({ ...draft, credentials })
        : await executeTwilioCall({ ...draft, credentials });
      patchObject(obj.id, {
        status: result.status === 'error' ? RUN_STATUS.ERROR : RUN_STATUS.DONE,
        content: result.workspaceObject?.content || result.message,
        meta: { ...obj.meta, ...(result.workspaceObject?.meta || {}), connector, draft },
      });
    } catch (err) {
      patchObject(obj.id, {
        status: RUN_STATUS.ERROR,
        content: `${connector === 'sendgrid' ? 'SendGrid' : 'Twilio'} execution failed.\n\nReason: ${err.message}`,
        meta: { ...obj.meta, connector, draft, mode: 'blocked', status: 'error', reason: err.message },
      });
    } finally {
      setExecuting(false);
    }
  };

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
          <span style={{ fontSize: 11, fontWeight: 700, color: GREEN, letterSpacing: 1, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Plug size={11} style={{ flexShrink: 0 }} /> CONNECTOR ACTION {running && '· running…'}
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
                  {info.mode === 'live' ? 'LIVE' : info.mode === 'blocked' ? 'BLOCKED' : 'SYNTH'}
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

        {connector && (
          <div style={{ marginBottom: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
              Action Draft
            </div>
            {Object.entries(draft).filter(([, value]) => value).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', minWidth: 60, textTransform: 'uppercase' }}>{key}</span>
                <span style={{ fontSize: 11, color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{value}</span>
              </div>
            ))}
            {obj.meta?.reason && (
              <div style={{ fontSize: 11, color: '#fca5a5', marginTop: 8 }}>{obj.meta.reason}</div>
            )}
            {obj.meta?.executeAction && (
              <button
                onClick={executeDraft}
                disabled={executing || obj.meta?.mode === 'blocked'}
                className="xps-electric-hover"
                style={{
                  marginTop: 10,
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid rgba(212,168,67,0.28)',
                  background: executing || obj.meta?.mode === 'blocked' ? 'rgba(255,255,255,0.05)' : 'rgba(212,168,67,0.12)',
                  color: executing || obj.meta?.mode === 'blocked' ? 'rgba(255,255,255,0.35)' : GOLD,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: executing || obj.meta?.mode === 'blocked' ? 'not-allowed' : 'pointer',
                }}
              >
                {executing ? 'Executing…' : (obj.meta.executeLabel || 'Execute now')}
              </button>
            )}
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
          {obj.agent ? `${obj.agent} · ` : ''}agent run
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
              const label = step.status === 'complete' ? 'DONE'
                : step.status === 'error' ? 'ERROR'
                : step.status === 'running' ? 'RUN'
                : step.status === 'skipped' ? 'SKIP'
                : 'IDLE';
              return (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'flex-start' }}>
                  <span style={{ color, fontSize: 10, fontWeight: 700, minWidth: 32, marginTop: 1 }}>{label}</span>
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
                <div style={{ fontSize: 11, color: '#c084fc', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Package size={11} style={{ flexShrink: 0 }} /> {art.title || `Artifact ${i + 1}`} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>({art.type})</span>
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
            Runtime State
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
            <div style={{ fontSize: 10, color: RED, letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Ban size={10} style={{ flexShrink: 0 }} /> Blocked Capabilities ({blocked.length})
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

function buildRuntimeConnectorCredentials(connectionPrefs = {}) {
  return {
    twilioAccountSid: connectionPrefs.twilioAccountSid,
    twilioAuthToken: connectionPrefs.twilioAuthToken,
    twilioPhoneNumber: connectionPrefs.twilioPhoneNumber,
    sendgridApiKey: connectionPrefs.sendgridApiKey,
    sendgridFromEmail: connectionPrefs.sendgridFromEmail,
  };
}

// ── Phase 4: Browser / Parallel renderers ─────────────────────────────────────

function BrowserSessionBody({ obj }) {
  const meta   = obj.meta || {};
  const mode   = meta.mode || 'blocked';
  const status = obj.status || 'queued';
  const isBlocked = mode === 'blocked';

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      <div style={{
        background: '#0e0e18',
        border: `1px solid ${isBlocked ? 'rgba(239,68,68,0.25)' : 'rgba(212,168,67,0.15)'}`,
        borderRadius: 12,
        padding: '18px 22px',
        maxWidth: 700,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: -1 }}>[N]</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>Browser Session</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: modeColor(mode), textTransform: 'uppercase', letterSpacing: 0.8 }}>{mode}</span>
        </div>
        {meta.url && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, wordBreak: 'break-all', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
            <Link size={10} style={{ marginTop: 1, flexShrink: 0 }} /> {meta.url}
          </div>
        )}
        {meta.action && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>
            Action: <span style={{ color: GOLD }}>{meta.action}</span>
          </div>
        )}
        {isBlocked && (
          <div style={{
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 12, color: '#fca5a5', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}><Ban size={12} style={{ flexShrink: 0 }} /> Browser Automation Blocked</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              Playwright cannot run inside Vercel serverless functions.<br />
              To enable: set <code style={{ color: GOLD }}>BROWSER_WORKER_URL</code> to a local Playwright worker.
            </div>
            {meta.instructions && (
              <div style={{ marginTop: 10 }}>
                {meta.instructions.map((inst, i) => (
                  <div key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', marginTop: 4 }}>$ {inst}</div>
                ))}
              </div>
            )}
          </div>
        )}
        {obj.logs?.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Logs</div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '8px 10px', maxHeight: 120, overflowY: 'auto' }}>
              {obj.logs.map((l, i) => (
                <div key={i} style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{l.line}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BrowserResultBody({ obj }) {
  const { createObject } = useWorkspace();
  const meta = obj.meta || {};
  const mode = meta.mode || 'blocked';
  const handleAddToUi = () => {
    const uiState = createDefaultUiState();
    const summary = meta.extracted_text || obj.content || 'Browser resource';
    uiState.components = [
      { id: genId(), type: 'section', title: 'Resource Intake', body: meta.url || 'Resource link' },
      { id: genId(), type: 'card', title: meta.url ? 'Connected Resource' : 'Browser Result', body: summary.slice(0, 180) },
      { id: genId(), type: 'button', label: 'Open Resource', variant: 'primary' },
    ];
    createObject({
      type: OBJ_TYPE.UI,
      title: `Resource UI — ${meta.url ? meta.url.slice(0, 30) : 'Browser Result'}`,
      content: 'Resource UI canvas',
      status: RUN_STATUS.IDLE,
      meta: { uiEditor: true, uiState, history: [createHistoryEntry(uiState, 'Resource import', 'browser')] },
    });
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      <div style={{ maxWidth: 800 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Camera size={18} style={{ color: GOLD, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>Browser Result</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: modeColor(mode), textTransform: 'uppercase' }}>{mode}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={handleAddToUi}
            className="xps-electric-hover"
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid rgba(212,168,67,0.3)',
              background: 'rgba(212,168,67,0.12)',
              color: GOLD,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Create UI from Resource
          </button>
        </div>
        {meta.url && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12, wordBreak: 'break-all', display: 'flex', alignItems: 'flex-start', gap: 5 }}><Link size={10} style={{ marginTop: 1, flexShrink: 0 }} /> {meta.url}</div>
        )}

        {/* Screenshot slot */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <Image size={24} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Screenshot</div>
            {meta.screenshot_url
              ? <img src={meta.screenshot_url} alt="screenshot" style={{ maxWidth: '100%', marginTop: 8, borderRadius: 6 }} />
              : <div style={{ fontSize: 10, color: mode === 'blocked' ? '#fca5a5' : 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                  {mode === 'blocked' ? 'Screenshot blocked — no browser worker' : 'No screenshot captured'}
                </div>
            }
          </div>
        </div>

        {/* Extracted text */}
        {(meta.extracted_text || obj.content) && (
          <div style={{
            background: '#0e0e18',
            border: '1px solid rgba(212,168,67,0.12)',
            borderRadius: 10,
            padding: '14px 16px',
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Extracted Content</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {meta.extracted_text || obj.content}
            </div>
          </div>
        )}

        {/* Evidence items */}
        {meta.evidence?.length > 0 && (
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Evidence ({meta.evidence.length})</div>
            {meta.evidence.map((ev, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 6,
              }}>
                {ev.title && <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{ev.title}</div>}
                {ev.url && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{ev.url}</div>}
                {ev.summary && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{ev.summary}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PageSnapshotBody({ obj }) {
  const meta = obj.meta || {};
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      <div style={{ maxWidth: 800 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Image size={18} style={{ color: GOLD, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>Page Snapshot</span>
        </div>
        {meta.url && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12, wordBreak: 'break-all', display: 'flex', alignItems: 'flex-start', gap: 5 }}><Link size={10} style={{ marginTop: 1, flexShrink: 0 }} /> {meta.url}</div>
        )}
        {meta.raw_html_length && (
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
            Raw HTML: {meta.raw_html_length.toLocaleString()} chars
          </div>
        )}
        <div style={{
          background: '#0e0e18',
          border: '1px solid rgba(212,168,67,0.12)',
          borderRadius: 10,
          padding: '14px 16px',
          fontFamily: 'monospace',
          fontSize: 11,
          color: 'rgba(255,255,255,0.65)',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.6,
          maxHeight: 500,
          overflowY: 'auto',
        }}>
          {meta.snapshot_text || obj.content || '(empty snapshot)'}
        </div>
      </div>
    </div>
  );
}

function EvidenceBundleBody({ obj }) {
  const meta  = obj.meta || {};
  const items = meta.items || [];
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      <div style={{ maxWidth: 750 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Archive size={18} style={{ color: GOLD, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>Evidence Bundle</span>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>
        {meta.source_url && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>Source: {meta.source_url}</div>
        )}
        {items.length === 0 && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No evidence items collected.</div>
        )}
        {items.map((item, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(212,168,67,0.1)',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ fontSize: 14, marginTop: 2 }}>
                {item.source_type === 'image' ? <FileImage size={14} style={{ color: 'rgba(255,255,255,0.4)' }} /> : item.source_type === 'pdf' ? <FileText size={14} style={{ color: 'rgba(255,255,255,0.4)' }} /> : <Link size={14} style={{ color: 'rgba(255,255,255,0.4)' }} />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {item.title && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 3 }}>{item.title}</div>
                )}
                {item.url && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 5, wordBreak: 'break-all' }}>{item.url}</div>
                )}
                {item.summary && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{item.summary}</div>
                )}
                {item.source_type && (
                  <div style={{ fontSize: 10, color: GOLD, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.6 }}>{item.source_type}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParallelRunGroupBody({ obj }) {
  const meta = obj.meta || {};
  const jobs = meta.jobs || [];
  const statusColor = (s) => {
    if (s === 'complete') return GREEN;
    if (s === 'error')    return RED;
    if (s === 'running')  return GOLD;
    if (s === 'blocked')  return '#f97316';
    if (s === 'cancelled')return '#94a3b8';
    return 'rgba(255,255,255,0.3)';
  };
  const done  = jobs.filter(j => ['complete','error','cancelled','blocked'].includes(j.status)).length;
  const total = jobs.length;
  const pct   = total > 0 ? Math.round((done / total) * 100) : obj.progress || 0;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
      <div style={{ maxWidth: 750 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Zap size={18} style={{ color: GOLD, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>Parallel Run Group</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{done}/{total} done</span>
        </div>

        {/* Progress bar */}
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 4, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: GOLD, borderRadius: 4, transition: 'width 0.4s ease' }} />
        </div>

        {jobs.length === 0 && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No jobs in group.</div>
        )}
        {jobs.map((job, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${statusColor(job.status)}22`,
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor(job.status), flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{job.title || job.jobId}</div>
              {job.type && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{job.type}</div>}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: statusColor(job.status), textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {job.status || 'queued'}
            </div>
          </div>
        ))}

        {meta.summary && (
          <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(212,168,67,0.06)', border: `1px solid ${GOLD}22`, borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            {meta.summary}
          </div>
        )}
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
