import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useWorkspace, detectObjectType, deriveTitle, OBJ_TYPE, RUN_STATUS } from '../lib/workspaceEngine.jsx';

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

const PANEL_NAVIGATION_PHRASES = {
  'bytebot panel': 'bytebot', 'scraper panel': 'scraper',
  'research panel': 'research', 'analytics panel': 'analytics',
  'connectors panel': 'connectors', 'workspace panel': 'workspace',
};

export default function ChatRail({ onWorkspaceAction, onNavigate }) {
  const [agent, setAgent] = useState('orchestrator');
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: '— awaiting configuration —\n\nSelect an agent and configure your API key to begin live orchestration. Running in synthetic mode.',
    agent: 'orchestrator',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Workspace engine actions
  const { createObject, updateObject, appendLog, setStatus } = useWorkspace();

  // Track the active run-log object for the current in-flight request
  const runObjectIdRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const selectedAgent = AGENTS.find(a => a.id === agent) || AGENTS[0];

  // Commit a completed reply to the workspace engine as a live object
  const commitToWorkspace = useCallback((reply, agentId, prompt) => {
    const type  = detectObjectType(reply, agentId);
    const title = deriveTitle(reply, agentId) || prompt.slice(0, 55);

    // Create the workspace object with the reply content
    createObject({ type, title, content: reply, agent: agentId, status: RUN_STATUS.DONE });

    // Navigate to workspace panel so the object is visible
    onNavigate?.('workspace');

    // Also fire legacy prop for any remaining navigation handlers
    if (onWorkspaceAction) {
      const lower = reply.toLowerCase();
      for (const [phrase, panel] of Object.entries(PANEL_NAVIGATION_PHRASES)) {
        if (lower.includes(phrase)) { onWorkspaceAction({ type: 'navigate', panel }); break; }
      }
    }
  }, [createObject, onNavigate, onWorkspaceAction]);

  const send = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim(), agent };
    const prompt  = userMsg.content;
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);

    // Create a RUNNING log object in the workspace so the center shows live state
    createObject({
      type:   OBJ_TYPE.LOG,
      title:  `${selectedAgent.label} — ${prompt.slice(0, 40)}`,
      content: '',
      agent,
      status: RUN_STATUS.RUNNING,
    });
    // Navigate immediately so the operator sees the running indicator
    onNavigate?.('workspace');

    // Store the run object id via ref (createObject is synchronous in reducer)
    // We'll close/mark it done when we get the reply.

    // Build messages for API (strip agent metadata)
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPTS[agent] || SYSTEM_PROMPTS.gpt },
      ...history.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
    ];

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, agent }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data  = await res.json();
      const reply = data.reply || data.error || 'No response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply, agent }]);

      // Commit result to workspace engine as a typed object
      commitToWorkspace(reply, agent, prompt);
    } catch (err) {
      // Synthetic fallback
      const syntheticReplies = {
        orchestrator: `[Synthetic] XPS Orchestrator received: "${prompt}". No live API configured — running in synthetic mode. Add OPENAI_API_KEY to enable live responses.`,
        research:     `[Synthetic] Research Agent: Query queued for "${prompt}". No live backend — synthetic mode active.`,
        scraper:      `[Synthetic] Scraper Agent: Target queued. Use the Scraper panel to run live scrape jobs.`,
        bytebot:      `[Synthetic] ByteBot: Task acknowledged. Multi-step execution requires live backend. Switch to ByteBot panel for the orchestration surface.`,
        default:      `[Synthetic] Agent offline — set OPENAI_API_KEY to enable live responses.`,
      };
      const syntheticContent = syntheticReplies[agent] || syntheticReplies.default;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: syntheticContent,
        agent,
        synthetic: true,
      }]);

      // Still create a workspace object for the synthetic reply
      commitToWorkspace(syntheticContent, agent, prompt);

      if (onWorkspaceAction && agent === 'bytebot') {
        onWorkspaceAction({ type: 'navigate', panel: 'bytebot' });
      }
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

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const agentInfo = AGENTS.find(a => a.id === msg.agent);

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
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5, paddingLeft: 2 }}>
          {agentInfo.icon} {agentInfo.label}
          {msg.synthetic && <span style={{ marginLeft: 6, color: '#fbbf24' }}>· synthetic</span>}
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
