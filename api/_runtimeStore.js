const GLOBAL_KEY = '__xpsRuntimeStore';
const MAX_ITEMS = 40;
const MAX_TEXT = 600;

function nowIso() {
  return new Date().toISOString();
}

function ensureStore() {
  if (!globalThis[GLOBAL_KEY]) {
    globalThis[GLOBAL_KEY] = {
      inboundEvents: [],
      executionHistory: [],
      jobs: [],
      groups: [],
    };
  }
  return globalThis[GLOBAL_KEY];
}

function limitPush(list, item) {
  list.unshift(item);
  if (list.length > MAX_ITEMS) list.length = MAX_ITEMS;
}

function clip(value, max = MAX_TEXT) {
  const text = `${value ?? ''}`;
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function sanitize(value, depth = 0) {
  if (value == null) return value;
  if (depth > 3) return '[truncated]';
  if (typeof value === 'string') return clip(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 12).map((item) => sanitize(item, depth + 1));
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 20)
        .map(([key, val]) => [key, sanitize(val, depth + 1)]),
    );
  }
  return clip(value);
}

function createHistoryEntry(status, detail, extra = {}) {
  return {
    ts: nowIso(),
    status,
    detail: clip(detail),
    ...sanitize(extra),
  };
}

function buildBaseUrl(req) {
  const proto = req?.headers?.['x-forwarded-proto'] || 'https';
  const host = req?.headers?.host || null;
  return host ? `${proto}://${host}` : null;
}

function upsertById(list, key, id, createValue) {
  const index = list.findIndex((item) => item[key] === id);
  if (index >= 0) return { item: list[index], index };
  const created = createValue();
  list.unshift(created);
  if (list.length > MAX_ITEMS) list.length = MAX_ITEMS;
  return { item: created, index: 0 };
}

export function recordInboundEvent({
  provider,
  eventType,
  channel = 'webhook',
  status = 'received',
  mode = 'live',
  blockedReason = null,
  payload = {},
  target = null,
}) {
  const store = ensureStore();
  const eventId = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const item = {
    eventId,
    provider,
    direction: 'inbound',
    channel,
    eventType,
    status,
    mode,
    blockedReason,
    target,
    receivedAt: nowIso(),
    action: {
      type: eventType,
      provider,
      channel,
    },
    result: {
      status,
      mode,
      blockedReason,
    },
    history: [
      createHistoryEntry(status, `${provider} ${eventType} received`, { channel, mode, blockedReason }),
    ],
    payload: sanitize(payload),
  };
  limitPush(store.inboundEvents, item);
  recordExecution({
    category: 'inbound',
    title: `${provider} ${eventType}`,
    status,
    mode,
    direction: 'inbound',
    provider,
    detail: blockedReason || `${channel} event recorded`,
    meta: { eventId, target, blockedReason },
  });
  return item;
}

export function recordExecution({
  category = 'runtime',
  title,
  status = 'complete',
  mode = 'live',
  direction = 'system',
  provider = null,
  detail = '',
  meta = {},
}) {
  const store = ensureStore();
  const item = {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category,
    title: clip(title || category),
    status,
    mode,
    direction,
    provider,
    detail: clip(detail),
    meta: sanitize(meta),
    ts: nowIso(),
  };
  limitPush(store.executionHistory, item);
  return item;
}

export function upsertJobRecord({
  jobId,
  kind = 'job',
  title = null,
  status = 'queued',
  mode = 'blocked',
  source = 'runtime',
  target = null,
  retryCount = 0,
  blockedReason = null,
  error = null,
  progress = null,
  detail = null,
}) {
  const store = ensureStore();
  const { item } = upsertById(store.jobs, 'jobId', jobId, () => ({
    jobId,
    kind,
    title: title || jobId,
    status,
    mode,
    source,
    target,
    retryCount,
    blockedReason,
    error,
    progress,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    history: [],
  }));

  Object.assign(item, {
    kind: kind || item.kind,
    title: title || item.title,
    status,
    mode,
    source,
    target: target ?? item.target,
    retryCount,
    blockedReason,
    error,
    progress,
    updatedAt: nowIso(),
  });
  item.history.unshift(createHistoryEntry(status, detail || `${item.title} ${status}`, { mode, blockedReason, error, progress }));
  if (item.history.length > 20) item.history.length = 20;
  return item;
}

export function upsertGroupRecord({
  groupId,
  title,
  status = 'running',
  mode = 'local',
  source = 'runtime',
  jobs = [],
  summary = null,
}) {
  const store = ensureStore();
  const { item } = upsertById(store.groups, 'groupId', groupId, () => ({
    groupId,
    title: title || groupId,
    status,
    mode,
    source,
    jobs: [],
    summary: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    history: [],
  }));
  Object.assign(item, {
    title: title || item.title,
    status,
    mode,
    source,
    jobs: sanitize(jobs),
    summary,
    updatedAt: nowIso(),
  });
  item.history.unshift(createHistoryEntry(status, summary || `${item.title} ${status}`, { mode, jobs: jobs.length }));
  if (item.history.length > 20) item.history.length = 20;
  return item;
}

export function getRuntimeSnapshot(env = process.env, req = null) {
  const store = ensureStore();
  const runtimeEnv = env.VERCEL ? 'cloud' : 'local';
  const baseUrl = buildBaseUrl(req);
  const browserWorkerUrl = env.BROWSER_WORKER_URL || null;
  const twilioConfigured = !!(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN);
  const sendgridConfigured = !!env.SENDGRID_API_KEY;

  return {
    environment: {
      runtime: runtimeEnv,
      baseUrl,
      historyStore: env.SUPABASE_URL ? 'persistence-configured' : 'ephemeral-process-memory',
      fallbackRouting: [
        browserWorkerUrl
          ? 'Browser jobs route to configured worker target.'
          : 'Browser jobs stay blocked until BROWSER_WORKER_URL is configured.',
        'Inbound webhooks are accepted and recorded; durable history depends on the active runtime/persistence path.',
        runtimeEnv === 'cloud'
          ? 'Cloud/serverless runtime visibility is truthful but may be instance-local without persistent storage.'
          : 'Local runtime visibility is process-local unless a persistence backend is configured.',
      ],
    },
    targets: {
      localRuntime: {
        status: browserWorkerUrl ? 'connected' : 'blocked',
        target: browserWorkerUrl,
        reason: browserWorkerUrl ? 'Dedicated browser worker target configured.' : 'No browser worker target configured.',
      },
      cloudRuntime: {
        status: runtimeEnv === 'cloud' ? 'active' : 'standby',
        target: runtimeEnv === 'cloud' ? (baseUrl || 'cloud-runtime') : null,
        reason: runtimeEnv === 'cloud' ? 'Serverless runtime active.' : 'Cloud runtime not active in local mode.',
      },
      browserWorker: {
        status: browserWorkerUrl ? 'local' : 'blocked',
        target: browserWorkerUrl,
      },
      webhookTargets: {
        twilioInbound: baseUrl ? `${baseUrl}/api/webhooks/twilio/inbound` : '/api/webhooks/twilio/inbound',
        twilioStatus: baseUrl ? `${baseUrl}/api/webhooks/twilio/status` : '/api/webhooks/twilio/status',
        sendgridInbound: baseUrl ? `${baseUrl}/api/webhooks/sendgrid/inbound` : '/api/webhooks/sendgrid/inbound',
        sendgridEvents: baseUrl ? `${baseUrl}/api/webhooks/sendgrid/events` : '/api/webhooks/sendgrid/events',
      },
    },
    inbound: {
      twilio: {
        ingestion: 'live',
        status: twilioConfigured ? 'configured' : 'ingest-only',
        verification: twilioConfigured ? 'token-configured' : 'unverified',
        recentCount: store.inboundEvents.filter((item) => item.provider === 'twilio').length,
      },
      sendgrid: {
        ingestion: 'live',
        status: sendgridConfigured ? 'configured' : 'ingest-only',
        verification: sendgridConfigured ? 'token-configured' : 'unverified',
        recentCount: store.inboundEvents.filter((item) => item.provider === 'sendgrid').length,
      },
      recentEvents: store.inboundEvents.slice(0, 12),
    },
    jobs: {
      queueMode: 'in-memory-runtime',
      recent: store.jobs.slice(0, 12),
      blockedCount: store.jobs.filter((item) => item.status === 'blocked').length,
      failedCount: store.jobs.filter((item) => item.status === 'error').length,
      runningCount: store.jobs.filter((item) => item.status === 'running').length,
    },
    groups: {
      recent: store.groups.slice(0, 12),
    },
    executionHistory: store.executionHistory.slice(0, 16),
  };
}
