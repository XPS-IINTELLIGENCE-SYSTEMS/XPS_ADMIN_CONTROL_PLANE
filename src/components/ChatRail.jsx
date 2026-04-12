import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, ChevronRight, Link2, Paperclip, Send, Sparkles, Trash2, X } from 'lucide-react';
import { getConnectionPrefs, subscribeConnectionPrefs } from '../lib/connectionPrefs.js';
import { resolveClientProviderState } from '../lib/providerState.js';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.API_URL || '';
const LEGACY_THREAD_STORAGE_KEY = 'xps.chat.thread.v3';
const THREAD_STORAGE_KEY = 'xps.chat.thread.v4';

const MODE_CONFIG = {
  assistant: {
    label: 'Assistant',
    agent: 'orchestrator',
    note: 'General operator chat with clear reasoning, next actions, and production-safe answers.',
  },
  research: {
    label: 'Research',
    agent: 'research',
    note: 'Focused account research, summaries, and competitive context.',
  },
  connectors: {
    label: 'Connectors',
    agent: 'orchestrator',
    note: 'Connector setup, ingestion advice, and runtime troubleshooting.',
  },
};

const DEFAULT_THREAD = [
  {
    id: 'welcome',
    role: 'assistant',
    mode: 'assistant',
    text: 'Primary chat is live. Pull over the dashboard whenever you need ingestion controls, Groq setup, workspace artifacts, or production checks.',
    createdAt: Date.now(),
    meta: { provider: 'system', model: 'chat-primary', mode: 'ready' },
  },
];

const QUICK_PROMPTS = [
  { label: 'Launch ingestion', prompt: 'Open the ingestion dashboard and tell me the best first data source to connect.' },
  { label: 'Groq readiness', prompt: 'Check whether Groq is ready and tell me exactly what is missing if it is not.' },
  { label: 'Sales follow-up', prompt: 'Draft a concise follow-up for a warm lead after a product demo.' },
  { label: 'Research account', prompt: 'Research a target account and give me a short reasoning-backed summary.' },
];

function loadThread() {
  if (typeof window === 'undefined') return DEFAULT_THREAD;
  try {
    const currentThreadRaw = window.localStorage.getItem(THREAD_STORAGE_KEY);
    const raw = currentThreadRaw || window.localStorage.getItem(LEGACY_THREAD_STORAGE_KEY);
    if (!raw) return DEFAULT_THREAD;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_THREAD;
    return parsed.map((message, index) => ({
      ...message,
      id: message?.id || `message-${index}`,
      role: message?.role === 'user' ? 'user' : 'assistant',
      mode: MODE_CONFIG[message?.mode] ? message.mode : 'assistant',
      text: typeof message?.text === 'string' ? message.text : '',
      createdAt: Number.isFinite(message?.createdAt) ? message.createdAt : Date.now() - index,
      attachments: Array.isArray(message?.attachments) ? message.attachments : [],
      meta: message?.meta || null,
    }));
  } catch {
    return DEFAULT_THREAD;
  }
}

function buildSystemPrompt(mode, activePanel) {
  const context = MODE_CONFIG[mode] || MODE_CONFIG.assistant;
  return [
    'You are the production operator chat assistant for the XPS Admin Control Plane.',
    'Behave like a standard high-quality chat agent: conversational, practical, and concise.',
    'When helpful, structure replies into Summary, Reasoning, and Next actions.',
    'Do not claim data sources or connector state that were not provided.',
    `Current conversation mode: ${context.label}.`,
    `Current dashboard section: ${activePanel}.`,
    'If Groq is unavailable, clearly explain the missing setup and point the user to the dashboard connectors drawer.',
  ].join(' ');
}

function providerLabel(provider) {
  if (!provider || provider === 'auto') return 'Groq-first auto';
  return String(provider).toUpperCase();
}

function getProviderTone(mode) {
  if (mode === 'live') return { label: 'Live', color: '#22c55e' };
  if (mode === 'local') return { label: 'Local', color: '#60a5fa' };
  if (mode === 'blocked') return { label: 'Blocked', color: '#ef4444' };
  return { label: 'Synthetic', color: '#eab308' };
}

function buildCredentials(connectionPrefs) {
  return {
    openaiApiKey: connectionPrefs.openaiApiKey,
    openaiModel: connectionPrefs.openaiModel,
    groqApiKey: connectionPrefs.groqApiKey,
    groqModel: connectionPrefs.groqModel,
    geminiApiKey: connectionPrefs.geminiApiKey,
    geminiModel: connectionPrefs.geminiModel,
    ollamaBaseUrl: connectionPrefs.ollamaBaseUrl,
    ollamaModel: connectionPrefs.ollamaModel,
  };
}

function attachmentQueueText(attachments) {
  if (!attachments.length) return '';
  return `\n\nAttachment queue:\n${attachments.map((item) => `- ${item.name} (${item.sizeLabel})`).join('\n')}`;
}

export default function ChatRail({ activePanel, onNavigate, onOpenDashboard, dashboardOpen, isMobile = false }) {
  const [thread, setThread] = useState(loadThread);
  const [mode, setMode] = useState('assistant');
  const [composer, setComposer] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [connectionPrefs, setConnectionPrefs] = useState(getConnectionPrefs());
  const [selectedProvider, setSelectedProvider] = useState('auto');
  const fileInputRef = useRef(null);
  const threadEndRef = useRef(null);

  const llmState = useMemo(
    () => resolveClientProviderState(apiStatus, connectionPrefs).llm,
    [apiStatus, connectionPrefs],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(THREAD_STORAGE_KEY, JSON.stringify(thread));
  }, [thread]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [thread, loading]);

  useEffect(() => {
    setConnectionPrefs(getConnectionPrefs());
    return subscribeConnectionPrefs(setConnectionPrefs);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/status`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setApiStatus(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (llmState.providers.groq?.configured) {
      setSelectedProvider((current) => (current === 'auto' ? 'groq' : current));
      return;
    }
    if (selectedProvider === 'groq' && !llmState.providers.groq?.configured) {
      setSelectedProvider('auto');
    }
  }, [llmState.providers.groq?.configured, selectedProvider]);

  const runtimeTone = getProviderTone(llmState.mode);
  const providerOptions = useMemo(() => ([
    { value: 'auto', label: 'Groq-first auto' },
    { value: 'groq', label: 'Groq' },
    { value: 'openai', label: 'OpenAI' },
    { value: 'gemini', label: 'Gemini' },
    { value: 'ollama', label: 'Ollama' },
    { value: 'synthetic', label: 'Synthetic' },
  ]), []);

  const handleAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFiles = (event) => {
    const next = Array.from(event.target.files || []).map((file) => ({
      name: file.name,
      type: file.type || 'file',
      size: file.size,
      sizeLabel: file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`,
    }));
    setAttachments((current) => [...current, ...next]);
    event.target.value = '';
  };

  const removeAttachment = (name) => {
    setAttachments((current) => current.filter((file) => file.name !== name));
  };

  const clearThread = () => {
    setThread(DEFAULT_THREAD);
    setAttachments([]);
    setComposer('');
  };

  const sendMessage = async (promptText = composer) => {
    const rawText = promptText.trim();
    if (!rawText && attachments.length === 0) return;
    if (loading) return;

    const queuedAttachments = [...attachments];
    const userText = rawText || 'Shared attachments only.';
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: userText,
      mode,
      attachments: queuedAttachments,
      createdAt: Date.now(),
      meta: { provider: providerLabel(selectedProvider) },
    };

    const recentMessages = thread
      .filter((message) => message.id !== 'welcome')
      .slice(-10)
      .map((message) => ({ role: message.role, content: message.text }));

    const payload = {
      agent: MODE_CONFIG[mode].agent,
      provider: selectedProvider,
      runId: `chat-${Date.now()}`,
      credentials: buildCredentials(connectionPrefs),
      attachments: queuedAttachments,
      messages: [
        { role: 'system', content: buildSystemPrompt(mode, activePanel) },
        ...recentMessages,
        { role: 'user', content: `${userText}${attachmentQueueText(queuedAttachments)}` },
      ],
    };

    setThread((current) => [...current, userMessage]);
    setComposer('');
    setAttachments([]);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }
      if (!response.ok && !data?.reply) throw new Error(data?.error || `Chat API request failed with HTTP ${response.status}`);
      const reply = data.reply || data.error || 'No response returned.';
      setThread((current) => [...current, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        mode,
        text: reply,
        createdAt: Date.now() + 1,
        meta: {
          provider: data.provider || selectedProvider,
          model: data.model || llmState.model || null,
          mode: data.mode || llmState.mode,
        },
      }]);
    } catch (error) {
      setThread((current) => [...current, {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        mode,
        text: `Live assistant request failed.\n\n${error.message}`,
        createdAt: Date.now() + 1,
        meta: { provider: selectedProvider, mode: 'blocked' },
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'var(--bg-root)' }}>
      <div style={{ padding: isMobile ? '16px 14px 14px' : '20px 20px 16px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg, rgba(17,19,24,0.95) 0%, rgba(8,9,12,0.92) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: 'var(--text-muted)' }}>PRIMARY CHAT</div>
            <div className="xps-gold-text" style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, marginTop: 4 }}>Operational AI agent</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6, maxWidth: 780 }}>
              {MODE_CONFIG[mode].note}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '7px 12px', background: `${runtimeTone.color}14`, border: `1px solid ${runtimeTone.color}24`, color: runtimeTone.color, fontSize: 12, fontWeight: 700 }}>
              <Activity size={13} />
              {llmState.active === 'none' ? 'Synthetic fallback' : `${providerLabel(llmState.active)} ready`}
            </div>
            <button
              type="button"
              onClick={clearThread}
              className="xps-electric-hover"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                borderRadius: 10,
                padding: '10px 12px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <Trash2 size={14} className="xps-icon" />
              Clear
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? 148 : 180}px, 1fr))`, gap: 12, marginTop: 16 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Conversation mode</span>
            <select
              data-testid="model-selector"
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                color: 'var(--text-primary)',
                padding: '11px 12px',
                outline: 'none',
              }}
            >
              {Object.entries(MODE_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Runtime provider</span>
            <select
              value={selectedProvider}
              onChange={(event) => setSelectedProvider(event.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                color: 'var(--text-primary)',
                padding: '11px 12px',
                outline: 'none',
              }}
            >
              {providerOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <div style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Dashboard drawer</span>
            <button
              type="button"
              onClick={() => {
                onNavigate?.('overview');
                onOpenDashboard?.();
              }}
              className="xps-electric-hover"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                border: '1px solid var(--border)',
                background: dashboardOpen ? 'var(--bg-active)' : 'var(--bg-card)',
                color: 'var(--text-primary)',
                borderRadius: 10,
                padding: '11px 12px',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
                <span>{dashboardOpen ? 'Dashboard open' : isMobile ? 'Pull dashboard' : 'Open dashboard'}</span>
                <ChevronRight size={15} className="xps-icon" />
              </button>
            </div>
          </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
          {QUICK_PROMPTS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setComposer(preset.prompt)}
              className="xps-electric-hover"
              style={{
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                borderRadius: 999,
                padding: '8px 11px',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: isMobile ? '14px' : '20px', display: 'grid', gap: 14 }}>
        {thread.map((message) => {
          const isAssistant = message.role === 'assistant';
          const metaTone = getProviderTone(message.meta?.mode);
          return (
            <div
              key={message.id}
              style={{
                justifySelf: isAssistant ? 'stretch' : 'end',
                maxWidth: isAssistant ? '100%' : 'min(720px, 100%)',
                background: isAssistant ? 'var(--bg-card)' : 'rgba(198,162,79,0.12)',
                border: `1px solid ${isAssistant ? 'var(--border)' : 'rgba(198,162,79,0.28)'}`,
                borderRadius: 20,
                padding: '14px 16px',
                whiteSpace: 'pre-wrap',
                boxShadow: isAssistant ? 'var(--shadow-card)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.1, color: isAssistant ? 'var(--text-muted)' : 'var(--gold)' }}>
                  {isAssistant ? `${MODE_CONFIG[message.mode]?.label || 'Assistant'} · ${providerLabel(message.meta?.provider)}` : 'YOU'}
                </div>
                {message.meta?.mode ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '4px 8px', background: `${metaTone.color}14`, color: metaTone.color, fontSize: 11, fontWeight: 700 }}>
                    <Sparkles size={12} />
                    {metaTone.label}
                    {message.meta?.model ? ` · ${message.meta.model}` : ''}
                  </span>
                ) : null}
              </div>

              <div style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.75 }}>{message.text}</div>

              {message.attachments?.length ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  {message.attachments.map((file) => (
                    <span key={`${message.id}-${file.name}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '6px 10px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: 12 }}>
                      <Paperclip size={12} className="xps-icon" />
                      {file.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
            <Activity size={14} />
            Working on your response…
          </div>
        ) : null}
        <div ref={threadEndRef} />
      </div>

      <div style={{ padding: isMobile ? '14px 14px 18px' : '18px 20px 20px', borderTop: '1px solid var(--border)', background: 'rgba(12,13,17,0.88)' }}>
        {!llmState.providers.groq?.configured ? (
          <div style={{ marginBottom: 12, borderRadius: 14, border: '1px solid rgba(234,179,8,0.28)', background: 'rgba(234,179,8,0.08)', padding: '12px 14px', color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6 }}>
            Groq full LLM is not configured yet. Open the dashboard drawer → Connectors and add a Groq API key to make the chat fully live.
          </div>
        ) : null}

        {attachments.length > 0 ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {attachments.map((file) => (
              <div key={file.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 999, padding: '8px 10px', fontSize: 12, color: 'var(--text-secondary)' }}>
                <Paperclip size={12} className="xps-icon" />
                {file.name}
                <button type="button" onClick={() => removeAttachment(file.name)} style={{ border: 'none', background: 'none', color: 'inherit', display: 'flex', padding: 0 }} aria-label={`Remove ${file.name}`}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <textarea
          data-testid="chat-input"
          value={composer}
          onChange={(event) => setComposer(event.target.value)}
          onKeyDown={handleComposerKeyDown}
          placeholder={`Message ${MODE_CONFIG[mode].label}…`}
          style={{
            width: '100%',
            minHeight: isMobile ? 112 : 126,
            resize: 'vertical',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '14px 16px',
            color: 'var(--text-primary)',
            outline: 'none',
            lineHeight: 1.7,
            fontSize: 14,
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              data-testid="attach-btn"
              type="button"
              onClick={handleAttach}
              className="xps-electric-hover"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 42,
                height: 42,
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
              aria-label="Attach file"
            >
              <Paperclip size={16} className="xps-icon" />
            </button>
            <input ref={fileInputRef} type="file" multiple hidden onChange={handleFiles} />
            <button
              type="button"
              onClick={() => {
                onNavigate?.('connectors');
                onOpenDashboard?.();
              }}
              className="xps-electric-hover"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                borderRadius: 12,
                padding: '10px 12px',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              <Link2 size={14} className="xps-icon" />
              Connect sources
            </button>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enter to send · Shift+Enter for a new line.</div>
          </div>

          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={loading || (!composer.trim() && attachments.length === 0)}
            className="xps-electric-hover"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              background: loading || (!composer.trim() && attachments.length === 0) ? 'rgba(198,162,79,0.35)' : 'var(--gold)',
              color: '#090a0d',
              borderRadius: 12,
              padding: '12px 16px',
              fontWeight: 800,
              opacity: loading || (!composer.trim() && attachments.length === 0) ? 0.6 : 1,
            }}
          >
            Send
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
