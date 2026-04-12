import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

const BRAND_LOGO = '/brand/xps-shield-wings.png';
const GOLD = '#d4af52';

const stats = [
  { value: '0', label: 'Locations' },
  { value: '0', label: 'Sales staff' },
  { value: '0', label: 'Leads' },
  { value: '0', label: 'AI support' },
];

const quickAccess = ['Google Workspace', 'GitHub', 'Supabase', 'Copilot'];

export default function LoginPage({ onContinue, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    onContinue?.();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
        background: '#050505',
        color: '#fff',
      }}
    >
      <section
        style={{
          padding: 'clamp(24px, 5vw, 44px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ width: '100%', maxWidth: 520 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.02)',
              color: '#fff',
              borderRadius: 999,
              padding: '9px 14px',
              marginBottom: 28,
            }}
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div className="xps-logo xps-brand-logo-glow" style={{ width: 74, height: 74, borderRadius: 18 }}>
              <img src={BRAND_LOGO} alt="XPS" />
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 'clamp(42px, 7vw, 58px)', lineHeight: 1, margin: 0 }}>XPS Intelligence</h1>
            <p style={{ marginTop: 20, fontSize: 18, lineHeight: 1.6, color: 'rgba(255,255,255,0.62)' }}>
              AI-Powered Sales Command Center for Xtreme Polishing Systems
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 18, marginTop: 34 }}>
            {stats.map((item) => (
              <div
                key={item.label}
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 18,
                  padding: '20px 18px',
                  background: 'rgba(255,255,255,0.02)',
                  textAlign: 'center',
                }}
              >
                <div className="xps-gold-text" style={{ fontSize: 34, fontWeight: 800 }}>{item.value}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.56)', textTransform: 'uppercase', letterSpacing: 1.2 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          padding: 'clamp(24px, 6vw, 48px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div style={{ fontSize: 'clamp(34px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.1 }}>Welcome back</div>
          <p style={{ marginTop: 12, color: 'rgba(255,255,255,0.62)', fontSize: 16 }}>
            Sign in to your XPS Intelligence account
          </p>

          <form onSubmit={handleSubmit} style={{ marginTop: 34 }}>
            <label style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)' }}>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@xpsxpress.com"
                autoComplete="username"
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'grid', gap: 10 }}>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)' }}>Password</span>
              <div style={{ position: 'relative' }}>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Any password works"
                  autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: 54 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    border: 'none',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.54)',
                    display: 'flex',
                    padding: 0,
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button type="button" style={{ border: 'none', background: 'transparent', color: GOLD, fontSize: 14 }}>
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                marginTop: 18,
                border: 'none',
                borderRadius: 16,
                background: GOLD,
                color: '#090909',
                padding: '17px 18px',
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              Sign In
            </button>
          </form>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            {quickAccess.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => onContinue?.()}
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(255,255,255,0.86)',
                  borderRadius: 999,
                  padding: '9px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.48)', lineHeight: 1.7 }}>
            No auth in this build. Any email, any password, and every quick-access button enters the dashboard.
          </div>

          <div style={{ marginTop: 26, textAlign: 'center', color: 'rgba(255,255,255,0.62)', fontSize: 16 }}>
            Don't have an account?{' '}
            <button type="button" onClick={() => onContinue?.()} style={{ border: 'none', background: 'transparent', color: GOLD, fontWeight: 800, fontSize: 16, padding: 0 }}>
              Sign up
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 16,
  padding: '16px 18px',
  color: '#fff',
  fontSize: 16,
  outline: 'none',
};
