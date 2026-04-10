import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Shield, Search, Globe, Bot, Eye, Lightbulb, Wrench, Sparkles,
  ChevronDown, ChevronUp, Paperclip, X, FileText, Image, File,
  HardDrive, AlertTriangle, Send, CheckCircle,
  Map, Cpu, Zap, Compass, Radio, Activity,
} from 'lucide-react';
import { useWorkspace, detectObjectType, deriveTitle, OBJ_TYPE, RUN_STATUS, genId } from '../lib/workspaceEngine.jsx';
import { startRun, subscribeRuns, cancelRun, getRunList } from '../lib/bytebotRuntime.js';
import { startBrowserJob, subscribeJobs, cancelBrowserJob, getJobList } from '../lib/browserJobRuntime.js';
import { persistSearchJob, persistScrapeJob, persistWorkspaceObject } from '../lib/supabasePersistence.js';

const gold = '#d4a843';
const API_URL = import.meta.env.API_URL || '';

// ── Provider state hook ───────────────────────────────────────────────────
function useProviderState() {
  const [providerState, setProviderState] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/status`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setProviderState(data);
      })
      .catch(() => {}); // silent — fallback to build-time detection
  }, []);

  return providerState;
}

// ── Provider indicator bar ────────────────────────────────────────────────
const PROVIDER_COLORS = {
  openai:    { color: '#4ade80', label: 'OpenAI',    mode: 'Live' },
  groq:      { color: '#4ade80', label: 'Groq',      mode: 'Live' },
  ollama:    { color: '#60a5fa', label: 'Ollama',    mode: 'Local' },
  none:      { color: '#fbbf24', label: 'Synthetic', mode: 'Synthetic' },
};

function ProviderIndicator({ providerState }) {
  const activeLLM = providerState?.llm?.active || 'none';
  const model     = providerState?.llm?.model   || null;
  const meta      = PROVIDER_COLORS[activeLLM] || PROVIDER_COLORS.none;

  return (
    <div
      data-testid="provider-indicator"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 10px',
        background: meta.color + '10',
        border: `1px solid ${meta.color}25`,
        borderRadius: 6,
        marginTop: 6,
      }}
    >
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
      <span style={{ fontSize: 10, fontWeight: 600, color: meta.color }}>
        {meta.label}
      </span>
      {model && (
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
          {model}
        </span>
      )}
      <span style={{
        marginLeft: 'auto', fontSize: 10, fontWeight: 600,
        color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5,
      }}>
        {meta.mode.toUpperCase()}
      </span>
    </div>
  );
}

// ── Agent registry (no emoji) ─────────────────────────────────────────────
const AGENTS = [
  { id: 'orchestrator', label: 'XPS Orchestrator', icon: Shield },
  { id: 'research',     label: 'Research Agent',   icon: Search },
  { id: 'scraper',      label: 'Scraper Agent',    icon: Globe },
  { id: 'bytebot',      label: 'ByteBot',          icon: Bot },
  { id: 'browser',      label: 'Browser Agent',    icon: Globe },
  { id: 'vision',       label: 'Vision Cortex',    icon: Eye },
  { id: 'intel',        label: 'Intel Core',       icon: Lightbulb },
  { id: 'builder',      label: 'Auto Builder',     icon: Wrench },
  { id: 'gpt',          label: 'Generic GPT',      icon: Sparkles },
];

// ── Mode registry ─────────────────────────────────────────────────────────
const MODES = [
  { id: 'planning',   label: 'Planning',        icon: Map },
  { id: 'agent',      label: 'Agent Mode',      icon: Cpu },
  { id: 'autonomous', label: 'Autonomous Mode', icon: Zap },
  { id: 'scraping',   label: 'Scraping Mode',   icon: Globe },
  { id: 'discover',   label: 'Discover Mode',   icon: Compass },
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

// ── Attachment sources ─────────────────────────────────────────────────────
const GOOGLE_DRIVE_CONFIGURED = !!(import.meta.env.GCP_SA_KEY || import.meta.env.GCP_PROJECT_ID);

const ATTACH_SOURCES = [
  { id: 'local',   label: 'Local File',     icon: File,      available: true,                  accept: '*/*' },
  { id: 'image',   label: 'Image',          icon: Image,     available: true,                  accept: 'image/*' },
  { id: 'doc',     label: 'Document',       icon: FileText,  available: true,                  accept: '.pdf,.doc,.docx,.txt,.md,.csv,.xlsx' },
  { id: 'drive',   label: 'Google Drive',   icon: HardDrive, available: GOOGLE_DRIVE_CONFIGURED, blocked: !GOOGLE_DRIVE_CONFIGURED, note: 'Requires GCP OAuth' },
];

export default function ChatRail({ onWorkspaceAction, onNavigate }) {
  const [agent, setAgent] = useState('orchestrator');
  const [mode, setMode]   = useState('agent');
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: '— awaiting configuration —\n\nSelect an agent and configure your API key to begin live orchestration. Running in synthetic mode.',
    agent: 'orchestrator',
  }]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [modeOpen, setModeOpen]   = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [activeRuns, setActiveRuns] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const fileInputRef = useRef(null);
  const currentAttachType = useRef(null);

  const providerState = useProviderState();

  const { createObject, setStatus, appendLog, patchObject } = useWorkspace();

  useEffect(() => {
    const isActive = r => r.status === 'running' || r.status === 'queued';
    const unsub = subscribeRuns(runs => setActiveRuns(runs.filter(isActive)));
    setActiveRuns(getRunList().filter(isActive));
    return unsub;
  }, []);

  useEffect(() => {
    const isActive = j => j.status === 'running' || j.status === 'queued';
    const unsub = subscribeJobs(jobs => setActiveJobs(jobs.filter(isActive)));
    setActiveJobs(getJobList().filter(isActive));
    return unsub;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = () => { setAgentOpen(false); setModeOpen(false); setAttachOpen(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const selectedAgent = AGENTS.find(a => a.id === agent) || AGENTS[0];
  const selectedMode  = MODES.find(m => m.id === mode)   || MODES[0];

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
    persistWorkspaceObject({ type, title, content, agent: agentId, meta }).catch(() => {});
  }, [createObject, onNavigate]);

  const send = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim(), agent, mode };
    const prompt  = userMsg.content;
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setAttachments([]);
    setLoading(true);

    if (agent === 'bytebot') {
      setLoading(false);
      startRun(
        { task: prompt, agent: 'bytebot', context: { mode } },
        { createObject, setStatus, appendLog, patchObject },
        onNavigate,
      ).then(runId => {
        setMessages(prev => [...prev, {
          role: 'assistant', content: 'ByteBot run started. Watching workspace for progress…',
          agent: 'bytebot', runId,
        }]);
      });
      return;
    }

    if (agent === 'browser') {
      setLoading(false);
      const isUrl = /^https?:\/\//i.test(prompt.trim());
      const url   = isUrl ? prompt.trim() : `https://www.google.com/search?q=${encodeURIComponent(prompt)}`;
      const action = isUrl ? 'scrape' : 'research';
      startBrowserJob(
        { url, action, prompt: isUrl ? '' : prompt },
        { createObject, setStatus, appendLog, patchObject },
        onNavigate,
      ).then(jobId => {
        setMessages(prev => [...prev, {
          role: 'assistant', content: `Browser job started for: ${url}\nAction: ${action} — watching workspace for result…`,
          agent: 'browser', jobId,
        }]);
      });
      return;
    }

    const runId   = genId();
    const wsObjId = genId();

    createObject({
      id: wsObjId, type: OBJ_TYPE.LOG,
      title: `${selectedAgent.label} — ${prompt.slice(0, 40)}`,
      content: '', agent, status: RUN_STATUS.RUNNING,
    });
    onNavigate?.('workspace');

    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPTS[agent] || SYSTEM_PROMPTS.gpt },
      ...history.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
    ];

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, agent, runId, mode }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const reply   = data.reply || data.error || 'No response.';
      const wsObj   = data.workspace_object || null;
      const evtMode = data.mode || 'synthetic';
      const evtType = data.event_type || 'run_completed';

      setMessages(prev => [...prev, {
        role: 'assistant', content: reply, agent, mode: evtMode, synthetic: evtMode === 'synthetic',
      }]);
      setStatus(wsObjId, evtType === 'run_failed' ? RUN_STATUS.ERROR : RUN_STATUS.DONE);

      if (evtType !== 'run_failed' && wsObj) {
        commitToWorkspace(wsObj, agent, prompt);
      } else if (evtType !== 'run_failed') {
        commitToWorkspace({ type: detectObjectType(reply, agent), title: deriveTitle(reply, agent) || prompt.slice(0, 55), content: reply }, agent, prompt);
      }
    } catch {
      setStatus(wsObjId, RUN_STATUS.ERROR);
      const syntheticReplies = {
        orchestrator: `[Synthetic] XPS Orchestrator received: "${prompt}". No live API configured — running in synthetic mode. Add OPENAI_API_KEY to enable live responses.`,
        research:     `[Synthetic] Research Agent: Query queued for "${prompt}". No live backend — synthetic mode active.`,
        scraper:      `[Synthetic] Scraper Agent: Target queued. Use the Scraper panel to run live scrape jobs.`,
        default:      `[Synthetic] Agent offline — set OPENAI_API_KEY to enable live responses.`,
      };
      const syntheticContent = syntheticReplies[agent] || syntheticReplies.default;
      setMessages(prev => [...prev, { role: 'assistant', content: syntheticContent, agent, synthetic: true }]);
      commitToWorkspace({ type: detectObjectType(syntheticContent, agent), title: `[Synthetic] ${selectedAgent.label}`, content: syntheticContent }, agent, prompt);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleFileSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newAttachments = files.map(f => ({ id: genId(), name: f.name, size: f.size, type: f.type, file: f }));
    setAttachments(prev => [...prev, ...newAttachments]);
    setAttachOpen(false);
    e.target.value = '';
  };

  const openFileChooser = (accept) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const AgentIcon = selectedAgent.icon;
  const ModeIcon  = selectedMode.icon;

  return (
    <div
      data-testid="chat-rail"
      style={{
        width: 340, minWidth: 340, height: '100%',
        background: '#0f0f0f',
        borderLeft: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', flexDirection: 'column',
      }}
      onClick={e => e.stopPropagation()}
    >
      {/* Rail header */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, color: 'rgba(255,255,255,0.3)' }}>AGENT RAIL</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
            {messages.filter(m => m.role !== 'system').length} messages
          </span>
        </div>

        {/* Agent selector */}
        <div style={{ position: 'relative', marginBottom: 6 }} onClick={e => e.stopPropagation()}>
          <button
            data-testid="agent-selector"
            onClick={() => { setAgentOpen(o => !o); setModeOpen(false); }}
            className="xps-electric-hover"
            data-active={agentOpen ? 'true' : undefined}
            style={{
              position: 'relative',
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '7px 10px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
              color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <AgentIcon size={13} className="xps-icon" style={{ flexShrink: 0 }} />
              <span>{selectedAgent.label}</span>
            </span>
            {agentOpen ? <ChevronUp size={12} className="xps-icon" /> : <ChevronDown size={12} className="xps-icon" />}
          </button>

          {agentOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
              background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, zIndex: 50, overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            }}>
              {AGENTS.map(a => {
                const AIcon = a.icon;
                return (
                  <button
                    key={a.id}
                    onClick={() => { setAgent(a.id); setAgentOpen(false); }}
                    className="xps-electric-hover"
                    data-active={agent === a.id ? 'true' : undefined}
                    style={{
                      position: 'relative',
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '8px 12px',
                      background: agent === a.id ? 'rgba(212,168,67,0.12)' : 'transparent',
                      border: 'none', color: agent === a.id ? gold : 'rgba(255,255,255,0.75)',
                      fontSize: 12, cursor: 'pointer', textAlign: 'left',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <AIcon size={12} className="xps-icon" />
                    <span style={{ fontWeight: agent === a.id ? 600 : 400 }}>{a.label}</span>
                    {agent === a.id && <CheckCircle size={11} className="xps-icon" style={{ marginLeft: 'auto' }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Mode selector */}
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <button
            data-testid="mode-selector"
            onClick={() => { setModeOpen(o => !o); setAgentOpen(false); }}
            className="xps-electric-hover"
            data-active={modeOpen ? 'true' : undefined}
            style={{
              position: 'relative',
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 10px', background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)', borderRadius: 7,
              color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <ModeIcon size={11} className="xps-icon" />
              <span>{selectedMode.label}</span>
            </span>
            {modeOpen ? <ChevronUp size={11} className="xps-icon" /> : <ChevronDown size={11} className="xps-icon" />}
          </button>

          {modeOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
              background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, zIndex: 50, overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            }}>
              {MODES.map(m => {
                const MIcon = m.icon;
                return (
                  <button
                    key={m.id}
                    data-testid={`mode-option-${m.id}`}
                    onClick={() => { setMode(m.id); setModeOpen(false); }}
                    className="xps-electric-hover"
                    data-active={mode === m.id ? 'true' : undefined}
                    style={{
                      position: 'relative',
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '7px 12px',
                      background: mode === m.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                      border: 'none', color: mode === m.id ? '#e2e8f0' : 'rgba(255,255,255,0.6)',
                      fontSize: 12, cursor: 'pointer', textAlign: 'left',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}
                  >
                    <MIcon size={11} className="xps-icon" />
                    <span style={{ fontWeight: mode === m.id ? 600 : 400 }}>{m.label}</span>
                    {mode === m.id && <CheckCircle size={10} className="xps-icon" style={{ marginLeft: 'auto' }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {/* Provider/runtime indicator */}
        <ProviderIndicator providerState={providerState} />
      </div>

      {/* Message thread */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 12px 0',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {activeRuns.length > 0 && <ActiveRunsSummary runs={activeRuns} />}
        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px' }}>
            <ThinkingDots />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{selectedAgent.label} thinking…</span>
          </div>
        )}
        <div ref={bottomRef} style={{ height: 8 }} />
      </div>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div style={{
          padding: '8px 12px 0',
          display: 'flex', flexWrap: 'wrap', gap: 6,
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          {attachments.map(att => (
            <div key={att.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 8px', background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
              fontSize: 11, color: 'rgba(255,255,255,0.7)', maxWidth: 160,
            }}>
              <FileText size={10} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {att.name}
              </span>
              <button
                onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 0, display: 'flex', lineHeight: 1 }}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div style={{ padding: '10px 12px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        {/* Attachment panel */}
        {attachOpen && (
          <div
            data-testid="attachment-panel"
            style={{
              marginBottom: 8, background: '#161616',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1 }}>
              ATTACH FILE
            </div>
            {ATTACH_SOURCES.map(src => {
              const SIcon = src.icon;
              return (
                  <button
                    key={src.id}
                    data-testid={`attach-source-${src.id}`}
                    disabled={!src.available}
                    onClick={() => {
                      if (src.available && !src.blocked) {
                        openFileChooser(src.accept || '*/*');
                      }
                    }}
                    className="xps-electric-hover"
                    data-active={false}
                    style={{
                      position: 'relative',
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '9px 12px',
                      background: 'transparent',
                      border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)',
                      color: src.available ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.25)',
                      fontSize: 12, cursor: src.available ? 'pointer' : 'not-allowed',
                      textAlign: 'left',
                    }}
                  >
                    <SIcon size={13} className="xps-icon" style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{src.label}</span>
                    {src.blocked && (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 10, fontWeight: 600,
                        color: '#ef4444', padding: '2px 7px', borderRadius: 99,
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                      }}>
                      <AlertTriangle size={9} className="xps-icon" />
                      {src.note || 'Blocked'}
                    </span>
                  )}
                  {src.available && !src.blocked && (
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Select</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={send} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <textarea
            ref={inputRef}
            data-testid="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${selectedAgent.label}…`}
            rows={3}
            style={{
              resize: 'none', width: '100%', padding: '9px 12px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: '#fff', fontSize: 13, lineHeight: 1.5,
              outline: 'none', fontFamily: 'inherit',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(212,168,67,0.4)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Paperclip */}
            <button
              type="button"
              data-testid="attach-btn"
              onClick={() => { setAttachOpen(o => !o); setAgentOpen(false); setModeOpen(false); }}
              title="Attach file"
              className="xps-electric-hover"
              data-active={attachOpen ? 'true' : undefined}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 30, height: 30,
                background: attachOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 7, color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <Paperclip size={13} className="xps-icon" />
            </button>

            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', flex: 1 }}>
              {attachments.length > 0 ? `${attachments.length} file(s)` : ''}
            </span>

            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
              {attachments.length === 0 && '↵ Send  ⇧↵ Newline'}
            </span>

            <button
              type="submit"
              data-testid="send-btn"
              disabled={loading || !input.trim()}
              className="xps-electric-hover"
              data-active={!!input.trim() && !loading ? 'true' : undefined}
              style={{
                position: 'relative',
                padding: '6px 14px',
                background: input.trim() && !loading ? gold : 'rgba(255,255,255,0.08)',
                color: input.trim() && !loading ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
                border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600,
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s, color 0.15s',
                display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
              }}
            >
              {loading ? '…' : 'Send'}
              {!loading && <Send size={11} className="xps-icon" />}
            </button>
          </div>
        </form>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileSelected}
          multiple
        />
      </div>
    </div>
  );
}

function ActiveRunsSummary({ runs }) {
  return (
    <div style={{
      background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.2)',
      borderRadius: 10, padding: '8px 10px', marginBottom: 4,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: gold, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>
        Active Runs ({runs.length})
      </div>
      {runs.map(run => (
        <div key={run.runId} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: gold, animation: 'xpsPulse 1s ease-in-out infinite' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {run.agent}: {run.task.slice(0, 35)}
            </span>
            <button
              onClick={() => cancelRun(run.runId)}
              title="Cancel run"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }}
            >
              <X size={12} />
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
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const agentInfo = AGENTS.find(a => a.id === msg.agent);
  const modeColor = msg.mode === 'live' ? '#4ade80' : msg.mode === 'synthetic' || msg.synthetic ? '#fbbf24' : 'rgba(255,255,255,0.25)';
  const modeLabel = msg.mode === 'live' ? 'live' : (msg.synthetic || msg.mode === 'synthetic') ? 'synthetic' : null;
  const ModeInfo = msg.mode ? MODES.find(m => m.id === msg.mode) : null;

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          maxWidth: '88%', padding: '8px 12px',
          background: 'rgba(212,168,67,0.15)', border: '1px solid rgba(212,168,67,0.25)',
          borderRadius: '12px 12px 2px 12px', color: '#fff', fontSize: 13, lineHeight: 1.5,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {msg.content}
          {msg.mode && ModeInfo && (
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, opacity: 0.5, fontSize: 10 }}>
              <ModeInfo.icon size={9} />
              {ModeInfo.label}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {agentInfo && (
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5, paddingLeft: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
          <agentInfo.icon size={10} />
          {agentInfo.label}
          {modeLabel && <span style={{ color: modeColor, fontWeight: 600 }}>· {modeLabel}</span>}
        </span>
      )}
      <div style={{
        maxWidth: '95%', padding: '8px 12px',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '2px 12px 12px 12px', color: 'rgba(255,255,255,0.85)',
        fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
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
          width: 4, height: 4, borderRadius: '50%', background: gold,
          animation: `xpsPulse 1.2s ease-in-out ${i * 0.2}s infinite`, opacity: 0.7,
        }} />
      ))}
    </div>
  );
}
