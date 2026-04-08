import React, { useState } from 'react';
import DeploymentStatus from './components/DeploymentStatus.jsx';
import HomePage from './components/HomePage.jsx';

const API_URL = import.meta.env.API_URL || '';

// AuthPanel and Supabase session checks have been disabled.
// The site is now directly accessible without any sign-in requirement.

function ChatPage() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hello! How can I help you today?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
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

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h2>AI Assistant</h2>
      <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, minHeight: 300, marginBottom: 12, background: '#fafafa' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8, textAlign: m.role === 'user' ? 'right' : 'left' }}>
            <span style={{ background: m.role === 'user' ? '#0070f3' : '#eee', color: m.role === 'user' ? '#fff' : '#000', borderRadius: 12, padding: '6px 12px', display: 'inline-block', maxWidth: '80%' }}>
              {m.content}
            </span>
          </div>
        ))}
        {loading && <div style={{ color: '#999' }}>Thinking…</div>}
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
        <input style={{ ...inputStyle, flex: 1, marginBottom: 0 }} value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message…" />
        <button style={btnStyle} type="submit" disabled={loading}>Send</button>
      </form>
    </div>
  );
}

function ScrapePage() {
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    setResult('');
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, prompt }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h2>AI Scraper</h2>
      <form onSubmit={handle}>
        <input style={inputStyle} type="url" placeholder="https://example.com" value={url} onChange={e => setUrl(e.target.value)} required />
        <input style={inputStyle} placeholder="Custom prompt (optional)" value={prompt} onChange={e => setPrompt(e.target.value)} />
        <button style={btnStyle} type="submit" disabled={loading}>{loading ? 'Scraping…' : 'Scrape & Summarise'}</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 16, background: '#f6f8fa', borderRadius: 8, padding: 16, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {result}
        </div>
      )}
    </div>
  );
}

const inputStyle = { display: 'block', width: '100%', boxSizing: 'border-box', padding: '8px 10px', marginBottom: 10, border: '1px solid #ccc', borderRadius: 4, fontSize: 14 };
const btnStyle = { padding: '8px 18px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 };

const PAGES = ['dashboard', 'assistant', 'scraper', 'admin', 'systems', 'env', 'status'];

export default function App() {
  const [page, setPage] = useState('home');

  // Auth/sign-in screen disabled – site is directly accessible without login.
  // if (!user) return <AuthPanel onAuth={setUser} />;

  if (page === 'home') {
    return <HomePage onEnterAdmin={() => setPage('dashboard')} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <aside style={{ width: 200, padding: '20px 12px', borderRight: '1px solid #eee', background: '#f9f9f9' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 18 }}>XPS Admin</h2>
        {PAGES.map(p => (
          <div
            key={p}
            onClick={() => setPage(p)}
            style={{
              padding: '8px 10px',
              cursor: 'pointer',
              borderRadius: 4,
              background: page === p ? '#0070f3' : 'transparent',
              color: page === p ? '#fff' : '#333',
              marginBottom: 2,
              fontSize: 14,
            }}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </div>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: 20 }}>
          <button
            onClick={() => setPage('home')}
            style={{ ...btnStyle, background: '#555', fontSize: 12, padding: '5px 10px' }}
          >
            ← Home
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 28 }}>
        {page === 'assistant' && <ChatPage />}
        {page === 'scraper' && <ScrapePage />}
        {page === 'status' && (
          <div>
            <h2>Deployment Status</h2>
            <DeploymentStatus />
          </div>
        )}
        {['dashboard', 'admin', 'systems', 'env'].includes(page) && (
          <div>
            <h1 style={{ textTransform: 'capitalize' }}>{page}</h1>
            {page === 'env' && (
              <div style={{ background: '#f6f8fa', padding: 16, borderRadius: 8, fontFamily: 'monospace', fontSize: 13 }}>
                <div>SUPABASE_URL: {import.meta.env.SUPABASE_URL ? '✅ set' : '❌ missing'}</div>
                <div>SUPABASE_ANON_KEY: {import.meta.env.SUPABASE_ANON_KEY ? '✅ set' : '❌ missing'}</div>
                <div>API_URL: {import.meta.env.API_URL || '(empty – using relative /api)'}</div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
