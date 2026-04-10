import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, Send, X, ChevronRight, Zap, AlertTriangle } from 'lucide-react';
import { orchestrate, ORCHESTRATOR_MODE } from '../../lib/orchestrator.js';
import { aiConversationSeed } from '../../data/synthetic.js';

const GOLD = '#c49e3c';

const RAIL_WIDTH = 360;

function MsgBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 12,
    }}>
      {!isUser && (
        <div style={{
          width: 24, height: 24, borderRadius: 6, background: 'rgba(196,158,60,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginRight: 8, marginTop: 2,
        }}>
          <Bot size={13} color={GOLD} />
        </div>
      )}
      <div style={{
        maxWidth: '80%',
        background: isUser ? GOLD : 'var(--bg-card-alt)',
        color: isUser ? '#0a0b0c' : 'var(--text-primary)',
        borderRadius: isUser ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
        padding: '10px 14px',
        fontSize: 13,
        lineHeight: 1.55,
        border: isUser ? 'none' : '1px solid var(--border)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.content}
        {msg.mode === 'synthetic' && !isUser && (
          <div style={{ fontSize: 10, color: isUser ? 'rgba(0,0,0,0.5)' : 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Zap size={8} /> synthetic mode
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssistantRail({ open, onToggle }) {
  const location = useLocation();
  const [messages, setMessages] = useState(aiConversationSeed);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (text) => {
    const prompt = text || input.trim();
    if (!prompt) return;
    setInput('');
    const userMsg = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const result = await orchestrate(prompt, location.pathname);
      setMessages(prev => [...prev, { role: 'assistant', content: result.reply, mode: result.mode, surface: result.surface }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}`, mode: 'error' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Tab — always visible collapsed button on the right edge
  const tabButton = (
    <button
      onClick={onToggle}
      title="Open AI Orchestrator"
      style={{
        position: 'fixed', right: open ? RAIL_WIDTH : 0, top: '50%', transform: 'translateY(-50%)',
        width: 24, height: 72, background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRight: 'none',
        borderRadius: '8px 0 0 8px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
        cursor: 'pointer', zIndex: 100, color: GOLD,
        transition: 'right 0.25s',
      }}
    >
      {open ? <X size={12} /> : <Bot size={12} />}
      {!open && (
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, writingMode: 'vertical-rl', color: 'var(--text-muted)', marginTop: 2 }}>
          AI
        </span>
      )}
    </button>
  );

  return (
    <>
      {tabButton}

      {/* Rail panel */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: RAIL_WIDTH,
        background: 'var(--bg-sidebar)',
        borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : `translateX(${RAIL_WIDTH}px)`,
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 99,
        boxShadow: open ? 'var(--shadow-lg)' : 'none',
      }}>
        {/* Header */}
        <div style={{
          height: 'var(--header-h)',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'rgba(196,158,60,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={14} color={GOLD} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>XPS AI Orchestrator</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {ORCHESTRATOR_MODE === 'live' ? 'live' : 'synthetic mode'}
              {' · '}
              {location.pathname.replace('/', '') || 'home'}
            </div>
          </div>
          <button onClick={onToggle} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>

        {/* Mode warning */}
        {ORCHESTRATOR_MODE === 'synthetic' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px',
            background: 'rgba(234,179,8,0.07)',
            borderBottom: '1px solid rgba(234,179,8,0.15)',
            fontSize: 11, color: '#eab308',
          }}>
            <AlertTriangle size={11} />
            Synthetic mode — set OPENAI_API_KEY for live intelligence
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
          {messages.map((msg, i) => (
            <MsgBubble key={i} msg={msg} />
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 4, padding: '8px 0', alignItems: 'center' }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(196,158,60,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                <Bot size={13} color={GOLD} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Thinking…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask your AI assistant anything…"
              rows={1}
              style={{
                flex: 1, resize: 'none', background: 'var(--bg-card)',
                border: '1px solid var(--border)', borderRadius: 8,
                color: 'var(--text-primary)', fontSize: 13,
                padding: '9px 12px', outline: 'none',
                lineHeight: 1.5, maxHeight: 120,
                overflowY: 'auto',
              }}
            />
            <button
              onClick={() => send()}
              disabled={loading || !input.trim()}
              style={{
                width: 34, height: 34, borderRadius: 8, border: 'none',
                background: input.trim() ? GOLD : 'var(--bg-card)',
                color: input.trim() ? '#0a0b0c' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.15s',
              }}
            >
              <Send size={14} />
            </button>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
            Enter to send · Shift+Enter for newline
          </div>
        </div>
      </div>
    </>
  );
}
