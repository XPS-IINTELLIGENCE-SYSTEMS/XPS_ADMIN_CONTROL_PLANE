import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Paperclip, Send, Trash2 } from 'lucide-react';

const THREAD_STORAGE_KEY = 'xps.chat.thread.v3';
const DEFAULT_THREAD = [
  {
    id: 'welcome',
    role: 'assistant',
    mode: 'assistant',
    text: 'Persistent chat is live on the right. The center stays reserved for dashboards, graphs, and workspace actions.',
    createdAt: Date.now(),
  },
];

const MODE_CONFIG = {
  assistant: {
    label: 'Assistant',
    note: 'Free-flow operator chat that stays in the right rail.',
  },
  research: {
    label: 'Research',
    note: 'Research guidance stays in chat unless you use a workspace action.',
  },
  connectors: {
    label: 'Connectors',
    note: 'Connector help stays in chat and does not replace the center surface.',
  },
};

function loadThread() {
  if (typeof window === 'undefined') return DEFAULT_THREAD;
  try {
    const raw = window.localStorage.getItem(THREAD_STORAGE_KEY);
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
    }));
  } catch {
    return DEFAULT_THREAD;
  }
}

function buildAssistantReply(text, mode, attachmentCount) {
  const trimmed = text.trim() || 'No prompt provided.';
  const attachmentLine = attachmentCount ? `\n\nI also have ${attachmentCount} attachment${attachmentCount === 1 ? '' : 's'} in this thread.` : '';

  if (mode === 'research') {
    return `Got it — I can help you research that right here without changing the center workspace.\n\nFocus: ${trimmed}\n\nTell me if you want a summary, open questions, or a next-step checklist.${attachmentLine}`;
  }

  if (mode === 'connectors') {
    return `Understood. I’ll keep connector guidance in this chat while the center stays on your control surfaces.\n\nRequest: ${trimmed}\n\nIf you want to change a connector, use the connector controls in the center when you are ready.${attachmentLine}`;
  }

  return `Got it. We can keep this as a normal back-and-forth conversation in the right rail.\n\nRequest: ${trimmed}\n\nThe center UI will stay focused on dashboards, graphs, and button-driven workspace actions.${attachmentLine}`;
}

export default function ChatRail() {
  const [thread, setThread] = useState(loadThread);
  const [mode, setMode] = useState('assistant');
  const [composer, setComposer] = useState('');
  const [attachments, setAttachments] = useState([]);
  const fileInputRef = useRef(null);
  const threadEndRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(THREAD_STORAGE_KEY, JSON.stringify(thread));
  }, [thread]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [thread]);

  const presets = useMemo(() => [
    { label: 'Daily brief', prompt: 'Build a short daily workspace brief for the sales team.' },
    { label: 'Connector update', prompt: 'Show me the connector changes I need to make today.' },
    { label: 'Sign-in help', prompt: 'Take me to the sign-in and access section.' },
  ], []);

  const handleAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFiles = (event) => {
    const next = Array.from(event.target.files || []).map((file) => ({ name: file.name, size: file.size }));
    setAttachments(next);
    event.target.value = '';
  };

  const handleSend = () => {
    if (!composer.trim() && attachments.length === 0) return;

    const nextUserMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: composer.trim() || 'Shared attachments only.',
      mode,
      createdAt: Date.now(),
    };
    const reply = buildAssistantReply(composer, mode, attachments.length);
    const nextAssistantMessage = {
      id: `assistant-${Date.now() + 1}`,
      role: 'assistant',
      mode,
      text: reply,
      createdAt: Date.now() + 1,
    };

    setThread((current) => [...current, nextUserMessage, nextAssistantMessage]);
    setComposer('');
    setAttachments([]);
  };

  const clearThread = () => {
    setThread(DEFAULT_THREAD);
    setAttachments([]);
    setComposer('');
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: 'var(--text-muted)' }}>PERSISTENT CHAT</div>
            <div className="xps-gold-text" style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>Right-rail operator chat</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
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
              gap: 6,
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              borderRadius: 10,
              padding: '8px 10px',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Trash2 size={14} className="xps-icon" />
            Clear
          </button>
        </div>

        <select
          data-testid="model-selector"
          value={mode}
          onChange={(event) => setMode(event.target.value)}
          style={{
            width: '100%',
            marginTop: 14,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            color: 'var(--text-primary)',
            padding: '10px 12px',
            outline: 'none',
          }}
        >
          {Object.entries(MODE_CONFIG).map(([value, config]) => (
            <option key={value} value={value}>{config.label}</option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {presets.map((preset) => (
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
                padding: '7px 10px',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'grid', gap: 12 }}>
        {thread.map((message) => {
          const isAssistant = message.role === 'assistant';
          const messageMode = MODE_CONFIG[message.mode] || MODE_CONFIG.assistant;
          return (
            <div
              key={message.id}
              style={{
                justifySelf: isAssistant ? 'stretch' : 'end',
                maxWidth: '100%',
                background: isAssistant ? 'var(--bg-card)' : 'rgba(198,162,79,0.12)',
                border: `1px solid ${isAssistant ? 'var(--border)' : 'rgba(198,162,79,0.28)'}`,
                borderRadius: 16,
                padding: '12px 14px',
                whiteSpace: 'pre-wrap',
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.1, color: isAssistant ? 'var(--text-muted)' : 'var(--gold)', marginBottom: 6 }}>
                {isAssistant ? messageMode.label.toUpperCase() : 'YOU'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7 }}>{message.text}</div>
            </div>
          );
        })}
        <div ref={threadEndRef} />
      </div>

      <div style={{ padding: 18, borderTop: '1px solid var(--border)' }}>
        {attachments.length > 0 && (
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {attachments.map((file) => (
              <div key={file.name} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 10px', fontSize: 12, color: 'var(--text-secondary)' }}>
                {file.name}
              </div>
            ))}
          </div>
        )}

        <textarea
          data-testid="chat-input"
          value={composer}
          onChange={(event) => setComposer(event.target.value)}
          onKeyDown={handleComposerKeyDown}
          placeholder={`Message ${MODE_CONFIG[mode].label}…`}
          style={{
            width: '100%',
            minHeight: 104,
            resize: 'vertical',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '12px 14px',
            color: 'var(--text-primary)',
            outline: 'none',
            lineHeight: 1.6,
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              data-testid="attach-btn"
              type="button"
              onClick={handleAttach}
              className="xps-electric-hover"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
              }}
              aria-label="Attach file"
            >
              <Paperclip size={16} className="xps-icon" />
            </button>
            <input ref={fileInputRef} type="file" multiple hidden onChange={handleFiles} />
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Enter to send · Shift+Enter for a new line.</div>
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={!composer.trim() && attachments.length === 0}
            className="xps-electric-hover"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              background: !composer.trim() && attachments.length === 0 ? 'rgba(198,162,79,0.35)' : 'var(--gold)',
              color: '#090a0d',
              borderRadius: 10,
              padding: '10px 14px',
              fontWeight: 800,
              opacity: !composer.trim() && attachments.length === 0 ? 0.6 : 1,
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
