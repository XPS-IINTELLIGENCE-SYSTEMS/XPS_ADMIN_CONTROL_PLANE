import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Link2, Paperclip, Send, Sparkles, Trash2, X } from 'lucide-react';
import { getConnectionPrefs, subscribeConnectionPrefs } from '../lib/connectionPrefs.js';
import { prependIngestionQueue } from '../lib/ingestionQueue.js';
import { resolveClientProviderState } from '../lib/providerState.js';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.API_URL || '';
const LEGACY_THREAD_STORAGE_KEY = 'xps.chat.thread.v3';
const THREAD_STORAGE_KEY = 'xps.chat.thread.v4';
const ACCEPTED_ATTACHMENT_TYPES = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.csv',
  '.txt',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.spreadsheet',
  'text/csv',
  'text/plain',
].join(',');

const MODE_CONFIG = {
  assistant: {
    label: 'Assistant',
    agent: 'orchestrator',
    note: 'OpenClaw-style operator chat with concise Groq-first guidance.',
  },
  research: {
    label: 'Research',
    agent: 'research',
    note: 'Research mode for target-account summaries and repo snapshot review.',
  },
  connectors: {
    label: 'Connectors',
    agent: 'orchestrator',
    note: 'Connector setup, ingestion, and Playwright browser-worker troubleshooting.',
  },
};

const DEFAULT_THREAD = [
  {
    id: 'welcome',
    role: 'assistant',
    mode: 'assistant',
    text: 'Groq-first chat is ready. Files added here are mirrored into the centered dashboard ingestion queue.',
    createdAt: Date.now(),
    meta: { provider: 'system', model: 'chat-primary', mode: 'ready' },
  },
];

const QUICK_PROMPTS = [
  { label: 'Groq status', prompt: 'Tell me whether Groq is ready and what is missing if it is blocked.' },
  { label: 'Connector checklist', prompt: 'Give me the next connector steps for this dashboard.' },
  { label: 'Summarize queue', prompt: 'Summarize the files and sources that should appear in the dashboard queue.' },
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
    'Behave like a high-quality operational chat agent: concise, practical, and direct.',
    'When helpful, structure replies into Summary, Reasoning, and Next actions.',
    'Do not claim data sources or connector state that were not provided.',
    `Current conversation mode: ${context.label}.`,
    `Current dashboard section: ${activePanel}.`,
    'If Groq is unavailable, clearly explain the missing setup and point the user to the centered dashboard connectors section.',
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

function toQueuedAttachments(files) {
  return Array.from(files || []).map((file) => ({
    name: file.name,
    type: file.type || 'file',
    size: file.size,
    sizeLabel: file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.max(1, Math.round(file.size / 1024))} KB`,
  }));
}

function syncAttachmentsToDashboard(files) {
  if (!files.length) return;
  prependIngestionQueue(files.map((file) => ({
    id: `chat-upload-${Date.now()}-${file.name}`,
    label: file.name,
    source: 'Chat upload',
    detail: `${file.sizeLabel} mirrored from the right-side chat rail.`,
    status: 'Queued',
  })));
}

export default function ChatRail({ activePanel, onNavigate, isMobile = false }) {
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
  const browserWorkerMode = apiStatus?.browser?.mode || (connectionPrefs.browserWorkerUrl ? 'local' : 'blocked');
  const browserWorkerReady = browserWorkerMode === 'live' || browserWorkerMode === 'local';
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
    const next = toQueuedAttachments(event.target.files);
    setAttachments((current) => [...current, ...next]);
    syncAttachmentsToDashboard(next);
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
        text: `Live assistant request failed.

${error.message}`,
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
    <div data-testid="chat-rail-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: 'var(--bg-sidebar)' }}>
      <div style={{ padding: isMobile ? '16px 14px 12px' : '18px 16px 14px', borderBottom: '1px solid var(--border)', background: 'linear-gradient(180deg, rgba(17,19,24,0.96) 0%, rgba(8,9,12,0.94) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: 'var(--text-muted)' }}>RIGHT CHAT RAIL</div>
            <div className="xps-gold-text" style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>OpenClaw operator chat</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
              {MODE_CONFIG[mode].note}
            </div>
          </div>
          <button
            type="button"
            onClick={clearThread}
            className="xps-electric-hover"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              borderRadius: 10,
              flexShrink: 0,
            }}
            aria-label="Clear thread"
          >
            <Trash2 size={14} className="xps-icon" />
          </button>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '7px 12px', background: `${runtimeTone.color}14`, border: `1px solid ${runtimeTone.color}24`, color: runtimeTone.color, fontSize: 12, fontWeight: 700, marginTop: 14 }}>
          <Activity size={13} />
          {llmState.active === 'none' ? 'Synthetic fallback' : `${providerLabel(llmState.active)} ready`}
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '6px 10px', background: 'rgba(212,175,82,0.12)', border: '1px solid rgba(212,175,82,0.24)', color: 'var(--gold)', fontSize: 11, fontWeight: 700 }}>
            <Sparkles size={11} />
            Groq-first
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '6px 10px', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.24)', color: '#93c5fd', fontSize: 11, fontWeight: 700 }}>
            <Paperclip size={11} />
            Paperclip uploads
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '6px 10px', background: browserWorkerReady ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', border: browserWorkerReady ? '1px solid rgba(34,197,94,0.24)' : '1px solid rgba(239,68,68,0.24)', color: browserWorkerReady ? '#4ade80' : '#fca5a5', fontSize: 11, fontWeight: 700 }}>
            <Activity size={11} />
            {browserWorkerReady ? 'Playwright worker ready' : 'Playwright worker blocked'}
          </span>
        </div>

        <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Conversation mode</span>
            <select
              data-testid="model-selector"
              value={mode}
              onChange={(event) => setMode(event.target.value)}
              style={selectStyle}
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
              style={selectStyle}
            >
              {providerOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
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
                borderRadius: 12,
                padding: '10px 12px',
                fontSize: 12,
                fontWeight: 600,
                textAlign: 'left',
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: isMobile ? '14px' : '16px', display: 'grid', gap: 12 }}>
        {thread.map((message) => {
          const isAssistant = message.role === 'assistant';
          const metaTone = getProviderTone(message.meta?.mode);
          return (
            <div
              key={message.id}
              style={{
                justifySelf: isAssistant ? 'stretch' : 'end',
                maxWidth: '100%',
                background: isAssistant ? 'var(--bg-card)' : 'rgba(198,162,79,0.12)',
                border: `1px solid ${isAssistant ? 'var(--border)' : 'rgba(198,162,79,0.28)'}`,
                borderRadius: 18,
                padding: '12px 14px',
                whiteSpace: 'pre-wrap',
                boxShadow: isAssistant ? 'var(--shadow-card)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.1, color: isAssistant ? 'var(--text-muted)' : 'var(--gold)' }}>
                  {isAssistant ? `${MODE_CONFIG[message.mode]?.label || 'Assistant'} · ${providerLabel(message.meta?.provider)}` : 'YOU'}
                </div>
                {message.meta?.mode ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '4px 8px', background: `${metaTone.color}14`, color: metaTone.color, fontSize: 10, fontWeight: 700 }}>
                    <Sparkles size={11} />
                    {metaTone.label}
                  </span>
                ) : null}
              </div>

              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>{message.text}</div>

              {message.attachments?.length ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {message.attachments.map((file) => (
                    <span key={`${message.id}-${file.name}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '6px 10px', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: 11 }}>
                      <Paperclip size={11} className="xps-icon" />
                      {file.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12 }}>
            <Activity size={14} />
            Working on your response…
          </div>
        ) : null}
        <div ref={threadEndRef} />
      </div>

      <div style={{ padding: isMobile ? '14px 14px 18px' : '14px 16px 16px', borderTop: '1px solid var(--border)', background: 'rgba(12,13,17,0.92)' }}>
        {!llmState.providers.groq?.configured ? (
          <div style={{ marginBottom: 12, borderRadius: 14, border: '1px solid rgba(234,179,8,0.28)', background: 'rgba(234,179,8,0.08)', padding: '12px 14px', color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.6 }}>
            Groq full LLM is not configured yet. Open the centered Connectors dashboard section and add a Groq API key to make the chat fully live.
          </div>
        ) : null}

        {attachments.length > 0 ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {attachments.map((file) => (
              <div key={file.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 999, padding: '8px 10px', fontSize: 11, color: 'var(--text-secondary)' }}>
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
            minHeight: isMobile ? 112 : 120,
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
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
            <input ref={fileInputRef} type="file" multiple hidden accept={ACCEPTED_ATTACHMENT_TYPES} onChange={handleFiles} />
            <button
              type="button"
              onClick={() => onNavigate?.('connectors')}
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
              Connectors
            </button>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>PDF, Docs, XLS, CSV, text · Enter to send</div>
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

const selectStyle = {
  width: '100%',
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  color: 'var(--text-primary)',
  padding: '11px 12px',
  outline: 'none',
};
