import React, { useState, useRef, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';
const GOLD = '#d4a843';

const INIT_MESSAGES = [
  {
    role: 'assistant',
    content: `Good morning, Marcus! I've analyzed your pipeline overnight. Here are 3 key insights:

1. **Gulf Coast Logistics** hasn't been contacted in 8 days — I recommend a follow-up call today with the new pricing sheet.

2. **Ace Hardware** proposal is pending review. The decision-maker, Robert Chen, typically responds within 48 hours.

3. Your territory close rate is up 4.2% this month. Great work on the Tampa Bay Brewing deal!`,
  },
];

const QUICK_ACTIONS = [
  { icon: '[S]', color: 'rgba(212,168,67,0.12)', title: 'Research a lead', desc: 'Get AI-powered intelligence on any company', prompt: 'Research Ace Hardware Distribution and give me competitive intelligence.' },
  { icon: '✉️', color: 'rgba(59,130,246,0.12)', title: 'Draft outreach email', desc: 'Create personalized cold outreach for a lead', prompt: 'Draft a personalized follow-up email for Gulf Coast Logistics.' },
  { icon: '📖', color: 'rgba(168,85,247,0.12)', title: 'Objection handling', desc: 'Get rebuttals for common sales objections', prompt: 'Help me handle the objection: "We already have a vendor for floor polishing."' },
  { icon: '⏱️', color: 'rgba(34,197,94,0.12)', title: 'Follow-up strategy', desc: 'AI-recommended next steps for stale leads', prompt: 'Generate a follow-up strategy for my 5 stale leads.' },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState(INIT_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    const content = text || input;
    if (!content.trim()) return;
    setInput('');
    const history = [...messages, { role: 'user', content }];
    setMessages(history);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      setMessages([...history, { role: 'assistant', content: data.reply || data.error || 'No response' }]);
    } catch (err) {
      setMessages([...history, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="ai-layout">
      {/* Chat Panel */}
      <div className="ai-chat-panel">
        <div className="ai-chat-header">
          <div className="ai-chat-avatar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/>
            </svg>
          </div>
          <div>
            <div className="ai-chat-name">XPS AI Sales Assistant</div>
            <div className="ai-chat-ctx">Context: Your territory · Pipeline · Lead data</div>
          </div>
        </div>

        <div className="ai-messages">
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'ai-msg-user' : 'ai-msg-assistant'}>
              <Md content={m.content} />
            </div>
          ))}
          {loading && (
            <div className="ai-msg-assistant" style={{ color: 'rgba(255,255,255,0.4)' }}>
              <span style={{ animation: 'pulse 1.2s infinite' }}>Thinking…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="ai-input-dock">
          <textarea
            className="ai-input"
            rows={1}
            placeholder="Ask your AI assistant anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            style={{ minHeight: 40, maxHeight: 120 }}
          />
          <button className="ai-send-btn" onClick={() => send()} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Right Panel */}
      <div className="ai-right-panel">
        {/* Quick Actions */}
        <div className="ai-panel-box">
          <div className="ai-panel-title">Quick Actions</div>
          {QUICK_ACTIONS.map((qa) => (
            <div key={qa.title} className="quick-action" onClick={() => send(qa.prompt)}>
              <div className="qa-icon" style={{ background: qa.color }}>{qa.icon}</div>
              <div>
                <div className="qa-title">{qa.title}</div>
                <div className="qa-desc">{qa.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Your Context */}
        <div className="ai-panel-box">
          <div className="ai-panel-title">Your Context</div>
          {[
            { label: 'Territory', value: 'Southeast FL' },
            { label: 'Active Leads', value: '47' },
            { label: 'Pending Proposals', value: '8' },
            { label: 'Follow-ups Due', value: '5' },
          ].map((r) => (
            <div key={r.label} className="ctx-row">
              <span className="ctx-label">{r.label}</span>
              <span className="ctx-value">{r.value}</span>
            </div>
          ))}
        </div>

        {/* Session Actions */}
        <div className="ai-panel-box">
          <div className="ai-panel-title">Session Actions</div>
          <button
            className="btn-outline"
            style={{ width: '100%', marginBottom: 8, justifyContent: 'center' }}
            onClick={() => setMessages(INIT_MESSAGES)}
          >
            Clear History
          </button>
          <button
            className="btn-outline"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Export Chat
          </button>
        </div>
      </div>
    </div>
  );
}

/* Simple markdown bold renderer */
function Md({ content }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i}>{p.slice(2, -2)}</strong>
          : p
      )}
    </>
  );
}
