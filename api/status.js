// Vercel serverless function: GET /api/status
// Returns comprehensive connector status — server-side truth only.
// No secrets are returned; only boolean states and metadata.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const env = process.env;

  // ── LLM provider detection ─────────────────────────────────────────────
  const hasOpenAI  = !!(env.OPENAI_API_KEY);
  const hasGroq    = !!(env.GROQ_API_KEY);
  const hasOllama  = !!(env.OLLAMA_BASE_URL);
  const hasGemini  = !!(env.GEMINI_API_KEY || env.GCP_GEMINI_KEY);
  const hasHubSpot = !!(env.HUBSPOT_API_KEY);
  const hasAirtable = !!(env.AIRTABLE_API_KEY && env.AIRTABLE_BASE_ID);
  const hasBrowserWorker = !!(env.BROWSER_WORKER_URL);

  let activeLLM = 'none';
  let llmModel  = null;
  if (hasOpenAI)       { activeLLM = 'openai';  llmModel = env.OPENAI_MODEL || 'gpt-4o-mini'; }
  else if (hasGroq)    { activeLLM = 'groq';    llmModel = env.GROQ_MODEL || 'llama3-8b-8192'; }
  else if (hasGemini)  { activeLLM = 'gemini';  llmModel = env.GEMINI_MODEL || 'gemini-1.5-flash'; }
  else if (hasOllama)  { activeLLM = 'ollama';  llmModel = env.OLLAMA_MODEL || 'llama3'; }

  // ── GitHub ─────────────────────────────────────────────────────────────
  const hasGitHub = !!(env.GITHUB_TOKEN || env.GITHUB_API_TOKEN);
  const githubOrg = env.GITHUB_ORG || env.GITHUB_OWNER || null;

  // ── Supabase ───────────────────────────────────────────────────────────
  const hasSupabase = !!(env.SUPABASE_URL && (env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY));
  const supabaseUrl = hasSupabase ? env.SUPABASE_URL : null;

  // ── Vercel ─────────────────────────────────────────────────────────────
  const hasVercel  = !!(env.VERCEL_TOKEN || env.VERCEL_ACCESS_TOKEN);
  const vercelTeam = env.VERCEL_TEAM_ID || null;

  // ── Google / GCP ───────────────────────────────────────────────────────
  const hasGCP      = !!(env.GCP_SA_KEY || env.GCP_PROJECT_ID);
  const gcpProject  = env.GCP_PROJECT_ID || null;

  // ── EXPLICITLY BLOCKED: direct product-account passthrough ─────────────
  // ChatGPT consumer product session embedding is NOT supported via any
  // official API. GitHub Copilot Chat internals are not an exposed API.
  // These are marked blocked with the truthful reason.
  const BLOCKED_PASSTHROUGH = [
    {
      id:     'chatgpt_product_session',
      label:  'ChatGPT Product Account Passthrough',
      reason: 'OpenAI does not expose a supported API for embedding a consumer ChatGPT product session. Cookie/session hijacking is prohibited. Substitute: OpenAI Chat Completions API (OPENAI_API_KEY).',
      substitute: hasOpenAI ? 'openai_chat_completions_api' : null,
    },
    {
      id:     'github_copilot_chat_internals',
      label:  'GitHub Copilot Chat Internal Embedding',
      reason: 'GitHub Copilot Chat product internals are not an officially exposed API for third-party embedding. Substitute: GitHub REST API + GitHub Models API (if enabled).',
      substitute: hasGitHub ? 'github_rest_api' : null,
    },
    {
      id:     'gpt_workspace_passthrough',
      label:  'GPT Workspace ID / Account-Linked Passthrough',
      reason: 'GPT workspace IDs are internal OpenAI product identifiers with no official third-party passthrough API. Substitute: OpenAI API with org-scoped key (OPENAI_API_KEY + OPENAI_ORG_ID).',
      substitute: hasOpenAI ? 'openai_org_scoped_api' : null,
    },
  ];

  // ── Runtime build info ─────────────────────────────────────────────────
  const runtimeEnv = env.VERCEL
    ? 'vercel'
    : env.NODE_ENV === 'production'
      ? 'node-production'
      : 'node-dev';

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    runtime: runtimeEnv,

    llm: {
      active:   activeLLM,
      model:    llmModel,
      mode:     activeLLM === 'none' ? 'synthetic' : activeLLM === 'ollama' ? 'local' : 'live',
      providers: {
        openai:  { configured: hasOpenAI,  model: env.OPENAI_MODEL || 'gpt-4o-mini', envKey: 'OPENAI_API_KEY' },
        groq:    { configured: hasGroq,    model: env.GROQ_MODEL || 'llama3-8b-8192', envKey: 'GROQ_API_KEY' },
        gemini:  { configured: hasGemini,  model: env.GEMINI_MODEL || 'gemini-1.5-flash', envKey: 'GEMINI_API_KEY' },
        ollama:  { configured: hasOllama,  model: env.OLLAMA_MODEL || 'llama3', envKey: 'OLLAMA_BASE_URL' },
      },
    },

    github: {
      configured: hasGitHub,
      mode:       hasGitHub ? 'live' : 'blocked',
      org:        githubOrg,
      capabilities: {
        repos:       hasGitHub,
        issues:      hasGitHub,
        pull_requests: hasGitHub,
        commits:     hasGitHub,
        workflows:   hasGitHub,
        releases:    hasGitHub,
        deployments: hasGitHub,
        code_scanning: hasGitHub,
      },
      envKey: 'GITHUB_TOKEN',
    },

    supabase: {
      configured: hasSupabase,
      mode:       hasSupabase ? 'live' : 'blocked',
      projectUrl: supabaseUrl ? supabaseUrl.replace(/^https?:\/\//, '').split('.')[0] + '.supabase.co' : null,
      capabilities: {
        database:   hasSupabase,
        auth:       hasSupabase,
        storage:    hasSupabase,
        realtime:   hasSupabase,
        pre_stage:  hasSupabase,
        stage:      hasSupabase,
        runtime_ledgers: hasSupabase,
        recovery_queue: hasSupabase,
        hubspot_export_staging: hasSupabase,
        airtable_export_staging: hasSupabase,
        edge_functions: false,
      },
      envKey: 'SUPABASE_URL + SUPABASE_ANON_KEY',
    },

    vercel: {
      configured: hasVercel,
      mode:       hasVercel ? 'live' : 'blocked',
      teamId:     vercelTeam,
      capabilities: {
        deployments:   hasVercel,
        env_vars:      hasVercel,
        build_logs:    hasVercel,
        domains:       hasVercel,
        project_info:  hasVercel,
      },
      envKey: 'VERCEL_TOKEN',
    },

    google: {
      configured: hasGCP,
      mode:       hasGCP ? 'live' : 'blocked',
      project:    gcpProject,
      gemini:     { configured: hasGemini, mode: hasGemini ? 'live' : 'blocked' },
      capabilities: {
        drive:    false,
        gmail:    hasGCP,
        calendar: false,
        sheets:   hasGCP,
        admin_sdk: hasGCP,
        gemini:   hasGemini,
      },
      driveBlockedReason: 'Google Drive requires interactive OAuth 2.0 user consent flow — not supported in serverless without a user session.',
      calendarBlockedReason: 'Google Calendar requires interactive OAuth 2.0 — not wired in current build.',
      envKey: 'GCP_SA_KEY or GCP_PROJECT_ID',
    },

    hubspot: {
      configured: hasHubSpot,
      mode:       hasHubSpot ? 'live' : 'blocked',
      capabilities: {
        crm_read:   hasHubSpot,
        crm_write:  hasHubSpot,
        contacts:   hasHubSpot,
        companies:  hasHubSpot,
        deals:      hasHubSpot,
        tickets:    hasHubSpot,
      },
      envKey: 'HUBSPOT_API_KEY',
    },

    airtable: {
      configured: hasAirtable,
      mode:       hasAirtable ? 'live' : 'blocked',
      baseId:     env.AIRTABLE_BASE_ID || null,
      capabilities: {
        bases:    hasAirtable,
        tables:   hasAirtable,
        records:  hasAirtable,
        staging:  hasAirtable,
      },
      envKey: 'AIRTABLE_API_KEY + AIRTABLE_BASE_ID',
    },

    browser: {
      configured: hasBrowserWorker,
      mode:       hasBrowserWorker ? 'local' : 'blocked',
      workerUrl:  hasBrowserWorker ? env.BROWSER_WORKER_URL : null,
      capabilities: {
        browser_jobs: hasBrowserWorker,
        screenshots:  hasBrowserWorker,
        extraction:   hasBrowserWorker,
      },
      envKey: 'BROWSER_WORKER_URL',
    },

    blockedPassthrough: BLOCKED_PASSTHROUGH,

    summary: {
      connectedSystems:  [hasOpenAI && 'openai', hasGroq && 'groq', hasGemini && 'gemini', hasOllama && 'ollama', hasGitHub && 'github', hasSupabase && 'supabase', hasVercel && 'vercel', hasGCP && 'google', hasHubSpot && 'hubspot', hasAirtable && 'airtable', hasBrowserWorker && 'browser_worker'].filter(Boolean),
      blockedSystems:    [!hasOpenAI && 'openai', !hasGroq && 'groq', !hasGemini && 'gemini', !hasGitHub && 'github', !hasSupabase && 'supabase', !hasVercel && 'vercel', !hasHubSpot && 'hubspot', !hasAirtable && 'airtable', !hasBrowserWorker && 'browser_worker'].filter(Boolean),
      chatPassthrough:   'blocked — use OpenAI API or Groq API instead',
      copilotPassthrough:'blocked — use GitHub REST API instead',
    },
  });
}
