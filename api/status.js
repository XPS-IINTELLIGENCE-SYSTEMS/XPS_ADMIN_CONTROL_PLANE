// Vercel serverless function: GET /api/status
// Returns comprehensive connector status — server-side truth only.
// No secrets are returned; only boolean states and metadata.

import { getLlmState } from './_llm.js';
import { getRuntimeSnapshot } from './_runtimeStore.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const env = process.env;

  // ── LLM provider detection ─────────────────────────────────────────────
  const llmState = getLlmState(env);
  const hasOpenAI  = llmState.providers.openai.configured;
  const hasGroq    = llmState.providers.groq.configured;
  const hasOllama  = llmState.providers.ollama.configured;
  const hasGemini  = llmState.providers.gemini.configured;
  const hasHubSpot = !!(env.HUBSPOT_API_KEY);
  const hasAirtable = !!(env.AIRTABLE_API_KEY && env.AIRTABLE_BASE_ID);
  const hasBrowserWorker = !!(env.BROWSER_WORKER_URL);
  const hasTwilio = !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN);
  const hasTwilioNumber = !!env.TWILIO_PHONE_NUMBER;
  const hasSendGrid = !!env.SENDGRID_API_KEY;
  const hasSendGridFrom = !!env.SENDGRID_FROM_EMAIL;

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
  const runtimeSnapshot = getRuntimeSnapshot(env, req);

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    runtime: runtimeEnv,

    llm: {
      active:   llmState.active,
      model:    llmState.model,
      mode:     llmState.mode,
      reason:   llmState.reason,
      providers: llmState.providers,
    },

    github: {
      configured: hasGitHub,
      mode:       hasGitHub ? 'live' : 'blocked',
      org:        githubOrg,
      reason:     hasGitHub ? null : 'GITHUB_TOKEN or GITHUB_API_TOKEN not set.',
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
      reason:     hasSupabase ? null : 'SUPABASE_URL and SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY must be set.',
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
      reason:     hasVercel ? null : 'VERCEL_TOKEN or VERCEL_ACCESS_TOKEN not set.',
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
      reason:     hasGCP ? null : 'GCP_SA_KEY or GCP_PROJECT_ID not set.',
      gemini:     { configured: hasGemini, mode: hasGemini ? 'live' : 'blocked', reason: llmState.providers.gemini.reason },
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
      reason:     hasHubSpot ? null : 'HUBSPOT_API_KEY not set.',
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
      reason:     hasAirtable ? null : 'AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set.',
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
      capabilityState: hasBrowserWorker ? 'local-only' : 'blocked',
      workerUrl:  hasBrowserWorker ? env.BROWSER_WORKER_URL : null,
      reason:     hasBrowserWorker ? null : 'BROWSER_WORKER_URL not set.',
      capabilities: {
        browser_jobs: hasBrowserWorker,
        screenshots:  hasBrowserWorker,
        extraction:   hasBrowserWorker,
      },
      envKey: 'BROWSER_WORKER_URL',
    },

    twilio: {
      configured: hasTwilio || runtimeSnapshot.inbound?.twilio?.ingestion === 'live',
      mode:       hasTwilio ? 'live' : 'ingest-only',
      capabilityState: hasTwilio
        ? (hasTwilioNumber ? 'write-enabled' : 'token-configured')
        : 'ingest-only',
      accountSid: hasTwilio ? `${env.TWILIO_ACCOUNT_SID.slice(0, 6)}…` : null,
      phoneNumber: hasTwilioNumber ? env.TWILIO_PHONE_NUMBER : null,
      reason: hasTwilio
        ? (hasTwilioNumber ? null : 'TWILIO_PHONE_NUMBER not set. Calls can be staged but outbound execution is incomplete.')
        : 'Inbound webhook ingestion is available, but verified Twilio runtime credentials are not configured.',
      capabilities: {
        outbound_calls: hasTwilio && hasTwilioNumber,
        inbound_webhooks: true,
        inbound_event_history: runtimeSnapshot.inbound?.twilio?.recentCount > 0,
        call_status_webhooks: true,
        ai_call_orchestration: hasTwilio && hasTwilioNumber,
      },
      webhookTarget: runtimeSnapshot.targets?.webhookTargets?.twilioInbound || null,
      envKey: 'TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN',
    },

    sendgrid: {
      configured: hasSendGrid || runtimeSnapshot.inbound?.sendgrid?.ingestion === 'live',
      mode:       hasSendGrid ? 'live' : 'ingest-only',
      capabilityState: hasSendGrid
        ? (hasSendGridFrom ? 'write-enabled' : 'token-configured')
        : 'ingest-only',
      fromEmail: hasSendGridFrom ? env.SENDGRID_FROM_EMAIL : null,
      reason: hasSendGrid
        ? (hasSendGridFrom ? null : 'SENDGRID_FROM_EMAIL not set. Outbound email can be staged but not sent from a verified address.')
        : 'Inbound/event webhook ingestion is available, but verified SendGrid send credentials are not configured.',
      capabilities: {
        outbound_email: hasSendGrid && hasSendGridFrom,
        templated_email: hasSendGrid,
        inbound_parse: true,
        event_webhooks: true,
      },
      webhookTarget: runtimeSnapshot.targets?.webhookTargets?.sendgridInbound || null,
      envKey: 'SENDGRID_API_KEY',
    },

    operatorModules: {
      communications: {
        twilio_calls: hasTwilio ? (hasTwilioNumber ? 'write-enabled' : 'token-configured') : 'blocked',
        sendgrid_email: hasSendGrid ? (hasSendGridFrom ? 'write-enabled' : 'token-configured') : 'blocked',
      },
      media: {
        image_generation: hasOpenAI || hasGemini ? 'substitute-path' : 'blocked',
        image_editing: hasOpenAI ? 'substitute-path' : 'blocked',
        video_generation: 'unimplemented',
        video_editing: 'unimplemented',
      },
      siteMutation: {
        ui_preview: 'write-enabled',
        apply_flow: 'write-enabled',
        rollback_flow: 'write-enabled',
        page_builder: 'write-enabled',
        feature_builder: 'write-enabled',
        agent_builder: 'workspace-artifact',
        runbook_generation: 'workspace-artifact',
        repo_mutation: hasGitHub ? 'token-configured' : 'blocked',
      },
      orchestration: {
        async_runs: 'write-enabled',
        parallel_groups: 'write-enabled',
        staged_exports: hasSupabase ? 'connected' : 'local-only',
        browser_jobs: hasBrowserWorker ? 'local-only' : 'blocked',
        inbound_events: 'write-enabled',
        job_history: 'write-enabled',
      },
    },

    runtimeOps: runtimeSnapshot,

    blockedPassthrough: BLOCKED_PASSTHROUGH,

    summary: {
      connectedSystems:  [hasOpenAI && 'openai', hasGroq && 'groq', hasGemini && 'gemini', hasOllama && 'ollama', hasGitHub && 'github', hasSupabase && 'supabase', hasVercel && 'vercel', hasGCP && 'google', hasHubSpot && 'hubspot', hasAirtable && 'airtable', hasBrowserWorker && 'browser_worker', hasTwilio && 'twilio', hasSendGrid && 'sendgrid'].filter(Boolean),
      blockedSystems:    [!hasOpenAI && 'openai', !hasGroq && 'groq', !hasGemini && 'gemini', !hasGitHub && 'github', !hasSupabase && 'supabase', !hasVercel && 'vercel', !hasHubSpot && 'hubspot', !hasAirtable && 'airtable', !hasBrowserWorker && 'browser_worker', !hasTwilio && 'twilio', !hasSendGrid && 'sendgrid'].filter(Boolean),
      chatPassthrough:   'blocked — use OpenAI API, Groq API, Gemini API, or Ollama instead',
      copilotPassthrough:'blocked — use GitHub REST API instead',
    },
  });
}
