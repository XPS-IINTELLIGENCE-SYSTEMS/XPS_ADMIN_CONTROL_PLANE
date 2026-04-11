import React from 'react';
import { ArrowRight, Bot, Plug, ShieldCheck, Sparkles } from 'lucide-react';

const BRAND_LOGO = '/brand/xps-shield-wings.png';
const GOLD = '#d4a843';

const previewCards = [
  { id: 'dashboard', title: 'Dashboard', image: '/screenshots/dashboard.png' },
  { id: 'crm', title: 'CRM', image: '/screenshots/crm.png' },
  { id: 'ai-assistant', title: 'AI Assistant', image: '/screenshots/ai-assistant.png' },
  { id: 'research', title: 'Research Lab', image: '/screenshots/research.png' },
  { id: 'analytics', title: 'Analytics', image: '/screenshots/analytics.png' },
  { id: 'connectors', title: 'Connectors', image: '/screenshots/connectors.png' },
];

const valueCards = [
  {
    title: 'Clear front door',
    text: 'A branded landing experience that opens directly into the sales intelligence workflow.',
    icon: Sparkles,
  },
  {
    title: 'Focused workflow',
    text: 'Dashboard, CRM, leads, assistant, research, outreach, proposals, analytics, connectors, admin, settings.',
    icon: Bot,
  },
  {
    title: 'Clean operations',
    text: 'Live provider truth, centralized connectors, and smaller admin controls without control-plane sprawl.',
    icon: ShieldCheck,
  },
];

export default function HomePage({ onEnterApp }) {
  return (
    <div style={{ minHeight: '100vh', background: '#06070a', color: '#fff' }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100vh',
          background: 'radial-gradient(circle at top, rgba(212,168,67,0.14), transparent 36%), linear-gradient(180deg, #090a0e 0%, #06070a 100%)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.8), transparent 90%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, padding: '24px 32px 48px' }}>
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              padding: '8px 0 28px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="xps-logo xps-brand-logo-glow" style={{ width: 46, height: 46, borderRadius: 12 }}>
                <img src={BRAND_LOGO} alt="XPS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <div className="xps-silver-text" style={{ fontSize: 16, fontWeight: 800, letterSpacing: 1.1 }}>XPS INTELLIGENCE</div>
                <div className="xps-gold-text" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2.1, marginTop: 4 }}>PREMIUM SALES INTELLIGENCE</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                onClick={() => onEnterApp('dashboard')}
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: 10,
                  padding: '10px 18px',
                  fontWeight: 600,
                }}
              >
                Open Dashboard
              </button>
              <button
                onClick={() => onEnterApp('ai-assistant')}
                style={{
                  background: GOLD,
                  color: '#090a0d',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 18px',
                  fontWeight: 800,
                }}
              >
                Launch Assistant
              </button>
            </div>
          </nav>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.05fr) minmax(360px, 0.95fr)', gap: 28, alignItems: 'center' }}>
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 999,
                  border: '1px solid rgba(212,168,67,0.25)',
                  background: 'rgba(212,168,67,0.08)',
                  color: 'rgba(255,255,255,0.86)',
                  fontSize: 13,
                  marginBottom: 22,
                }}
              >
                <Sparkles size={15} className="xps-icon" />
                Black and gold sales intelligence workspace
              </div>

              <h1 style={{ fontSize: 'clamp(44px, 6vw, 78px)', lineHeight: 1, letterSpacing: -1.8, marginBottom: 18 }}>
                Restore the
                <span className="xps-gold-text" style={{ display: 'block' }}>intended XPS experience.</span>
              </h1>

              <p style={{ color: 'rgba(255,255,255,0.68)', fontSize: 18, lineHeight: 1.75, maxWidth: 680, marginBottom: 28 }}>
                A clearer front door, a cleaner left navigation, and a focused sales intelligence workflow built around dashboard, CRM, leads, assistant, research, outreach, proposals, analytics, connectors, admin, and settings.
              </p>

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
                <button
                  onClick={() => onEnterApp('dashboard')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: GOLD,
                    color: '#090a0d',
                    border: 'none',
                    borderRadius: 12,
                    padding: '14px 22px',
                    fontWeight: 800,
                    fontSize: 15,
                  }}
                >
                  Enter Platform
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => onEnterApp('connectors')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(255,255,255,0.03)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    padding: '14px 22px',
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  <Plug size={16} />
                  View Connectors
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
                {valueCards.map(({ title, text, icon: Icon }) => (
                  <div
                    key={title}
                    style={{
                      background: 'rgba(255,255,255,0.035)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 16,
                      padding: 18,
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(212,168,67,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                      <Icon size={18} color={GOLD} />
                    </div>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.62)', fontSize: 13, lineHeight: 1.65 }}>{text}</div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(10,11,15,0.92)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 24,
                padding: 20,
                boxShadow: '0 24px 90px rgba(0,0,0,0.45)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Intended page system</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>Built from the original repo screenshots</div>
                </div>
                <div className="xps-gold-text" style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.3 }}>XPS</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {previewCards.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => onEnterApp(card.id)}
                    style={{
                      padding: 0,
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 16,
                      overflow: 'hidden',
                      background: '#0b0d12',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ aspectRatio: '16 / 10', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <img src={card.image} alt={card.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{card.title}</div>
                      <div style={{ color: 'rgba(255,255,255,0.52)', fontSize: 11, marginTop: 4 }}>Open page</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
