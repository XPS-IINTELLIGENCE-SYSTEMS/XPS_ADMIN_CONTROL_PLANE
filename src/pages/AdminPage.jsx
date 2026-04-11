import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw, Shield, UserRoundCheck, Wand2 } from 'lucide-react';
import Panel from '../components/ui/Panel.jsx';
import { getSession, getSupabaseClient, isSupabaseConfigured, signInWithProvider, signInWithEmail, signOut } from '../lib/supabaseClient.js';
import { getGovernance, setGovernance, subscribeGovernance } from '../lib/governance.js';
import { getConnectionPrefs, subscribeConnectionPrefs, maskSecret } from '../lib/connectionPrefs.js';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.API_URL || '';
const GOLD = '#d4a843';

function statusTone(mode) {
  if (mode === 'live') return { color: '#22c55e', label: 'Live' };
  if (mode === 'local') return { color: '#60a5fa', label: 'Local' };
  if (mode === 'ingest-only') return { color: '#f59e0b', label: 'Ingest only' };
  return { color: '#ef4444', label: 'Blocked' };
}

function StatusPill({ mode }) {
  const tone = statusTone(mode);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '5px 10px', background: `${tone.color}14`, border: `1px solid ${tone.color}26`, color: tone.color, fontSize: 12, fontWeight: 700 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: tone.color }} />
      {tone.label}
    </span>
  );
}

function SummaryCard({ label, value, note }) {
  return (
    <div style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 14, padding: 18 }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8 }}>{value}</div>
      {note ? <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{note}</div> : null}
    </div>
  );
}

function ConnectorRow({ label, mode, note }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 180px) auto 1fr', gap: 14, alignItems: 'start', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
      <StatusPill mode={mode} />
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{note}</div>
    </div>
  );
}

function ToggleRow({ label, value, note, onToggle }) {
  return (
    <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', color: 'var(--text-primary)', textAlign: 'left' }}>
      <div>
        <div style={{ fontWeight: 600 }}>{label}</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>{note}</div>
      </div>
      <div style={{ width: 46, height: 26, borderRadius: 999, background: value ? GOLD : 'rgba(255,255,255,0.14)', position: 'relative', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: value ? '#090a0d' : '#f8fafc', transition: 'left 0.15s ease' }} />
      </div>
    </button>
  );
}

function buildAccountEntries(liveStatus) {
  return [
    {
      id: 'supabase',
      label: 'Supabase',
      url: liveStatus?.supabase?.projectUrl ? `https://${liveStatus.supabase.projectUrl}` : 'https://supabase.com/dashboard',
      mode: liveStatus?.supabase?.mode || 'blocked',
      note: liveStatus?.supabase?.configured ? 'Project login and auth callbacks live here.' : 'Supabase project is not yet configured in runtime.',
    },
    {
      id: 'github',
      label: 'GitHub',
      url: 'https://github.com/login',
      mode: liveStatus?.github?.mode || 'blocked',
      note: liveStatus?.github?.configured ? `Repo target ${liveStatus.github.repo || 'connected'} is available.` : 'Open GitHub sign-in for repo account access.',
    },
    {
      id: 'vercel',
      label: 'Vercel',
      url: 'https://vercel.com/login',
      mode: liveStatus?.vercel?.mode || 'blocked',
      note: liveStatus?.vercel?.configured ? `Project ${liveStatus.vercel.projectId || 'connected'} is wired.` : 'Open Vercel sign-in to access deployment controls.',
    },
    {
      id: 'google-workspace',
      label: 'Google Workspace',
      url: 'https://accounts.google.com/',
      mode: liveStatus?.google?.mode || 'blocked',
      note: liveStatus?.google?.configured ? `Project ${liveStatus.google.project || 'connected'} is installed.` : 'Open Google sign-in for Workspace and Cloud account access.',
    },
  ];
}

export default function AdminPage() {
  const [liveStatus, setLiveStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authStatus, setAuthStatus] = useState('');
  const [governance, setGovernanceState] = useState(getGovernance());
  const [connectionPrefs, setConnectionPrefsState] = useState(getConnectionPrefs());
  const authConfigured = isSupabaseConfigured();

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError('');
    try {
      const response = await fetch(`${API_URL}/api/status`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setLiveStatus(await response.json());
    } catch (error) {
      setStatusError(error.message);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!authConfigured) {
      setSession(null);
      return undefined;
    }
    let mounted = true;
    getSession().then((nextSession) => {
      if (mounted) setSession(nextSession);
    }).catch(() => {});
    const { data: authListener } = getSupabaseClient().auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, [authConfigured]);

  useEffect(() => {
    setGovernanceState(getGovernance());
    return subscribeGovernance(setGovernanceState);
  }, []);

  useEffect(() => {
    setConnectionPrefsState(getConnectionPrefs());
    return subscribeConnectionPrefs(setConnectionPrefsState);
  }, []);

  const connectedSystems = liveStatus?.summary?.connectedSystems || [];
  const blockedSystems = liveStatus?.summary?.blockedSystems || [];
  const activeProvider = liveStatus?.llm?.active || 'synthetic';
  const activeModel = liveStatus?.llm?.model || 'fallback';

  const connectorRows = useMemo(() => {
    if (!liveStatus) return [];
    return [
      { label: 'Groq', mode: liveStatus.llm?.providers?.groq?.configured ? 'live' : 'blocked', note: liveStatus.llm?.providers?.groq?.configured ? `Model: ${liveStatus.llm.providers.groq.model}` : liveStatus.llm?.providers?.groq?.reason },
      { label: 'OpenAI', mode: liveStatus.llm?.providers?.openai?.configured ? 'live' : 'blocked', note: liveStatus.llm?.providers?.openai?.configured ? `Model: ${liveStatus.llm.providers.openai.model}` : liveStatus.llm?.providers?.openai?.reason },
      { label: 'GitHub', mode: liveStatus.github?.mode, note: liveStatus.github?.configured ? `Repo: ${liveStatus.github.repo || 'connected'}` : liveStatus.github?.reason },
      { label: 'Supabase', mode: liveStatus.supabase?.mode, note: liveStatus.supabase?.configured ? `Project: ${liveStatus.supabase.projectUrl}` : liveStatus.supabase?.reason },
      { label: 'Vercel', mode: liveStatus.vercel?.mode, note: liveStatus.vercel?.configured ? `Project: ${liveStatus.vercel.projectId || 'connected'}` : liveStatus.vercel?.reason },
      { label: 'Google Workspace', mode: liveStatus.google?.mode, note: liveStatus.google?.configured ? `Project: ${liveStatus.google.project || 'connected'}` : liveStatus.google?.reason },
      { label: 'Twilio', mode: liveStatus.twilio?.mode, note: liveStatus.twilio?.reason || 'Voice lane available.' },
      { label: 'SendGrid', mode: liveStatus.sendgrid?.mode, note: liveStatus.sendgrid?.reason || 'Email lane available.' },
    ];
  }, [liveStatus]);

  const governanceRows = [
    { key: 'allowUiEdits', label: 'Allow UI edits', note: 'Keep the assistant able to stage interface refinements.' },
    { key: 'requireApproval', label: 'Require approval', note: 'Add a deliberate gate before write actions.' },
    { key: 'connectorPermissions', label: 'Enable connector actions', note: 'Allow connected systems to be used inside workflows.' },
    { key: 'browserExecution', label: 'Browser execution', note: 'Only enable when a browser worker is configured.' },
  ];
  const accountEntries = useMemo(() => buildAccountEntries(liveStatus), [liveStatus]);

  const handleOAuth = async (provider) => {
    if (!authConfigured) {
      setAuthStatus('Supabase auth is not configured yet.');
      return;
    }
    setAuthStatus('');
    try {
      const redirectTo = typeof window !== 'undefined' ? window.location.href : undefined;
      await signInWithProvider(provider, redirectTo);
      setAuthStatus(`Redirecting to ${provider} sign-in…`);
    } catch (error) {
      setAuthStatus(error.message);
    }
  };

  const handleEmailSignIn = async () => {
    if (!authConfigured) {
      setAuthStatus('Supabase auth is not configured yet.');
      return;
    }
    if (!authEmail) return;
    setAuthStatus('');
    try {
      const redirectTo = typeof window !== 'undefined' ? window.location.href : undefined;
      await signInWithEmail(authEmail, redirectTo);
      setAuthStatus('Magic link sent.');
    } catch (error) {
      setAuthStatus(error.message);
    }
  };

  const handleSignOut = async () => {
    if (!authConfigured) {
      setAuthStatus('Supabase auth is not configured yet.');
      return;
    }
    setAuthStatus('');
    try {
      await signOut();
      setAuthStatus('Signed out.');
    } catch (error) {
      setAuthStatus(error.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>Admin</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6, maxWidth: 720 }}>
            Focused runtime, access, and governance controls for the intended XPS Intelligence product.
          </p>
        </div>
        <button data-testid="admin-refresh-status" onClick={fetchStatus} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', padding: '10px 14px', fontWeight: 700 }}>
          <RefreshCw size={14} className="xps-icon" style={{ animation: statusLoading ? 'xpsPulse 1s linear infinite' : 'none' }} />
          Refresh status
        </button>
      </div>

      <Panel title="Active provider" subtitle="The live lane currently driving assistant and runtime behavior" actions={<StatusPill mode={liveStatus?.llm?.mode === 'live' ? 'live' : activeProvider === 'ollama' ? 'local' : activeProvider === 'synthetic' ? 'blocked' : 'live'} />} style={{ marginBottom: 18 }}>
        <div data-testid="active-provider-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div className="xps-gold-text" style={{ fontWeight: 800, fontSize: 18, letterSpacing: 0.6 }}>
              {String(activeProvider).toUpperCase()} · {activeModel}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6 }}>
              {liveStatus?.llm?.reason || 'Provider status unavailable.'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--bg-card-alt)', border: '1px solid var(--border)', fontSize: 12 }}>
              Preferred provider: <strong>{connectionPrefs.providerPreference || 'auto'}</strong>
            </span>
            <span style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--bg-card-alt)', border: '1px solid var(--border)', fontSize: 12 }}>
              Runtime target: <strong>{connectionPrefs.runtimeTarget || 'local'}</strong>
            </span>
          </div>
        </div>
        {statusError ? (
          <div style={{ marginTop: 14, color: '#fca5a5', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <AlertTriangle size={14} />
            {statusError}
          </div>
        ) : null}
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 18 }}>
        <SummaryCard label="Connected" value={connectedSystems.length} note={connectedSystems.join(' · ') || 'No live systems'} />
        <SummaryCard label="Blocked" value={blockedSystems.length} note={blockedSystems.slice(0, 4).join(' · ') || 'None'} />
        <SummaryCard label="Access" value={session?.user?.email || 'Signed out'} note="Supabase auth state" />
        <SummaryCard label="Approval mode" value={governance.requireApproval ? 'On' : 'Off'} note={`Autonomy: ${governance.autonomyLevel}`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(320px, 1fr)', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Panel title="Core connectors" subtitle="Keep only the systems that support the intended app experience">
            <div>
              {connectorRows.map((row, index) => (
                <div key={row.label} style={{ borderBottom: index === connectorRows.length - 1 ? 'none' : undefined }}>
                  <ConnectorRow {...row} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Governance" subtitle="Small set of controls that directly affect the product">
            <div style={{ display: 'grid', gap: 12 }}>
              {governanceRows.map((row) => (
                <ToggleRow key={row.key} label={row.label} note={row.note} value={!!governance[row.key]} onToggle={() => setGovernance({ [row.key]: !governance[row.key] })} />
              ))}
            </div>
          </Panel>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Panel title="Access" subtitle="Keep admin entry simple and readable">
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Workspace entry stays click-through. Connected auth here is optional and only used for linked admin actions.
                {!authConfigured ? ' Configure Supabase URL and anon key to enable live sign-in.' : ''}
              </div>
              <button data-testid="auth-google-btn" disabled={!authConfigured} onClick={() => handleOAuth('google')} style={authButtonStyle(false, !authConfigured)}>
                <UserRoundCheck size={14} />
                Continue with Google
              </button>
              <button data-testid="auth-github-btn" disabled={!authConfigured} onClick={() => handleOAuth('github')} style={authButtonStyle(false, !authConfigured)}>
                <Shield size={14} />
                Continue with GitHub
              </button>
              <div style={{ display: 'grid', gap: 10, marginTop: 4 }}>
                <input disabled={!authConfigured} value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="you@company.com" style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 12px', color: 'var(--text-primary)', outline: 'none', opacity: authConfigured ? 1 : 0.55 }} />
                <button data-testid="auth-email-btn" disabled={!authConfigured} onClick={handleEmailSignIn} style={authButtonStyle(true, !authConfigured)}>
                  <Wand2 size={14} />
                  Email magic link
                </button>
                <button disabled={!authConfigured} onClick={handleSignOut} style={secondaryButtonStyle(!authConfigured)}>
                  Sign out
                </button>
              </div>
              {authStatus ? <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{authStatus}</div> : null}
            </div>
          </Panel>

          <Panel title="Connected account entry" subtitle="Typical website sign-in paths for linked systems">
            <div style={{ display: 'grid', gap: 10 }}>
              {accountEntries.map((entry) => (
                <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 10, alignItems: 'center', padding: '10px 12px', background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{entry.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{entry.note}</div>
                  </div>
                  <button onClick={() => window.open(entry.url, '_blank', 'noopener,noreferrer')} style={authButtonStyle(entry.mode === 'live')}>
                    Open sign-in
                  </button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Current defaults" subtitle="Session and saved connection choices">
            <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
              <MetaRow label="Repo target" value={connectionPrefs.repoTarget || 'Not set'} />
              <MetaRow label="Deployment target" value={connectionPrefs.deploymentTarget || 'preview'} />
              <MetaRow label="GitHub token" value={maskSecret(connectionPrefs.githubToken)} />
              <MetaRow label="OpenAI key" value={maskSecret(connectionPrefs.openaiApiKey)} />
              <MetaRow label="Groq key" value={maskSecret(connectionPrefs.groqApiKey)} />
            </div>
          </Panel>

          <Panel title="Truthful limits" subtitle="Keep unsupported surfaces explicit">
            <div style={{ display: 'grid', gap: 12 }}>
              {(liveStatus?.blockedPassthrough || []).slice(0, 2).map((item) => (
                <div key={item.id} style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <AlertTriangle size={14} color="#f59e0b" />
                    <strong>{item.label}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{item.reason}</div>
                </div>
              ))}
              {liveStatus?.blockedPassthrough?.length ? null : (
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No passthrough warnings reported.</div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 10 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function authButtonStyle(primary = false, disabled = false) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: primary ? 'none' : '1px solid var(--border)',
    background: primary ? GOLD : 'var(--bg-card-alt)',
    color: primary ? '#090a0d' : 'var(--text-primary)',
    fontWeight: 700,
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

function secondaryButtonStyle(disabled = false) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}
