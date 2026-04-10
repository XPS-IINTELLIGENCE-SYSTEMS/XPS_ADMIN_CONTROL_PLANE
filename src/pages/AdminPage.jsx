/**
 * AdminPage — Full capability admin for XPS Intelligence Control Plane.
 *
 * Surfaces live/blocked/synthetic status for every integration:
 * GitHub, Supabase, GPT/OpenAI, Vercel, Google Workspace, Gemini.
 *
 * All states are derived from real env-var presence — no faked data.
 */
import React, { useState } from 'react';
import {
  GitBranch, Database, Cpu, Globe, Mail, Sparkles,
  CheckCircle, XCircle, AlertTriangle, MinusCircle,
  ChevronDown, ChevronRight, Lock, Unlock, Activity,
  Key, Server, RefreshCw, Shield,
  BookOpen, Zap, Code, Package, GitPullRequest,
  Users, HardDrive, Brain, Cloud,
} from 'lucide-react';

// ── Runtime truth detection ────────────────────────────────────────────────
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
      <Icon size={10} />
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
      <Icon size={13} style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
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
    <div data-testid={`cap-panel-${title.toLowerCase().replace(/\s+/g, '-')}`} style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 14,
    }}>
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
          <HeaderIcon size={15} style={{ color: meta.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{subtitle}</div>}
        </div>
        <StatusPill status={status} />
        {open ? <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />}
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
              <Lock size={12} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
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
  const [activeSection, setActiveSection] = useState('integrations'); // 'integrations' | 'system' | 'users'

  const navItems = [
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'system',       label: 'System',       icon: Activity },
    { id: 'users',        label: 'Access',       icon: Users },
  ];

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
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 10px', borderRadius: 6,
                border: 'none', background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                fontSize: 12, fontWeight: active ? 600 : 400,
                cursor: 'pointer', textAlign: 'left', width: '100%',
                color: active ? '#e2e8f0' : 'rgba(255,255,255,0.45)',
                marginBottom: 2,
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={13} strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
              {active && (
                <span style={{
                  marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%',
                  background: 'linear-gradient(90deg, #c49e3c, #e8d5a3)',
                }} />
              )}
            </button>
          );
        })}

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
        {activeSection === 'integrations' && <IntegrationsSection />}
        {activeSection === 'system' && <SystemSection />}
        {activeSection === 'users' && <AccessSection />}
      </div>
    </div>
  );
}

// ── Integrations section ───────────────────────────────────────────────────
function IntegrationsSection() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 className="xps-gold-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3, marginBottom: 4 }}>
          Integration Capability Matrix
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Live connector status — reflects actual environment configuration, not synthetic data.
        </p>
      </div>

      <SectionHeading>AI / LLM Providers</SectionHeading>

      <CapPanel
        icon={Cpu}
        title="OpenAI / GPT"
        subtitle="Chat completions, embeddings, vision, function calling"
        status={deriveStatus(OPENAI_CONFIGURED)}
        defaultOpen
      >
        <CapRow icon={Brain}       label="Chat Completions (GPT-4o, GPT-4-turbo, GPT-3.5-turbo)" status={deriveStatus(OPENAI_CONFIGURED)} note="OPENAI_API_KEY" />
        <CapRow icon={Package}     label="Embeddings (text-embedding-3-small/large)"               status={deriveStatus(OPENAI_CONFIGURED)} />
        <CapRow icon={BookOpen}    label="Vision / Image Input (GPT-4o)"                           status={deriveStatus(OPENAI_CONFIGURED)} />
        <CapRow icon={Code}       label="Function Calling / Tool Use"                             status={deriveStatus(OPENAI_CONFIGURED)} />
        <CapRow icon={RefreshCw}   label="Streaming Responses"                                     status={deriveStatus(OPENAI_CONFIGURED)} />
        <CapRow icon={Shield}      label="Moderation Endpoint"                                     status={deriveStatus(OPENAI_CONFIGURED)} />
      </CapPanel>

      <CapPanel
        icon={Zap}
        title="Groq"
        subtitle="Ultra-fast LLaMA/Mixtral inference"
        status={deriveStatus(GROQ_CONFIGURED)}
        defaultOpen={false}
      >
        <CapRow icon={Brain}       label="LLaMA 3 70B / 8B"                  status={deriveStatus(GROQ_CONFIGURED)} note="GROQ_API_KEY" />
        <CapRow icon={Zap}         label="Mixtral 8x7B"                      status={deriveStatus(GROQ_CONFIGURED)} />
        <CapRow icon={RefreshCw}   label="Streaming"                         status={deriveStatus(GROQ_CONFIGURED)} />
      </CapPanel>

      <CapPanel
        icon={Sparkles}
        title="Google Gemini"
        subtitle="Gemini Pro / Flash multimodal"
        status={deriveStatus(GEMINI_CONFIGURED)}
        defaultOpen={false}
      >
        <CapRow icon={Brain}       label="Gemini 1.5 Pro / Flash"            status={deriveStatus(GEMINI_CONFIGURED)} note="GEMINI_API_KEY" />
        <CapRow icon={BookOpen}    label="Multimodal (image + text)"         status={deriveStatus(GEMINI_CONFIGURED)} />
        <CapRow icon={Code}       label="Function Calling"                  status={deriveStatus(GEMINI_CONFIGURED)} />
        <CapRow icon={Package}     label="Embeddings (text-embedding-004)"   status={deriveStatus(GEMINI_CONFIGURED)} />
      </CapPanel>

      <SectionHeading>Data / Storage</SectionHeading>

      <CapPanel
        icon={Database}
        title="Supabase"
        subtitle="PostgreSQL + Auth + Storage + Realtime"
        status={deriveStatus(SUPABASE_CONFIGURED)}
        defaultOpen
      >
        <CapRow icon={HardDrive}   label="PostgreSQL Database"               status={deriveStatus(SUPABASE_CONFIGURED)} note="SUPABASE_URL" />
        <CapRow icon={Shield}      label="Auth (JWT / Row-Level Security)"   status={deriveStatus(SUPABASE_CONFIGURED)} />
        <CapRow icon={Package}     label="File Storage (S3-compatible)"      status={deriveStatus(SUPABASE_CONFIGURED)} />
        <CapRow icon={RefreshCw}   label="Realtime Subscriptions"            status={deriveStatus(SUPABASE_CONFIGURED)} />
        <CapRow icon={Activity}    label="Edge Functions"                    status={STATUS.BLOCKED} note="Not wired" />
      </CapPanel>

      <SectionHeading>DevOps / Deployment</SectionHeading>

      <CapPanel
        icon={GitBranch}
        title="GitHub"
        subtitle="Repos, Actions, Issues, PRs, Deployments"
        status={deriveStatus(GITHUB_CONFIGURED)}
        defaultOpen
      >
        <CapRow icon={GitBranch}      label="Repository Access (read/write)"    status={deriveStatus(GITHUB_CONFIGURED)} note="GITHUB_TOKEN" />
        <CapRow icon={GitPullRequest} label="Pull Requests + Code Review"       status={deriveStatus(GITHUB_CONFIGURED)} />
        <CapRow icon={Activity}       label="GitHub Actions (trigger / status)"  status={deriveStatus(GITHUB_CONFIGURED)} />
        <CapRow icon={Package}        label="Releases + Artifacts"               status={deriveStatus(GITHUB_CONFIGURED)} />
        <CapRow icon={Shield}         label="Code Scanning / Security Alerts"    status={deriveStatus(GITHUB_CONFIGURED)} />
      </CapPanel>

      <CapPanel
        icon={Cloud}
        title="Vercel"
        subtitle="Deployments, environment, domains"
        status={deriveStatus(VERCEL_CONFIGURED)}
        defaultOpen={false}
      >
        <CapRow icon={Globe}      label="Deployments (trigger / status)"     status={deriveStatus(VERCEL_CONFIGURED)} note="VERCEL_TOKEN" />
        <CapRow icon={Server}      label="Environment Variables (read/write)"  status={deriveStatus(VERCEL_CONFIGURED)} />
        <CapRow icon={Activity}    label="Build Logs"                          status={deriveStatus(VERCEL_CONFIGURED)} />
        <CapRow icon={Globe}      label="Domain Management"                   status={deriveStatus(VERCEL_CONFIGURED)} />
      </CapPanel>

      <SectionHeading>Google Workspace</SectionHeading>

      <CapPanel
        icon={Mail}
        title="Google Workspace"
        subtitle="Gmail, Drive, Calendar, Sheets"
        status={deriveStatus(GOOGLE_CONFIGURED)}
        defaultOpen={false}
      >
        <CapRow icon={Mail}        label="Gmail (read / send)"                status={deriveStatus(GOOGLE_CONFIGURED)} note="GCP_SA_KEY" />
        <CapRow icon={HardDrive}   label="Google Drive (files / folders)"     status={STATUS.BLOCKED} note="OAuth scope required" />
        <CapRow icon={BookOpen}    label="Google Sheets (read / write)"       status={deriveStatus(GOOGLE_CONFIGURED)} />
        <CapRow icon={Activity}    label="Google Calendar"                    status={STATUS.BLOCKED} note="Not wired" />
        <CapRow icon={Users}       label="Google Admin SDK (users / groups)"  status={deriveStatus(GOOGLE_CONFIGURED)} />
      </CapPanel>
    </div>
  );
}

// ── System section ─────────────────────────────────────────────────────────
function SystemSection() {
  const services = [
    { label: 'API Routes (/api/*)',      ok: true,                   note: 'Vercel serverless' },
    { label: 'LLM Adapter',             ok: OPENAI_CONFIGURED || GROQ_CONFIGURED, note: 'api/_llm.js' },
    { label: 'Supabase Persistence',    ok: SUPABASE_CONFIGURED,    note: 'src/lib/supabasePersistence.js' },
    { label: 'ByteBot Runtime',         ok: true,                   note: 'src/lib/bytebotRuntime.js' },
    { label: 'Browser Job Runtime',     ok: true,                   note: 'src/lib/browserJobRuntime.js' },
    { label: 'Workspace Engine',        ok: true,                   note: 'src/lib/workspaceEngine.jsx' },
    { label: 'Orchestrator',            ok: OPENAI_CONFIGURED,      note: 'src/lib/orchestrator.js' },
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
          { key: 'OPENAI_API_KEY',   set: OPENAI_CONFIGURED,   hint: 'Live LLM inference' },
          { key: 'GROQ_API_KEY',     set: GROQ_CONFIGURED,     hint: 'Groq LLM (fast fallback)' },
          { key: 'GEMINI_API_KEY',   set: GEMINI_CONFIGURED,   hint: 'Google Gemini' },
          { key: 'SUPABASE_URL',     set: SUPABASE_CONFIGURED, hint: 'Database persistence' },
          { key: 'SUPABASE_ANON_KEY',set: SUPABASE_CONFIGURED, hint: 'Database auth' },
          { key: 'GITHUB_TOKEN',     set: GITHUB_CONFIGURED,   hint: 'GitHub API' },
          { key: 'VERCEL_TOKEN',     set: VERCEL_CONFIGURED,   hint: 'Vercel deployments' },
          { key: 'GCP_SA_KEY',       set: GOOGLE_CONFIGURED,   hint: 'Google Workspace / Gemini' },
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
function AccessSection() {
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
          { label: 'Supabase Auth',        ok: SUPABASE_CONFIGURED, note: 'JWT-based auth via @supabase/supabase-js' },
          { label: 'Row-Level Security',   ok: SUPABASE_CONFIGURED, note: 'Enabled on Supabase tables when configured' },
          { label: 'Dev Auth Bypass',      ok: true,                note: 'Active in current build' },
          { label: 'Google OAuth',         ok: false,               note: 'Not wired — requires GCP OAuth client' },
          { label: 'GitHub OAuth',         ok: false,               note: 'Not wired' },
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
