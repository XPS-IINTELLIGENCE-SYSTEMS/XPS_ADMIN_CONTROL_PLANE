import React, { useState, useEffect } from 'react';
import { supabase, signIn, signUp, signOut } from './lib/supabaseClient.js';
import DeploymentStatus from './components/DeploymentStatus.jsx';

const API_URL = import.meta.env.API_URL || '';

function AuthPanel({ onAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(email, password);
        setError('Check your email to confirm your account.');
      } else {
        const data = await signIn(email, password);
        onAuth(data.user || data.session?.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', padding: 24, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>XPS Admin – {mode === 'login' ? 'Sign In' : 'Sign Up'}</h2>
      <form onSubmit={handle}>
        <input style={inputStyle} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input style={inputStyle} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        {error && <p style={{ color: 'red', fontSize: 13 }}>{error}</p>}
        <button style={btnStyle} type="submit" disabled={loading}>{loading ? 'Loading…' : mode === 'login' ? 'Sign In' : 'Sign Up'}</button>
      </form>
      <p style={{ fontSize: 13, marginTop: 12 }}>
        {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <span style={{ color: '#0070f3', cursor: 'pointer' }} onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? 'Sign Up' : 'Sign In'}
        </span>
      </p>
    </div>
  );
}

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
  const [page, setPage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setAuthLoading(false);
    }).catch(() => {
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!user) return <AuthPanel onAuth={setUser} />;

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
          <p style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>{user.email}</p>
          <button
            onClick={() => signOut().catch(console.error)}
            style={{ ...btnStyle, background: '#e53e3e', fontSize: 12, padding: '5px 10px' }}
          >
            Sign Out
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
            <p>Signed in as <strong>{user.email}</strong></p>
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
