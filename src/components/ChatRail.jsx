import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useWorkspace, detectObjectType, deriveTitle, OBJ_TYPE, RUN_STATUS, genId } from '../lib/workspaceEngine.jsx';
import { startRun, subscribeRuns, cancelRun, getRunList } from '../lib/bytebotRuntime.js';
import { persistSearchJob, persistScrapeJob, persistWorkspaceObject } from '../lib/supabasePersistence.js';

const gold = '#d4a843';
const API_URL = import.meta.env.API_URL || '';

const AGENTS = [
  { id: 'orchestrator',  label: 'XPS Orchestrator', icon: '🛡️' },
  { id: 'research',      label: 'Research Agent',   icon: '🔍' },
  { id: 'scraper',       label: 'Scraper Agent',    icon: '🕷️' },
  { id: 'bytebot',       label: 'ByteBot',          icon: '🤖' },
  { id: 'vision',        label: 'Vision Cortex',    icon: '👁️' },
  { id: 'intel',         label: 'Intel Core',       icon: '💡' },
  { id: 'builder',       label: 'Auto Builder',     icon: '🏗️' },
  { id: 'gpt',           label: 'Generic GPT',      icon: '✨' },
];

const SYSTEM_PROMPTS = {
  orchestrator: 'You are the XPS Orchestrator. You coordinate all XPS intelligence operations, routing tasks to the appropriate agents, managing workflows, and synthesizing results for the operator.',
  research:     'You are the XPS Research Agent. You specialize in gathering, analyzing, and synthesizing intelligence from web searches, public data, and research queries.',
  scraper:      'You are the XPS Scraper Agent. You specialize in web scraping, data extraction, and structured output from target URLs.',
  bytebot:      'You are ByteBot, an autonomous task orchestrator. You break down complex operator requests into queued multi-step actions and report progress clearly.',
  vision:       'You are Vision Cortex, the XPS visual intelligence agent. You analyze images, describe visual data, and support AI image/video workflow tasks.',
  intel:        'You are Intel Core, the XPS competitive and market intelligence agent. You analyze competitors, market trends, and strategic signals.',
  builder:      'You are Auto Builder, the XPS code and UI generation agent. You create, scaffold, and iterate on code, UI components, and system structures.',
  gpt:          'You are a helpful AI assistant for the XPS Intelligence Command Center. Help the operator with any task.',
};

export default function ChatRail({ onWorkspaceAction, onNavigate }) {
  const [agent, setAgent] = useState('orchestrator');
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: '— awaiting configuration —\n\nSelect an agent and configure your API key to begin live orchestration. Running in synthetic mode.',
    agent: 'orchestrator',
  }]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [activeRuns, setActiveRuns] = useState([]);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  const { createObject, setStatus, appendLog, patchObject } = useWorkspace();

  // Subscribe to ByteBot runtime run state
  useEffect(() => {
    const unsub = subscribeRuns(runs => setActiveRuns(runs.filter(r => r.status === 'running' || r.status === 'queued')));
    setActiveRuns(getRunList().filter(r => r.status === 'running' || r.status === 'queued'));
    return unsub;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const selectedAgent = AGENTS.find(a => a.id === agent) || AGENTS[0];

  // Commit a completed reply to the workspace engine as a live object
  const commitToWorkspace = useCallback((wsObj, agentId, prompt) => {
    const { type, title, content, steps = [], meta = {} } = wsObj;
    createObject({
      type:    type   || detectObjectType(content, agentId),
      title:   title  || deriveTitle(content, agentId) || prompt.slice(0, 55),
      content: content || '',
      agent:   agentId,
      status:  RUN_STATUS.DONE,
      steps,
      meta,
    });
    onNavigate?.('workspace');

    // Persist workspace object
    persistWorkspaceObject({ type, title, content, agent: agentId, meta }).catch(() => {});
  }, [createObject, onNavigate]);

  const send = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim(), agent };
    const prompt  = userMsg.content;
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);

    // ── ByteBot: use full multi-step runtime ──────────────────────────────────
    if (agent === 'bytebot') {
      setLoading(false);
      startRun(
        { task: prompt, agent: 'bytebot', context: {} },
        { createObject, setStatus, appendLog, patchObject },
        onNavigate,
      ).then(runId => {
        setMessages(prev => [...prev, {
          role:   'assistant',
          content: `ByteBot run started. Watching workspace for progress…`,
          agent:  'bytebot',
          runId,
        }]);
      });
      return;
    }

    // ── Other agents: call /api/chat with structured response ─────────────────
    const runId = genId();
    const wsObjId = genId();

    createObject({
      id:      wsObjId,
      type:    OBJ_TYPE.LOG,
      title:   `${selectedAgent.label} — ${prompt.slice(0, 40)}`,
      content: '',
      agent,
      status:  RUN_STATUS.RUNNING,
    });
    onNavigate?.('workspace');

    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPTS[agent] || SYSTEM_PROMPTS.gpt },
      ...history.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
    ];

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: apiMessages, agent, runId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Handle structured contract
      const reply   = data.reply || data.error || 'No response.';
      const wsObj   = data.workspace_object || null;
      const mode    = data.mode || 'synthetic';
      const evtType = data.event_type || 'run_completed';

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        agent,
        mode,
        synthetic: mode === 'synthetic',
      }]);

      setStatus(wsObjId, evtType === 'run_failed' ? RUN_STATUS.ERROR : RUN_STATUS.DONE);

      if (evtType !== 'run_failed' && wsObj) {
        commitToWorkspace(wsObj, agent, prompt);
      } else if (evtType !== 'run_failed') {
        // Fallback: infer type from reply
        commitToWorkspace({
          type:    detectObjectType(reply, agent),
          title:   deriveTitle(reply, agent) || prompt.slice(0, 55),
          content: reply,
        }, agent, prompt);
      }

    } catch (err) {
      setStatus(wsObjId, RUN_STATUS.ERROR);

      const syntheticReplies = {
        orchestrator: `[Synthetic] XPS Orchestrator received: "${prompt}". No live API configured — running in synthetic mode. Add OPENAI_API_KEY to enable live responses.`,
        research:     `[Synthetic] Research Agent: Query queued for "${prompt}". No live backend — synthetic mode active.`,
        scraper:      `[Synthetic] Scraper Agent: Target queued. Use the Scraper panel to run live scrape jobs.`,
        default:      `[Synthetic] Agent offline — set OPENAI_API_KEY to enable live responses.`,
      };
      const syntheticContent = syntheticReplies[agent] || syntheticReplies.default;

      setMessages(prev => [...prev, {
        role:      'assistant',
        content:   syntheticContent,
        agent,
        synthetic: true,
      }]);

      commitToWorkspace({
        type:    detectObjectType(syntheticContent, agent),
        title:   `[Synthetic] ${selectedAgent.label}`,
        content: syntheticContent,
      }, agent, prompt);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{
      width: 340,
      minWidth: 340,
      height: '100%',
      background: '#0f0f0f',
      borderLeft: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Rail header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.4, color: 'rgba(255,255,255,0.3)' }}>AGENT RAIL</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 0.6 }}>
            {messages.filter(m => m.role !== 'system').length} messages
          </span>
        </div>

        {/* Agent selector */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setAgentOpen(o => !o)}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '7px 10px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span>{selectedAgent.icon}</span>
              <span>{selectedAgent.label}</span>
            </span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round">
              <path d={agentOpen ? 'M2 8l4-4 4 4' : 'M2 4l4 4 4-4'}/>
            </svg>
          </button>

          {agentOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              zIndex: 50,
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            }}>
              {AGENTS.map(a => (
                <button
                  key={a.id}
                  onClick={() => { setAgent(a.id); setAgentOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '8px 12px',
                    background: agent === a.id ? 'rgba(212,168,67,0.12)' : 'transparent',
                    border: 'none',
                    color: agent === a.id ? gold : 'rgba(255,255,255,0.75)',
                    fontSize: 13, cursor: 'pointer', textAlign: 'left',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                  onMouseEnter={e => { if (agent !== a.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (agent !== a.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>{a.icon}</span>
                  <span style={{ fontWeight: agent === a.id ? 600 : 400 }}>{a.label}</span>
                  {agent === a.id && <span style={{ marginLeft: 'auto', color: gold, fontSize: 10 }}>●</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message thread */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 12px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {/* Active runs summary */}
        {activeRuns.length > 0 && (
          <ActiveRunsSummary runs={activeRuns} />
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px' }}>
            <ThinkingDots />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              {selectedAgent.label} thinking…
            </span>
          </div>
        )}
        <div ref={bottomRef} style={{ height: 8 }} />
      </div>

      {/* Input area */}
      <div style={{
        padding: '10px 12px 12px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${selectedAgent.label}…`}
            rows={3}
            style={{
              resize: 'none',
              width: '100%',
              padding: '9px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#fff',
              fontSize: 13,
              lineHeight: 1.5,
              outline: 'none',
              fontFamily: 'inherit',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(212,168,67,0.4)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>↵ Send  ⇧↵ Newline</span>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: '6px 14px',
                background: input.trim() && !loading ? gold : 'rgba(255,255,255,0.08)',
                color: input.trim() && !loading ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
                border: 'none',
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s, color 0.15s',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {loading ? '…' : 'Send'}
              {!loading && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 11L11 1M11 1H4M11 1V8"/>
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActiveRunsSummary({ runs }) {
  return (
    <div style={{
      background: 'rgba(212,168,67,0.06)',
      border: '1px solid rgba(212,168,67,0.2)',
      borderRadius: 10,
      padding: '8px 10px',
      marginBottom: 4,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: gold, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>
        ▶ Active Runs ({runs.length})
      </div>
      {runs.map(run => (
        <div key={run.runId} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: gold,
              animation: 'pulse 1s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {run.agent}: {run.task.slice(0, 35)}
            </span>
            <button
              onClick={() => cancelRun(run.runId)}
              title="Cancel run"
              style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
          {run.progress > 0 && (
            <div style={{ marginTop: 4, marginLeft: 11 }}>
              <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 1 }}>
                <div style={{ width: `${run.progress}%`, height: '100%', background: gold, borderRadius: 1, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const agentInfo = AGENTS.find(a => a.id === msg.agent);
  const modeColor = msg.mode === 'live' ? '#4ade80' : msg.mode === 'synthetic' || msg.synthetic ? '#fbbf24' : 'rgba(255,255,255,0.25)';
  const modeLabel = msg.mode === 'live' ? 'live' : (msg.synthetic || msg.mode === 'synthetic') ? 'synthetic' : null;

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          maxWidth: '88%',
          padding: '8px 12px',
          background: 'rgba(212,168,67,0.15)',
          border: '1px solid rgba(212,168,67,0.25)',
          borderRadius: '12px 12px 2px 12px',
          color: '#fff',
          fontSize: 13,
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {agentInfo && (
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5, paddingLeft: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
          {agentInfo.icon} {agentInfo.label}
          {modeLabel && <span style={{ color: modeColor, fontWeight: 600 }}>· {modeLabel}</span>}
        </span>
      )}
      <div style={{
        maxWidth: '95%',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '2px 12px 12px 12px',
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content}
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 4, height: 4, borderRadius: '50%',
          background: gold,
          animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          opacity: 0.7,
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,80%,100%{transform:scale(0.6);opacity:0.3} 40%{transform:scale(1);opacity:1} }`}</style>
    </div>
  );
}
