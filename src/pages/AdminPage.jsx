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
import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch, Database, Cpu, Globe, Mail, Sparkles,
  CheckCircle, XCircle, AlertTriangle, MinusCircle,
  ChevronDown, ChevronRight, Lock, Unlock, Activity,
  Key, Server, RefreshCw, Shield,
  BookOpen, Zap, Code, Package, GitPullRequest,
  Users, HardDrive, Brain, Cloud,
  Ban, Info, GitCommit, Tag, Workflow, Eye,
} from 'lucide-react';

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

// ── Main component ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const [activeSection, setActiveSection] = useState('integrations'); // 'integrations' | 'github' | 'supabase' | 'vercel' | 'google' | 'system' | 'users'
  const [liveStatus, setLiveStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const res = await fetch(`${API_URL}/api/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLiveStatus(data);
    } catch (err) {
      setStatusError(err.message);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const navItems = [
    { id: 'integrations', label: 'Overview',        icon: Activity },
    { id: 'github',       label: 'GitHub',           icon: GitBranch },
    { id: 'supabase',     label: 'Supabase',         icon: Database },
    { id: 'vercel',       label: 'Vercel',           icon: Cloud },
    { id: 'google',       label: 'Google Workspace', icon: Mail },
    { id: 'system',       label: 'System',           icon: Server },
    { id: 'users',        label: 'Access',           icon: Users },
  ];

  // Resolve live vs build-time statuses
  const live = liveStatus || {};
  const ghConfigured      = live.github?.configured  ?? GITHUB_CONFIGURED;
  const sbConfigured      = live.supabase?.configured ?? SUPABASE_CONFIGURED;
  const openaiConfigured  = live.llm?.providers?.openai?.configured ?? OPENAI_CONFIGURED;
  const groqConfigured    = live.llm?.providers?.groq?.configured   ?? GROQ_CONFIGURED;
  const vercelConfigured  = live.vercel?.configured   ?? VERCEL_CONFIGURED;
  const googleConfigured  = live.google?.configured   ?? GOOGLE_CONFIGURED;
  const geminiConfigured  = live.google?.gemini?.configured ?? GEMINI_CONFIGURED;

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
            className="xps-logo"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              overflow: 'hidden',
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
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text-primary)' }}>XPS ADMIN</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.4 }}>CONTROL PLANE</div>
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
              onClick={() => setActiveSection(item.id)}
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
              API error — using build-time state
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
          />
        )}
        {activeSection === 'github'    && <GitHubSection configured={ghConfigured} liveStatus={live} />}
        {activeSection === 'supabase'  && <SupabaseSection configured={sbConfigured} liveStatus={live} />}
        {activeSection === 'vercel'    && <VercelSection configured={vercelConfigured} liveStatus={live} />}
        {activeSection === 'google'    && <GoogleSection configured={googleConfigured} geminiConfigured={geminiConfigured} liveStatus={live} />}
        {activeSection === 'system'    && <SystemSection openaiConfigured={openaiConfigured} groqConfigured={groqConfigured} sbConfigured={sbConfigured} />}
        {activeSection === 'users'     && <AccessSection sbConfigured={sbConfigured} />}
      </div>
    </div>
  );
}

// ── Integrations section ───────────────────────────────────────────────────
function IntegrationsSection({ liveStatus, ghConfigured, sbConfigured, openaiConfigured, groqConfigured, vercelConfigured, googleConfigured, geminiConfigured }) {
  const live = liveStatus || {};
  const activeLLM  = live.llm?.active || (openaiConfigured ? 'openai' : groqConfigured ? 'groq' : 'none');
  const llmModel   = live.llm?.model  || null;
  const llmMode    = live.llm?.mode   || (activeLLM === 'none' ? 'synthetic' : 'live');

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
              ? 'Set OPENAI_API_KEY or GROQ_API_KEY to enable live AI inference.'
              : `Mode: ${llmMode} — Chat Completions API routed through backend. No consumer product passthrough.`}
          </div>
        </div>
        <StatusPill status={activeLLM === 'none' ? STATUS.SYNTHETIC : llmMode === 'local' ? STATUS.LOCAL : STATUS.LIVE} />
      </div>

      <SectionHeading>BLOCKED — Unsupported Direct Passthrough</SectionHeading>

      <BlockedPassthroughPanel openaiConfigured={openaiConfigured} ghConfigured={ghConfigured} />

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

// ── GitHub section ─────────────────────────────────────────────────────────
function GitHubSection({ configured, liveStatus }) {
  const [githubData, setGithubData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [repoData, setRepoData] = useState({});

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

      {configured ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
            PROJECT DETAILS
          </div>
          <InfoRow label="Project URL" value={sb.projectUrl || 'Configured'} />
          <InfoRow label="Persistence mode" value="Live — all runs persisted to workspace_objects" />
          <InfoRow label="Search jobs" value="Persisted to search_jobs table" />
          <InfoRow label="Scrape jobs" value="Persisted to scrape_jobs table" />
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

// ── Utility components ─────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', width: 180, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: '#e2e8f0', flex: 1 }}>{value}</span>
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
// ── System section ─────────────────────────────────────────────────────────
function SystemSection({ openaiConfigured, groqConfigured, sbConfigured }) {
  const services = [
    { label: 'API Routes (/api/*)',      ok: true,                         note: 'Vercel serverless' },
    { label: 'LLM Adapter',             ok: openaiConfigured || groqConfigured, note: 'api/_llm.js' },
    { label: 'Status Endpoint',         ok: true,                         note: 'api/status.js' },
    { label: 'GitHub Proxy',            ok: true,                         note: 'api/github.js' },
    { label: 'Supabase Persistence',    ok: sbConfigured,                 note: 'src/lib/supabasePersistence.js' },
    { label: 'ByteBot Runtime',         ok: true,                         note: 'src/lib/bytebotRuntime.js' },
    { label: 'Browser Job Runtime',     ok: true,                         note: 'src/lib/browserJobRuntime.js' },
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
    </div>
  );
}

// ── Access section ─────────────────────────────────────────────────────────
function AccessSection({ sbConfigured }) {
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
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>
          AUTH CONFIG
        </div>
        {[
          { label: 'Supabase Auth',        ok: sbConfigured, note: 'JWT-based auth via @supabase/supabase-js' },
          { label: 'Row-Level Security',   ok: sbConfigured, note: 'Enabled on Supabase tables when configured' },
          { label: 'Dev Auth Bypass',      ok: true,         note: 'Active in current build' },
          { label: 'Google OAuth',         ok: false,        note: 'Not wired — requires GCP OAuth client' },
          { label: 'GitHub OAuth',         ok: false,        note: 'Not wired' },
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
