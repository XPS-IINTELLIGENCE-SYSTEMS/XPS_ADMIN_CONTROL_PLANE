import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Search, Mail, BookOpen, Clock, Zap, AlertTriangle } from 'lucide-react';
import { orchestrate, ORCHESTRATOR_MODE } from '../lib/orchestrator.js';
import { aiConversationSeed, quickActions, userContextPanel } from '../data/synthetic.js';

const GOLD = '#c49e3c';

function MsgBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
      {!isUser && (
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(196,158,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10, marginTop: 2 }}>
          <Bot size={14} color={GOLD} />
        </div>
      )}
      <div style={{
        maxWidth: '78%',
        background: isUser ? GOLD : 'var(--bg-card-alt)',
        color: isUser ? '#0a0b0c' : 'var(--text-primary)',
        borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
        padding: '12px 16px', fontSize: 14, lineHeight: 1.6,
        border: isUser ? 'none' : '1px solid var(--border)',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {msg.content}
        {msg.mode === 'synthetic' && !isUser && (
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Zap size={8} /> synthetic mode
          </div>
        )}
      </div>
    </div>
  );
}

const ICON_MAP = { search: Search, mail: Mail, 'book-open': BookOpen, clock: Clock };

export default function AIAssistant() {
  const [messages, setMessages] = useState(aiConversationSeed);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const prompt = text || input.trim();
    if (!prompt) return;
    setInput('');
    const userMsg = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const result = await orchestrate(prompt, '/ai-assistant');
      setMessages(prev => [...prev, { role: 'assistant', content: result.reply, mode: result.mode }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, height: 'calc(100vh - 112px)' }}>
      {/* Main chat */}
      <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {/* Chat header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(196,158,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} color={GOLD} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>XPS AI Sales Assistant</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Context: Your territory · Pipeline · Lead data
            </div>
          </div>
          {ORCHESTRATOR_MODE === 'synthetic' && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#eab308', background: 'rgba(234,179,8,0.1)', padding: '3px 10px', borderRadius: 99 }}>
              <AlertTriangle size={10} /> synthetic mode
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {messages.map((msg, i) => <MsgBubble key={i} msg={msg} />)}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(196,158,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={14} color={GOLD} />
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Thinking…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask your AI assistant anything…"
            style={{
              flex: 1, background: 'var(--bg-root)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '11px 14px',
              color: 'var(--text-primary)', fontSize: 14, outline: 'none',
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              width: 40, height: 40, borderRadius: 10, border: 'none',
              background: input.trim() ? GOLD : 'var(--bg-card-alt)',
              color: input.trim() ? '#0a0b0c' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Quick Actions */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase' }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickActions.map(action => {
              const Icon = ICON_MAP[action.icon] || Search;
              return (
                <button
                  key={action.id}
                  onClick={() => send(action.label)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    background: 'var(--bg-card-alt)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-gold)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(196,158,60,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={13} color={GOLD} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{action.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{action.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Your Context */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text-muted)', marginBottom: 14, textTransform: 'uppercase' }}>Your Context</div>
          {[
            { label: 'Territory',          val: userContextPanel.territory },
            { label: 'Active Leads',       val: userContextPanel.activeLeads },
            { label: 'Pending Proposals',  val: userContextPanel.pendingProposals },
            { label: 'Follow-ups Due',     val: userContextPanel.followupsDue },
          ].map(({ label, val }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
