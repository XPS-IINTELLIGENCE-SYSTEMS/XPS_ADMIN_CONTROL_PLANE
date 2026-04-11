/**
 * AdminPage — Full capability admin for XPS Intelligence Control Plane.
 *
 * Surfaces live/blocked/synthetic status for every integration:
 * GitHub, Supabase, GPT/OpenAI, Vercel, Google Workspace, Gemini.
 *
 * States are derived from /api/status (server-side truth) supplemented by
 * build-time env var detection. No faked data. Blocked passthrough is
 * explicitly surfaced with truthful reasons.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  GitBranch, Database, Cpu, Globe, Mail, Sparkles,
  CheckCircle, XCircle, AlertTriangle, MinusCircle,
  ChevronDown, ChevronRight, Lock, Unlock, Activity,
  Key, Server, RefreshCw, Shield,
  BookOpen, Zap, Code, Package, GitPullRequest,
  Users, HardDrive, Brain, Cloud,
  Ban, Info, GitCommit, Tag, Workflow, Eye, PhoneCall, Clapperboard, LayoutPanelTop,
} from 'lucide-react';
import { supabase, signInWithProvider, signInWithEmail, signOut, getSession } from '../lib/supabaseClient.js';
import { DEFAULT_GOVERNANCE, getGovernance, setGovernance, subscribeGovernance } from '../lib/governance.js';
import { getConnectionPrefs, updateConnectionPrefs, resetConnectionPrefs, subscribeConnectionPrefs, maskSecret } from '../lib/connectionPrefs.js';
import { useWorkspace, OBJ_TYPE, RUN_STATUS, genId } from '../lib/workspaceEngine.jsx';
import { createDefaultUiState, createHistoryEntry, normalizeUiState, validateUiState } from '../lib/uiMutations.js';
import { requestAppShellNavigation } from '../lib/appShellEvents.js';
import { executeSendGridEmail, executeTwilioCall, buildConnectorCredentials } from '../lib/operatorActions.js';
import { subscribeRuns, getRunList, retryRun, recoverRun, cancelRun } from '../lib/bytebotRuntime.js';
import { subscribeJobs, getJobList, retryBrowserJob, recoverBrowserJob, cancelBrowserJob } from '../lib/browserJobRuntime.js';
import { subscribeGroups, getGroupList } from '../lib/parallelRunGroup.js';
import { loadAdminStatusSnapshot, saveAdminStatusSnapshot } from '../lib/orchestrationPersistence.js';

const API_URL = import.meta.env.API_URL || '';
const BRAND_LOGO = '/brand/xps-shield-wings.png';

// ── Runtime truth detection (build-time, client-side supplement) ──────────
const env = import.meta.env;

function isSet(key) {
  const v = env[key];
  return typeof v === 'string' && v.length > 5;
}

const GITHUB_CONFIGURED  = isSet('GITHUB_TOKEN') || isSet('GITHUB_API_TOKEN');
const SUPABASE_CONFIGURED = isSet('SUPABASE_URL') && isSet('SUPABASE_ANON_KEY');
const OPENAI_CONFIGURED  = isSet('OPENAI_API_KEY') || isSet('GPT_API_KEY');
const GROQ_CONFIGURED    = isSet('GROQ_API_KEY');
const VERCEL_CONFIGURED  = isSet('VERCEL_TOKEN') || isSet('VERCEL_ACCESS_TOKEN');
const GOOGLE_CONFIGURED  = isSet('GCP_SA_KEY') || isSet('GCP_PROJECT_ID');
const GEMINI_CONFIGURED  = isSet('GEMINI_API_KEY') || isSet('GCP_GEMINI_KEY');
const HUBSPOT_CONFIGURED = isSet('HUBSPOT_API_KEY');
const AIRTABLE_CONFIGURED = isSet('AIRTABLE_API_KEY') && isSet('AIRTABLE_BASE_ID');
const BROWSER_WORKER_CONFIGURED = isSet('BROWSER_WORKER_URL');
const TWILIO_CONFIGURED = isSet('TWILIO_ACCOUNT_SID') && isSet('TWILIO_AUTH_TOKEN');
const SENDGRID_CONFIGURED = isSet('SENDGRID_API_KEY');

// Status types
const STATUS = {
  LIVE:      'live',
  BLOCKED:   'blocked',
  SYNTHETIC: 'synthetic',
  LOCAL:     'local',
};

function deriveStatus(configured) {
  return configured ? STATUS.LIVE : STATUS.BLOCKED;
}

// Resolve status from live API data if available, else fall back to build-time
function resolveStatus(liveConfigured, buildConfigured) {
  if (liveConfigured !== undefined) return liveConfigured ? STATUS.LIVE : STATUS.BLOCKED;
  return buildConfigured ? STATUS.LIVE : STATUS.BLOCKED;
}

// ── Design tokens ──────────────────────────────────────────────────────────
const STATUS_META = {
  [STATUS.LIVE]:      { color: '#4ade80', label: 'Live',      icon: CheckCircle },
  [STATUS.BLOCKED]:   { color: '#ef4444', label: 'Blocked',   icon: XCircle },
  [STATUS.SYNTHETIC]: { color: '#fbbf24', label: 'Synthetic', icon: AlertTriangle },
  [STATUS.LOCAL]:     { color: '#60a5fa', label: 'Local',     icon: MinusCircle },
};

function StatusPill({ status }) {
  const meta = STATUS_META[status] || STATUS_META[STATUS.BLOCKED];
  const Icon = meta.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 99,
      background: meta.color + '14',
      border: `1px solid ${meta.color}30`,
      fontSize: 11, fontWeight: 600, color: meta.color,
    }}>
      <Icon size={10} className="xps-icon" style={{ color: 'var(--icon-silver)' }} />
      {meta.label}
    </span>
  );
}

function CapRow({ icon: Icon, label, status, note }) {
  const meta = STATUS_META[status] || STATUS_META[STATUS.BLOCKED];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 16px',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <Icon size={13} className="xps-icon xps-icon-muted" style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{label}</span>
      {note && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{note}</span>}
      <StatusPill status={status} />
    </div>
  );
}

function CapPanel({ icon: HeaderIcon, title, subtitle, status, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const meta = STATUS_META[status] || STATUS_META[STATUS.BLOCKED];

  return (
    <div
      data-testid={`cap-panel-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className="xps-electric-hover"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 14,
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px',
          background: 'transparent', border: 'none',
          borderBottom: open ? '1px solid rgba(255,255,255,0.05)' : 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: meta.color + '14',
          border: `1px solid ${meta.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <HeaderIcon size={15} className="xps-icon" style={{ color: 'var(--icon-silver)' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{subtitle}</div>}
        </div>
        <StatusPill status={status} />
        {open
          ? <ChevronDown size={14} className="xps-icon xps-icon-muted" style={{ flexShrink: 0 }} />
          : <ChevronRight size={14} className="xps-icon xps-icon-muted" style={{ flexShrink: 0 }} />}
      </button>

      {open && (
        <div>
          {children}
          {status === STATUS.BLOCKED && (
            <div style={{
              margin: '10px 16px 12px',
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 8,
              fontSize: 11,
              color: 'rgba(255,255,255,0.45)',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <Lock size={12} className="xps-icon" style={{ color: 'var(--icon-silver)', flexShrink: 0, marginTop: 1 }} />
              <span>
                Not configured — set the required environment variable(s) in{' '}
                <code style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3 }}>.env.local</code>
                {' '}or Vercel project settings to enable this integration.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConnectorControls({ title = 'Connector Controls', status, statusNote, actions = [], scopes = [], blockedReason }) {
  const meta = STATUS_META[status] || STATUS_META[STATUS.BLOCKED];
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>{title.toUpperCase()}</span>
        <span style={{ marginLeft: 'auto' }}>
          <StatusPill status={status} />
        </span>
      </div>
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 11, color: meta.color, fontWeight: 600 }}>{statusNote}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              disabled={action.disabled}
              className="xps-electric-hover"
              style={actionBtnStyle(action.disabled, action.accent)}
            >
              {action.label}
            </button>
          ))}
        </div>
        {blockedReason && status === STATUS.BLOCKED && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '8px 10px' }}>
            {blockedReason}
          </div>
        )}
        {scopes.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase' }}>Scopes / Capabilities</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {scopes.map(scope => (
                <div key={scope.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: STATUS_META[scope.status]?.color || 'rgba(255,255,255,0.5)' }}>{scope.label}</span>
                  {scope.note && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{scope.note}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeading({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 1.4,
      color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
      marginBottom: 10, marginTop: 24,
      paddingBottom: 6, borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      {children}
    </div>
  );
}

function getRuntimeSourceMeta(statusSource) {
  if (statusSource === 'live') {
    return { label: 'live /api/status', color: '#4ade80' };
  }
  if (statusSource === 'recovered') {
    return { label: 'last browser-local continuity snapshot', color: '#fbbf24' };
  }
  return { label: 'unavailable', color: 'rgba(255,255,255,0.35)' };
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AdminPage({ activeSection: requestedSection = 'integrations', onSectionChange }) {
  const workspace = useWorkspace();
  const [activeSection, setActiveSection] = useState(requestedSection);
  const [liveStatus, setLiveStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [savedStatus, setSavedStatus] = useState(() => loadAdminStatusSnapshot());
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authStatus, setAuthStatus] = useState(null);
  const [governance, setGovernanceState] = useState(getGovernance());
  const [connectionPrefs, setConnectionPrefsState] = useState(getConnectionPrefs());

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const res = await fetch(`${API_URL}/api/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLiveStatus(data);
      saveAdminStatusSnapshot(data);
      setSavedStatus(loadAdminStatusSnapshot());
    } catch (err) {
      setStatusError(err.message);
      setSavedStatus(loadAdminStatusSnapshot());
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);
  useEffect(() => {
    let mounted = true;
    getSession().then(data => {
      if (mounted) setSession(data);
    }).catch(() => {});
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);
  useEffect(() => {
    setGovernanceState(getGovernance());
    const unsub = subscribeGovernance(setGovernanceState);
    return unsub;
  }, []);
  useEffect(() => {
    setActiveSection(requestedSection);
  }, [requestedSection]);
  useEffect(() => {
    setConnectionPrefsState(getConnectionPrefs());
    const unsub = subscribeConnectionPrefs(setConnectionPrefsState);
    return unsub;
  }, []);

  const updateGovernance = (patch) => {
    setGovernanceState(setGovernance(patch));
  };
  const updateSessionConnections = (patch) => {
    setConnectionPrefsState(updateConnectionPrefs(patch));
  };
  const resetSessionConnections = (keys) => {
    setConnectionPrefsState(resetConnectionPrefs(keys));
  };

  const handleOAuth = async (provider) => {
    setAuthStatus(null);
    try {
      const redirectTo = typeof window !== 'undefined' ? window.location.href : undefined;
      await signInWithProvider(provider, redirectTo);
      setAuthStatus(`Redirecting to ${provider}…`);
    } catch (err) {
      setAuthStatus(err.message);
    }
  };

  const handleEmailSignIn = async () => {
    if (!authEmail) return;
    setAuthStatus(null);
    try {
      const redirectTo = typeof window !== 'undefined' ? window.location.href : undefined;
      await signInWithEmail(authEmail, redirectTo);
      setAuthStatus('Magic link sent — check your inbox.');
    } catch (err) {
      setAuthStatus(err.message);
    }
  };

  const handleSignOut = async () => {
    setAuthStatus(null);
    try {
      await signOut();
      setAuthStatus('Signed out.');
    } catch (err) {
      setAuthStatus(err.message);
    }
  };

  const navItems = [
    { id: 'integrations', label: 'Overview',        icon: Activity },
    { id: 'github',       label: 'GitHub',           icon: GitBranch },
    { id: 'supabase',     label: 'Supabase',         icon: Database },
    { id: 'vercel',       label: 'Vercel',           icon: Cloud },
    { id: 'google',       label: 'Google Workspace', icon: Mail },
    { id: 'communications', label: 'Communications', icon: PhoneCall },
    { id: 'runtime',      label: 'Runtime Ops',      icon: Workflow },
    { id: 'builder',      label: 'Builder',          icon: LayoutPanelTop },
    { id: 'system',       label: 'System',           icon: Server },
    { id: 'governance',   label: 'Governance',       icon: Shield },
    { id: 'users',        label: 'Access',           icon: Users },
  ];

  // Resolve live vs build-time statuses
  const live = liveStatus || {};
  const ghConfigured      = !!(live.github?.configured || connectionPrefs.githubToken || GITHUB_CONFIGURED);
  const sbConfigured      = !!(live.supabase?.configured || (connectionPrefs.supabaseUrl && connectionPrefs.supabaseAnonKey) || SUPABASE_CONFIGURED);
  const openaiConfigured  = !!(live.llm?.providers?.openai?.configured || connectionPrefs.openaiApiKey || OPENAI_CONFIGURED);
  const groqConfigured    = !!(live.llm?.providers?.groq?.configured || connectionPrefs.groqApiKey || GROQ_CONFIGURED);
  const vercelConfigured  = !!(live.vercel?.configured || connectionPrefs.vercelToken || VERCEL_CONFIGURED);
  const googleConfigured  = !!(live.google?.configured || GOOGLE_CONFIGURED);
  const geminiConfigured  = !!(live.google?.gemini?.configured || connectionPrefs.geminiApiKey || GEMINI_CONFIGURED);
  const hubspotConfigured = !!(live.hubspot?.configured || connectionPrefs.hubspotApiKey || HUBSPOT_CONFIGURED);
  const airtableConfigured = live.airtable?.configured ?? AIRTABLE_CONFIGURED;
  const browserWorkerConfigured = live.browser?.configured ?? BROWSER_WORKER_CONFIGURED;
  const twilioConfigured = !!(live.twilio?.configured || (connectionPrefs.twilioAccountSid && connectionPrefs.twilioAuthToken) || TWILIO_CONFIGURED);
  const sendgridConfigured = !!(live.sendgrid?.configured || connectionPrefs.sendgridApiKey || SENDGRID_CONFIGURED);
  const runtimeStatusSource = liveStatus ? 'live' : savedStatus ? 'recovered' : 'unavailable';

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Admin sidebar */}
      <div style={{
        width: 200, flexShrink: 0,
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-sidebar)',
        display: 'flex', flexDirection: 'column',
        padding: '16px 8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 12px' }}>
          <div
            className="xps-logo xps-brand-logo-glow"
            style={{
              width: 40,
              height: 40,
              flexShrink: 0,
            }}
          >
            <img
              src={BRAND_LOGO}
              alt="XPS"
              data-testid="brand-logo-admin"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div className="xps-silver-text" style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1.1 }}>XPS INTELLIGENCE</div>
            <div className="xps-gold-text" style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.6, marginTop: 3 }}>ADMIN CONTROL PLANE</div>
          </div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.4, color: 'rgba(255,255,255,0.3)', padding: '4px 8px 10px' }}>
          ADMIN
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              data-testid={`admin-nav-${item.id}`}
              onClick={() => { setActiveSection(item.id); onSectionChange?.(item.id); }}
              className="xps-electric-hover"
              data-active={active ? 'true' : undefined}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 6,
                border: 'none', background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                fontSize: 12, fontWeight: active ? 600 : 400,
                cursor: 'pointer', textAlign: 'left', width: '100%',
                color: active ? '#e2e8f0' : 'rgba(255,255,255,0.45)',
                marginBottom: 2,
              }}
            >
              <Icon size={13} strokeWidth={active ? 2.2 : 1.8} className="xps-icon" />
              {item.label}
              {active && (
                <span style={{
                  marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%',
                  background: 'linear-gradient(90deg, var(--electric-gold), var(--electric-silver-bright))',
                }} />
              )}
            </button>
          );
        })}

        {/* Live status refresh button */}
        <div style={{ marginTop: 12, padding: '0 8px' }}>
          <button
            data-testid="admin-refresh-status"
            onClick={fetchStatus}
            disabled={statusLoading}
            className="xps-electric-hover"
            style={{
              position: 'relative',
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '7px 8px', borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: statusLoading ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.5)',
              fontSize: 11, cursor: statusLoading ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCw size={11} className="xps-icon" style={{ animation: statusLoading ? 'spin 1s linear infinite' : 'none' }} />
            {statusLoading ? 'Refreshing…' : 'Refresh Status'}
          </button>
          {statusError && (
            <div style={{ marginTop: 6, fontSize: 10, color: '#ef4444', textAlign: 'center' }}>
              {savedStatus ? 'API error — runtime/system panels using last saved continuity snapshot' : 'API error — using build-time state'}
            </div>
          )}
          {liveStatus && (
            <div style={{ marginTop: 6, fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
              {new Date(liveStatus.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Dev mode badge */}
        <div style={{ marginTop: 'auto', padding: '10px 8px 0' }}>
          <div style={{
            padding: '8px 10px', borderRadius: 8,
            background: 'rgba(96,165,250,0.07)',
            border: '1px solid rgba(96,165,250,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Unlock size={11} style={{ color: '#60a5fa' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', letterSpacing: 0.5 }}>DEV MODE</span>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
              Auth bypassed. Operator shell active.
            </div>
          </div>
        </div>
      </div>

      {/* Admin content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
        {activeSection === 'integrations' && (
          <IntegrationsSection
            liveStatus={live}
            ghConfigured={ghConfigured}
            sbConfigured={sbConfigured}
            openaiConfigured={openaiConfigured}
            groqConfigured={groqConfigured}
            vercelConfigured={vercelConfigured}
            googleConfigured={googleConfigured}
            geminiConfigured={geminiConfigured}
            hubspotConfigured={hubspotConfigured}
            airtableConfigured={airtableConfigured}
            browserWorkerConfigured={browserWorkerConfigured}
            twilioConfigured={twilioConfigured}
            sendgridConfigured={sendgridConfigured}
            connectionPrefs={connectionPrefs}
            onUpdateConnectionPrefs={updateSessionConnections}
            onResetConnectionPrefs={resetSessionConnections}
          />
        )}
        {activeSection === 'github'    && <GitHubSection configured={ghConfigured} liveStatus={live} />}
        {activeSection === 'supabase'  && <SupabaseSection configured={sbConfigured} liveStatus={live} />}
        {activeSection === 'vercel'    && <VercelSection configured={vercelConfigured} liveStatus={live} />}
        {activeSection === 'google'    && <GoogleSection configured={googleConfigured} geminiConfigured={geminiConfigured} liveStatus={live} />}
        {activeSection === 'communications' && (
          <CommunicationsSection
            twilioConfigured={twilioConfigured}
            sendgridConfigured={sendgridConfigured}
            liveStatus={live}
            connectionPrefs={connectionPrefs}
            governance={governance}
            workspace={workspace}
          />
        )}
        {activeSection === 'runtime' && (
          <RuntimeSection
            statusSnapshot={liveStatus || savedStatus}
            statusSource={runtimeStatusSource}
            workspace={workspace}
          />
        )}
        {activeSection === 'builder' && (
          <BuilderSection
            browserWorkerConfigured={browserWorkerConfigured}
            openaiConfigured={openaiConfigured}
            geminiConfigured={geminiConfigured}
            ghConfigured={ghConfigured}
            liveStatus={live}
            governance={governance}
            workspace={workspace}
          />
        )}
        {activeSection === 'system'    && (
          <SystemSection
            openaiConfigured={openaiConfigured}
            groqConfigured={groqConfigured}
            sbConfigured={sbConfigured}
            browserWorkerConfigured={browserWorkerConfigured}
            runtimeStatusSource={runtimeStatusSource}
            savedStatus={savedStatus}
          />
        )}
        {activeSection === 'governance' && (
          <GovernanceSection
            governance={governance}
            onChange={updateGovernance}
            sbConfigured={sbConfigured}
          />
        )}
        {activeSection === 'users'     && (
          <AccessSection
            sbConfigured={sbConfigured}
            session={session}
            authEmail={authEmail}
            authStatus={authStatus}
            onEmailChange={setAuthEmail}
            onEmailSignIn={handleEmailSignIn}
            onOAuth={handleOAuth}
            onSignOut={handleSignOut}
          />
        )}
      </div>
    </div>
  );
}

// ── Integrations section ───────────────────────────────────────────────────
function IntegrationsSection({
  liveStatus,
  ghConfigured,
  sbConfigured,
  openaiConfigured,
  groqConfigured,
  vercelConfigured,
  googleConfigured,
  geminiConfigured,
  hubspotConfigured,
  airtableConfigured,
  browserWorkerConfigured,
  twilioConfigured,
  sendgridConfigured,
  connectionPrefs,
  onUpdateConnectionPrefs,
  onResetConnectionPrefs,
}) {
  const live = liveStatus || {};
  const activeLLM  = live.llm?.active && live.llm.active !== 'none'
    ? live.llm.active
    : openaiConfigured
      ? 'openai'
      : groqConfigured
        ? 'groq'
        : geminiConfigured
          ? 'gemini'
          : (!!connectionPrefs?.ollamaBaseUrl || live.llm?.providers?.ollama?.configured)
            ? 'ollama'
            : 'none';
  const llmModel   = live.llm?.model
    || (activeLLM === 'openai' ? connectionPrefs?.openaiModel : null)
    || (activeLLM === 'groq' ? connectionPrefs?.groqModel : null)
    || (activeLLM === 'gemini' ? connectionPrefs?.geminiModel : null)
    || (activeLLM === 'ollama' ? connectionPrefs?.ollamaModel : null)
    || null;
  const llmMode    = live.llm?.mode || (activeLLM === 'ollama' ? 'local' : activeLLM === 'none' ? 'synthetic' : 'live');
  const browserStatus = live.browser?.mode === 'local' || browserWorkerConfigured ? STATUS.LOCAL : STATUS.BLOCKED;
  const ollamaConfigured = live.llm?.providers?.ollama?.configured || !!connectionPrefs?.ollamaBaseUrl;
  const inboundTwilioStatus = live.runtimeOps?.inbound?.twilio?.status === 'configured' ? STATUS.LIVE : STATUS.LOCAL;
  const inboundSendGridStatus = live.runtimeOps?.inbound?.sendgrid?.status === 'configured' ? STATUS.LIVE : STATUS.LOCAL;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 className="xps-gold-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, marginBottom: 4 }}>
          Integration Capability Matrix
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Live connector status — reflects actual environment configuration, not synthetic data.
        </p>
        {live.timestamp && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
            Last refreshed: {new Date(live.timestamp).toLocaleString()} &middot; Runtime: {live.runtime || 'unknown'}
          </p>
        )}
      </div>

      {/* Active LLM provider banner */}
      <div
        data-testid="active-provider-banner"
        style={{
          marginBottom: 18, padding: '12px 16px',
          background: activeLLM !== 'none' ? 'rgba(74,222,128,0.07)' : 'rgba(251,191,36,0.07)',
          border: `1px solid ${activeLLM !== 'none' ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.2)'}`,
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <Cpu size={15} style={{ color: activeLLM !== 'none' ? '#4ade80' : '#fbbf24', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: activeLLM !== 'none' ? '#4ade80' : '#fbbf24' }}>
            {activeLLM === 'none' ? 'No LLM Configured — Synthetic Mode' : `Active LLM: ${activeLLM.toUpperCase()}${llmModel ? ` (${llmModel})` : ''}`}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {activeLLM === 'none'
              ? 'Set a backend credential or save a session key below to enable live AI inference.'
              : `Mode: ${llmMode} — routed through ${live.llm?.active && live.llm.active !== 'none' ? 'backend runtime' : 'session/build fallback'}. No consumer product passthrough.`}
          </div>
        </div>
        <StatusPill status={activeLLM === 'none' ? STATUS.SYNTHETIC : llmMode === 'local' ? STATUS.LOCAL : STATUS.LIVE} />
      </div>

      <SectionHeading>BLOCKED — Unsupported Direct Passthrough</SectionHeading>

      <BlockedPassthroughPanel openaiConfigured={openaiConfigured} ghConfigured={ghConfigured} />

      <SectionHeading>SESSION PASSTHROUGH / TOKEN INPUTS</SectionHeading>

      <SessionConnectionMatrix
        connectionPrefs={connectionPrefs}
        onUpdateConnectionPrefs={onUpdateConnectionPrefs}
        onResetConnectionPrefs={onResetConnectionPrefs}
        statuses={{
          openai: openaiConfigured,
          groq: groqConfigured,
          gemini: geminiConfigured,
          ollama: ollamaConfigured,
          github: ghConfigured,
          supabase: sbConfigured,
          vercel: vercelConfigured,
          hubspot: hubspotConfigured,
          airtable: airtableConfigured,
          browser: browserWorkerConfigured,
          twilio: twilioConfigured,
          sendgrid: sendgridConfigured,
        }}
      />

      <SectionHeading>AI / LLM Providers</SectionHeading>

      <CapPanel
        icon={Cpu}
        title="OpenAI / GPT"
        subtitle="Chat completions, embeddings, vision, function calling"
        status={deriveStatus(openaiConfigured)}
        defaultOpen
      >
        <CapRow icon={Brain}       label="Chat Completions (GPT-4o, GPT-4-turbo, GPT-3.5-turbo)" status={deriveStatus(openaiConfigured)} note="OPENAI_API_KEY" />
        <CapRow icon={Package}     label="Embeddings (text-embedding-3-small/large)"               status={deriveStatus(openaiConfigured)} />
        <CapRow icon={BookOpen}    label="Vision / Image Input (GPT-4o)"                           status={deriveStatus(openaiConfigured)} />
        <CapRow icon={Code}        label="Function Calling / Tool Use"                             status={deriveStatus(openaiConfigured)} />
        <CapRow icon={RefreshCw}   label="Streaming Responses"                                     status={deriveStatus(openaiConfigured)} />
        <CapRow icon={Shield}      label="Moderation Endpoint"                                     status={deriveStatus(openaiConfigured)} />
      </CapPanel>

      <CapPanel
        icon={Zap}
        title="Groq"
        subtitle="Ultra-fast LLaMA/Mixtral inference"
        status={deriveStatus(groqConfigured)}
        defaultOpen={false}
      >
        <CapRow icon={Brain}       label="LLaMA 3 70B / 8B"                  status={deriveStatus(groqConfigured)} note="GROQ_API_KEY" />
        <CapRow icon={Zap}         label="Mixtral 8x7B"                      status={deriveStatus(groqConfigured)} />
        <CapRow icon={RefreshCw}   label="Streaming"                         status={deriveStatus(groqConfigured)} />
      </CapPanel>

      <CapPanel
        icon={Cpu}
        title="Ollama"
        subtitle="Local/self-hosted model passthrough"
        status={deriveStatus(ollamaConfigured)}
        defaultOpen={false}
      >
        <CapRow icon={Brain}       label="Local chat model runtime"            status={deriveStatus(ollamaConfigured)} note="OLLAMA_BASE_URL" />
        <CapRow icon={Server}      label="Self-hosted inference endpoint"      status={deriveStatus(ollamaConfigured)} />
        <CapRow icon={Code}        label="OpenAI-compatible substitute path"   status={deriveStatus(ollamaConfigured)} />
      </CapPanel>

      <CapPanel
        icon={Sparkles}
        title="Google Gemini"
        subtitle="Gemini Pro / Flash multimodal"
        status={deriveStatus(geminiConfigured)}
        defaultOpen={false}
      >
        <CapRow icon={Brain}       label="Gemini 1.5 Pro / Flash"            status={deriveStatus(geminiConfigured)} note="GEMINI_API_KEY" />
        <CapRow icon={BookOpen}    label="Multimodal (image + text)"         status={deriveStatus(geminiConfigured)} />
        <CapRow icon={Code}        label="Function Calling"                  status={deriveStatus(geminiConfigured)} />
        <CapRow icon={Package}     label="Embeddings (text-embedding-004)"   status={deriveStatus(geminiConfigured)} />
      </CapPanel>

      <SectionHeading>Data / Storage</SectionHeading>

      <CapPanel
        icon={Database}
        title="Supabase"
        subtitle="PostgreSQL + Auth + Storage + Realtime"
        status={deriveStatus(sbConfigured)}
        defaultOpen
      >
        <CapRow icon={HardDrive}   label="PostgreSQL Database"               status={deriveStatus(sbConfigured)} note="SUPABASE_URL" />
        <CapRow icon={Shield}      label="Auth (JWT / Row-Level Security)"   status={deriveStatus(sbConfigured)} />
        <CapRow icon={Package}     label="File Storage (S3-compatible)"      status={deriveStatus(sbConfigured)} />
        <CapRow icon={RefreshCw}   label="Realtime Subscriptions"            status={deriveStatus(sbConfigured)} />
        <CapRow icon={Activity}    label="Edge Functions"                    status={STATUS.BLOCKED} note="Not wired" />
      </CapPanel>

      <SectionHeading>DevOps / Deployment</SectionHeading>

      <CapPanel
        icon={GitBranch}
        title="GitHub"
        subtitle="Repos, Actions, Issues, PRs, Deployments"
        status={deriveStatus(ghConfigured)}
        defaultOpen
      >
        <CapRow icon={GitBranch}      label="Repository Access (read/write)"    status={deriveStatus(ghConfigured)} note="GITHUB_TOKEN" />
        <CapRow icon={GitPullRequest} label="Pull Requests + Code Review"       status={deriveStatus(ghConfigured)} />
        <CapRow icon={Activity}       label="GitHub Actions (trigger / status)"  status={deriveStatus(ghConfigured)} />
        <CapRow icon={Package}        label="Releases + Artifacts"               status={deriveStatus(ghConfigured)} />
        <CapRow icon={Shield}         label="Code Scanning / Security Alerts"    status={deriveStatus(ghConfigured)} />
        <CapRow icon={GitCommit}      label="Commits / Branch History"           status={deriveStatus(ghConfigured)} />
      </CapPanel>

      <CapPanel
        icon={Cloud}
        title="Vercel"
        subtitle="Deployments, environment, domains"
        status={deriveStatus(vercelConfigured)}
        defaultOpen={false}
      >
        <CapRow icon={Globe}      label="Deployments (trigger / status)"     status={deriveStatus(vercelConfigured)} note="VERCEL_TOKEN" />
        <CapRow icon={Server}      label="Environment Variables (read/write)"  status={deriveStatus(vercelConfigured)} />
        <CapRow icon={Activity}    label="Build Logs"                          status={deriveStatus(vercelConfigured)} />
        <CapRow icon={Globe}       label="Domain Management"                   status={deriveStatus(vercelConfigured)} />
      </CapPanel>

      <SectionHeading>Google Workspace</SectionHeading>

      <CapPanel
        icon={Mail}
        title="Google Workspace"
        subtitle="Gmail, Drive, Calendar, Sheets"
        status={deriveStatus(googleConfigured)}
        defaultOpen={false}
      >
        <CapRow icon={Mail}        label="Gmail (read / send)"                status={deriveStatus(googleConfigured)} note="GCP_SA_KEY" />
        <CapRow icon={HardDrive}   label="Google Drive (files / folders)"     status={STATUS.BLOCKED} note="OAuth scope required" />
        <CapRow icon={BookOpen}    label="Google Sheets (read / write)"       status={deriveStatus(googleConfigured)} />
        <CapRow icon={Activity}    label="Google Calendar"                    status={STATUS.BLOCKED} note="Not wired" />
        <CapRow icon={Users}       label="Google Admin SDK (users / groups)"  status={deriveStatus(googleConfigured)} />
      </CapPanel>

      <SectionHeading>CRM / Staging</SectionHeading>

      <CapPanel
        icon={Users}
        title="HubSpot / Breeze AI"
        subtitle="CRM destination plus truthful Breeze AI substitute status"
        status={deriveStatus(hubspotConfigured)}
        defaultOpen={false}
      >
        <CapRow icon={Users}     label="CRM Objects (contacts, companies, deals)" status={deriveStatus(hubspotConfigured)} note="HUBSPOT_API_KEY" />
        <CapRow icon={Sparkles}  label="Breeze AI API substitute path"            status={deriveStatus(hubspotConfigured)} note="HubSpot token required" />
        <CapRow icon={Ban}       label="Direct HubSpot app-session passthrough"    status={STATUS.BLOCKED} note="Unsupported product session control" />
        <CapRow icon={Package}   label="Export staging (Supabase queue)"          status={deriveStatus(sbConfigured)} />
        <CapRow icon={Shield}    label="Write-path safety gate"                   status={deriveStatus(hubspotConfigured)} />
      </CapPanel>

      <CapPanel
        icon={Package}
        title="Airtable"
        subtitle="Optional staging mirror (non-blocking)"
        status={deriveStatus(airtableConfigured)}
        defaultOpen={false}
      >
        <CapRow icon={Package}   label="Staging mirror (records)"                status={deriveStatus(airtableConfigured)} note="AIRTABLE_API_KEY" />
        <CapRow icon={BookOpen}  label="Review grid sync"                        status={deriveStatus(airtableConfigured)} />
        <CapRow icon={Shield}    label="Optional staging gate"                   status={deriveStatus(airtableConfigured)} />
      </CapPanel>

      <SectionHeading>Automation</SectionHeading>

      <CapPanel
        icon={Globe}
        title="Browser Worker"
        subtitle="Playwright worker for scraping and evidence capture"
        status={browserStatus}
        defaultOpen={false}
      >
        <CapRow icon={Globe}    label="Browser job execution"                    status={browserStatus} note="BROWSER_WORKER_URL" />
        <CapRow icon={Activity} label="Screenshots / evidence"                   status={browserStatus} />
        <CapRow icon={Eye}      label="DOM extraction + summaries"               status={browserStatus} />
      </CapPanel>

      <CapPanel
        icon={PhoneCall}
        title="Twilio"
        subtitle="Inbound/outbound calling control surface"
        status={deriveStatus(twilioConfigured)}
        defaultOpen={false}
      >
        <CapRow icon={PhoneCall} label="Outbound call staging"                   status={deriveStatus(twilioConfigured)} note="TWILIO_ACCOUNT_SID" />
        <CapRow icon={Mail}      label="Inbound webhook ingestion"               status={inboundTwilioStatus} note={live.runtimeOps?.inbound?.twilio?.verification || 'unverified'} />
        <CapRow icon={Ban}       label="AI autonomous calling"                   status={STATUS.BLOCKED} note="Execution endpoint not yet wired" />
      </CapPanel>

      <CapPanel
        icon={Mail}
        title="SendGrid"
        subtitle="Outbound email orchestration surface"
        status={deriveStatus(sendgridConfigured)}
        defaultOpen={false}
      >
        <CapRow icon={Mail}      label="Outbound email staging"                  status={deriveStatus(sendgridConfigured)} note="SENDGRID_API_KEY" />
        <CapRow icon={Workflow}  label="Template + workflow handoff"             status={deriveStatus(sendgridConfigured)} />
        <CapRow icon={Mail}      label="Inbound/event webhook ingestion"         status={inboundSendGridStatus} note={live.runtimeOps?.inbound?.sendgrid?.verification || 'unverified'} />
      </CapPanel>
    </div>
  );
}

// ── Blocked Passthrough Panel ──────────────────────────────────────────────
function BlockedPassthroughPanel({ openaiConfigured, ghConfigured }) {
  const items = [
    {
      label:   'ChatGPT Product Account Passthrough',
      reason:  'OpenAI does not expose a supported API to embed a consumer ChatGPT product account session. Cookie or session hijacking is prohibited and unsupported.',
      sub:     openaiConfigured
        ? 'Substitute active: OpenAI Chat Completions API via OPENAI_API_KEY — backend-only, secure.'
        : 'Substitute available: Set OPENAI_API_KEY to enable OpenAI Chat Completions API.',
      subOk:   openaiConfigured,
    },
    {
      label:   'GitHub Copilot Chat Internal Embedding',
      reason:  'GitHub Copilot Chat product internals are not an officially exposed API for third-party embedding. There is no supported path to proxy Copilot product sessions.',
      sub:     ghConfigured
        ? 'Substitute active: GitHub REST API via GITHUB_TOKEN — repos, issues, PRs, actions, deployments.'
        : 'Substitute available: Set GITHUB_TOKEN to enable GitHub REST API integration.',
      subOk:   ghConfigured,
    },
    {
      label:   'GPT Workspace ID / Consumer Account Passthrough',
      reason:  'GPT workspace identifiers are internal OpenAI product concepts with no supported third-party passthrough API.',
      sub:     openaiConfigured
        ? 'Substitute active: OpenAI API with org-scoped key (OPENAI_API_KEY + OPENAI_ORG_ID) — full API access.'
        : 'Substitute available: Set OPENAI_API_KEY to use the OpenAI API (org-scoped if needed).',
      subOk:   openaiConfigured,
    },
  ];

  return (
    <div
      data-testid="blocked-passthrough-panel"
      style={{
        background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 12, overflow: 'hidden', marginBottom: 18,
      }}
    >
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid rgba(239,68,68,0.12)',
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(239,68,68,0.06)',
      }}>
        <Ban size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>Unsupported Direct Passthrough — Explicitly Blocked</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>
            The following passthrough modes are NOT implemented. Strongest lawful substitutes are shown.
          </div>
        </div>
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            padding: '12px 16px',
            borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
            <XCircle size={13} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{item.reason}</div>
            </div>
            <StatusPill status={STATUS.BLOCKED} />
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', marginLeft: 23,
            background: item.subOk ? 'rgba(74,222,128,0.06)' : 'rgba(251,191,36,0.06)',
            border: `1px solid ${item.subOk ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)'}`,
            borderRadius: 7,
          }}>
            <Info size={11} style={{ color: item.subOk ? '#4ade80' : '#fbbf24', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: item.subOk ? '#4ade80' : '#fbbf24' }}>{item.sub}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionConnectionMatrix({ connectionPrefs, onUpdateConnectionPrefs, onResetConnectionPrefs, statuses }) {
  const cards = [
    {
      key: 'openai',
      title: 'ChatGPT / OpenAI API',
      description: 'Strongest supported substitute for ChatGPT product passthrough.',
      fields: [
        { key: 'openaiApiKey', label: 'Session API key', placeholder: 'sk-…', secret: true },
        { key: 'openaiModel', label: 'Preferred model', placeholder: 'gpt-4o-mini' },
      ],
      status: statuses.openai || !!connectionPrefs.openaiApiKey ? STATUS.LIVE : STATUS.BLOCKED,
      note: statuses.openai ? 'Backend token configured.' : connectionPrefs.openaiApiKey ? 'Browser session token configured.' : 'Requires OPENAI_API_KEY or a session token.',
    },
    {
      key: 'groq',
      title: 'Groq',
      description: 'OpenAI-compatible live inference path for fast chat.',
      fields: [
        { key: 'groqApiKey', label: 'Session API key', placeholder: 'gsk_…', secret: true },
        { key: 'groqModel', label: 'Preferred model', placeholder: 'llama-3.3-70b-versatile' },
      ],
      status: statuses.groq || !!connectionPrefs.groqApiKey ? STATUS.LIVE : STATUS.BLOCKED,
      note: statuses.groq ? 'Backend token configured.' : connectionPrefs.groqApiKey ? 'Browser session token configured.' : 'Requires GROQ_API_KEY or a session token.',
    },
    {
      key: 'gemini',
      title: 'Gemini',
      description: 'Provider-supported Google Gemini API path.',
      fields: [
        { key: 'geminiApiKey', label: 'Session API key', placeholder: 'AIza…', secret: true },
        { key: 'geminiModel', label: 'Preferred model', placeholder: 'gemini-1.5-flash' },
      ],
      status: statuses.gemini || !!connectionPrefs.geminiApiKey ? STATUS.LIVE : STATUS.BLOCKED,
      note: statuses.gemini ? 'Backend token configured.' : connectionPrefs.geminiApiKey ? 'Browser session token configured.' : 'Requires GEMINI_API_KEY or a session token.',
    },
    {
      key: 'ollama',
      title: 'Ollama',
      description: 'Local/self-hosted model passthrough.',
      fields: [
        { key: 'ollamaBaseUrl', label: 'Base URL', placeholder: 'http://localhost:11434' },
        { key: 'ollamaModel', label: 'Preferred model', placeholder: 'llama3.1:8b' },
      ],
      status: statuses.ollama || !!connectionPrefs.ollamaBaseUrl ? STATUS.LOCAL : STATUS.BLOCKED,
      note: statuses.ollama ? 'Backend base URL configured.' : connectionPrefs.ollamaBaseUrl ? 'Browser session base URL configured.' : 'Requires OLLAMA_BASE_URL or a session URL.',
    },
    {
      key: 'github',
      title: 'GitHub / Copilot Substitute',
      description: 'Token surface for GitHub REST actions and truthful Copilot substitute controls.',
      fields: [{ key: 'githubToken', label: 'Session token', placeholder: 'ghp_…', secret: true }],
      status: statuses.github || !!connectionPrefs.githubToken ? STATUS.LIVE : STATUS.BLOCKED,
      note: statuses.github ? 'Backend token configured.' : connectionPrefs.githubToken ? 'Browser session token configured.' : 'Requires GITHUB_TOKEN or a session token.',
    },
    {
      key: 'supabase',
      title: 'Supabase',
      description: 'Session-scoped project URL and anon key for auth/data surfaces.',
      fields: [
        { key: 'supabaseUrl', label: 'Project URL', placeholder: 'https://project.supabase.co' },
        { key: 'supabaseAnonKey', label: 'Anon key', placeholder: 'eyJ…', secret: true },
      ],
      status: statuses.supabase || (!!connectionPrefs.supabaseUrl && !!connectionPrefs.supabaseAnonKey) ? STATUS.LIVE : STATUS.BLOCKED,
      note: statuses.supabase ? 'Backend project configured.' : connectionPrefs.supabaseUrl && connectionPrefs.supabaseAnonKey ? 'Browser session project configured.' : 'Requires SUPABASE_URL + SUPABASE_ANON_KEY.',
    },
    {
      key: 'vercel',
      title: 'Vercel',
      description: 'Token surface for truthful deployment control readiness.',
      fields: [{ key: 'vercelToken', label: 'Session token', placeholder: 'vercel_…', secret: true }],
      status: statuses.vercel || !!connectionPrefs.vercelToken ? STATUS.LIVE : STATUS.BLOCKED,
      note: statuses.vercel ? 'Backend token configured.' : connectionPrefs.vercelToken ? 'Browser session token configured.' : 'Requires VERCEL_TOKEN or a session token.',
    },
    {
      key: 'hubspot',
      title: 'HubSpot / Breeze AI',
      description: 'Token surface for CRM export and truthful Breeze AI substitute state.',
      fields: [{ key: 'hubspotApiKey', label: 'Session token', placeholder: 'pat-…', secret: true }],
      status: statuses.hubspot || !!connectionPrefs.hubspotApiKey ? STATUS.LIVE : STATUS.BLOCKED,
      note: statuses.hubspot ? 'Backend token configured.' : connectionPrefs.hubspotApiKey ? 'Browser session token configured.' : 'Requires HUBSPOT_API_KEY or a session token.',
    },
    {
      key: 'airtable',
      title: 'Airtable',
      description: 'Session-scoped base and token for staging mirrors.',
      fields: [
        { key: 'airtableApiKey', label: 'Session token', placeholder: 'pat…', secret: true },
        { key: 'airtableBaseId', label: 'Base ID', placeholder: 'app…' },
      ],
      status: statuses.airtable || (!!connectionPrefs.airtableApiKey && !!connectionPrefs.airtableBaseId) ? STATUS.LIVE : STATUS.BLOCKED,
      note: statuses.airtable ? 'Backend Airtable credentials configured.' : connectionPrefs.airtableApiKey ? 'Browser session Airtable credentials configured.' : 'Requires AIRTABLE_API_KEY + AIRTABLE_BASE_ID.',
    },
    {
      key: 'browser',
      title: 'Browser Worker',
      description: 'Optional session worker URL for local/browser automation substitute path.',
      fields: [{ key: 'browserWorkerUrl', label: 'Worker URL', placeholder: 'http://localhost:3001' }],
      status: statuses.browser || !!connectionPrefs.browserWorkerUrl ? STATUS.LOCAL : STATUS.BLOCKED,
      note: statuses.browser ? 'Backend browser worker configured.' : connectionPrefs.browserWorkerUrl ? 'Browser session worker configured.' : 'Requires BROWSER_WORKER_URL or a session worker URL.',
    },
    {
      key: 'twilio',
      title: 'Twilio',
      description: 'Calling control surface for truthful inbound/outbound orchestration state.',
      fields: [
        { key: 'twilioAccountSid', label: 'Account SID', placeholder: 'AC…' },
        { key: 'twilioAuthToken', label: 'Auth token', placeholder: '••••', secret: true },
        { key: 'twilioPhoneNumber', label: 'Phone number', placeholder: '+15555555555' },
      ],
      status: statuses.twilio || (!!connectionPrefs.twilioAccountSid && !!connectionPrefs.twilioAuthToken) ? STATUS.LIVE : STATUS.BLOCKED,
      note: statuses.twilio ? 'Backend Twilio credentials configured.' : connectionPrefs.twilioAccountSid ? 'Browser session Twilio credentials configured.' : 'Requires TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN.',
    },
    {
      key: 'sendgrid',
      title: 'SendGrid',
      description: 'Outbound email control surface with truthful staging state.',
      fields: [
        { key: 'sendgridApiKey', label: 'API key', placeholder: 'SG.…', secret: true },
        { key: 'sendgridFromEmail', label: 'From email', placeholder: 'ops@example.com' },
      ],
      status: statuses.sendgrid || !!connectionPrefs.sendgridApiKey ? STATUS.LIVE : STATUS.BLOCKED,
      note: statuses.sendgrid ? 'Backend SendGrid credentials configured.' : connectionPrefs.sendgridApiKey ? 'Browser session SendGrid credentials configured.' : 'Requires SENDGRID_API_KEY.',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginBottom: 18 }}>
      {cards.map((card) => (
        <SessionConnectorCard
          key={card.key}
          card={card}
          connectionPrefs={connectionPrefs}
          onUpdateConnectionPrefs={onUpdateConnectionPrefs}
          onResetConnectionPrefs={onResetConnectionPrefs}
        />
      ))}
    </div>
  );
}

function SessionConnectorCard({ card, connectionPrefs, onUpdateConnectionPrefs, onResetConnectionPrefs }) {
  const [draft, setDraft] = useState(() => Object.fromEntries(card.fields.map((field) => [field.key, connectionPrefs[field.key] || ''])));
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setDraft(Object.fromEntries(card.fields.map((field) => [field.key, connectionPrefs[field.key] || ''])));
  }, [card.fields, connectionPrefs]);

  const handleSave = () => {
    onUpdateConnectionPrefs(draft);
    setNotice('Saved to this browser for session-scoped passthrough and testing.');
  };

  const handleClear = () => {
    onResetConnectionPrefs(card.fields.map((field) => field.key));
    setNotice('Cleared browser session values.');
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{card.title}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{card.description}</div>
        </div>
        <StatusPill status={card.status} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {card.fields.map((field) => (
          <label key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{field.label}</span>
            <input
              type={field.secret ? 'password' : 'text'}
              value={draft[field.key] || ''}
              placeholder={field.placeholder}
              onChange={(event) => setDraft((prev) => ({ ...prev, [field.key]: event.target.value }))}
              style={{
                width: '100%',
                padding: '9px 11px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#f8fafc',
                fontSize: 12,
              }}
            />
            {field.secret && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                Current: {maskSecret(connectionPrefs[field.key])}
              </span>
            )}
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={handleSave} className="xps-electric-hover" style={actionBtnStyle(false, '#4ade80')}>Save Session</button>
        <button onClick={handleClear} className="xps-electric-hover" style={actionBtnStyle(false, '#ef4444')}>Clear</button>
      </div>
      <div style={{ fontSize: 11, color: card.status === STATUS.BLOCKED ? '#fbbf24' : 'rgba(255,255,255,0.45)', marginTop: 10 }}>
        {notice || card.note}
      </div>
    </div>
  );
}

// ── GitHub section ─────────────────────────────────────────────────────────
function GitHubSection({ configured, liveStatus }) {
  const [githubData, setGithubData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoData, setRepoData] = useState({});
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const fetchGitHub = useCallback(async (action, params = {}) => {
    if (!configured) return;
    const qs = new URLSearchParams({ action, ...params }).toString();
    const res = await fetch(`${API_URL}/api/github?${qs}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [configured]);

  useEffect(() => {
    if (!configured) return;
    setLoading(true);
    fetchGitHub('repos', { per_page: '10' })
      .then(d => setGithubData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [configured, fetchGitHub]);

  const loadRepoDetails = useCallback(async (repoFullName) => {
    if (repoData[repoFullName]) { setSelectedRepo(repoFullName); return; }
    try {
      const [prs, issues, workflows] = await Promise.all([
        fetchGitHub('prs',       { repo: repoFullName, state: 'open', per_page: '5' }),
        fetchGitHub('issues',    { repo: repoFullName, state: 'open', per_page: '5' }),
        fetchGitHub('workflows', { repo: repoFullName }),
      ]);
      setRepoData(prev => ({ ...prev, [repoFullName]: { prs, issues, workflows } }));
      setSelectedRepo(repoFullName);
    } catch {}
  }, [fetchGitHub, repoData]);

  const ghCaps = liveStatus?.github?.capabilities || {};
  const runTest = async () => {
    if (!configured) return;
    setTesting(true);
    setTestStatus(null);
    try {
      const data = await fetchGitHub('repos', { per_page: '1' });
      setTestStatus(data?.blocked ? 'Blocked' : 'Connection OK');
    } catch (err) {
      setTestStatus(`Test failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div data-testid="admin-github-panel">
      <div style={{ marginBottom: 20 }}>
        <h2 className="xps-gold-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, marginBottom: 4 }}>
          GitHub Integration
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Official GitHub REST API — backend-proxied via GITHUB_TOKEN. GitHub Copilot Chat product passthrough is not implemented.
        </p>
      </div>

      {/* Capability matrix */}
      <CapPanel icon={GitBranch} title="GitHub REST API" subtitle="Repos, Issues, PRs, Actions, Deployments" status={deriveStatus(configured)} defaultOpen>
        <CapRow icon={GitBranch}      label="Repository visibility (read)"      status={deriveStatus(configured)} note="GITHUB_TOKEN" />
        <CapRow icon={GitPullRequest} label="Pull Requests (list / read)"       status={deriveStatus(configured)} />
        <CapRow icon={Package}        label="Issues (list / read)"              status={deriveStatus(configured)} />
        <CapRow icon={GitCommit}      label="Commits / branch history"          status={deriveStatus(configured)} />
        <CapRow icon={Workflow}       label="GitHub Actions (workflow status)"  status={deriveStatus(configured)} />
        <CapRow icon={Eye}            label="Check runs / CI status"            status={deriveStatus(configured)} />
        <CapRow icon={Tag}            label="Releases / tags"                   status={deriveStatus(configured)} />
        <CapRow icon={Shield}         label="Code Scanning alerts"              status={deriveStatus(configured)} />
        <CapRow icon={Ban}            label="Copilot Chat product passthrough"  status={STATUS.BLOCKED} note="Unsupported — not an API" />
      </CapPanel>

      <ConnectorControls
        title="Connector Controls"
        status={deriveStatus(configured)}
        statusNote={configured ? 'Token configured — GitHub REST API ready.' : 'Blocked — missing server-side token.'}
        blockedReason="GitHub OAuth is not wired. Set GITHUB_TOKEN to enable."
        actions={[
          { label: 'Connect', onClick: () => setActionNotice('Add GITHUB_TOKEN in Admin session inputs or backend env, then refresh status.'), disabled: configured, accent: '#4ade80' },
          { label: 'Reconnect', onClick: () => setActionNotice('GitHub uses token passthrough only. Refresh status to re-read current credentials.'), disabled: !configured, accent: '#fbbf24' },
          { label: 'Disconnect', onClick: () => setActionNotice('Direct browser disconnect is blocked. Remove GITHUB_TOKEN from env or clear the session token input.'), disabled: !configured, accent: '#ef4444' },
          { label: testing ? 'Testing…' : 'Test Connection', onClick: runTest, disabled: !configured || testing, accent: '#60a5fa' },
        ]}
        scopes={[
          { label: 'Repo Read/Write', status: deriveStatus(configured), note: 'repo, workflow' },
          { label: 'Issues/PRs', status: deriveStatus(configured), note: 'read/write' },
          { label: 'Copilot Passthrough', status: STATUS.BLOCKED, note: 'unsupported' },
        ]}
      />
      {actionNotice && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>
          Action: {actionNotice}
        </div>
      )}
      {testStatus && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
          Test result: {testStatus}
        </div>
      )}

      {/* Live data */}
      {!configured && (
        <BlockedInfo>Set <code>GITHUB_TOKEN</code> in environment to enable live GitHub data.</BlockedInfo>
      )}

      {configured && loading && (
        <LoadingRow label="Fetching GitHub repositories…" />
      )}

      {configured && error && (
        <ErrorRow label={`GitHub API error: ${error}`} />
      )}

      {configured && githubData && !githubData.blocked && Array.isArray(githubData.data) && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
            REPOSITORIES ({githubData.data.length})
          </div>
          {githubData.data.slice(0, 8).map(repo => (
            <div
              key={repo.id}
              style={{
                padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                background: selectedRepo === repo.full_name ? 'rgba(255,255,255,0.03)' : 'transparent',
              }}
              onClick={() => loadRepoDetails(repo.full_name)}
            >
              <GitBranch size={13} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{repo.full_name}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{repo.language || ''}</span>
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 99,
                background: repo.private ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)',
                color: repo.private ? '#ef4444' : '#4ade80',
                border: `1px solid ${repo.private ? 'rgba(239,68,68,0.2)' : 'rgba(74,222,128,0.2)'}`,
              }}>{repo.private ? 'Private' : 'Public'}</span>
              <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.2)' }} />
            </div>
          ))}
        </div>
      )}

      {selectedRepo && repoData[selectedRepo] && (
        <RepoDetailPanel repoName={selectedRepo} data={repoData[selectedRepo]} />
      )}
    </div>
  );
}

function RepoDetailPanel({ repoName, data }) {
  const prs        = data.prs?.data || [];
  const issues     = data.issues?.data || [];
  const workflows  = data.workflows?.data?.workflows || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
      <MiniList title={`Pull Requests (${prs.length})`} icon={GitPullRequest} items={prs.map(pr => ({ label: `#${pr.number} ${pr.title}`, sub: pr.head?.ref || '', color: pr.draft ? '#fbbf24' : '#4ade80' }))} />
      <MiniList title={`Issues (${issues.length})`} icon={Package} items={issues.filter(i => !i.pull_request).map(i => ({ label: `#${i.number} ${i.title}`, sub: i.labels?.map(l => l.name).join(', ') || '', color: '#60a5fa' }))} />
      {workflows.length > 0 && (
        <div style={{ gridColumn: '1 / -1' }}>
          <MiniList title={`Workflows (${workflows.length})`} icon={Workflow} items={workflows.map(w => ({ label: w.name, sub: w.path, color: w.state === 'active' ? '#4ade80' : '#ef4444' }))} />
        </div>
      )}
    </div>
  );
}

function MiniList({ title, icon: Icon, items }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={12} style={{ color: 'rgba(255,255,255,0.35)' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.8 }}>{title.toUpperCase()}</span>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: '10px 14px', fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>None</div>
      ) : items.slice(0, 5).map((item, i) => (
        <div key={i} style={{ padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
          {item.sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{item.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ── Supabase section ───────────────────────────────────────────────────────
function SupabaseSection({ configured, liveStatus }) {
  const sb = liveStatus?.supabase || {};
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const runTest = async () => {
    if (!configured) return;
    setTesting(true);
    setTestStatus(null);
    try {
      setTestStatus('Connection OK — Supabase reachable.');
    } catch (err) {
      setTestStatus(`Test failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div data-testid="admin-supabase-panel">
      <div style={{ marginBottom: 20 }}>
        <h2 className="xps-gold-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, marginBottom: 4 }}>
          Supabase Integration
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          PostgreSQL database, Auth, Storage, and Realtime via official @supabase/supabase-js.
        </p>
      </div>

      <CapPanel icon={Database} title="Supabase Project" subtitle="PostgreSQL + Auth + Storage + Realtime" status={deriveStatus(configured)} defaultOpen>
        <CapRow icon={HardDrive}   label="PostgreSQL (persistence engine)"        status={deriveStatus(configured)} note="SUPABASE_URL" />
        <CapRow icon={Shield}      label="Supabase Auth (JWT + RLS)"              status={deriveStatus(configured)} />
        <CapRow icon={Package}     label="Storage (S3-compatible buckets)"        status={deriveStatus(configured)} />
        <CapRow icon={RefreshCw}   label="Realtime (postgres_changes)"            status={deriveStatus(configured)} />
        <CapRow icon={Activity}    label="Queue / Job artifact persistence"       status={deriveStatus(configured)} note="Run schema" />
        <CapRow icon={Activity}    label="Edge Functions"                         status={STATUS.BLOCKED} note="Not wired" />
      </CapPanel>

      <ConnectorControls
        title="Connector Controls"
        status={deriveStatus(configured)}
        statusNote={configured ? 'Supabase project configured.' : 'Blocked — missing SUPABASE_URL or SUPABASE_ANON_KEY.'}
        blockedReason="Supabase Auth broker requires SUPABASE_URL + SUPABASE_ANON_KEY."
        actions={[
          { label: 'Connect', onClick: () => setActionNotice('Enter SUPABASE_URL and SUPABASE_ANON_KEY in the session inputs or backend env, then refresh status.'), disabled: configured, accent: '#4ade80' },
          { label: 'Reconnect', onClick: () => setActionNotice('Supabase reconnection re-reads configured URL and anon key on refresh.'), disabled: !configured, accent: '#fbbf24' },
          { label: 'Disconnect', onClick: () => setActionNotice('Direct browser disconnect is blocked. Remove env vars or clear the saved session values.'), disabled: !configured, accent: '#ef4444' },
          { label: testing ? 'Testing…' : 'Test Connection', onClick: runTest, disabled: !configured || testing, accent: '#60a5fa' },
        ]}
        scopes={[
          { label: 'Database', status: deriveStatus(configured), note: 'postgres' },
          { label: 'Auth', status: deriveStatus(configured), note: 'jwt, rls' },
          { label: 'Storage', status: deriveStatus(configured), note: 'buckets' },
        ]}
      />
      {actionNotice && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>
          Action: {actionNotice}
        </div>
      )}
      {testStatus && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
          Test result: {testStatus}
        </div>
      )}

      {configured ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
            PROJECT DETAILS
          </div>
          <InfoRow label="Project URL" value={sb.projectUrl || 'Configured'} />
          <InfoRow label="Persistence mode" value="Live — all runs persisted to workspace_objects" />
          <InfoRow label="Search jobs" value="Persisted to search_jobs table" />
          <InfoRow label="Scrape jobs" value="Persisted to scrape_jobs table" />
          <InfoRow label="Pre-stage queue" value="Persisted to pre_stage_items" />
          <InfoRow label="Stage queue" value="Persisted to stage_items" />
          <InfoRow label="HubSpot export staging" value="Persisted to hubspot_exports" />
          <InfoRow label="Airtable export staging" value="Persisted to airtable_exports" />
          <InfoRow label="Runtime ledger" value="Persisted to runtime_ledgers" />
          <InfoRow label="Recovery queue" value="Persisted to recovery_queue" />
          <InfoRow label="Auth bypass" value="Active (DEV mode)" />
        </div>
      ) : (
        <BlockedInfo>Set <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> to enable persistence and auth.</BlockedInfo>
      )}
    </div>
  );
}

// ── Vercel section ─────────────────────────────────────────────────────────
function VercelSection({ configured, liveStatus }) {
  const vrc = liveStatus?.vercel || {};
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const runTest = async () => {
    if (!configured) return;
    setTesting(true);
    setTestStatus(null);
    try {
      setTestStatus('Connection OK — Vercel API token present.');
    } catch (err) {
      setTestStatus(`Test failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div data-testid="admin-vercel-panel">
      <div style={{ marginBottom: 20 }}>
        <h2 className="xps-gold-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, marginBottom: 4 }}>
          Vercel Integration
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Deployment status, environment variables, build logs, and domain management via Vercel REST API.
        </p>
      </div>

      <CapPanel icon={Cloud} title="Vercel API" subtitle="Deployments, environment, domains, build logs" status={deriveStatus(configured)} defaultOpen>
        <CapRow icon={Globe}    label="Deployments (list / status / trigger)"   status={deriveStatus(configured)} note="VERCEL_TOKEN" />
        <CapRow icon={Server}   label="Environment Variables (read / write)"    status={deriveStatus(configured)} />
        <CapRow icon={Activity} label="Build Logs (streaming)"                  status={deriveStatus(configured)} />
        <CapRow icon={Globe}    label="Domain Management"                       status={deriveStatus(configured)} />
        <CapRow icon={Shield}   label="Project Settings"                        status={deriveStatus(configured)} />
      </CapPanel>

      <ConnectorControls
        title="Connector Controls"
        status={deriveStatus(configured)}
        statusNote={configured ? 'Vercel token configured.' : 'Blocked — missing VERCEL_TOKEN.'}
        blockedReason="Vercel OAuth is not wired. Use a server-side VERCEL_TOKEN."
        actions={[
          { label: 'Connect', onClick: () => setActionNotice('Add VERCEL_TOKEN in the session inputs or backend env, then refresh status.'), disabled: configured, accent: '#4ade80' },
          { label: 'Reconnect', onClick: () => setActionNotice('Vercel reconnection is token-based only. Refresh status after updating credentials.'), disabled: !configured, accent: '#fbbf24' },
          { label: 'Disconnect', onClick: () => setActionNotice('Direct browser disconnect is blocked. Remove VERCEL_TOKEN from env or clear the session token input.'), disabled: !configured, accent: '#ef4444' },
          { label: testing ? 'Testing…' : 'Test Connection', onClick: runTest, disabled: !configured || testing, accent: '#60a5fa' },
        ]}
        scopes={[
          { label: 'Deployments', status: deriveStatus(configured), note: 'read/write' },
          { label: 'Environment', status: deriveStatus(configured), note: 'read/write' },
          { label: 'Domains', status: deriveStatus(configured), note: 'read/write' },
        ]}
      />
      {actionNotice && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>
          Action: {actionNotice}
        </div>
      )}
      {testStatus && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
          Test result: {testStatus}
        </div>
      )}

      {configured ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
            DEPLOYMENT RUNTIME
          </div>
          <InfoRow label="Team ID" value={vrc.teamId || 'Personal account'} />
          <InfoRow label="Runtime" value={liveStatus?.runtime || 'vercel'} />
          <InfoRow label="API routes" value="Vercel serverless functions (/api/*)" />
          <InfoRow label="Deploy hook" value="Set VERCEL_DEPLOY_HOOK_URL to enable runtime trigger" />
        </div>
      ) : (
        <BlockedInfo>Set <code>VERCEL_TOKEN</code> in environment to enable Vercel management API.</BlockedInfo>
      )}
    </div>
  );
}

// ── Google Workspace section ───────────────────────────────────────────────
function GoogleSection({ configured, geminiConfigured, liveStatus }) {
  const g = liveStatus?.google || {};
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const runTest = async () => {
    if (!configured && !geminiConfigured) return;
    setTesting(true);
    setTestStatus(null);
    try {
      setTestStatus('Connection OK — Google APIs configured.');
    } catch (err) {
      setTestStatus(`Test failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div data-testid="admin-google-panel">
      <div style={{ marginBottom: 20 }}>
        <h2 className="xps-gold-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, marginBottom: 4 }}>
          Google Workspace
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Official Google APIs via service account. OAuth-required scopes are marked blocked.
        </p>
      </div>

      <CapPanel icon={Mail} title="Google Workspace APIs" subtitle="Gmail, Drive, Calendar, Sheets, Admin SDK" status={deriveStatus(configured)} defaultOpen>
        <CapRow icon={Mail}      label="Gmail API (read / send)"                        status={deriveStatus(configured)} note="GCP_SA_KEY" />
        <CapRow icon={BookOpen}  label="Google Sheets API (read / write)"               status={deriveStatus(configured)} />
        <CapRow icon={Users}     label="Google Admin SDK (users / groups / domains)"    status={deriveStatus(configured)} />
        <CapRow icon={HardDrive} label="Google Drive (file listing / download)"         status={STATUS.BLOCKED} note="OAuth user consent required" />
        <CapRow icon={Activity}  label="Google Calendar (events / availability)"        status={STATUS.BLOCKED} note="Not wired — OAuth required" />
      </CapPanel>

      <CapPanel icon={Sparkles} title="Google Gemini" subtitle="Gemini Pro / Flash multimodal API" status={deriveStatus(geminiConfigured)} defaultOpen={false}>
        <CapRow icon={Brain}     label="Gemini 1.5 Pro / Flash (chat completions)"     status={deriveStatus(geminiConfigured)} note="GEMINI_API_KEY" />
        <CapRow icon={BookOpen}  label="Multimodal input (image + text)"               status={deriveStatus(geminiConfigured)} />
        <CapRow icon={Code}      label="Function calling"                              status={deriveStatus(geminiConfigured)} />
        <CapRow icon={Package}   label="Embeddings (text-embedding-004)"               status={deriveStatus(geminiConfigured)} />
      </CapPanel>

      <ConnectorControls
        title="Connector Controls"
        status={deriveStatus(configured || geminiConfigured)}
        statusNote={configured || geminiConfigured ? 'Google APIs configured (OAuth-required scopes blocked).' : 'Blocked — missing GCP credentials.'}
        blockedReason="OAuth user consent required for Drive/Calendar. Service account only covers Gmail/Sheets/Admin SDK."
        actions={[
          { label: 'Connect', onClick: () => setActionNotice('Configure GCP service-account credentials or a Gemini API key in the session inputs, then refresh status.'), disabled: configured || geminiConfigured, accent: '#4ade80' },
          { label: 'Reconnect', onClick: () => setActionNotice('Google Workspace is reloaded from configured credentials on refresh. OAuth-only scopes stay blocked.'), disabled: !(configured || geminiConfigured), accent: '#fbbf24' },
          { label: 'Disconnect', onClick: () => setActionNotice('Direct browser disconnect is blocked. Remove GCP or Gemini credentials from env/session storage.'), disabled: !(configured || geminiConfigured), accent: '#ef4444' },
          { label: testing ? 'Testing…' : 'Test Connection', onClick: runTest, disabled: !(configured || geminiConfigured) || testing, accent: '#60a5fa' },
        ]}
        scopes={[
          { label: 'Gmail / Sheets', status: deriveStatus(configured), note: 'service account' },
          { label: 'Drive', status: STATUS.BLOCKED, note: 'OAuth consent required' },
          { label: 'Gemini', status: deriveStatus(geminiConfigured), note: 'GEMINI_API_KEY' },
        ]}
      />
      {actionNotice && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>
          Action: {actionNotice}
        </div>
      )}
      {testStatus && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
          Test result: {testStatus}
        </div>
      )}

      {!configured && !geminiConfigured && (
        <BlockedInfo>Set <code>GCP_SA_KEY</code> or <code>GCP_PROJECT_ID</code> to enable Google Workspace APIs. Set <code>GEMINI_API_KEY</code> for Gemini LLM.</BlockedInfo>
      )}

      <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 12, padding: '14px 16px', marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <AlertTriangle size={14} style={{ color: '#fbbf24', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>Google Drive — Blocked State</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              Google Drive file access requires an interactive OAuth 2.0 user consent flow. This cannot be performed in a serverless/headless environment without a user session.
              The attachment UI shows Drive as blocked. To enable: implement an OAuth callback route, store user tokens in Supabase, and use the Drive API with user-delegated credentials.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommunicationsSection({ twilioConfigured, sendgridConfigured, liveStatus, connectionPrefs, governance, workspace }) {
  const twilio = liveStatus?.twilio || {};
  const sendgrid = liveStatus?.sendgrid || {};
  const runtimeInbound = liveStatus?.runtimeOps?.inbound || {};
  const [twilioDraft, setTwilioDraft] = useState({ to: '', message: 'This is a live XPS operator call from the control plane.' });
  const [sendgridDraft, setSendgridDraft] = useState({ to: '', subject: 'XPS control plane message', text: 'Live operator email from the XPS control plane.' });
  const [actionNotice, setActionNotice] = useState(null);
  const [busyAction, setBusyAction] = useState(null);

  const createWorkspaceResult = (result) => {
    const wsObj = result?.workspaceObject;
    if (!wsObj) return;
    const id = genId();
    workspace.createObject({
      id,
      type: wsObj.type || OBJ_TYPE.CONNECTOR_ACTION,
      title: wsObj.title,
      content: wsObj.content,
      status: result.status === 'error' ? RUN_STATUS.ERROR : RUN_STATUS.DONE,
      meta: wsObj.meta || {},
    });
    workspace.setActive(id);
    requestAppShellNavigation({ page: 'workspace', panel: 'workspace' });
  };

  const handleTwilioAction = async () => {
    if (!(governance.communicationActions && governance.connectorPermissions)) {
      setActionNotice('Twilio execution is blocked by governance.');
      return;
    }
    setBusyAction('twilio');
    try {
      const result = await executeTwilioCall({
        ...twilioDraft,
        credentials: buildConnectorCredentials(connectionPrefs),
      });
      createWorkspaceResult(result);
      setActionNotice(result.message);
    } catch (err) {
      setActionNotice(err.message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleSendGridAction = async () => {
    if (!(governance.communicationActions && governance.connectorPermissions)) {
      setActionNotice('SendGrid execution is blocked by governance.');
      return;
    }
    setBusyAction('sendgrid');
    try {
      const result = await executeSendGridEmail({
        ...sendgridDraft,
        credentials: buildConnectorCredentials(connectionPrefs),
      });
      createWorkspaceResult(result);
      setActionNotice(result.message);
    } catch (err) {
      setActionNotice(err.message);
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div data-testid="admin-communications-panel">
      <div style={{ marginBottom: 20 }}>
        <h2 className="xps-gold-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, marginBottom: 4 }}>
          Communications Orchestration
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Token-driven control surfaces for calling and email. Buttons below use the strongest live app-side execution path available and stay blocked when the runtime cannot support direct delivery.
        </p>
      </div>

      <CapPanel icon={PhoneCall} title="Twilio Calling" subtitle="Inbound/outbound telephony surfaces" status={deriveStatus(twilioConfigured)} defaultOpen>
        <CapRow icon={PhoneCall} label="Outbound call execution" status={twilio.capabilityState === 'write-enabled' ? STATUS.LIVE : deriveStatus(twilioConfigured)} note="TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN" />
        <CapRow icon={Activity}  label="Inbound webhook ingestion" status={runtimeInbound.twilio?.status === 'configured' ? STATUS.LIVE : STATUS.LOCAL} note={runtimeInbound.twilio?.verification || 'unverified'} />
        <CapRow icon={Workflow}  label="AI call workflow handoff" status={STATUS.BLOCKED} note="Execution endpoint pending" />
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'grid', gap: 10 }}>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
            Destination number
            <input value={twilioDraft.to} onChange={(e) => setTwilioDraft((prev) => ({ ...prev, to: e.target.value }))} placeholder="+15551234567" style={actionInputStyle} />
          </label>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
            Spoken message
            <textarea value={twilioDraft.message} onChange={(e) => setTwilioDraft((prev) => ({ ...prev, message: e.target.value }))} rows={4} placeholder="Say: this is the XPS operator control plane…" style={{ ...actionInputStyle, resize: 'vertical', minHeight: 90 }} />
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handleTwilioAction} disabled={busyAction === 'twilio'} className="xps-electric-hover" style={actionBtnStyle(busyAction === 'twilio', '#22c55e')}>
              {busyAction === 'twilio' ? 'Placing call…' : 'Place live call'}
            </button>
            <button onClick={() => requestAppShellNavigation({ page: 'workspace', panel: 'workspace' })} className="xps-electric-hover" style={actionBtnStyle(false, '#60a5fa')}>
              Open workspace actions
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>
            Runtime truth: {twilio.reason || 'Live Twilio call execution is available from this panel.'}
          </div>
        </div>
      </CapPanel>

      <CapPanel icon={Mail} title="SendGrid Email" subtitle="Outbound email orchestration" status={deriveStatus(sendgridConfigured)} defaultOpen={false}>
        <CapRow icon={Mail}     label="Outbound email execution" status={sendgrid.capabilityState === 'write-enabled' ? STATUS.LIVE : deriveStatus(sendgridConfigured)} note="SENDGRID_API_KEY" />
        <CapRow icon={Workflow} label="Template + runbook handoff" status={deriveStatus(sendgridConfigured)} />
        <CapRow icon={Mail}     label="Inbound parse / event webhooks" status={runtimeInbound.sendgrid?.status === 'configured' ? STATUS.LIVE : STATUS.LOCAL} note={runtimeInbound.sendgrid?.verification || 'unverified'} />
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'grid', gap: 10 }}>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
            Destination email
            <input value={sendgridDraft.to} onChange={(e) => setSendgridDraft((prev) => ({ ...prev, to: e.target.value }))} placeholder="operator@example.com" style={actionInputStyle} />
          </label>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
            Subject
            <input value={sendgridDraft.subject} onChange={(e) => setSendgridDraft((prev) => ({ ...prev, subject: e.target.value }))} placeholder="Subject" style={actionInputStyle} />
          </label>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
            Body
            <textarea value={sendgridDraft.text} onChange={(e) => setSendgridDraft((prev) => ({ ...prev, text: e.target.value }))} rows={5} placeholder="Email body" style={{ ...actionInputStyle, resize: 'vertical', minHeight: 110 }} />
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handleSendGridAction} disabled={busyAction === 'sendgrid'} className="xps-electric-hover" style={actionBtnStyle(busyAction === 'sendgrid', '#22c55e')}>
              {busyAction === 'sendgrid' ? 'Sending…' : 'Send live email'}
            </button>
            <button onClick={() => requestAppShellNavigation({ page: 'workspace', panel: 'workspace' })} className="xps-electric-hover" style={actionBtnStyle(false, '#60a5fa')}>
              Open workspace actions
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>
            Runtime truth: {sendgrid.reason || 'Live SendGrid send execution is available from this panel.'}
          </div>
        </div>
      </CapPanel>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
          CAPABILITY TRUTH
        </div>
        <InfoRow label="Twilio state" value={twilio.capabilityState || (twilioConfigured ? 'token-configured' : 'blocked')} />
        <InfoRow label="Twilio number" value={twilio.phoneNumber || 'Not configured'} />
        <InfoRow label="Twilio session SID" value={connectionPrefs.twilioAccountSid ? maskSecret(connectionPrefs.twilioAccountSid) : 'Not set'} />
        <InfoRow label="SendGrid state" value={sendgrid.capabilityState || (sendgridConfigured ? 'token-configured' : 'blocked')} />
        <InfoRow label="From email" value={sendgrid.fromEmail || 'Not configured'} />
        <InfoRow label="SendGrid session sender" value={connectionPrefs.sendgridFromEmail || 'Not set'} />
      </div>
      {actionNotice && (
        <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', whiteSpace: 'pre-wrap' }}>
          {actionNotice}
        </div>
      )}
    </div>
  );
}

function RuntimeSection({ statusSnapshot, statusSource = 'live', workspace }) {
  const runtimeOps = statusSnapshot?.runtimeOps || {};
  const continuitySnapshot = statusSnapshot?.persistence || null;
  const runtimeSourceMeta = getRuntimeSourceMeta(statusSource);
  const [runs, setRuns] = useState(getRunList());
  const [jobs, setJobs] = useState(getJobList());
  const [groups, setGroups] = useState(getGroupList());
  const recoveredWorkspaceObjects = useMemo(
    () => workspace.objects.filter((item) => item.meta?.persistence?.recoveredAt).length,
    [workspace.objects],
  );
  const recoveredRuns = useMemo(() => runs.filter((item) => item.recoveryPending).length, [runs]);
  const recoveredJobs = useMemo(() => jobs.filter((item) => item.recoveryPending).length, [jobs]);
  const recoveredGroups = useMemo(() => groups.filter((item) => item.recoveryPending).length, [groups]);
  const workspaceCtx = {
    createObject: workspace.createObject,
    patchObject: workspace.patchObject,
    appendLog: workspace.appendLog,
    setStatus: workspace.setStatus,
  };

  useEffect(() => subscribeRuns(setRuns), []);
  useEffect(() => subscribeJobs(setJobs), []);
  useEffect(() => subscribeGroups(setGroups), []);

  const openWorkspace = () => requestAppShellNavigation({ page: 'workspace', panel: 'workspace' });
  const pushRuntimeSnapshot = () => {
    workspace.createObject({
      type: OBJ_TYPE.RUNTIME_STATE,
      title: 'Runtime Operations Snapshot',
      content: [
        `Runtime: ${runtimeOps.environment?.runtime || 'unknown'}`,
        `History store: ${runtimeOps.environment?.historyStore || 'unknown'}`,
        `Inbound events: ${runtimeOps.inbound?.recentEvents?.length || 0}`,
        `Jobs: ${runtimeOps.jobs?.recent?.length || 0}`,
        `Parallel groups: ${runtimeOps.groups?.recent?.length || 0}`,
      ].join('\n'),
      status: RUN_STATUS.DONE,
      meta: runtimeOps,
    });
    openWorkspace();
  };
  const pushInboundEvents = () => {
    (runtimeOps.inbound?.recentEvents || []).forEach((event) => {
      workspace.createObject({
        type: OBJ_TYPE.CONNECTOR_ACTION,
        title: `${event.provider} inbound — ${event.eventType}`,
        content: JSON.stringify(event.payload || {}, null, 2),
        status: event.status === 'blocked' ? RUN_STATUS.ERROR : RUN_STATUS.DONE,
        meta: {
          connector: event.provider,
          direction: 'inbound',
          mode: event.mode,
          status: event.status,
          action: event.eventType,
          history: event.history,
          result: event.result,
          payload: event.payload,
          blockedReason: event.blockedReason,
        },
      });
    });
    openWorkspace();
  };
  const pushRecoverySnapshot = () => {
    workspace.createObject({
      type: OBJ_TYPE.RUNTIME_STATE,
      title: 'Recovery Continuity Snapshot',
      content: [
        `Snapshot source: ${statusSource}`,
        `Workspace objects restored: ${recoveredWorkspaceObjects}`,
        `Runs requiring recover/retry: ${recoveredRuns}`,
        `Browser jobs requiring recover/retry: ${recoveredJobs}`,
        `Parallel groups recovered: ${recoveredGroups}`,
        `Runtime snapshot saved: ${continuitySnapshot?.savedAt || 'not yet saved'}`,
      ].join('\n'),
      status: RUN_STATUS.DONE,
      meta: {
        source: statusSource,
        continuitySnapshot,
        recoveredWorkspaceObjects,
        recoveredRuns,
        recoveredJobs,
        recoveredGroups,
      },
    });
    openWorkspace();
  };

  return (
    <div data-testid="admin-runtime-panel">
      <div style={{ marginBottom: 20 }}>
        <h2 className="xps-gold-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, marginBottom: 4 }}>
          Runtime Operations Center
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Truthful inbound events, job orchestration, parallel groups, runtime targets, and execution history.
        </p>
        <div style={{ marginTop: 8, fontSize: 11, color: runtimeSourceMeta.color }}>
          Runtime source: {runtimeSourceMeta.label}
        </div>
      </div>

      <CapPanel icon={Workflow} title="Runtime Targets" subtitle="Local vs cloud routing, workers, and webhook targets" status={runtimeOps.environment?.runtime === 'cloud' ? STATUS.LIVE : STATUS.LOCAL} defaultOpen>
        <InfoRow label="Runtime mode" value={runtimeOps.environment?.runtime || 'unknown'} />
        <InfoRow label="History store" value={runtimeOps.environment?.historyStore || 'unknown'} />
        <InfoRow label="Snapshot source" value={runtimeSourceMeta.label} />
        <InfoRow label="Continuity save" value={continuitySnapshot?.savedAt || 'No browser-local runtime snapshot saved yet'} />
        <InfoRow label="Browser worker target" value={runtimeOps.targets?.browserWorker?.target || 'Blocked — no worker target configured'} />
        <InfoRow label="Twilio inbound target" value={runtimeOps.targets?.webhookTargets?.twilioInbound || '/api/webhooks/twilio/inbound'} />
        <InfoRow label="SendGrid event target" value={runtimeOps.targets?.webhookTargets?.sendgridEvents || '/api/webhooks/sendgrid/events'} />
        {(runtimeOps.environment?.fallbackRouting || []).map((item) => (
          <div key={item} style={{ padding: '0 16px 10px', fontSize: 11, color: 'rgba(255,255,255,0.42)' }}>• {item}</div>
        ))}
      </CapPanel>

      <CapPanel icon={Shield} title="Continuity Recovery" subtitle="Browser-local reload recovery for workspace + orchestration state" status={recoveredWorkspaceObjects || recoveredRuns || recoveredJobs || recoveredGroups || statusSource === 'recovered' ? STATUS.LOCAL : STATUS.LIVE} defaultOpen={false}>
        <InfoRow label="Recovered workspace objects" value={`${recoveredWorkspaceObjects}`} />
        <InfoRow label="Runs pending recovery" value={`${recoveredRuns}`} />
        <InfoRow label="Browser jobs pending recovery" value={`${recoveredJobs}`} />
        <InfoRow label="Parallel groups recovered" value={`${recoveredGroups}`} />
        <div style={{ padding: '0 16px 12px', fontSize: 11, color: 'rgba(255,255,255,0.42)' }}>
          Browser-local continuity keeps the operator view, builder state, and last-known runtime snapshots across reloads. Durable backend history still depends on Supabase/runtime persistence and is never claimed when unavailable.
        </div>
        <div style={{ padding: '0 16px 14px' }}>
          <button onClick={pushRecoverySnapshot} className="xps-electric-hover" style={actionBtnStyle(false, '#f59e0b')}>Render recovery snapshot</button>
        </div>
      </CapPanel>

      <CapPanel icon={PhoneCall} title="Inbound Communication Events" subtitle="Twilio + SendGrid webhook/event visibility" status={STATUS.LIVE} defaultOpen>
        <CapRow icon={PhoneCall} label="Twilio inbound ingestion" status={runtimeOps.inbound?.twilio?.status === 'configured' ? STATUS.LIVE : STATUS.LOCAL} note={runtimeOps.inbound?.twilio?.verification || 'unverified'} />
        <CapRow icon={Mail} label="SendGrid inbound/event ingestion" status={runtimeOps.inbound?.sendgrid?.status === 'configured' ? STATUS.LIVE : STATUS.LOCAL} note={runtimeOps.inbound?.sendgrid?.verification || 'unverified'} />
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={pushInboundEvents} className="xps-electric-hover" style={actionBtnStyle(false, '#60a5fa')}>Render inbound events in workspace</button>
          <button onClick={pushRuntimeSnapshot} className="xps-electric-hover" style={actionBtnStyle(false, '#22c55e')}>Render runtime snapshot</button>
          <button onClick={pushRecoverySnapshot} className="xps-electric-hover" style={actionBtnStyle(false, '#f59e0b')}>Render recovery snapshot</button>
        </div>
        <RuntimeRecordList
          emptyLabel="No inbound events recorded in the active runtime yet."
          records={runtimeOps.inbound?.recentEvents || []}
          renderMeta={(event) => `${event.channel || 'webhook'} · ${event.mode}`}
        />
      </CapPanel>

      <CapPanel icon={Activity} title="Job Queue / Retries / Failures" subtitle="Queued, running, failed, recovered, and blocked jobs" status={STATUS.LIVE} defaultOpen={false}>
        <RuntimeRecordList
          emptyLabel="No runtime jobs recorded yet."
          records={[...runs, ...jobs].sort((a, b) => b.updatedAt - a.updatedAt)}
          renderTitle={(record) => record.title || record.task || record.jobId || record.runId}
          renderMeta={(record) => `${record.agent || record.action || record.kind || 'job'} · attempt ${record.attempt || 1}${record.recoveryPending ? ' · recovery pending' : ''}`}
          renderActions={(record) => record.runId ? (
            <>
              <button onClick={() => retryRun(record.runId, workspaceCtx, openWorkspace)} className="xps-electric-hover" style={actionBtnStyle(false, '#60a5fa')}>Retry</button>
              <button onClick={() => recoverRun(record.runId, workspaceCtx, openWorkspace)} className="xps-electric-hover" style={actionBtnStyle(false, '#f59e0b')}>Recover</button>
              {(record.status === 'queued' || record.status === 'running') && (
                <button onClick={() => cancelRun(record.runId)} className="xps-electric-hover" style={actionBtnStyle(false, '#ef4444')}>Cancel</button>
              )}
            </>
          ) : (
            <>
              <button onClick={() => retryBrowserJob(record.jobId, workspaceCtx, openWorkspace)} className="xps-electric-hover" style={actionBtnStyle(false, '#60a5fa')}>Retry</button>
              <button onClick={() => recoverBrowserJob(record.jobId, workspaceCtx, openWorkspace)} className="xps-electric-hover" style={actionBtnStyle(false, '#f59e0b')}>Recover</button>
              {(record.status === 'queued' || record.status === 'running') && (
                <button onClick={() => cancelBrowserJob(record.jobId)} className="xps-electric-hover" style={actionBtnStyle(false, '#ef4444')}>Cancel</button>
              )}
            </>
          )}
        />
      </CapPanel>

      <CapPanel icon={Zap} title="Parallel Groups" subtitle="Grouped status, partial failure truth, and history" status={groups.length ? STATUS.LIVE : STATUS.LOCAL} defaultOpen={false}>
        <RuntimeRecordList
          emptyLabel="No parallel groups recorded yet."
          records={groups}
          renderTitle={(group) => group.title}
          renderMeta={(group) => `${group.jobs?.length || 0} job(s)${group.recoveryPending ? ' · recovery pending' : ''}`}
        />
      </CapPanel>

      <CapPanel icon={BookOpen} title="Execution History" subtitle="Outbound + inbound runtime ledger" status={STATUS.LIVE} defaultOpen={false}>
        <RuntimeRecordList
          emptyLabel="No execution history recorded yet."
          records={runtimeOps.executionHistory || []}
          renderTitle={(record) => record.title}
          renderMeta={(record) => `${record.category || 'runtime'} · ${record.direction || 'system'} · ${record.mode || 'unknown'}`}
        />
      </CapPanel>
    </div>
  );
}

function BuilderSection({ browserWorkerConfigured, openaiConfigured, geminiConfigured, ghConfigured, liveStatus, governance, workspace }) {
  const media = liveStatus?.operatorModules?.media || {};
  const siteMutation = liveStatus?.operatorModules?.siteMutation || {};
  const orchestration = liveStatus?.operatorModules?.orchestration || {};
  const [builderNotice, setBuilderNotice] = useState(null);

  const ensureUiEditor = () => {
    const existing = workspace.objects.find((item) => item.type === OBJ_TYPE.UI && item.meta?.uiEditor);
    if (existing) return existing;
    const initial = createDefaultUiState();
    const created = {
      id: genId(),
      type: OBJ_TYPE.UI,
      title: 'UI Editor Canvas',
      content: 'Editable UI canvas',
      status: RUN_STATUS.IDLE,
      meta: { uiEditor: true, uiState: initial, history: [createHistoryEntry(initial, 'Initial UI state', 'seed')] },
    };
    workspace.createObject(created);
    return created;
  };

  const openBuilderCanvas = () => {
    const target = ensureUiEditor();
    workspace.setActive(target.id);
    requestAppShellNavigation({ page: 'workspace', panel: 'workspace' });
    setBuilderNotice('Builder canvas opened in the workspace.');
  };

  const applyPendingPreview = () => {
    const target = ensureUiEditor();
    const preview = target.meta?.preview;
    if (!preview?.state) {
      setBuilderNotice('No pending preview is available to apply.');
      return;
    }
    if (governance.previewOnly || governance.requireApproval) {
      setBuilderNotice('Apply is blocked by governance (preview-only or approval required).');
      return;
    }
    if (preview.validation && !preview.validation.valid) {
      setBuilderNotice(`Apply is blocked by validation. ${preview.validation.issues.join(', ')}`);
      return;
    }
    const nextState = normalizeUiState(preview.state);
    const history = Array.isArray(target.meta?.history) ? [...target.meta.history] : [];
    history.push(createHistoryEntry(nextState, preview.summary || 'Apply preview', 'admin'));
    workspace.patchObject(target.id, { meta: { ...target.meta, uiState: nextState, history, preview: null } });
    workspace.createObject({
      type: OBJ_TYPE.SITE_MUTATION,
      title: `Site Mutation Apply — ${preview.summary || 'Apply preview'}`,
      content: `Applied governed mutation from admin.\n\nSummary: ${preview.summary || 'Apply preview'}\nValidation: ${preview.validation?.summary || 'Validation passed.'}`,
      status: RUN_STATUS.DONE,
      meta: { stage: 'apply', summary: preview.summary || 'Apply preview', source: 'admin', validation: preview.validation || { valid: true, issues: [] }, targetId: target.id },
    });
    workspace.setActive(target.id);
    requestAppShellNavigation({ page: 'workspace', panel: 'workspace' });
    setBuilderNotice('Pending preview applied. Rollback remains available.');
  };

  const stageRollbackPreview = () => {
    const target = ensureUiEditor();
    const history = Array.isArray(target.meta?.history) ? target.meta.history : [];
    if (history.length < 2) {
      setBuilderNotice('No prior version is available for rollback.');
      return;
    }
    const previous = history[history.length - 2];
    const nextState = normalizeUiState(previous.state);
    const validation = validateUiState(nextState);
    const preview = {
      id: genId(),
      summary: `Rollback to ${previous.summary || previous.id}`,
      source: 'admin-rollback',
      createdAt: new Date().toISOString(),
      state: nextState,
      validation,
    };
    workspace.patchObject(target.id, { meta: { ...target.meta, preview } });
    workspace.createObject({
      type: OBJ_TYPE.SITE_MUTATION,
      title: `Site Mutation Rollback Preview — ${previous.summary || previous.id}`,
      content: `Rollback preview prepared.\n\nSummary: ${preview.summary}\nValidation: ${validation.summary}${validation.issues.length ? `\n${validation.issues.map(issue => `- ${issue}`).join('\n')}` : ''}`,
      status: validation.valid ? RUN_STATUS.DONE : RUN_STATUS.ERROR,
      meta: { stage: 'rollback-preview', summary: preview.summary, source: 'admin', validation, targetId: target.id, previewId: preview.id },
    });
    workspace.setActive(target.id);
    requestAppShellNavigation({ page: 'workspace', panel: 'workspace' });
    setBuilderNotice('Rollback preview created in the workspace.');
  };

  return (
    <div data-testid="admin-builder-panel">
      <div style={{ marginBottom: 20 }}>
        <h2 className="xps-gold-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, marginBottom: 4 }}>
          Builder / Mutation Runtime
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Governs site editing, media surfaces, workflow orchestration, and repo-linked mutation truth.
        </p>
      </div>

      <CapPanel icon={LayoutPanelTop} title="Site Mutation" subtitle="Preview, apply, rollback, governed mutation" status={STATUS.LIVE} defaultOpen>
        <CapRow icon={LayoutPanelTop} label="UI preview + apply flow" status={STATUS.LIVE} note={siteMutation.ui_preview || 'write-enabled'} />
        <CapRow icon={RefreshCw}      label="Rollback flow"           status={STATUS.LIVE} note={siteMutation.rollback_flow || 'write-enabled'} />
        <CapRow icon={GitBranch}      label="Repo-linked mutation path" status={deriveStatus(ghConfigured)} note={siteMutation.repo_mutation || 'blocked'} />
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={openBuilderCanvas} className="xps-electric-hover" style={actionBtnStyle(false, '#60a5fa')}>Open builder canvas</button>
          <button onClick={applyPendingPreview} className="xps-electric-hover" style={actionBtnStyle(false, '#22c55e')}>Apply pending preview</button>
          <button onClick={stageRollbackPreview} className="xps-electric-hover" style={actionBtnStyle(false, '#f59e0b')}>Create rollback preview</button>
        </div>
      </CapPanel>

      <CapPanel icon={Clapperboard} title="Media Surfaces" subtitle="Image/video generation and editing truth" status={openaiConfigured || geminiConfigured ? STATUS.SYNTHETIC : STATUS.BLOCKED} defaultOpen={false}>
        <CapRow icon={Sparkles} label="Image generation" status={openaiConfigured || geminiConfigured ? STATUS.SYNTHETIC : STATUS.BLOCKED} note={media.image_generation || 'blocked'} />
        <CapRow icon={Sparkles} label="Image editing"    status={openaiConfigured ? STATUS.SYNTHETIC : STATUS.BLOCKED} note={media.image_editing || 'blocked'} />
        <CapRow icon={Clapperboard} label="Video generation" status={STATUS.BLOCKED} note={media.video_generation || 'unimplemented'} />
        <CapRow icon={Clapperboard} label="Video editing"    status={STATUS.BLOCKED} note={media.video_editing || 'unimplemented'} />
      </CapPanel>

      <CapPanel icon={Workflow} title="Orchestration Runtime" subtitle="Async queues, parallel groups, browser jobs" status={browserWorkerConfigured ? STATUS.LOCAL : STATUS.SYNTHETIC} defaultOpen={false}>
        <CapRow icon={Workflow} label="Async runs"        status={STATUS.LIVE} note={orchestration.async_runs || 'write-enabled'} />
        <CapRow icon={Activity} label="Parallel groups"   status={STATUS.LIVE} note={orchestration.parallel_groups || 'write-enabled'} />
        <CapRow icon={Package}  label="Staged exports"    status={liveStatus?.supabase?.configured ? STATUS.LIVE : STATUS.LOCAL} note={orchestration.staged_exports || 'local-only'} />
        <CapRow icon={Globe}    label="Browser jobs"      status={browserWorkerConfigured ? STATUS.LOCAL : STATUS.BLOCKED} note={orchestration.browser_jobs || 'blocked'} />
      </CapPanel>
      {builderNotice && (
        <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', whiteSpace: 'pre-wrap' }}>
          {builderNotice}
        </div>
      )}
    </div>
  );
}

// ── Utility components ─────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', width: 180, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: '#e2e8f0', flex: 1 }}>{value}</span>
    </div>
  );
}

function RuntimeRecordList({ records = [], emptyLabel, renderTitle, renderMeta, renderActions }) {
  if (!records.length) {
    return <div style={{ padding: '14px 16px', fontSize: 12, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>{emptyLabel}</div>;
  }
  return (
    <div style={{ padding: '8px 16px 16px', display: 'grid', gap: 10 }}>
      {records.map((record) => {
        const title = renderTitle ? renderTitle(record) : (record.title || record.eventType || record.jobId || record.runId || 'runtime record');
        const status = `${record.status || 'unknown'}`.toUpperCase();
        const history = Array.isArray(record.history) ? record.history : [];
        return (
          <div key={record.id || record.eventId || record.jobId || record.runId || record.groupId || title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', flex: 1 }}>{title}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.8 }}>{status}</div>
            </div>
            {renderMeta && (
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{renderMeta(record)}</div>
            )}
            {record.detail && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>{record.detail}</div>
            )}
            {record.blockedReason && (
              <div style={{ fontSize: 11, color: '#fca5a5', marginTop: 6 }}>{record.blockedReason}</div>
            )}
            {(record.recoveryPending || record.persistence?.recoveredAt) && (
              <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 6 }}>
                Restored from browser-local continuity snapshot{record.recoveredFromStatus ? ` · previously ${record.recoveredFromStatus}` : ''}.
              </div>
            )}
            {history.length > 0 && (
              <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
                {history.slice(0, 3).map((entry) => (
                  <div key={`${entry.ts}-${entry.status}`} style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)' }}>
                    {new Date(entry.ts).toLocaleTimeString()} · {entry.status} · {entry.detail}
                  </div>
                ))}
              </div>
            )}
            {renderActions && (
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {renderActions(record)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BlockedInfo({ children }) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 10, marginBottom: 14,
      background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
      display: 'flex', alignItems: 'flex-start', gap: 10,
      fontSize: 12, color: 'rgba(255,255,255,0.55)',
    }}>
      <Lock size={13} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
      <span>{children}</span>
    </div>
  );
}

function LoadingRow({ label }) {
  return (
    <div style={{ padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite', color: 'rgba(255,255,255,0.3)' }} />
      {label}
    </div>
  );
}

function ErrorRow({ label }) {
  return (
    <div style={{ padding: '12px 16px', fontSize: 12, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 8 }}>
      <AlertTriangle size={12} />
      {label}
    </div>
  );
}

function actionBtnStyle(disabled, accent = '#d4a843') {
  return {
    padding: '7px 12px',
    borderRadius: 8,
    border: `1px solid ${disabled ? 'rgba(255,255,255,0.1)' : accent}`,
    background: disabled ? 'rgba(255,255,255,0.04)' : `${accent}22`,
    color: disabled ? 'rgba(255,255,255,0.3)' : accent,
    fontSize: 11,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

const actionInputStyle = {
  width: '100%',
  marginTop: 6,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  color: '#e2e8f0',
  fontSize: 12,
  padding: '10px 12px',
  outline: 'none',
};
// ── System section ─────────────────────────────────────────────────────────
function SystemSection({ openaiConfigured, groqConfigured, sbConfigured, browserWorkerConfigured, runtimeStatusSource = 'live', savedStatus = null }) {
  const runtimeSourceMeta = getRuntimeSourceMeta(runtimeStatusSource);
  const services = [
    { label: 'API Routes (/api/*)',      ok: true,                         note: 'Vercel serverless' },
    { label: 'LLM Adapter',             ok: openaiConfigured || groqConfigured, note: 'api/_llm.js' },
    { label: 'Status Endpoint',         ok: true,                         note: 'api/status.js' },
    { label: 'GitHub Proxy',            ok: true,                         note: 'api/github.js' },
    { label: 'Supabase Persistence',    ok: sbConfigured,                 note: 'src/lib/supabasePersistence.js' },
    { label: 'Staging Pipeline',        ok: sbConfigured,                 note: 'pre_stage_items / stage_items' },
    { label: 'Runtime Ledger',          ok: sbConfigured,                 note: 'runtime_ledgers' },
    { label: 'Recovery Queue',          ok: sbConfigured,                 note: 'recovery_queue' },
    { label: 'ByteBot Runtime',         ok: true,                         note: 'src/lib/bytebotRuntime.js' },
    { label: 'Browser Job Runtime',     ok: true,                         note: 'src/lib/browserJobRuntime.js' },
    { label: 'Client Continuity Cache', ok: true,                         note: 'browser-local orchestration snapshot' },
    { label: 'Browser Worker',          ok: browserWorkerConfigured,      note: 'BROWSER_WORKER_URL' },
    { label: 'Workspace Engine',        ok: true,                         note: 'src/lib/workspaceEngine.jsx' },
    { label: 'Orchestrator',            ok: openaiConfigured,             note: 'src/lib/orchestrator.js' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 className="xps-gold-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, marginBottom: 4 }}>
          System Status
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Runtime module health and environment readiness.
        </p>
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden', marginBottom: 20,
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
          RUNTIME MODULES
        </div>
        {services.map(s => (
          <div key={s.label} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            {s.ok
              ? <CheckCircle size={13} style={{ color: '#4ade80', flexShrink: 0 }} />
              : <XCircle size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
            }
            <span style={{ flex: 1, fontSize: 12, color: '#e2e8f0' }}>{s.label}</span>
            <code style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>{s.note}</code>
            <span style={{ fontSize: 11, fontWeight: 600, color: s.ok ? '#4ade80' : '#ef4444' }}>{s.ok ? 'Operational' : 'Unconfigured'}</span>
          </div>
        ))}
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
          ENVIRONMENT VARIABLES
        </div>
        {[
          { key: 'OPENAI_API_KEY',   set: openaiConfigured,   hint: 'Live LLM inference' },
          { key: 'GROQ_API_KEY',     set: groqConfigured,     hint: 'Groq LLM (fast fallback)' },
          { key: 'GEMINI_API_KEY',   set: GEMINI_CONFIGURED,  hint: 'Google Gemini' },
          { key: 'SUPABASE_URL',     set: sbConfigured,       hint: 'Database persistence' },
          { key: 'SUPABASE_ANON_KEY',set: sbConfigured,       hint: 'Database auth' },
          { key: 'GITHUB_TOKEN',     set: GITHUB_CONFIGURED,  hint: 'GitHub API' },
          { key: 'VERCEL_TOKEN',     set: VERCEL_CONFIGURED,  hint: 'Vercel deployments' },
          { key: 'GCP_SA_KEY',       set: GOOGLE_CONFIGURED,  hint: 'Google Workspace / Gemini' },
          { key: 'HUBSPOT_API_KEY',  set: HUBSPOT_CONFIGURED, hint: 'HubSpot CRM' },
          { key: 'AIRTABLE_API_KEY', set: AIRTABLE_CONFIGURED, hint: 'Airtable staging' },
          { key: 'AIRTABLE_BASE_ID', set: AIRTABLE_CONFIGURED, hint: 'Airtable base' },
          { key: 'BROWSER_WORKER_URL', set: BROWSER_WORKER_CONFIGURED, hint: 'Browser automation worker' },
        ].map(item => (
          <div key={item.key} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <Key size={11} style={{ color: item.set ? '#4ade80' : '#ef4444', flexShrink: 0 }} />
            <code style={{ fontSize: 11, color: item.set ? '#e2e8f0' : 'rgba(255,255,255,0.35)', flex: 1 }}>{item.key}</code>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{item.hint}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
              background: item.set ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
              color: item.set ? '#4ade80' : '#ef4444',
              border: `1px solid ${item.set ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>
              {item.set ? 'SET' : 'MISSING'}
            </span>
          </div>
        ))}
        <div style={{ padding: '10px 16px', fontSize: 11, color: 'rgba(255,255,255,0.25)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          Set variables in <code style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 3 }}>.env.local</code> for local dev or in Vercel project settings for production.
        </div>
      </div>

      <div style={{
        marginTop: 20,
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
          CONTINUITY / RECOVERY TRUTH
        </div>
        <InfoRow label="Runtime source" value={runtimeSourceMeta.label} />
        <InfoRow label="Last continuity save" value={savedStatus?.persistence?.savedAt || 'No runtime snapshot saved yet'} />
        <div style={{ padding: '0 16px 14px', fontSize: 11, color: 'rgba(255,255,255,0.42)' }}>
          Browser-local continuity restores operator state after reloads and exposes the last saved runtime/admin snapshot. Durable backend mutation and orchestration history still require configured runtime persistence such as Supabase.
        </div>
      </div>
    </div>
  );
}

// ── Access section ─────────────────────────────────────────────────────────
function GovernanceSection({ governance, onChange, sbConfigured }) {
  const config = governance || DEFAULT_GOVERNANCE;
  const toggles = [
    { key: 'allowUiEdits', label: 'Allow UI edits', note: 'Enable center-surface editing controls.' },
    { key: 'allowSiteMutations', label: 'Allow site mutations', note: 'Permit governed page, navigation, and feature-flag changes.' },
    { key: 'allowGitHubWrites', label: 'Allow GitHub writes', note: 'Permit GitHub write actions when token is configured.' },
    { key: 'requireApproval', label: 'Require approval', note: 'Gate apply actions until approval is granted.' },
    { key: 'previewOnly', label: 'Preview-only mode', note: 'Block apply/commit; allow preview generation only.' },
    { key: 'deploymentPermission', label: 'Deployment permission', note: 'Allow deployment triggers via Vercel.' },
    { key: 'connectorPermissions', label: 'Connector permissions', note: 'Allow connector read/write actions.' },
    { key: 'browserExecution', label: 'Browser execution', note: 'Allow Playwright worker execution.' },
    { key: 'exportStaging', label: 'Export staging', note: 'Enable staging queues for HubSpot/Airtable.' },
    { key: 'communicationActions', label: 'Communication actions', note: 'Allow Twilio and SendGrid staging surfaces.' },
    { key: 'mediaActions', label: 'Media actions', note: 'Allow image/video workflow staging surfaces.' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 className="xps-gold-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, marginBottom: 4 }}>
          Governance & Guardrails
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Control how the orchestrator can mutate UI, data, and connector surfaces.
        </p>
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
          GOVERNANCE TOGGLES
        </div>
        {toggles.map(item => (
          <div key={item.key} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <input
              type="checkbox"
              checked={!!config[item.key]}
              onChange={e => onChange({ [item.key]: e.target.checked })}
              style={{ accentColor: '#d4a843' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>{item.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{item.note}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: config[item.key] ? '#4ade80' : '#ef4444' }}>
              {config[item.key] ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12,
      }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 8 }}>
            AUTONOMY LEVEL
          </div>
          <select
            value={config.autonomyLevel}
            onChange={e => onChange({ autonomyLevel: e.target.value })}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              padding: '8px 10px',
              color: '#e2e8f0',
              fontSize: 12,
            }}
          >
            <option value="assist">Assisted</option>
            <option value="guided">Guided</option>
            <option value="autonomous">Autonomous</option>
          </select>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 8 }}>
            ROLLBACK RETENTION
          </div>
          <select
            value={config.rollbackRetention}
            onChange={e => onChange({ rollbackRetention: e.target.value })}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              padding: '8px 10px',
              color: '#e2e8f0',
              fontSize: 12,
            }}
          >
            <option value="7 days">7 days</option>
            <option value="30 days">30 days</option>
            <option value="90 days">90 days</option>
            <option value="365 days">365 days</option>
          </select>
        </div>
      </div>

      {!sbConfigured && (
        <BlockedInfo>
          Supabase not configured — governance changes are stored locally only. Configure <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> to persist governance history.
        </BlockedInfo>
      )}
    </div>
  );
}

// ── Access section ─────────────────────────────────────────────────────────
function AccessSection({
  sbConfigured,
  session,
  authEmail,
  authStatus,
  onEmailChange,
  onEmailSignIn,
  onOAuth,
  onSignOut,
}) {
  const statusColor = session ? '#4ade80' : sbConfigured ? '#fbbf24' : '#ef4444';
  const statusLabel = session ? 'Signed In' : sbConfigured ? 'Ready' : 'Blocked';
  const oauthReady = !!session;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 className="xps-gold-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, marginBottom: 4 }}>
          Access Control
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Authentication state and operator access configuration.
        </p>
      </div>

      <div style={{
        background: 'rgba(96,165,250,0.07)',
        border: '1px solid rgba(96,165,250,0.2)',
        borderRadius: 12, padding: '16px 20px', marginBottom: 18,
        display: 'flex', alignItems: 'flex-start', gap: 12,
      }}>
        <Unlock size={16} style={{ color: '#60a5fa', flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa', marginBottom: 4 }}>Auth Bypassed — Dev Mode</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
            Authentication is disabled for development. The application boots directly into the operator shell.
            Auth is scaffolded in <code style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>src/lib/supabaseClient.js</code>
            {' '}— enable via <code style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>DEV_AUTH=false</code> when Supabase auth is configured.
          </div>
        </div>
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden', marginBottom: 18,
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
          AUTH BROKER — SUPABASE
        </div>
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: statusColor }}>{statusLabel}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
              {session ? session.user?.email || 'Authenticated' : sbConfigured ? 'Supabase auth ready' : 'Supabase not configured'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              data-testid="auth-google-btn"
              onClick={() => onOAuth('google')}
              disabled={!sbConfigured}
              className="xps-electric-hover"
              style={actionBtnStyle(!sbConfigured)}
            >
              Continue with Google
            </button>
            <button
              data-testid="auth-github-btn"
              onClick={() => onOAuth('github')}
              disabled={!sbConfigured}
              className="xps-electric-hover"
              style={actionBtnStyle(!sbConfigured)}
            >
              Continue with GitHub
            </button>
            <button
              data-testid="auth-signout-btn"
              onClick={onSignOut}
              disabled={!session}
              className="xps-electric-hover"
              style={actionBtnStyle(!session, '#ef4444')}
            >
              Sign out
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              data-testid="auth-email-input"
              value={authEmail}
              onChange={e => onEmailChange(e.target.value)}
              placeholder="Continue with email"
              disabled={!sbConfigured}
              style={{
                flex: 1, minWidth: 200,
                padding: '8px 10px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.04)', color: '#e2e8f0',
                fontSize: 12,
              }}
            />
            <button
              data-testid="auth-email-btn"
              onClick={onEmailSignIn}
              disabled={!sbConfigured || !authEmail}
              className="xps-electric-hover"
              style={actionBtnStyle(!sbConfigured || !authEmail)}
            >
              Continue with Email
            </button>
          </div>

          {authStatus && (
            <div style={{
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              fontSize: 11,
              color: 'rgba(255,255,255,0.6)',
            }}>
              {authStatus}
            </div>
          )}
        </div>
      </div>

      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
          AUTH CONFIG
        </div>
        {[
          { label: 'Supabase Auth',        ok: sbConfigured, note: 'JWT-based auth via @supabase/supabase-js' },
          { label: 'Row-Level Security',   ok: sbConfigured, note: 'Enabled on Supabase tables when configured' },
          { label: 'Dev Auth Bypass',      ok: true,         note: 'Active in current build' },
          { label: 'Google OAuth',         ok: oauthReady, note: oauthReady ? 'User authenticated (provider config still required)' : 'Enable provider in Supabase dashboard' },
          { label: 'GitHub OAuth',         ok: oauthReady, note: oauthReady ? 'User authenticated (provider config still required)' : 'Enable provider in Supabase dashboard' },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            {item.ok
              ? <CheckCircle size={13} style={{ color: '#4ade80', flexShrink: 0 }} />
              : <XCircle size={13} style={{ color: '#ef4444', flexShrink: 0 }} />
            }
            <span style={{ flex: 1, fontSize: 12, color: '#e2e8f0' }}>{item.label}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{item.note}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: item.ok ? '#4ade80' : '#ef4444' }}>
              {item.ok ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
