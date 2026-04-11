import { storage } from './safeStorage.js';

const KEYS = {
  workspace: 'orchestration.workspace.v1',
  runs: 'orchestration.runs.v1',
  jobs: 'orchestration.jobs.v1',
  groups: 'orchestration.groups.v1',
  adminStatus: 'orchestration.adminStatus.v1',
};

const ACTIVE_WORKSPACE_STATUSES = new Set(['queued', 'running', 'retry']);
const ACTIVE_RUNTIME_STATUSES = new Set(['queued', 'running', 'retry']);

function nowIso() {
  return new Date().toISOString();
}

function normalizeTs(value, fallback = Date.now()) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : fallback;
}

function withPersistenceMeta(meta = {}, scope, savedAt, recoveredAt, extra = {}) {
  return {
    ...meta,
    persistence: {
      layer: 'browser-local',
      scope,
      savedAt: savedAt || null,
      recoveredAt: recoveredAt || null,
      ...extra,
    },
  };
}

function createRecoveryEntry(status, detail, savedAt) {
  return {
    ts: nowIso(),
    status,
    detail: `${detail}${savedAt ? ` Last saved: ${savedAt}.` : ''}`,
  };
}

function normalizeHistory(history, fallbackStatus, fallbackDetail, savedAt) {
  const normalized = Array.isArray(history) ? history.filter(Boolean) : [];
  const detail = fallbackDetail || `Recovered ${fallbackStatus}.`;
  normalized.unshift(createRecoveryEntry('recovered', detail, savedAt));
  return normalized.slice(0, 24);
}

function serializeWorkspaceObject(object = {}) {
  return {
    id: object.id,
    type: object.type,
    title: object.title,
    content: object.content,
    logs: Array.isArray(object.logs) ? object.logs : [],
    status: object.status,
    agent: object.agent ?? null,
    meta: object.meta ?? {},
    steps: Array.isArray(object.steps) ? object.steps : [],
    progress: Number(object.progress || 0),
    createdAt: normalizeTs(object.createdAt),
    updatedAt: normalizeTs(object.updatedAt),
  };
}

export function saveWorkspaceSnapshot(state = {}) {
  const objects = Array.isArray(state.objects) ? state.objects.map(serializeWorkspaceObject) : [];
  storage.set(KEYS.workspace, {
    savedAt: nowIso(),
    activeId: state.activeId || null,
    objects,
  });
}

export function loadWorkspaceSnapshot() {
  const raw = storage.get(KEYS.workspace, null);
  if (!raw || !Array.isArray(raw.objects)) return null;
  const recoveredAt = nowIso();
  const objects = raw.objects.map((object) => {
    const nextStatus = ACTIVE_WORKSPACE_STATUSES.has(object.status) ? 'idle' : object.status;
    const previousStatus = object.status || 'idle';
    return {
      ...object,
      logs: Array.isArray(object.logs) ? object.logs : [],
      steps: Array.isArray(object.steps) ? object.steps : [],
      createdAt: normalizeTs(object.createdAt),
      updatedAt: Date.now(),
      status: nextStatus,
      meta: withPersistenceMeta(object.meta, 'workspace-object', raw.savedAt, recoveredAt, {
        recoveredFromStatus: previousStatus,
        recoveryPending: ACTIVE_WORKSPACE_STATUSES.has(previousStatus),
      }),
    };
  });
  const activeId = objects.find((item) => item.id === raw.activeId)?.id || objects[objects.length - 1]?.id || null;
  return {
    objects,
    activeId,
    savedAt: raw.savedAt || null,
    recoveredAt,
  };
}

function serializeRun(run = {}) {
  return {
    runId: run.runId,
    agent: run.agent,
    task: run.task,
    status: run.status,
    progress: Number(run.progress || 0),
    steps: Array.isArray(run.steps) ? run.steps : [],
    logs: Array.isArray(run.logs) ? run.logs : [],
    result: run.result ?? null,
    error: run.error ?? null,
    mode: run.mode ?? 'synthetic',
    createdAt: normalizeTs(run.createdAt),
    updatedAt: normalizeTs(run.updatedAt),
    cancelled: !!run.cancelled,
    wsObjId: run.wsObjId || null,
    attempt: Number(run.attempt || 1),
    history: Array.isArray(run.history) ? run.history : [],
    runtimeOpts: run.runtime?.opts || { task: run.task, agent: run.agent, context: {} },
  };
}

export function saveRunSnapshot(runs = []) {
  storage.set(KEYS.runs, {
    savedAt: nowIso(),
    runs: Array.isArray(runs) ? runs.map(serializeRun) : [],
  });
}

export function loadRunSnapshot() {
  const raw = storage.get(KEYS.runs, null);
  if (!raw || !Array.isArray(raw.runs)) return [];
  return raw.runs.map((run) => {
    const recoveryPending = ACTIVE_RUNTIME_STATUSES.has(run.status);
    return {
      ...run,
      status: recoveryPending ? 'recovery_pending' : (run.status || 'queued'),
      progress: recoveryPending ? Number(run.progress || 0) : Number(run.progress || 0),
      logs: Array.isArray(run.logs) ? run.logs : [],
      steps: Array.isArray(run.steps) ? run.steps : [],
      createdAt: normalizeTs(run.createdAt),
      updatedAt: Date.now(),
      recoveryPending,
      recoveredFromStatus: run.status || 'queued',
      history: normalizeHistory(
        run.history,
        run.status || 'queued',
        recoveryPending
          ? 'Recovered queued/running run; use Recover or Retry to resume from the last truthful snapshot.'
          : 'Recovered run record from the last saved browser-local snapshot.',
        raw.savedAt,
      ),
      runtime: {
        workspaceCtx: null,
        onNavigate: null,
        opts: run.runtimeOpts || { task: run.task, agent: run.agent, context: {} },
      },
      persistence: {
        layer: 'browser-local',
        scope: 'run',
        savedAt: raw.savedAt || null,
        recoveredAt: nowIso(),
      },
    };
  });
}

function serializeJob(job = {}) {
  return {
    jobId: job.jobId,
    url: job.url,
    action: job.action,
    prompt: job.prompt || '',
    status: job.status,
    progress: Number(job.progress || 0),
    logs: Array.isArray(job.logs) ? job.logs : [],
    result: job.result ?? null,
    error: job.error ?? null,
    mode: job.mode ?? 'blocked',
    createdAt: normalizeTs(job.createdAt),
    updatedAt: normalizeTs(job.updatedAt),
    cancelled: !!job.cancelled,
    wsObjId: job.wsObjId || null,
    attempt: Number(job.attempt || 1),
    history: Array.isArray(job.history) ? job.history : [],
    runtimeOpts: job.runtime?.opts || { url: job.url, action: job.action, prompt: job.prompt || '', workerUrl: '' },
  };
}

export function saveBrowserJobSnapshot(jobs = []) {
  storage.set(KEYS.jobs, {
    savedAt: nowIso(),
    jobs: Array.isArray(jobs) ? jobs.map(serializeJob) : [],
  });
}

export function loadBrowserJobSnapshot() {
  const raw = storage.get(KEYS.jobs, null);
  if (!raw || !Array.isArray(raw.jobs)) return [];
  return raw.jobs.map((job) => {
    const recoveryPending = ACTIVE_RUNTIME_STATUSES.has(job.status);
    return {
      ...job,
      status: recoveryPending ? 'recovery_pending' : (job.status || 'queued'),
      logs: Array.isArray(job.logs) ? job.logs : [],
      createdAt: normalizeTs(job.createdAt),
      updatedAt: Date.now(),
      recoveryPending,
      recoveredFromStatus: job.status || 'queued',
      history: normalizeHistory(
        job.history,
        job.status || 'queued',
        recoveryPending
          ? 'Recovered queued/running browser job; use Recover or Retry to resume from the last truthful snapshot.'
          : 'Recovered browser job record from the last saved browser-local snapshot.',
        raw.savedAt,
      ),
      runtime: {
        workspaceCtx: null,
        onNavigate: null,
        opts: job.runtimeOpts || { url: job.url, action: job.action, prompt: job.prompt || '', workerUrl: '' },
      },
      persistence: {
        layer: 'browser-local',
        scope: 'browser-job',
        savedAt: raw.savedAt || null,
        recoveredAt: nowIso(),
      },
    };
  });
}

function serializeGroup(group = {}) {
  return {
    groupId: group.groupId,
    title: group.title,
    jobs: Array.isArray(group.jobs) ? group.jobs : [],
    status: group.status,
    wsObjId: group.wsObjId || null,
    createdAt: normalizeTs(group.createdAt),
    updatedAt: normalizeTs(group.updatedAt),
    history: Array.isArray(group.history) ? group.history : [],
  };
}

export function saveGroupSnapshot(groups = []) {
  storage.set(KEYS.groups, {
    savedAt: nowIso(),
    groups: Array.isArray(groups) ? groups.map(serializeGroup) : [],
  });
}

export function loadGroupSnapshot() {
  const raw = storage.get(KEYS.groups, null);
  if (!raw || !Array.isArray(raw.groups)) return [];
  return raw.groups.map((group) => {
    const recoveryPending = ACTIVE_RUNTIME_STATUSES.has(group.status);
    return {
      ...group,
      status: recoveryPending ? 'recovery_pending' : (group.status || 'running'),
      jobs: Array.isArray(group.jobs) ? group.jobs : [],
      createdAt: normalizeTs(group.createdAt),
      updatedAt: Date.now(),
      recoveryPending,
      recoveredFromStatus: group.status || 'running',
      history: normalizeHistory(
        group.history,
        group.status || 'running',
        recoveryPending
          ? 'Recovered active parallel group; inspect member jobs and resume manually from the last truthful snapshot.'
          : 'Recovered parallel group history from the last saved browser-local snapshot.',
        raw.savedAt,
      ),
      persistence: {
        layer: 'browser-local',
        scope: 'parallel-group',
        savedAt: raw.savedAt || null,
        recoveredAt: nowIso(),
      },
    };
  });
}

export function saveAdminStatusSnapshot(snapshot) {
  if (!snapshot) return;
  storage.set(KEYS.adminStatus, {
    savedAt: nowIso(),
    snapshot,
  });
}

export function loadAdminStatusSnapshot() {
  const raw = storage.get(KEYS.adminStatus, null);
  if (!raw?.snapshot) return null;
  return {
    ...raw.snapshot,
    persistence: {
      layer: 'browser-local',
      scope: 'admin-runtime-snapshot',
      savedAt: raw.savedAt || null,
      recoveredAt: nowIso(),
      recovered: true,
    },
  };
}
