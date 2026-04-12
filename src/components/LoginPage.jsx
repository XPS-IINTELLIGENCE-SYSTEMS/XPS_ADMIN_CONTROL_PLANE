import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const BRAND_LOGO = '/brand/xps-shield-wings.png';
const GOLD = '#d4af52';

const previewImages = [
  '/screenshots/dashboard.png',
  '/screenshots/ai-assistant.png',
  '/screenshots/connectors.png',
];

export default function LoginPage({ onContinue, onBack }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('Any operator name and password can continue in this build.');
  const selectedPreview = useMemo(() => {
    const seed = (name.trim().length + password.trim().length) % previewImages.length;
    return previewImages[seed];
  }, [name, password]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage(`Signed in as ${name.trim() || 'Operator'}. Authentication is intentionally open in this build.`);
    onContinue?.();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
        color: '#fff',
        background: 'radial-gradient(circle at top left, rgba(212,175,82,0.14), transparent 24%), #050505',
      }}
    >
      <section
        style={{
          padding: 'clamp(22px, 5vw, 44px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(13,11,8,0.96), rgba(6,6,6,0.98))',
        }}
      >
        <div style={{ width: '100%', maxWidth: 620 }}>
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
              marginBottom: 20,
            }}
          >
            <ArrowLeft size={14} />
            Back to landing
          </button>

          <div className="xps-logo xps-brand-logo-glow" style={{ width: 92, height: 92, borderRadius: 24, marginBottom: 22 }}>
            <img src={BRAND_LOGO} alt="XPS" />
          </div>

          <div className="xps-gold-text" style={{ fontSize: 13, fontWeight: 800, letterSpacing: 2.6 }}>SIGN IN</div>
          <h1 style={{ fontSize: 'clamp(42px, 7vw, 66px)', lineHeight: 0.98, marginTop: 14 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginTop: 16, maxWidth: 520 }}>
            Use any operator name and password to enter the XPS mobile command center and launch the Groq-first chat shell.
          </p>

          <form onSubmit={handleSubmit} style={{ marginTop: 28 }}>
            <label style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.74)' }}>Operator name</span>
              <input
                id="login-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Jane Smith"
                autoComplete="username"
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'grid', gap: 10 }}>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.74)' }}>Password</span>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Any password works"
                  autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: 52 }}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, borderRadius: 16, border: '1px solid rgba(212,175,82,0.18)', background: 'rgba(212,175,82,0.08)', padding: '14px 16px' }}>
              <ShieldCheck size={18} color={GOLD} />
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.68)', lineHeight: 1.6 }}>
                Open access mode is enabled for demo and production-preview routing.
              </div>
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
                padding: '17px 18px',
                fontSize: 17,
                fontWeight: 800,
              }}
            >
              Enter chat workspace
            </button>
          </form>

          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.44)', lineHeight: 1.7, marginTop: 18 }}>{message}</div>
        </div>
      </section>

      <section
        style={{
          padding: 'clamp(22px, 5vw, 40px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, rgba(10,10,10,0.98), rgba(6,6,6,0.96))',
        }}
      >
        <div style={{ width: '100%', maxWidth: 600 }}>
          <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 28, overflow: 'hidden', boxShadow: '0 26px 80px rgba(0,0,0,0.42)' }}>
            <div style={{ aspectRatio: '4 / 3', background: '#090909' }}>
              <img src={selectedPreview} alt="XPS product preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div style={{ padding: '18px 18px 20px', background: 'linear-gradient(180deg, rgba(17,17,17,0.98), rgba(10,10,10,0.98))' }}>
              <div className="xps-gold-text" style={{ fontSize: 12, fontWeight: 800, letterSpacing: 2 }}>LIVE PREVIEW</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginTop: 10 }}>Chat, dashboard, and mobile navigation in one shell.</div>
              <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.58)', lineHeight: 1.7 }}>
                The dashboard stays one pull away, the side menu stays accessible on mobile, and Groq remains the primary runtime target.
              </div>
            </div>
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
