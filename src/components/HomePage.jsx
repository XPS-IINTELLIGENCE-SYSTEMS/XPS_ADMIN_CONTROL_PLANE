import React from 'react';
import { ArrowRight, BarChart2, Bot, FileText, FlaskConical, LayoutDashboard, Plug, Send, Settings, Shield, Target, Users } from 'lucide-react';

const BRAND_LOGO = '/brand/xps-shield-wings.png';
const GOLD = '#d4af52';

const featureCards = [
  { panel: 'dashboard', title: 'Dashboard', note: 'Daily revenue, pipeline, and territory priorities.', icon: LayoutDashboard },
  { panel: 'crm', title: 'CRM', note: 'Customer relationship activity and open opportunities.', icon: Users },
  { panel: 'leads', title: 'Leads', note: 'Qualification, scoring, and lead routing.', icon: Target },
  { panel: 'ai-assistant', title: 'AI Assistant', note: 'Live drafting, coaching, and next-step support.', icon: Bot },
  { panel: 'research', title: 'Research Lab', note: 'Account research and competitive intelligence.', icon: FlaskConical },
  { panel: 'outreach', title: 'Outreach', note: 'Sequences, replies, and follow-up timing.', icon: Send },
  { panel: 'proposals', title: 'Proposals', note: 'Proposal progress, approvals, and close support.', icon: FileText },
  { panel: 'analytics', title: 'Analytics', note: 'Revenue performance and activity trends.', icon: BarChart2 },
  { panel: 'connectors', title: 'Connectors', note: 'Provider status and routing defaults.', icon: Plug },
  { panel: 'admin', title: 'Admin', note: 'Focused runtime, access, and governance controls.', icon: Shield },
  { panel: 'settings', title: 'Settings', note: 'Workspace defaults and credential readiness.', icon: Settings },
];

const highlights = [
  { value: '60+', label: 'LOCATIONS' },
  { value: '200+', label: 'SALES STAFF' },
  { value: '50K+', label: 'LEADS' },
  { value: '24/7', label: 'AI SUPPORT' },
];

export default function HomePage({ onEnterApp, onBackToLogin }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top left, rgba(212,175,82,0.16), transparent 30%), radial-gradient(circle at bottom right, rgba(212,175,82,0.1), transparent 28%), #070707',
        color: '#fff',
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 32px 48px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="xps-logo xps-brand-logo-glow" style={{ width: 56, height: 56, borderRadius: 16 }}>
              <img src={BRAND_LOGO} alt="XPS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, letterSpacing: 2.8, color: 'rgba(255,255,255,0.58)' }}>XPS INTELLIGENCE</div>
              <div className="xps-gold-text" style={{ fontSize: 30, fontWeight: 800, marginTop: 4 }}>Sales Command Center</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={onBackToLogin}
              style={{
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.02)',
                color: '#fff',
                borderRadius: 12,
                padding: '12px 18px',
                fontWeight: 600,
              }}
            >
              Back to Login
            </button>
            <button
              onClick={() => onEnterApp('dashboard')}
              style={{
                border: 'none',
                background: GOLD,
                color: '#090909',
                borderRadius: 12,
                padding: '12px 20px',
                fontWeight: 800,
              }}
            >
              Open Platform
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 0.9fr) minmax(0, 1.1fr)', gap: 28, alignItems: 'stretch' }}>
          <section
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 28,
              padding: '40px 36px',
              background: 'linear-gradient(180deg, rgba(15,15,15,0.96), rgba(9,9,9,0.96))',
              boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
            }}
          >
            <div className="xps-logo xps-brand-logo-glow" style={{ width: 72, height: 72, borderRadius: 20, marginBottom: 28 }}>
              <img src={BRAND_LOGO} alt="XPS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>

            <h1 style={{ fontSize: 'clamp(34px, 4vw, 58px)', lineHeight: 1.05, marginBottom: 18 }}>
              XPS Intelligence
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.64)', fontSize: 20, lineHeight: 1.55, maxWidth: 560 }}>
              AI-powered sales command center for Xtreme Polishing Systems.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18, marginTop: 40 }}>
              {highlights.map((item) => (
                <div
                  key={item.label}
                  style={{
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 18,
                    padding: '22px 18px',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={{ color: GOLD, fontSize: 38, fontWeight: 800, lineHeight: 1 }}>{item.value}</div>
                  <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: 13, letterSpacing: 1.2, marginTop: 10 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </section>

          <section
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 28,
              padding: '32px 28px',
              background: 'linear-gradient(180deg, rgba(11,11,11,0.98), rgba(8,8,8,0.96))',
              boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
              <div>
                <div className="xps-gold-text" style={{ fontSize: 14, fontWeight: 800, letterSpacing: 2 }}>HOME</div>
                <h2 style={{ fontSize: 38, marginTop: 8 }}>Choose where to go next</h2>
                <p style={{ color: 'rgba(255,255,255,0.58)', fontSize: 15, marginTop: 10, maxWidth: 560 }}>
                  The login page opens this portal, and every remaining XPS page stays one click away.
                </p>
              </div>

              <button
                onClick={() => onEnterApp('ai-assistant')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  border: 'none',
                  background: GOLD,
                  color: '#090909',
                  borderRadius: 12,
                  padding: '13px 18px',
                  fontWeight: 800,
                }}
              >
                Launch Assistant
                <ArrowRight size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
              {featureCards.map(({ panel, title, note, icon: Icon }) => (
                <button
                  key={panel}
                  onClick={() => onEnterApp(panel)}
                  className="xps-electric-hover"
                  style={{
                    position: 'relative',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 18,
                    background: 'rgba(255,255,255,0.025)',
                    padding: '18px 18px 20px',
                    textAlign: 'left',
                    color: '#fff',
                  }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(212,175,82,0.12)', marginBottom: 14 }}>
                    <Icon size={18} color={GOLD} />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.56)', marginTop: 8, lineHeight: 1.6 }}>{note}</div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
