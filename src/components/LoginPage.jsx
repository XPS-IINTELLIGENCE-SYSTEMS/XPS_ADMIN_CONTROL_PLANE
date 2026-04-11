import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const BRAND_LOGO = '/brand/xps-shield-wings.png';
const GOLD = '#d4af52';

const highlights = [
  { value: '60+', label: 'LOCATIONS' },
  { value: '200+', label: 'SALES STAFF' },
  { value: '50K+', label: 'LEADS' },
  { value: '24/7', label: 'AI SUPPORT' },
];

export default function LoginPage({ onContinue }) {
  const [email, setEmail] = useState('you@xpsxpress.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    onContinue({ email, password });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(420px, 1fr)',
        background: '#070707',
        color: '#fff',
      }}
    >
      <section
        style={{
          padding: '40px 48px',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          background: 'radial-gradient(circle at center left, rgba(212,175,82,0.12), transparent 35%), linear-gradient(180deg, #0b0a08, #080808)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
          <div className="xps-logo xps-brand-logo-glow" style={{ width: 96, height: 96, borderRadius: 24, margin: '0 auto 34px' }}>
            <img src={BRAND_LOGO} alt="XPS" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <h1 style={{ fontSize: 'clamp(42px, 5vw, 64px)', lineHeight: 1.08, marginBottom: 18 }}>
            XPS Intelligence
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 20, lineHeight: 1.55, maxWidth: 460, margin: '0 auto' }}>
            AI-Powered Sales Command Center for Xtreme Polishing Systems
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20, marginTop: 48 }}>
            {highlights.map((item) => (
              <div
                key={item.label}
                style={{
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 18,
                  padding: '24px 18px',
                }}
              >
                <div style={{ color: GOLD, fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{item.value}</div>
                <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: 13, letterSpacing: 1.1, marginTop: 10 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          padding: '40px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #090909, #060606)',
        }}
      >
        <div style={{ width: '100%', maxWidth: 480 }}>
          <div className="xps-gold-text" style={{ fontWeight: 800, letterSpacing: 2, fontSize: 13, marginBottom: 10 }}>LOGIN</div>
          <h2 style={{ fontSize: 50, lineHeight: 1.05, marginBottom: 14 }}>Welcome back</h2>
          <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: 16, marginBottom: 36 }}>
            Sign in to your XPS Intelligence account
          </p>

          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', marginBottom: 22 }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', marginBottom: 10 }}>Email</div>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@xpsxpress.com"
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'block' }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', marginBottom: 10 }}>Password</div>
              <div style={{ position: 'relative' }}>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  style={{ ...inputStyle, paddingRight: 50 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.48)',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button type="button" onClick={handleSubmit} style={{ background: 'transparent', border: 'none', color: GOLD, fontSize: 14 }}>
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                marginTop: 22,
                border: 'none',
                borderRadius: 16,
                background: GOLD,
                color: '#090909',
                padding: '18px 20px',
                fontSize: 17,
                fontWeight: 800,
              }}
            >
              Sign In
            </button>
          </form>

          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.62)', marginTop: 30, fontSize: 15 }}>
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={handleSubmit}
              style={{ background: 'transparent', border: 'none', color: GOLD, fontSize: 15, fontWeight: 700, padding: 0 }}
            >
              Sign up
            </button>
          </div>

          <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: 12, marginTop: 18, textAlign: 'center' }}>
            This screen is visual only and does not require authentication.
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
  borderRadius: 14,
  padding: '16px 18px',
  color: '#fff',
  fontSize: 16,
  outline: 'none',
};
