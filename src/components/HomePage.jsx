import React from 'react';
import { Sparkles } from 'lucide-react';

const gold = '#d4a843';
const darkBg = '#0d0d0d';

const navStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 48px',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
  position: 'sticky',
  top: 0,
  zIndex: 100,
  background: 'rgba(13,13,13,0.92)',
  backdropFilter: 'blur(8px)',
};

const navLinkStyle = {
  color: 'rgba(255,255,255,0.85)',
  textDecoration: 'none',
  fontSize: 15,
  fontWeight: 500,
  cursor: 'pointer',
  padding: '4px 0',
  background: 'none',
  border: 'none',
};

const statsData = [
  { value: '60+', label: 'LOCATIONS' },
  { value: '200+', label: 'SALES STAFF' },
  { value: '50K+', label: 'LEADS MANAGED' },
  { value: '$120M+', label: 'REVENUE TRACKED' },
];

export default function HomePage({ onEnterAdmin }) {
  return (
    <div style={{ background: darkBg, minHeight: '100vh', color: '#fff', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* ── Navigation ── */}
      <nav style={navStyle}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} aria-label="XPS Intelligence - Xtreme Polishing Systems">
          <div style={{
            width: 36, height: 36, background: gold, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
              <path d="M10 1L2 5V10C2 14.97 5.4 19.45 10 21C14.6 19.45 18 14.97 18 10V5L10 1Z" fill="#0d0d0d" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: 0.5 }}>XPS INTELLIGENCE</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5 }}>XTREME POLISHING SYSTEMS</div>
          </div>
        </div>

        {/* Nav Links – placeholder anchors for future section routing */}
        <div style={{ display: 'flex', gap: 36 }}>
          {['Platform', 'Solutions', 'Coverage', 'About'].map(link => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              style={{ ...navLinkStyle, textDecoration: 'none' }}
            >
              {link}
            </a>
          ))}
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={onEnterAdmin}
            style={{ ...navLinkStyle, fontSize: 14 }}
          >
            Sign In
          </button>
          <button
            onClick={onEnterAdmin}
            style={{
              background: gold, color: '#0d0d0d', border: 'none', borderRadius: 6,
              padding: '9px 22px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              letterSpacing: 0.3,
            }}
          >
            Request Demo
          </button>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <div style={{
        position: 'relative',
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '80px 24px 60px',
        overflow: 'hidden',
      }}>
        {/* Decorative particle dots */}
        <Particles />

        {/* Badge pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.3)',
          borderRadius: 50, padding: '6px 18px', marginBottom: 32,
          fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 500,
        }}>
          <Sparkles size={16} className="xps-icon" />
          AI-Powered Sales Intelligence Platform
        </div>

        {/* Hero heading */}
        <h1 style={{
          fontSize: 'clamp(42px, 6vw, 72px)',
          fontWeight: 800,
          lineHeight: 1.1,
          margin: '0 0 24px',
          maxWidth: 820,
          letterSpacing: -1,
        }}>
          The Command Center for<br />
          <span style={{ color: gold }}>Xtreme Sales</span>
        </h1>

        {/* Sub-headline */}
        <p style={{
          fontSize: 18,
          color: 'rgba(255,255,255,0.65)',
          maxWidth: 620,
          lineHeight: 1.7,
          margin: '0 0 44px',
        }}>
          Empowering 60+ locations and 200+ sales professionals with AI-driven
          CRM, lead intelligence, proposal automation, and competitive insights —
          built for the polishing industry.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={onEnterAdmin}
            style={{
              background: gold, color: '#0d0d0d', border: 'none', borderRadius: 8,
              padding: '14px 32px', fontWeight: 700, fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            Get Started <span style={{ fontSize: 18 }}>→</span>
          </button>
          <button
            onClick={onEnterAdmin}
            style={{
              background: 'transparent', color: '#fff',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8,
              padding: '14px 32px', fontWeight: 600, fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <span style={{ fontSize: 14 }}>▷</span> Watch Demo
          </button>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'flex',
          gap: 0,
          marginTop: 72,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingTop: 40,
          width: '100%',
          maxWidth: 820,
          justifyContent: 'space-around',
          flexWrap: 'wrap',
        }}>
          {statsData.map(({ value, label }) => (
            <div key={label} style={{ textAlign: 'center', padding: '8px 20px' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: gold, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 6, letterSpacing: 1.5 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Simple SVG-based decorative particles to mimic the screenshot background */
function Particles() {
  const dots = [
    { cx: '12%', cy: '20%', r: 1.5, opacity: 0.5 },
    { cx: '25%', cy: '60%', r: 1, opacity: 0.3 },
    { cx: '40%', cy: '15%', r: 2, opacity: 0.4 },
    { cx: '55%', cy: '75%', r: 1.2, opacity: 0.35 },
    { cx: '70%', cy: '30%', r: 1.8, opacity: 0.45 },
    { cx: '80%', cy: '65%', r: 1, opacity: 0.3 },
    { cx: '90%', cy: '20%', r: 1.5, opacity: 0.4 },
    { cx: '8%', cy: '80%', r: 1.2, opacity: 0.25 },
    { cx: '60%', cy: '50%', r: 1, opacity: 0.2 },
    { cx: '33%', cy: '85%', r: 1.5, opacity: 0.3 },
    { cx: '75%', cy: '90%', r: 1, opacity: 0.25 },
    { cx: '18%', cy: '40%', r: 1.2, opacity: 0.35 },
    { cx: '88%', cy: '45%', r: 1.8, opacity: 0.3 },
    { cx: '50%', cy: '10%', r: 1, opacity: 0.4 },
    { cx: '95%', cy: '70%', r: 1.5, opacity: 0.25 },
  ];

  return (
    <svg
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={gold} opacity={d.opacity} />
      ))}
      {/* Subtle radial glow behind hero text */}
      <radialGradient id="heroGlow" cx="50%" cy="50%" r="40%">
        <stop offset="0%" stopColor={gold} stopOpacity="0.06" />
        <stop offset="100%" stopColor={gold} stopOpacity="0" />
      </radialGradient>
      <rect x="0" y="0" width="100%" height="100%" fill="url(#heroGlow)" />
    </svg>
  );
}
