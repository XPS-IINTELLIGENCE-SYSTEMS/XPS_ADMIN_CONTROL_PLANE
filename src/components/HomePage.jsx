import React from 'react';
import { ArrowRight, LayoutDashboard, MessageSquare, PanelLeft, ShieldCheck } from 'lucide-react';

const BRAND_LOGO = '/brand/xps-shield-wings.png';
const GOLD = '#d4af52';

const stats = [
  { value: '0', label: 'Locations' },
  { value: '0', label: 'Sales staff' },
  { value: '0', label: 'Leads' },
  { value: '0', label: 'Active chats' },
];

const showcase = [
  {
    title: 'Landing page',
    note: 'Use the existing XPS screenshots as the only visual reference.',
    image: '/screenshots/dashboard.png',
  },
  {
    title: 'Dashboard + tools',
    note: 'Keep the tool rail left, the dashboard centered, and the chat pinned on the right.',
    image: '/screenshots/connectors.png',
  },
  {
    title: 'Chat rail',
    note: 'Groq-first chat stays in the right rail with source attachment handoff into the dashboard.',
    image: '/screenshots/ai-assistant.png',
  },
];

const capabilities = [
  { icon: PanelLeft, label: 'Left tool panel' },
  { icon: LayoutDashboard, label: 'Centered dashboard' },
  { icon: MessageSquare, label: 'Right chat rail' },
  { icon: ShieldCheck, label: 'Mobile PWA shell' },
];

export default function HomePage({ onStartSignIn, onEnterApp }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        color: '#fff',
        background: 'radial-gradient(circle at top left, rgba(212,175,82,0.16), transparent 28%), #050505',
      }}
    >
      <div style={{ maxWidth: 1480, margin: '0 auto', padding: 'clamp(20px, 4vw, 36px)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="xps-logo xps-brand-logo-glow" style={{ width: 56, height: 56, borderRadius: 18 }}>
              <img src={BRAND_LOGO} alt="XPS" />
            </div>
            <div>
              <div className="xps-silver-text" style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1.6 }}>XPS INTELLIGENCE</div>
              <div className="xps-gold-text" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2.4, marginTop: 2 }}>ADMIN CONTROL PLANE</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onStartSignIn}
              style={{
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.03)',
                color: '#fff',
                borderRadius: 14,
                padding: '12px 18px',
                fontWeight: 700,
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onEnterApp('overview')}
              style={{
                border: 'none',
                background: GOLD,
                color: '#090909',
                borderRadius: 14,
                padding: '12px 18px',
                fontWeight: 800,
              }}
            >
              Open dashboard
            </button>
          </div>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
            gap: 24,
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 30,
              padding: 'clamp(24px, 5vw, 42px)',
              background: 'linear-gradient(180deg, rgba(15,15,15,0.98), rgba(7,7,7,0.98))',
              boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
            }}
          >
            <div className="xps-gold-text" style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2.6 }}>LANDING PAGE</div>
            <h1 style={{ fontSize: 'clamp(40px, 7vw, 78px)', lineHeight: 0.98, marginTop: 18 }}>
              XPS Intelligence
            </h1>
            <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.68)', lineHeight: 1.7, marginTop: 18, maxWidth: 720 }}>
              AI-powered sales command center for Xtreme Polishing Systems with a left tool rail, centered dashboard, and right-side Groq chat rail.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 28 }}>
              {stats.map((item) => (
                <div
                  key={item.label}
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 18,
                    padding: '20px 18px',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div className="xps-gold-text" style={{ fontSize: 30, fontWeight: 800 }}>{item.value}</div>
                  <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.56)', letterSpacing: 1.2, textTransform: 'uppercase' }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 28 }}>
              <button
                type="button"
                onClick={onStartSignIn}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  border: 'none',
                  background: GOLD,
                  color: '#090909',
                  borderRadius: 14,
                  padding: '14px 18px',
                  fontWeight: 800,
                }}
              >
                Continue to sign in
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => onEnterApp('overview')}
                style={{
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#fff',
                  borderRadius: 14,
                  padding: '14px 18px',
                  fontWeight: 700,
                }}
              >
                Preview the shell
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 26 }}>
              {capabilities.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    borderRadius: 999,
                    padding: '10px 14px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.02)',
                    color: 'rgba(255,255,255,0.78)',
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  <Icon size={14} color={GOLD} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 18 }}>
            {showcase.map((item) => (
              <article
                key={item.title}
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 24,
                  overflow: 'hidden',
                  background: 'linear-gradient(180deg, rgba(15,15,15,0.96), rgba(8,8,8,0.96))',
                  boxShadow: '0 26px 80px rgba(0,0,0,0.38)',
                }}
              >
                <div style={{ aspectRatio: '16 / 9', background: '#090909' }}>
                  <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
                <div style={{ padding: '18px 18px 20px' }}>
                  <div className="xps-gold-text" style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2.2 }}>REFERENCE</div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginTop: 10 }}>{item.title}</div>
                  <div style={{ marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,0.58)', lineHeight: 1.7 }}>{item.note}</div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
