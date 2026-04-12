import React from 'react';
import { ArrowRight, Bot, LayoutDashboard, MenuSquare, ShieldCheck, Sparkles } from 'lucide-react';

const BRAND_LOGO = '/brand/xps-shield-wings.png';
const GOLD = '#d4af52';

const showcase = [
  {
    title: 'Mobile-first command view',
    note: 'Primary chat stays in focus while the dashboard slides in when you need it.',
    image: '/screenshots/ai-assistant.png',
  },
  {
    title: 'Operations dashboard',
    note: 'Review connector readiness, workspace outputs, and runtime health in one pullout.',
    image: '/screenshots/dashboard.png',
  },
  {
    title: 'Admin and connector controls',
    note: 'Route Groq, credentials, and production checks from the same system.',
    image: '/screenshots/connectors.png',
  },
];

const capabilities = [
  { icon: Bot, title: 'Groq-first chat', note: 'Production chat routes to Groq first with the full 70B model default when credentials exist.' },
  { icon: LayoutDashboard, title: 'Live dashboard drawer', note: 'Pull the dashboard over the chat instead of losing your current conversation.' },
  { icon: MenuSquare, title: 'Slide-out mobile menu', note: 'Open the side navigation from the header on small screens without breaking layout.' },
  { icon: ShieldCheck, title: 'Production posture', note: 'Keep connector status, sign-in access, and workspace artifacts in the same shell.' },
];

export default function HomePage({ onStartSignIn, onEnterApp }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        color: '#fff',
        background: 'radial-gradient(circle at top left, rgba(212,175,82,0.18), transparent 28%), radial-gradient(circle at bottom right, rgba(212,175,82,0.12), transparent 28%), #060606',
      }}
    >
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: 'clamp(22px, 4vw, 36px)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="xps-logo xps-brand-logo-glow" style={{ width: 56, height: 56, borderRadius: 18 }}>
              <img src={BRAND_LOGO} alt="XPS" />
            </div>
            <div>
              <div className="xps-silver-text" style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1.6 }}>XPS INTELLIGENCE</div>
              <div className="xps-gold-text" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2.4, marginTop: 2 }}>PRODUCTION COMMAND CENTER</div>
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
              Sign in
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
              Open chat shell
            </button>
          </div>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: 24,
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 28,
              padding: 'clamp(24px, 5vw, 40px)',
              background: 'linear-gradient(180deg, rgba(16,16,16,0.96), rgba(8,8,8,0.98))',
              boxShadow: '0 30px 90px rgba(0,0,0,0.45)',
            }}
          >
            <div className="xps-gold-text" style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2.4 }}>LANDING PAGE</div>
            <h1 style={{ fontSize: 'clamp(42px, 7vw, 78px)', lineHeight: 0.98, marginTop: 16 }}>
              Mobile-ready AI sales operations.
            </h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.68)', lineHeight: 1.7, marginTop: 18, maxWidth: 620 }}>
              Launch into a polished landing page, move through a simple sign-in, and land in a chat-first production shell with a side menu and dashboard drawer.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 26 }}>
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
                Preview the app
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 32 }}>
              {capabilities.map(({ icon: Icon, title, note }) => (
                <div
                  key={title}
                  style={{
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 18,
                    padding: '18px 16px',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(212,175,82,0.12)', marginBottom: 12 }}>
                    <Icon size={18} color={GOLD} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
                  <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.58)', lineHeight: 1.6 }}>{note}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 18 }}>
            {showcase.map((item, index) => (
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
                <div style={{ aspectRatio: index === 0 ? '16 / 10' : '16 / 9', background: '#090909' }}>
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <div style={{ padding: '18px 18px 20px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '6px 10px', background: 'rgba(212,175,82,0.1)', color: GOLD, fontSize: 12, fontWeight: 800, letterSpacing: 1 }}>
                    <Sparkles size={12} color={GOLD} />
                    XPS EXPERIENCE
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginTop: 12 }}>{item.title}</div>
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
