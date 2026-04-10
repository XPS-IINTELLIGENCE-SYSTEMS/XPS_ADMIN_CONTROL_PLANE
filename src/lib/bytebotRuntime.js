/**
 * ByteBot Runtime — client-side multi-step run queue
 *
 * Manages a queue of agent runs, each with:
 * - multi-step task model
 * - progress tracking
 * - live log emission via workspace engine
 * - safe cancellation
 * - error/retry state
 * - Supabase persistence (graceful no-op when not configured)
 */

import { genId, OBJ_TYPE, RUN_STATUS } from './workspaceEngine.jsx';
import { persistRun, persistLog, persistArtifact } from './supabasePersistence.js';

const API_URL = import.meta.env.API_URL || '';

// ── Run state ─────────────────────────────────────────────────────────────────

const _runs    = new Map();          // runId → RunState
const _subs    = new Set();          // () => void callbacks

export function subscribeRuns(cb) {
  _subs.add(cb);
  return () => _subs.delete(cb);
}

function notify() {
  for (const cb of _subs) cb([..._runs.values()]);
}

function getRunList() {
  return [..._runs.values()].sort((a, b) => b.createdAt - a.createdAt);
}

// ── ByteBot run API ───────────────────────────────────────────────────────────

/**
 * Start a new ByteBot run.
 *
 * @param {object}   opts
 * @param {string}   opts.task        - Natural language task
 * @param {string}   [opts.agent]     - Agent id (default: bytebot)
 * @param {object}   [opts.context]   - Additional context passed to backend
 * @param {object}   workspaceCtx     - { createObject, appendLog, setStatus, patchObject }
 * @param {function} [onNavigate]     - Called with 'workspace' when run starts
 * @returns {string} runId
 */
export async function startRun(opts, workspaceCtx, onNavigate) {
  const { task, agent = 'bytebot', context = {} } = opts;
  const runId  = genId();
  const now    = Date.now();

  const runState = {
    runId,
    agent,
    task,
    status:    'queued',
    progress:  0,
    steps:     [],
    logs:      [],
    result:    null,
    error:     null,
    mode:      'synthetic',
    createdAt: now,
    updatedAt: now,
    cancelled: false,
    wsObjId:   null,
  };
  _runs.set(runId, runState);
  notify();

  // Create a LOG object in workspace immediately
  const wsObjId = genId();
  runState.wsObjId = wsObjId;

  workspaceCtx.createObject({
    id:      wsObjId,
    type:    OBJ_TYPE.LOG,
    title:   `${agent} — ${task.slice(0, 45)}`,
    content: `Task: ${task}\nAgent: ${agent}\nStatus: queued…`,
    agent,
    status:  RUN_STATUS.QUEUED,
    steps:   [],
    progress: 0,
  });
  onNavigate?.('workspace');

  // Persist run start
  persistRun({ runId, agent, task, status: 'queued', mode: 'synthetic', steps: [] }).catch(() => {});

  // Advance to running
  _patchRun(runId, { status: 'running' });
  workspaceCtx.setStatus(wsObjId, RUN_STATUS.RUNNING);
  _emitLog(runId, workspaceCtx, `[${agent}] Starting run: ${task}`);

  // Execute the run in background
  _executeRun(runId, task, agent, context, workspaceCtx).catch(err => {
    _patchRun(runId, { status: 'error', error: err.message });
    workspaceCtx.setStatus(wsObjId, RUN_STATUS.ERROR);
    _emitLog(runId, workspaceCtx, `Error: ${err.message}`);
    persistLog(runId, 'error', err.message).catch(() => {});
  });

  return runId;
}

/**
 * Cancel a running run.
 */
export function cancelRun(runId) {
  const run = _runs.get(runId);
  if (!run) return;
  run.cancelled = true;
  _patchRun(runId, { status: 'cancelled' });
}

/**
 * Get all active/recent runs.
 */
export { getRunList };

// ── Internal execution ────────────────────────────────────────────────────────

async function _executeRun(runId, task, agent, context, workspaceCtx) {
  const run = _runs.get(runId);
  if (!run || run.cancelled) return;

  const wsObjId = run.wsObjId;

  try {
    // Synthetic pre-steps while we call the backend
    _emitLog(runId, workspaceCtx, `[${agent}] Analyzing task…`);
    _patchRun(runId, { progress: 10 });

    const res  = await fetch(`${API_URL}/api/agents/run`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ task, agent, context, runId }),
    });

    if (run.cancelled) return;

    if (!res.ok) {
      throw new Error(`Backend returned ${res.status}`);
    }

    const data = await res.json();

    if (run.cancelled) return;

    const steps    = data.steps || [];
    const result   = data.result || data.error || 'No result';
    const mode     = data.mode || 'synthetic';
    const summary  = data.summary || task.slice(0, 60);
    const artifacts = data.artifacts || [];

    // Emit step logs
    let progress = 10;
    for (const step of steps) {
      if (run.cancelled) return;
      const stepProgress = Math.min(10 + Math.round((step.step / (steps.length || 1)) * 85), 95);
      progress = stepProgress;
      _patchRun(runId, { progress });
      _emitLog(runId, workspaceCtx, `[step ${step.step}] ${step.label} — ${step.status}`);
      workspaceCtx.patchObject(wsObjId, { progress, steps });
    }

    _patchRun(runId, { status: 'complete', progress: 100, result, mode, steps });
    workspaceCtx.setStatus(wsObjId, RUN_STATUS.DONE);
    workspaceCtx.patchObject(wsObjId, {
      progress: 100,
      steps,
      content: result,
      meta: { agent, mode, summary, artifacts },
    });
    _emitLog(runId, workspaceCtx, `Run complete — ${summary}`);

    // Persist completion
    persistRun({ runId, agent, task, status: 'complete', mode, steps, result }).catch(() => {});
    persistLog(runId, 'info', `Run completed: ${summary}`).catch(() => {});

    // Create result workspace object
    const wsType = data.workspace_object?.type || inferWsType(result, agent);
    workspaceCtx.createObject({
      type:     wsType,
      title:    summary,
      content:  result,
      agent,
      status:   RUN_STATUS.DONE,
      steps,
      progress: 100,
      meta:     { agent, mode, summary, runId, artifacts },
    });

    // Persist artifacts
    for (const art of artifacts) {
      persistArtifact({ type: art.type || 'report', title: art.title, content: art.content, agent, runId }).catch(() => {});
    }

  } catch (err) {
    if (run.cancelled) return;

    // Synthetic fallback on network/API error
    const syntheticResult = buildSyntheticResult(task, agent);
    _patchRun(runId, { status: 'complete', progress: 100, result: syntheticResult, mode: 'synthetic' });
    workspaceCtx.setStatus(wsObjId, RUN_STATUS.DONE);
    workspaceCtx.patchObject(wsObjId, {
      progress: 100,
      content:  syntheticResult,
      meta:     { agent, mode: 'synthetic', error: err.message },
    });
    _emitLog(runId, workspaceCtx, `[synthetic] Backend unavailable — synthetic fallback`);

    workspaceCtx.createObject({
      type:     OBJ_TYPE.AGENT_RUN,
      title:    `[Synthetic] ${agent}: ${task.slice(0, 45)}`,
      content:  syntheticResult,
      agent,
      status:   RUN_STATUS.DONE,
      steps:    [
        { step: 1, label: 'Task received',     status: 'complete' },
        { step: 2, label: 'Backend offline',   status: 'skipped'  },
        { step: 3, label: 'Synthetic fallback',status: 'complete' },
      ],
      progress: 100,
      meta:     { agent, mode: 'synthetic', error: err.message },
    });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _patchRun(runId, patch) {
  const run = _runs.get(runId);
  if (!run) return;
  Object.assign(run, patch, { updatedAt: Date.now() });
  notify();
}

function _emitLog(runId, workspaceCtx, line) {
  const run = _runs.get(runId);
  if (!run) return;
  run.logs.push({ ts: Date.now(), line });
  if (run.wsObjId) workspaceCtx.appendLog(run.wsObjId, line);
  notify();
  persistLog(runId, 'info', line).catch(() => {});
}

function inferWsType(result, agentId) {
  if (!result) return OBJ_TYPE.AGENT_RUN;
  if (result.includes('```')) return OBJ_TYPE.CODE;
  const lower = result.toLowerCase();
  if (agentId === 'builder') return OBJ_TYPE.UI;
  if (agentId === 'research' || lower.includes('findings') || lower.includes('research')) return OBJ_TYPE.SEARCH;
  if (agentId === 'scraper') return OBJ_TYPE.SCRAPE;
  return OBJ_TYPE.AGENT_RUN;
}

const SYNTHETIC_TEMPLATES = {
  bytebot: (task) => `# ByteBot Run — Synthetic\n\nTask: ${task}\n\n## Steps Executed\n\n1. Task received and parsed\n2. Context analyzed\n3. Backend LLM unavailable — synthetic mode active\n\n## Result\n\nNo live backend configured. Set OPENAI_API_KEY to enable real ByteBot execution.\n\n**Mode:** synthetic`,
  research: (task) => `# Research Report — Synthetic\n\nQuery: ${task}\n\n## Summary\n\nSynthetic research result. No live LLM — set OPENAI_API_KEY.\n\n**Mode:** synthetic`,
  builder: (task) => `# Build Result — Synthetic\n\nTask: ${task}\n\n\`\`\`jsx\n// Synthetic build — no live LLM\n// Set OPENAI_API_KEY for real code generation\nfunction GeneratedComponent() {\n  return <div>Placeholder</div>;\n}\n\`\`\`\n\n**Mode:** synthetic`,
  default: (task) => `# Agent Result — Synthetic\n\nTask: ${task}\n\nNo live backend. Set OPENAI_API_KEY.\n\n**Mode:** synthetic`,
};

function buildSyntheticResult(task, agent) {
  const fn = SYNTHETIC_TEMPLATES[agent] || SYNTHETIC_TEMPLATES.default;
  return fn(task);
}
