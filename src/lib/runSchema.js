/**
 * XPS Run Schema — shared backend → workspace render contracts
 *
 * All API routes return a typed event envelope so the workspace renderer
 * can directly dispatch structured objects without parsing freeform text.
 *
 * Event types mirror the Responses API / structured-output pattern:
 * the backend emits one of these top-level event_type values and the
 * client workspace engine creates/updates the matching object type.
 */

// ── Event type constants ──────────────────────────────────────────────────────

export const EVT = {
  RUN_STARTED:              'run_started',
  RUN_PROGRESS:             'run_progress',
  RUN_COMPLETED:            'run_completed',
  RUN_FAILED:               'run_failed',
  WORKSPACE_OBJECT_CREATED: 'workspace_object_created',
  WORKSPACE_OBJECT_UPDATED: 'workspace_object_updated',
  ARTIFACT_CREATED:         'artifact_created',
  LOG_APPENDED:             'log_appended',
  SEARCH_RESULT:            'search_result',
  SCRAPE_RESULT:            'scrape_result',
  REPORT_RESULT:            'report_result',
  CODE_RESULT:              'code_result',
  UI_RESULT:                'ui_result',
  IMAGE_RESULT:             'image_result',
  VIDEO_RESULT:             'video_result',
  CONNECTOR_STATE:          'connector_state',
  BLOCKED_CAPABILITY:       'blocked_capability',
};

// ── Run statuses ──────────────────────────────────────────────────────────────

export const RUN = {
  QUEUED:    'queued',
  RUNNING:   'running',
  COMPLETE:  'complete',
  CANCELLED: 'cancelled',
  ERROR:     'error',
  RETRY:     'retry',
};

// ── Capability modes ──────────────────────────────────────────────────────────

export const CAP_MODE = {
  LIVE:      'live',
  SYNTHETIC: 'synthetic',
  LOCAL:     'local',
  BLOCKED:   'blocked',
};

// ── Step statuses ─────────────────────────────────────────────────────────────

export const STEP = {
  PENDING:  'pending',
  RUNNING:  'running',
  COMPLETE: 'complete',
  SKIPPED:  'skipped',
  ERROR:    'error',
};

// ── Schema builders ───────────────────────────────────────────────────────────

/**
 * Build a run_started event envelope.
 */
export function mkRunStarted({ runId, agent, task, steps = [], mode = CAP_MODE.SYNTHETIC }) {
  return {
    event_type: EVT.RUN_STARTED,
    run_id:     runId,
    agent,
    task,
    steps,
    mode,
    timestamp:  new Date().toISOString(),
  };
}

/**
 * Build a run_completed event envelope.
 */
export function mkRunCompleted({ runId, agent, task, result, steps = [], artifact = null, mode = CAP_MODE.SYNTHETIC }) {
  return {
    event_type: EVT.RUN_COMPLETED,
    run_id:     runId,
    agent,
    task,
    result,
    steps,
    artifact,
    mode,
    timestamp:  new Date().toISOString(),
  };
}

/**
 * Build a run_failed event envelope.
 */
export function mkRunFailed({ runId, agent, task, error, steps = [], mode = CAP_MODE.SYNTHETIC }) {
  return {
    event_type: EVT.RUN_FAILED,
    run_id:     runId,
    agent,
    task,
    error,
    steps,
    mode,
    timestamp:  new Date().toISOString(),
  };
}

/**
 * Build a search_result event envelope.
 */
export function mkSearchResult({ query, summary, sources = [], mode = CAP_MODE.SYNTHETIC }) {
  return {
    event_type: EVT.SEARCH_RESULT,
    query,
    summary,
    sources,
    mode,
    timestamp:  new Date().toISOString(),
  };
}

/**
 * Build a scrape_result event envelope.
 */
export function mkScrapeResult({ url, summary, rawLength = 0, mode = CAP_MODE.SYNTHETIC }) {
  return {
    event_type: EVT.SCRAPE_RESULT,
    url,
    summary,
    raw_length: rawLength,
    mode,
    timestamp:  new Date().toISOString(),
  };
}

/**
 * Build a connector_state event envelope.
 */
export function mkConnectorState(connectors) {
  return {
    event_type: EVT.CONNECTOR_STATE,
    connectors,   // Record<connectorName, { status, mode, error? }>
    timestamp:    new Date().toISOString(),
  };
}

/**
 * Build a blocked_capability event envelope.
 */
export function mkBlockedCapability({ capability, reason, requiredEnv = [] }) {
  return {
    event_type:    EVT.BLOCKED_CAPABILITY,
    capability,
    reason,
    required_env:  requiredEnv,
    mode:          CAP_MODE.BLOCKED,
    timestamp:     new Date().toISOString(),
  };
}

// ── Step builder ──────────────────────────────────────────────────────────────

export function mkStep(n, label, status = STEP.PENDING) {
  return { step: n, label, status };
}

// ── Workspace object type map from event ─────────────────────────────────────

export function wsTypeFromEvent(eventType) {
  const map = {
    [EVT.SEARCH_RESULT]:  'search',
    [EVT.SCRAPE_RESULT]:  'scrape',
    [EVT.REPORT_RESULT]:  'report',
    [EVT.CODE_RESULT]:    'code',
    [EVT.UI_RESULT]:      'ui',
    [EVT.IMAGE_RESULT]:   'image',
    [EVT.VIDEO_RESULT]:   'video',
    [EVT.RUN_COMPLETED]:  'agent_run',
    [EVT.ARTIFACT_CREATED]:'artifact',
    [EVT.CONNECTOR_STATE]:'runtime_state',
    [EVT.BLOCKED_CAPABILITY]:'runtime_state',
  };
  return map[eventType] ?? 'report';
}
