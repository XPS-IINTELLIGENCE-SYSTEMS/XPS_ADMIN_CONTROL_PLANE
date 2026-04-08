import React, { useState, useEffect, useRef } from 'react';
import { supabase, signIn, signUp, signOut } from './lib/supabaseClient.js';
import DeploymentStatus from './components/DeploymentStatus.jsx';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || '';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  gold:      '#c9a227',
  goldDark:  '#a07a14',
  goldBg:    'rgba(201,162,39,0.1)',
  goldBgHov: 'rgba(201,162,39,0.18)',
  bg:        '#0a0a0a',
  bgSide:    '#0e0e0e',
  bgCard:    '#161616',
  bgInput:   '#1c1c1c',
  bgHov:     '#1e1e1e',
  border:    '#262626',
  borderLt:  '#333333',
  text:      '#f0f0f0',
  textSec:   '#9ca3af',
  textMuted: '#6b7280',
  green:     '#22c55e',
  red:       '#ef4444',
};

// ─── Tiny SVG icon ────────────────────────────────────────────────────────────
function Icon({ d, size = 16, color = C.textSec, sw = 1.5, fill = 'none', style = {} }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill={fill} stroke={color} strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
    >
      <path d={d} />
    </svg>
  );
}

// ─── XPS Shield logo ──────────────────────────────────────────────────────────
function ShieldLogo({ size = 32 }) {
  return (
    <svg width={size} height={Math.round(size * 1.15)} viewBox="0 0 80 92" fill="none">
      <defs>
        <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#f0d060" />
          <stop offset="45%"  stopColor="#c9a227" />
          <stop offset="100%" stopColor="#7a5a10" />
        </linearGradient>
      </defs>
      <path d="M40 4 L76 18 L76 46 C76 67 60 80 40 88 C20 80 4 67 4 46 L4 18 Z" fill="url(#sg)" />
      <path d="M40 13 L67 24 L67 45 C67 62 53 73 40 80 C27 73 13 62 13 45 L13 24 Z" fill="rgba(0,0,0,0.3)" />
      <text x="40" y="55" textAnchor="middle" fontSize="15" fill="white"
            fontWeight="800" fontFamily="Arial,sans-serif">XPS</text>
    </svg>
  );
}

// ─── Navigation config ────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'MAIN',
    items: [
      { id: 'dashboard',   label: 'Dashboard',     d: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
      { id: 'crm',         label: 'CRM',            d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
      { id: 'leads',       label: 'Leads',          d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
      { id: 'assistant',   label: 'AI Assistant',   d: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
      { id: 'research',    label: 'Research Lab',   d: 'M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18' },
      { id: 'outreach',    label: 'Outreach',       d: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6' },
      { id: 'proposals',   label: 'Proposals',      d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8' },
      { id: 'analytics',   label: 'Analytics',      d: 'M18 20V10M12 20V4M6 20v-6' },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { id: 'knowledge',   label: 'Knowledge Base', d: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5V4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z' },
      { id: 'competition', label: 'Competition',    d: 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4zM8 2v16M16 6v16' },
      { id: 'connectors',  label: 'Connectors',     d: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { id: 'admin',    label: 'Admin',       d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
      { id: 'settings', label: 'Settings',    d: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
      { id: 'status',   label: 'Deployment',  d: 'M22 12h-4l-3 9L9 3l-3 9H2' },
    ],
  },
];

const ALL_NAV = NAV_SECTIONS.flatMap(s => s.items);

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage({ onAuth }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [mode, setMode]         = useState('login');
  const [msg, setMsg]           = useState({ text: '', ok: false });
  const [loading, setLoading]   = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setMsg({ text: '', ok: false });
    setLoading(true);
    try {
      if (mode === 'signup') {
        await signUp(email, password);
        setMsg({ text: 'Check your email to confirm your account.', ok: true });
      } else {
        const data = await signIn(email, password);
        onAuth(data.user || data.session?.user);
      }
    } catch (err) {
      setMsg({ text: err.message, ok: false });
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    display: 'block', width: '100%', boxSizing: 'border-box',
    padding: '10px 14px', background: C.bgInput,
    border: `1px solid ${C.border}`, borderRadius: 6,
    color: C.text, fontSize: 14, outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: C.bg, color: C.text }}>
      {/* ── Left panel ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 60px', borderRight: `1px solid ${C.border}`,
      }}>
        <ShieldLogo size={80} />
        <h1 style={{ margin: '22px 0 8px', fontSize: 30, fontWeight: 700, color: C.text }}>
          XPS Intelligence
        </h1>
        <p style={{ color: C.textSec, fontSize: 14, textAlign: 'center', maxWidth: 300, marginBottom: 44, lineHeight: 1.6 }}>
          AI-Powered Sales Command Center for Xtreme Polishing Systems
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%', maxWidth: 340 }}>
          {[
            { num: '60+',  label: 'LOCATIONS'  },
            { num: '200+', label: 'SALES STAFF' },
            { num: '50K+', label: 'LEADS'       },
            { num: '24/7', label: 'AI SUPPORT'  },
          ].map(({ num, label }) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 8, padding: '16px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: C.gold }}>{num}</div>
              <div style={{ fontSize: 10, color: C.textSec, letterSpacing: '0.1em', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 60px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px', color: C.text }}>Welcome back</h2>
          <p style={{ color: C.textSec, fontSize: 14, margin: '0 0 30px' }}>
            {mode === 'login' ? 'Sign in to your XPS Intelligence account' : 'Create your XPS Intelligence account'}
          </p>

          <form onSubmit={handle}>
            <label style={{ display: 'block', fontSize: 12, color: C.textSec, marginBottom: 6, letterSpacing: '0.03em' }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@xpsxpress.com" required
              style={{ ...inp, marginBottom: 16 }}
            />

            <label style={{ display: 'block', fontSize: 12, color: C.textSec, marginBottom: 6, letterSpacing: '0.03em' }}>Password</label>
            <div style={{ position: 'relative', marginBottom: mode === 'login' ? 4 : 16 }}>
              <input
                type={showPass ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                style={{ ...inp, paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPass(v => !v)} style={{
                position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1,
              }}>
                <Icon
                  d={showPass
                    ? 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22'
                    : 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'}
                  size={16} color={C.textMuted}
                />
              </button>
            </div>

            {mode === 'login' && (
              <div style={{ textAlign: 'right', marginBottom: 22 }}>
                <span style={{ color: C.gold, fontSize: 13, cursor: 'pointer' }}>Forgot password?</span>
              </div>
            )}

            {msg.text && (
              <p style={{ color: msg.ok ? C.green : C.red, fontSize: 13, marginBottom: 12 }}>{msg.text}</p>
            )}

            <button type="submit" disabled={loading} style={{
              display: 'block', width: '100%', padding: '12px',
              background: loading ? '#7a5a10' : C.gold,
              color: '#000', border: 'none', borderRadius: 6,
              fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: 20, fontFamily: 'inherit', transition: 'background 0.2s',
            }}>
              {loading ? 'Signing in…' : mode === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: C.textSec }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <span
              onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setMsg({ text: '', ok: false }); }}
              style={{ color: C.gold, cursor: 'pointer' }}
            >
              {mode === 'login' ? 'Sign up' : 'Sign In'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Revenue Pipeline SVG chart ───────────────────────────────────────────────
function RevenuePipelineChart() {
  const months = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
  const values = [320, 345, 352, 368, 430, 488, 510, 548, 592];
  const W = 640, H = 200;
  const padL = 48, padR = 8, padT = 8, padB = 24;
  const cW = W - padL - padR, cH = H - padT - padB;
  const maxVal = 800;
  const yTicks = [0, 200, 400, 600, 800];

  const gx = (i) => padL + (i / (months.length - 1)) * cW;
  const gy = (v) => padT + (1 - v / maxVal) * cH;

  const pts = values.map((v, i) => ({ x: gx(i), y: gy(v) }));

  const smooth = pts.map((p, i) => {
    if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    const prev = pts[i - 1];
    const dx = (p.x - prev.x) / 2.5;
    return `C ${(prev.x + dx).toFixed(1)} ${prev.y.toFixed(1)}, ${(p.x - dx).toFixed(1)} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }).join(' ');

  const area = smooth
    + ` L ${pts[pts.length - 1].x.toFixed(1)} ${(padT + cH).toFixed(1)}`
    + ` L ${pts[0].x.toFixed(1)} ${(padT + cH).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="rpg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={C.gold} stopOpacity="0.28" />
          <stop offset="100%" stopColor={C.gold} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {yTicks.map(v => {
        const y = gy(v);
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={C.border} strokeWidth="1" />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill={C.textMuted} fontFamily="Inter,sans-serif">
              ${v}K
            </text>
          </g>
        );
      })}
      <path d={area}   fill="url(#rpg)" />
      <path d={smooth} fill="none" stroke={C.gold} strokeWidth="2.5" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={C.gold} />)}
      {months.map((m, i) => (
        <text key={m} x={gx(i)} y={H - 4} textAnchor="middle" fontSize="10" fill={C.textMuted} fontFamily="Inter,sans-serif">
          {m}
        </text>
      ))}
    </svg>
  );
}

// ─── Pipeline Stages donut chart ──────────────────────────────────────────────
function DonutChart({ data, size = 160 }) {
  const cx = size / 2, cy = size / 2;
  const outerR = size * 0.42, innerR = size * 0.27;
  const total = data.reduce((s, d) => s + d.value, 0);
  const gap = 0.025;
  let start = -Math.PI / 2;

  const arcs = data.map(({ value, color }) => {
    const sweep = (value / total) * 2 * Math.PI;
    const sa = start + gap, ea = start + sweep - gap;
    start += sweep;

    const x1 = cx + outerR * Math.cos(sa), y1 = cy + outerR * Math.sin(sa);
    const x2 = cx + outerR * Math.cos(ea), y2 = cy + outerR * Math.sin(ea);
    const x3 = cx + innerR * Math.cos(ea), y3 = cy + innerR * Math.sin(ea);
    const x4 = cx + innerR * Math.cos(sa), y4 = cy + innerR * Math.sin(sa);
    const large = ea - sa > Math.PI ? 1 : 0;

    const d = [
      `M${x1.toFixed(2)} ${y1.toFixed(2)}`,
      `A${outerR} ${outerR} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
      `L${x3.toFixed(2)} ${y3.toFixed(2)}`,
      `A${innerR} ${innerR} 0 ${large} 0 ${x4.toFixed(2)} ${y4.toFixed(2)}`,
      'Z',
    ].join(' ');
    return { d, color };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arcs.map((a, i) => <path key={i} d={a.d} fill={a.color} />)}
    </svg>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
function DashboardPage({ user }) {
  const name = (user?.email || 'Admin').split('@')[0];
  const displayName = name.charAt(0).toUpperCase() + name.slice(1);
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { label: 'Active Leads',    value: '2,847', change: '+12.4%', pos: true,  d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
    { label: 'Pipeline Value',  value: '$4.2M',  change: '+8.7%',  pos: true,  d: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
    { label: 'Proposals Sent',  value: '342',   change: '+23.1%', pos: true,  d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6' },
    { label: 'Close Rate',      value: '34.2%', change: '−1.3%',  pos: false, d: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z' },
  ];

  const stages = [
    { label: 'Prospecting', value: 420, color: '#c9a227' },
    { label: 'Qualified',   value: 310, color: '#a07a14' },
    { label: 'Proposal',    value: 180, color: '#6b7280' },
    { label: 'Negotiation', value: 90,  color: '#4b5563' },
    { label: 'Closed Won',  value: 140, color: '#22c55e' },
  ];

  const leads = [
    { name: 'Ace Hardware Distribution', type: 'Retail · Proposal',    value: '$45K', score: 92 },
    { name: 'Gulf Coast Logistics',      type: 'Transport · Qualified', value: '$32K', score: 87 },
    { name: 'Sunbelt Auto Group',        type: 'Auto · Prospecting',    value: '$28K', score: 78 },
    { name: 'Florida Marine Services',   type: 'Marine · Proposal',     value: '$61K', score: 95 },
  ];

  const activities = [
    { emoji: '📞', title: 'Call with Gulf Coast Logistics',  time: '2h ago' },
    { emoji: '📧', title: 'Proposal sent to Ace Hardware',   time: '4h ago' },
    { emoji: '✅', title: 'Deal closed: Sunbelt Auto',       time: '1d ago' },
    { emoji: '🔔', title: 'New lead: Marine Tech Solutions', time: '2d ago' },
  ];

  const card = {
    background: C.bgCard, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: '20px 22px',
  };

  return (
    <div style={{ padding: '28px 28px 40px', flex: 1 }}>
      <div style={{ marginBottom: 26 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: C.text }}>{greeting}, {displayName}</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: C.textSec }}>
          Here's your sales intelligence briefing for today.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {stats.map((s, i) => (
          <div key={i} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, background: C.goldBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon d={s.d} color={C.gold} size={18} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: s.pos ? C.green : C.red }}>
                {s.pos ? '↑' : '↓'} {s.change}
              </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: C.text, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: 14, marginBottom: 20 }}>
        <div style={card}>
          <h3 style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 600, color: C.text }}>Revenue Pipeline</h3>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: C.textSec }}>Monthly pipeline value trend</p>
          <RevenuePipelineChart />
        </div>

        <div style={card}>
          <h3 style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 600, color: C.text }}>Pipeline Stages</h3>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: C.textSec }}>Lead distribution by stage</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <DonutChart data={stages} size={148} />
          </div>
          {stages.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: C.textSec }}>{s.label}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={card}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: C.text }}>Top Leads</h3>
          {leads.map((l, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0',
              borderBottom: i < leads.length - 1 ? `1px solid ${C.border}` : 'none',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{l.name}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{l.type}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.gold }}>{l.value}</div>
                <div style={{ fontSize: 11, color: C.textMuted }}>Score: {l.score}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={card}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: C.text }}>Recent Activity</h3>
          {activities.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '10px 0',
              borderBottom: i < activities.length - 1 ? `1px solid ${C.border}` : 'none',
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{a.emoji}</span>
              <div>
                <div style={{ fontSize: 13, color: C.text }}>{a.title}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AI Assistant full‑page ───────────────────────────────────────────────────
function AIAssistantPage({ user }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm XPS Intelligence AI, your dedicated sales assistant. I can help you analyze leads, score prospects, draft proposals, and provide competitive market intelligence. What would you like to explore today?",
    },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const endRef                = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const content = text || input;
    if (!content.trim()) return;
    const userMsg = { role: 'user', content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/chat`, {
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

  const quickActions = ['Sales Analysis', 'Lead Scoring', 'Proposal Help', 'Market Intel'];

  const card = { background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 28px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, background: C.goldBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            color={C.gold} size={22} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: C.text }}>XPS AI</h2>
          <p style={{ margin: 0, fontSize: 12, color: C.textSec }}>Your intelligent sales assistant</p>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {quickActions.map(q => (
          <button key={q} onClick={() => send(q)} style={{
            padding: '6px 14px', background: C.bgCard,
            border: `1px solid ${C.border}`, borderRadius: 20,
            color: C.textSec, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'border-color 0.15s, color 0.15s',
          }}
            onMouseEnter={e => { e.target.style.borderColor = C.gold; e.target.style.color = C.gold; }}
            onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.textSec; }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ ...card, flex: 1, overflowY: 'auto', padding: '16px', marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 12,
          }}>
            {m.role === 'assistant' && (
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: C.goldBg, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 2,
              }}>
                <Icon d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  color={C.gold} size={14} />
              </div>
            )}
            <div style={{
              maxWidth: '76%', padding: '10px 14px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: m.role === 'user' ? C.gold : C.bgInput,
              color: m.role === 'user' ? '#000' : C.text,
              fontSize: 13, lineHeight: 1.55, border: m.role === 'user' ? 'none' : `1px solid ${C.border}`,
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.textMuted, fontSize: 13 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', background: C.goldBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                color={C.gold} size={14} />
            </div>
            Thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input row */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
        <Icon d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
          size={16} color={C.textMuted} />
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !loading && send()}
          placeholder="Ask about leads, sales strategy, proposals…"
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: C.text, fontSize: 13, fontFamily: 'inherit',
          }}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={{
          width: 32, height: 32, borderRadius: 7, background: input.trim() ? C.gold : C.bgHov,
          border: 'none', cursor: input.trim() ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'background 0.2s',
        }}>
          <Icon d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" size={14} color={input.trim() ? '#000' : C.textMuted} />
        </button>
      </div>
    </div>
  );
}

// ─── Persistent right-side AI Chat Panel ──────────────────────────────────────
function AIChatPanel() {
  const [open, setOpen]       = useState(true);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! Ask me anything about your leads, pipeline, or sales strategy.' },
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const endRef                = useRef(null);

  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

  const send = async (text) => {
    const content = text || input;
    if (!content.trim()) return;
    const userMsg = { role: 'user', content };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      setMessages([...history, { role: 'assistant', content: data.reply || data.error || 'No response.' }]);
    } catch (err) {
      setMessages([...history, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const chips = ['Sales Analysis', 'Lead Scoring', 'Market Intel'];

  return (
    <div style={{
      width: open ? 300 : 44,
      flexShrink: 0,
      borderLeft: `1px solid ${C.border}`,
      background: C.bgSide,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.25s ease',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        title={open ? 'Collapse AI panel' : 'Open AI panel'}
        style={{
          position: 'absolute', top: 12, left: open ? 10 : 6, zIndex: 10,
          width: 28, height: 28, borderRadius: 6,
          background: C.goldBg, border: `1px solid rgba(201,162,39,0.25)`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'left 0.25s',
        }}
      >
        <Icon
          d={open ? 'M13 17l5-5-5-5M6 17l5-5-5-5' : 'M11 17l-5-5 5-5M18 17l-5-5 5-5'}
          size={14} color={C.gold}
        />
      </button>

      {open && (
        <>
          {/* Header */}
          <div style={{
            padding: '12px 12px 12px 44px',
            borderBottom: `1px solid ${C.border}`, flexShrink: 0,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>XPS AI</div>
            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>Sales Intelligence Assistant</div>
          </div>

          {/* Quick chips */}
          <div style={{ padding: '8px 10px', borderBottom: `1px solid ${C.border}`, display: 'flex', flexWrap: 'wrap', gap: 5, flexShrink: 0 }}>
            {chips.map(c => (
              <button key={c} onClick={() => send(c)} style={{
                padding: '4px 10px', background: C.bgCard,
                border: `1px solid ${C.border}`, borderRadius: 20,
                color: C.textSec, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {c}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 8,
              }}>
                {m.role === 'assistant' && (
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', background: C.goldBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginRight: 6, marginTop: 2, flexShrink: 0,
                  }}>
                    <Icon d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      color={C.gold} size={11} />
                  </div>
                )}
                <div style={{
                  maxWidth: '84%', padding: '7px 10px',
                  borderRadius: m.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                  background: m.role === 'user' ? C.gold : C.bgCard,
                  color: m.role === 'user' ? '#000' : C.text,
                  fontSize: 12, lineHeight: 1.5,
                  border: m.role === 'user' ? 'none' : `1px solid ${C.border}`,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ color: C.textMuted, fontSize: 11, paddingLeft: 28 }}>Thinking…</div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '8px 10px', borderTop: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
          }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !loading && send()}
              placeholder="Ask XPS AI…"
              style={{
                flex: 1, background: C.bgInput, border: `1px solid ${C.border}`,
                borderRadius: 6, padding: '7px 10px',
                color: C.text, fontSize: 12, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()} style={{
              width: 28, height: 28, borderRadius: 6,
              background: input.trim() ? C.gold : C.bgHov,
              border: 'none', cursor: input.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" size={12} color={input.trim() ? '#000' : C.textMuted} />
            </button>
          </div>
        </>
      )}

      {/* Collapsed: rotated label */}
      {!open && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%) rotate(-90deg)',
          whiteSpace: 'nowrap', fontSize: 10, fontWeight: 700,
          color: C.textMuted, letterSpacing: '0.1em', marginTop: 20,
          pointerEvents: 'none',
        }}>
          XPS AI
        </div>
      )}
    </div>
  );
}

// ─── Placeholder page ─────────────────────────────────────────────────────────
function PlaceholderPage({ title }) {
  return (
    <div style={{ padding: '28px', flex: 1 }}>
      <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600, color: C.text }}>{title}</h2>
      <p style={{ color: C.textSec, fontSize: 14, margin: '0 0 24px' }}>This module is coming soon.</p>
      <div style={{
        background: C.bgCard, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: 48, textAlign: 'center', color: C.textMuted, fontSize: 14,
      }}>
        🚧 Under development
      </div>
    </div>
  );
}

// ─── Settings page ────────────────────────────────────────────────────────────
function SettingsPage() {
  return (
    <div style={{ padding: '28px', flex: 1 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 600, color: C.text }}>Settings</h2>
      <div style={{
        background: C.bgCard, border: `1px solid ${C.border}`,
        borderRadius: 10, padding: '20px 24px', fontFamily: 'monospace', fontSize: 13,
      }}>
        {[
          ['VITE_SUPABASE_URL',      import.meta.env.VITE_SUPABASE_URL      ? '✅ set' : '❌ missing'],
          ['VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ set' : '❌ missing'],
          ['VITE_API_URL',           import.meta.env.VITE_API_URL || '(using relative /api)'],
        ].map(([k, v]) => (
          <div key={k} style={{ marginBottom: 8, color: C.textSec }}>
            <span style={{ color: C.textMuted }}>{k}:</span> {v}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Deployment Status page ───────────────────────────────────────────────────
function StatusPage() {
  return (
    <div style={{ padding: '28px', flex: 1 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 600, color: C.text }}>Deployment Status</h2>
      <DeploymentStatus />
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, user }) {
  return (
    <aside style={{
      width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: C.bgSide, borderRight: `1px solid ${C.border}`,
    }}>
      {/* Brand */}
      <div style={{ padding: '18px 16px 14px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldLogo size={30} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.text, letterSpacing: '0.06em' }}>XPS INTELLIGENCE</div>
            <div style={{ fontSize: 9, color: C.textMuted, letterSpacing: '0.12em', marginTop: 1 }}>COMMAND CENTER</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
        {NAV_SECTIONS.map(sec => (
          <div key={sec.label}>
            <div style={{
              fontSize: 9, letterSpacing: '0.12em', color: C.textMuted,
              padding: '14px 8px 5px', fontWeight: 700,
            }}>
              {sec.label}
            </div>
            {sec.items.map(item => {
              const active = page === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
                    marginBottom: 1,
                    background: active ? C.goldBg : 'transparent',
                    color: active ? C.gold : C.textSec,
                    fontSize: 13, fontWeight: active ? 500 : 400,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.bgHov; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <Icon d={item.d} size={15} color={active ? C.gold : C.textSec} />
                  {item.label}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '12px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
        <p style={{
          fontSize: 11, color: C.textMuted, margin: '0 0 8px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {user?.email}
        </p>
        <button
          onClick={() => signOut().catch(console.error)}
          style={{
            width: '100%', padding: '6px 10px',
            background: 'rgba(239,68,68,0.08)', color: C.red,
            border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5,
            cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
          }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function TopBar({ page, user }) {
  const current   = ALL_NAV.find(n => n.id === page);
  const pageTitle = current?.label || 'Dashboard';
  const initials  = (user?.email || 'AD').slice(0, 2).toUpperCase();

  return (
    <header style={{
      height: 56, display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 14, flexShrink: 0,
      borderBottom: `1px solid ${C.border}`, background: C.bg,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 110 }}>
        <Icon d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" size={17} color={C.textSec} />
        <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{pageTitle}</span>
      </div>

      <div style={{ flex: 1, maxWidth: 420 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 7, padding: '6px 12px',
        }}>
          <Icon d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0" size={13} color={C.textMuted} />
          <input
            placeholder="Search leads, companies, proposals…"
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: C.textSec, fontSize: 12, width: '100%', fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18 }}>
        {/* Sparkle */}
        <Icon d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z" size={17} color={C.textSec} />

        {/* Bell */}
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <Icon d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" size={18} color={C.textSec} />
          <div style={{
            position: 'absolute', top: -3, right: -3,
            width: 8, height: 8, borderRadius: '50%',
            background: C.gold, border: `1.5px solid ${C.bg}`,
          }} />
        </div>

        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Icon d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" size={14} color={C.textSec} />
          <span style={{ fontSize: 12, color: C.textSec, whiteSpace: 'nowrap' }}>Tampa, FL</span>
        </div>

        {/* Avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: C.gold, color: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
        }}>
          {initials}
        </div>
      </div>
    </header>
  );
}

// ─── Page router ──────────────────────────────────────────────────────────────
function PageContent({ page, user }) {
  if (page === 'dashboard') return <DashboardPage user={user} />;
  if (page === 'assistant') return <AIAssistantPage user={user} />;
  if (page === 'settings')  return <SettingsPage />;
  if (page === 'status')    return <StatusPage />;
  const label = ALL_NAV.find(n => n.id === page)?.label || page;
  return <PlaceholderPage title={label} />;
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]           = useState('dashboard');
  const [user, setUser]           = useState(null);
  const [authLoading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data }) => { setUser(data.session?.user || null); setLoading(false); })
      .catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldLogo size={28} />
          <span style={{ color: C.textSec, fontSize: 14 }}>Loading…</span>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage onAuth={setUser} />;

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      background: C.bg, fontFamily: 'Inter, system-ui, sans-serif', color: C.text,
    }}>
      {/* Left sidebar */}
      <Sidebar page={page} setPage={setPage} user={user} />

      {/* Center: top bar + scrollable page content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar page={page} user={user} />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <PageContent page={page} user={user} />
        </div>
      </div>

      {/* Right: persistent AI chat panel */}
      <AIChatPanel />
    </div>
  );
}

