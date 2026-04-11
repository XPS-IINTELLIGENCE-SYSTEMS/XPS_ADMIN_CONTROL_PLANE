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
import { startBrowserJob } from './browserJobRuntime.js';
import { createRunGroup, updateGroupJobStatus } from './parallelRunGroup.js';
import {
  persistRun,
  persistLog,
  persistArtifact,
  persistSearchJob,
  persistScrapeJob,
  persistWorkspaceObject,
  persistConnectorSnapshot,
  persistPreStageItem,
  persistStageItem,
  persistHubSpotExport,
  persistAirtableExport,
  persistRuntimeLedger,
  persistRecoveryQueue,
} from './supabasePersistence.js';

const API_URL = import.meta.env.API_URL || '';
const RETRY_DELAY_BASE_MS = 600;

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
  const retryAttempts = Math.max(0, Number(context?.retryAttempts ?? context?.maxRetries ?? context?.retries ?? 1));

  try {
    _emitLog(runId, workspaceCtx, `[${agent}] Analyzing task…`);
    _patchRun(runId, { progress: 6 });

    const data = await runWithRetry(async () => {
      const res = await fetch(`${API_URL}/api/agents/run`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ task, agent, context, runId }),
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      return res.json();
    }, retryAttempts, runId, workspaceCtx);

    if (run.cancelled) return;

    const plan        = Array.isArray(data.plan) ? data.plan : [];
    const result      = data.result || data.error || 'No result';
    const mode        = data.mode || 'synthetic';
    const summary     = data.summary || task.slice(0, 60);
    const artifacts   = Array.isArray(data.artifacts) ? data.artifacts : [];
    const steps       = normalizeSteps(data.steps || plan, agent);
    const staging     = normalizeStaging(data.staging);
    const connectors  = data.connector_state || null;
    const blockedCaps = Array.isArray(data.blocked_capabilities) ? data.blocked_capabilities : [];

    _emitLog(runId, workspaceCtx, `[${agent}] Plan received — ${steps.length || 0} steps`);
    _patchRun(runId, { steps, mode });
    workspaceCtx.patchObject(wsObjId, { steps, progress: 12 });

    if (plan.length) {
      createWorkspaceObject(workspaceCtx, {
        type: OBJ_TYPE.WORKFLOW,
        title: `Run Plan — ${task.slice(0, 40)}`,
        content: formatPlan(plan),
        agent,
        status: RUN_STATUS.DONE,
        meta: { plan, runId, mode },
      }, runId);
    }

    if (connectors) {
      createWorkspaceObject(workspaceCtx, {
        type: OBJ_TYPE.RUNTIME_STATE,
        title: 'Connector State',
        content: formatConnectorState(connectors),
        agent,
        status: RUN_STATUS.DONE,
        meta: { connectors, mode, runId },
      }, runId);
      persistConnectorSnapshot({ connectors, mode, triggeredBy: 'run' }).catch(() => {});
    }

    if (blockedCaps.length) {
      createWorkspaceObject(workspaceCtx, {
        type: OBJ_TYPE.RUNTIME_STATE,
        title: 'Blocked Capabilities',
        content: blockedCaps.map(c => `${c.capability}: ${c.reason}`).join('\n'),
        agent,
        status: RUN_STATUS.DONE,
        meta: { blockedCaps, mode, runId },
      }, runId);
    }

    const totalSteps = steps.length || 1;
    let completedSteps = 0;
    const executedGroups = new Set();

    for (const step of steps) {
      if (run.cancelled) return;

      if (step.parallel) {
        const groupKey = step.group || `group-${step.step}`;
        if (executedGroups.has(groupKey)) continue;
        const groupSteps = steps.filter(s => s.parallel && (s.group || `group-${s.step}`) === groupKey);
        const groupId = createRunGroup(`Parallel Group ${groupKey}`, groupSteps.map(s => ({
          jobId: `${runId}-${s.step}`,
          title: s.label,
          type: s.action,
          status: 'queued',
        })), workspaceCtx);

        await Promise.all(groupSteps.map(async (groupStep) => {
          if (run.cancelled) return;
          markStepStatus(groupStep, steps, 'running', runId, wsObjId, workspaceCtx);
          try {
            await executeStepAction(groupStep, runId, task, context, workspaceCtx);
            markStepStatus(groupStep, steps, 'complete', runId, wsObjId, workspaceCtx);
            updateGroupJobStatus(groupId, `${runId}-${groupStep.step}`, 'complete', workspaceCtx);
          } catch (err) {
            markStepStatus(groupStep, steps, 'error', runId, wsObjId, workspaceCtx);
            updateGroupJobStatus(groupId, `${runId}-${groupStep.step}`, 'error', workspaceCtx);
            persistRecoveryQueue({ runId, action: groupStep.action || 'parallel_step', payload: { step: groupStep, error: err.message }, status: 'queued', lastError: err.message }).catch(() => {});
          } finally {
            completedSteps += 1;
            updateProgress(runId, wsObjId, completedSteps, totalSteps, workspaceCtx);
          }
        }));

        executedGroups.add(groupKey);
        continue;
      }

      markStepStatus(step, steps, 'running', runId, wsObjId, workspaceCtx);
      try {
        await executeStepAction(step, runId, task, context, workspaceCtx);
        markStepStatus(step, steps, 'complete', runId, wsObjId, workspaceCtx);
      } catch (err) {
        markStepStatus(step, steps, 'error', runId, wsObjId, workspaceCtx);
        persistRecoveryQueue({ runId, action: step.action || 'step', payload: { step, error: err.message }, status: 'queued', lastError: err.message }).catch(() => {});
      } finally {
        completedSteps += 1;
        updateProgress(runId, wsObjId, completedSteps, totalSteps, workspaceCtx);
      }
    }

    _patchRun(runId, { status: 'complete', progress: 100, result, mode, steps });
    workspaceCtx.setStatus(wsObjId, RUN_STATUS.DONE);
    workspaceCtx.patchObject(wsObjId, {
      progress: 100,
      steps,
      content: result,
      meta: { agent, mode, summary, artifacts, runId },
    });
    _emitLog(runId, workspaceCtx, `Run complete — ${summary}`);

    persistRun({ runId, agent, task, status: 'complete', mode, steps, result, summary, artifacts }).catch(() => {});
    persistLog(runId, 'info', `Run completed: ${summary}`).catch(() => {});

    const wsType = data.workspace_object?.type || inferWsType(result, agent);
    createWorkspaceObject(workspaceCtx, {
      type: wsType,
      title: summary,
      content: result,
      agent,
      status: RUN_STATUS.DONE,
      steps,
      progress: 100,
      meta: { agent, mode, summary, runId, artifacts },
    }, runId);

    for (const art of artifacts) {
      persistArtifact({ type: art.type || 'report', title: art.title, content: art.content, agent, runId, meta: art.meta || {} }).catch(() => {});
      createWorkspaceObject(workspaceCtx, {
        type: mapArtifactType(art.type),
        title: art.title || summary,
        content: art.content || '',
        agent,
        status: RUN_STATUS.DONE,
        meta: { ...art.meta, runId },
      }, runId);
    }

    if (Array.isArray(data.workspace_objects)) {
      data.workspace_objects.forEach(obj => {
        createWorkspaceObject(workspaceCtx, {
          type: obj.type || OBJ_TYPE.REPORT,
          title: obj.title || summary,
          content: obj.content || '',
          agent,
          status: RUN_STATUS.DONE,
          meta: obj.meta || {},
        }, runId);
      });
    }

    recordStaging(runId, staging, workspaceCtx, agent);

  } catch (err) {
    if (run.cancelled) return;

    const syntheticResult = buildSyntheticResult(task, agent);
    _patchRun(runId, { status: 'complete', progress: 100, result: syntheticResult, mode: 'synthetic' });
    workspaceCtx.setStatus(wsObjId, RUN_STATUS.DONE);
    workspaceCtx.patchObject(wsObjId, {
      progress: 100,
      content:  syntheticResult,
      meta:     { agent, mode: 'synthetic', error: err.message },
    });
    _emitLog(runId, workspaceCtx, `[synthetic] Backend unavailable — synthetic fallback`);

    createWorkspaceObject(workspaceCtx, {
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
    }, runId);
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

function normalizeSteps(rawSteps, fallbackAgent) {
  if (!Array.isArray(rawSteps)) return [];
  return rawSteps.map((step, i) => ({
    step: step.step ?? i + 1,
    label: step.label ?? `Step ${i + 1}`,
    status: step.status ?? 'pending',
    parallel: step.parallel ?? false,
    action: step.action ?? 'run',
    agent: step.agent ?? fallbackAgent,
    group: step.group ?? null,
    details: step.details ?? '',
  }));
}

function normalizeStaging(staging) {
  return {
    pre_stage: Array.isArray(staging?.pre_stage) ? staging.pre_stage : [],
    stage: Array.isArray(staging?.stage) ? staging.stage : [],
    hubspot_ready: Array.isArray(staging?.hubspot_ready) ? staging.hubspot_ready : [],
    airtable_ready: Array.isArray(staging?.airtable_ready) ? staging.airtable_ready : [],
    runtime_ledger: Array.isArray(staging?.runtime_ledger) ? staging.runtime_ledger : [],
    recovery_queue: Array.isArray(staging?.recovery_queue) ? staging.recovery_queue : [],
  };
}

function formatPlan(plan) {
  if (!plan?.length) return 'No execution plan returned.';
  return plan
    .map(step => {
      const action = step.action ? ` (${step.action})` : '';
      const agent = step.agent ? ` [${step.agent}]` : '';
      return `${step.step ?? ''}. ${step.label || 'Step'}${action}${agent}`;
    })
    .join('\n');
}

function formatConnectorState(connectors) {
  return Object.entries(connectors || {})
    .map(([name, val]) => `${name}: ${val.status || 'unknown'} (${val.mode || 'unknown'})`)
    .join('\n');
}

function mapArtifactType(type) {
  switch ((type || '').toLowerCase()) {
    case 'code':
      return OBJ_TYPE.CODE;
    case 'data':
      return OBJ_TYPE.DATA;
    case 'ui':
      return OBJ_TYPE.UI;
    case 'workflow':
      return OBJ_TYPE.WORKFLOW;
    case 'report':
    default:
      return OBJ_TYPE.REPORT;
  }
}

function createWorkspaceObject(workspaceCtx, payload, runId) {
  const id = payload.id || genId();
  workspaceCtx.createObject({ ...payload, id });
  persistWorkspaceObject({ id, runId, ...payload }).catch(() => {});
  return id;
}

function markStepStatus(step, steps, status, runId, wsObjId, workspaceCtx) {
  step.status = status;
  _emitLog(runId, workspaceCtx, `[step ${step.step}] ${step.label} — ${status}`);
  workspaceCtx.patchObject(wsObjId, { steps: [...steps] });
}

function updateProgress(runId, wsObjId, completed, total, workspaceCtx) {
  const progress = Math.min(10 + Math.round((completed / total) * 85), 95);
  _patchRun(runId, { progress });
  workspaceCtx.patchObject(wsObjId, { progress });
}

async function executeStepAction(step, runId, task, context, workspaceCtx) {
  const action = (step.action || '').toLowerCase();
  const stepTask = step.details || step.label || task;
  const stepAgent = step.agent || 'bytebot';

  if (stepAgent && stepAgent !== 'bytebot') {
    return runSubAgent(stepAgent, stepTask, runId, context, workspaceCtx);
  }

  if (action.includes('search') || action.includes('research')) {
    return runSearch(stepTask, runId, workspaceCtx);
  }

  if (action.includes('scrape')) {
    const url = extractUrl(stepTask) || context?.url;
    return runScrape(url, stepTask, runId, workspaceCtx);
  }

  if (action.includes('browser')) {
    const url = extractUrl(stepTask) || context?.url;
    if (!url) {
      _emitLog(runId, workspaceCtx, '[browser] No URL provided for browser step.');
      return null;
    }
    return startBrowserJob({ url, action: 'scrape', prompt: stepTask }, workspaceCtx);
  }

  if (action.includes('connector') || action.includes('status')) {
    const res = await fetch(`${API_URL}/api/control?action=connector_status`);
    if (!res.ok) throw new Error(`Control plane returned ${res.status}`);
    const data = await res.json();
    if (data.workspace_object) {
      createWorkspaceObject(workspaceCtx, {
        type: data.workspace_object.type || OBJ_TYPE.RUNTIME_STATE,
        title: data.workspace_object.title,
        content: data.workspace_object.content,
        agent: 'control',
        status: RUN_STATUS.DONE,
        meta: data.workspace_object.meta,
      }, runId);
    }
    return data;
  }

  if (action.includes('export') && action.includes('hubspot')) {
    persistHubSpotExport({ runId, payload: { task: stepTask }, status: 'queued', blockedReason: context?.hubspotBlockedReason || null }).catch(() => {});
    createWorkspaceObject(workspaceCtx, {
      type: OBJ_TYPE.HUBSPOT_EXPORT,
      title: 'HubSpot Export Staging',
      content: `Export queued: ${stepTask}`,
      agent: stepAgent,
      status: RUN_STATUS.DONE,
      meta: { runId, target: 'hubspot' },
    }, runId);
    return null;
  }

  if (action.includes('export') && action.includes('airtable')) {
    persistAirtableExport({ runId, payload: { task: stepTask }, status: 'queued', blockedReason: context?.airtableBlockedReason || null }).catch(() => {});
    createWorkspaceObject(workspaceCtx, {
      type: OBJ_TYPE.AIRTABLE_EXPORT,
      title: 'Airtable Export Staging',
      content: `Export queued: ${stepTask}`,
      agent: stepAgent,
      status: RUN_STATUS.DONE,
      meta: { runId, target: 'airtable' },
    }, runId);
    return null;
  }

  if (action.includes('email') || action.includes('sendgrid')) {
    const sendgridReady = isConnectorReady(context, 'sendgrid');
    createWorkspaceObject(workspaceCtx, {
      type: OBJ_TYPE.CONNECTOR_ACTION,
      title: sendgridReady ? 'SendGrid Email Runbook' : 'SendGrid Blocked',
      content: sendgridReady
        ? `Email orchestration staged.\n\nTask: ${stepTask}\n\nCapability state: substitute-path\nNext action: route through a verified SendGrid execution endpoint when server-side send is implemented.`
        : `Email orchestration blocked.\n\nTask: ${stepTask}\n\nReason: ${getConnectorReason(context, 'sendgrid', 'Configure SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.')}`,
      agent: stepAgent,
      status: RUN_STATUS.DONE,
      meta: { connector: 'sendgrid', mode: sendgridReady ? 'substitute-path' : 'blocked', runId },
    }, runId);
    return null;
  }

  if (action.includes('call') || action.includes('twilio') || action.includes('phone')) {
    const twilioReady = isConnectorReady(context, 'twilio');
    createWorkspaceObject(workspaceCtx, {
      type: OBJ_TYPE.CONNECTOR_ACTION,
      title: twilioReady ? 'Twilio Call Runbook' : 'Twilio Blocked',
      content: twilioReady
        ? `Call orchestration staged.\n\nTask: ${stepTask}\n\nCapability state: substitute-path\nNext action: wire the staged runbook to a Twilio execution endpoint for outbound or inbound call control.`
        : `Call orchestration blocked.\n\nTask: ${stepTask}\n\nReason: ${getConnectorReason(context, 'twilio', 'Configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.')}`,
      agent: stepAgent,
      status: RUN_STATUS.DONE,
      meta: { connector: 'twilio', mode: twilioReady ? 'substitute-path' : 'blocked', runId },
    }, runId);
    return null;
  }

  if (action.includes('image')) {
    const mediaReady = isMediaReady(context, 'image');
    createWorkspaceObject(workspaceCtx, {
      type: OBJ_TYPE.IMAGE,
      title: mediaReady ? 'Image Workflow Brief' : 'Image Generation Blocked',
      content: mediaReady
        ? `Image generation substitute path prepared.\n\nPrompt: ${stepTask}\n\nStatus: substitute-path — use the active LLM/media runtime to refine prompt and hand off to a dedicated generator when connected.`
        : `Image generation blocked.\n\nPrompt: ${stepTask}\n\nReason: ${getMediaReason(context, 'image', 'Configure an LLM/media runtime to prepare image workflows.')}`,
      agent: stepAgent,
      status: RUN_STATUS.DONE,
      meta: { mode: mediaReady ? 'substitute-path' : 'blocked', runId },
    }, runId);
    return null;
  }

  if (action.includes('video')) {
    const mediaReady = isMediaReady(context, 'video');
    createWorkspaceObject(workspaceCtx, {
      type: OBJ_TYPE.VIDEO,
      title: mediaReady ? 'Video Workflow Brief' : 'Video Generation Blocked',
      content: mediaReady
        ? `Video workflow substitute path prepared.\n\nPrompt: ${stepTask}\n\nStatus: substitute-path — capture brief, storyboard, and prompts now; direct video generation runtime remains pending.`
        : `Video generation blocked.\n\nPrompt: ${stepTask}\n\nReason: ${getMediaReason(context, 'video', 'Video generation is not wired in the current runtime.')}`,
      agent: stepAgent,
      status: RUN_STATUS.DONE,
      meta: { mode: mediaReady ? 'substitute-path' : 'blocked', runId },
    }, runId);
    return null;
  }

  if (action.includes('build') || action.includes('mutat') || action.includes('layout') || action.includes('ui')) {
    createWorkspaceObject(workspaceCtx, {
      type: OBJ_TYPE.SITE_MUTATION || OBJ_TYPE.UI,
      title: 'Site Mutation Runbook',
      content: `Governed site mutation staged.\n\nTask: ${stepTask}\n\nNext action: open the UI editor in the workspace, preview the change, then apply or rollback through governed controls.`,
      agent: stepAgent,
      status: RUN_STATUS.DONE,
      meta: { mode: 'write-enabled', runId },
    }, runId);
    return null;
  }

  _emitLog(runId, workspaceCtx, `[${stepAgent}] Step "${step.label}" marked complete without tool execution.`);
  return null;
}

async function runSubAgent(stepAgent, stepTask, runId, context, workspaceCtx) {
  const res = await fetch(`${API_URL}/api/agents/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task: stepTask, agent: stepAgent, context, runId: `${runId}-${stepAgent}` }),
  });
  if (!res.ok) throw new Error(`Sub-agent ${stepAgent} returned ${res.status}`);
  const data = await res.json();
  if (data.workspace_object) {
    createWorkspaceObject(workspaceCtx, {
      type: data.workspace_object.type || OBJ_TYPE.REPORT,
      title: data.workspace_object.title || stepTask.slice(0, 60),
      content: data.workspace_object.content || data.result || '',
      agent: stepAgent,
      status: RUN_STATUS.DONE,
      meta: data.workspace_object.meta || {},
    }, runId);
  }
  return data;
}

async function runSearch(query, runId, workspaceCtx) {
  const res = await fetch(`${API_URL}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, runId }),
  });
  if (!res.ok) throw new Error(`Search returned ${res.status}`);
  const data = await res.json();
  if (data.workspace_object) {
    createWorkspaceObject(workspaceCtx, {
      type: data.workspace_object.type || OBJ_TYPE.SEARCH,
      title: data.workspace_object.title,
      content: data.workspace_object.content,
      agent: 'research',
      status: RUN_STATUS.DONE,
      meta: data.workspace_object.meta,
    }, runId);
  }
  persistSearchJob({ query, context: null, status: 'complete', summary: data.summary, sources: data.sources || [], mode: data.mode || 'synthetic' }).catch(() => {});
  return data;
}

async function runScrape(url, prompt, runId, workspaceCtx) {
  if (!url) {
    _emitLog(runId, workspaceCtx, '[scrape] No URL provided for scrape step.');
    return null;
  }
  const res = await fetch(`${API_URL}/api/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, prompt, runId }),
  });
  if (!res.ok) throw new Error(`Scrape returned ${res.status}`);
  const data = await res.json();
  if (data.workspace_object) {
    createWorkspaceObject(workspaceCtx, {
      type: data.workspace_object.type || OBJ_TYPE.SCRAPE,
      title: data.workspace_object.title,
      content: data.workspace_object.content,
      agent: 'scraper',
      status: RUN_STATUS.DONE,
      meta: data.workspace_object.meta,
    }, runId);
  }
  persistScrapeJob({ url, prompt, status: 'complete', result: data.summary, rawContent: null, mode: data.mode || 'synthetic' }).catch(() => {});
  return data;
}

function extractUrl(text) {
  const match = (text || '').match(/https?:\/\/[^\s)]+/i);
  return match ? match[0] : null;
}

function isConnectorReady(context, name) {
  const connector = context?.operatorState?.[name];
  return !!(connector?.configured || connector?.status === 'connected');
}

function getConnectorReason(context, name, fallback) {
  return context?.operatorState?.[name]?.reason || fallback;
}

function isMediaReady(context, type) {
  const moduleState = context?.operatorModules?.media?.[type === 'video' ? 'video_generation' : 'image_generation'];
  return ['substitute-path', 'write-enabled', 'connected'].includes(moduleState);
}

function getMediaReason(context, type, fallback) {
  const moduleState = context?.operatorModules?.media?.[type === 'video' ? 'video_generation' : 'image_generation'];
  if (moduleState) return `Capability state: ${moduleState}`;
  return fallback;
}

function recordStaging(runId, staging, workspaceCtx, agent) {
  if (staging.pre_stage.length) {
    staging.pre_stage.forEach(item => persistPreStageItem({ runId, payload: item, status: 'queued' }).catch(() => {}));
    createWorkspaceObject(workspaceCtx, {
      type: OBJ_TYPE.PRE_STAGE,
      title: 'Pre-Stage Queue',
      content: JSON.stringify(staging.pre_stage, null, 2),
      agent,
      status: RUN_STATUS.DONE,
      meta: { runId, count: staging.pre_stage.length },
    }, runId);
  }

  if (staging.stage.length) {
    staging.stage.forEach(item => persistStageItem({ runId, payload: item, status: 'queued' }).catch(() => {}));
    createWorkspaceObject(workspaceCtx, {
      type: OBJ_TYPE.STAGE,
      title: 'Stage Queue',
      content: JSON.stringify(staging.stage, null, 2),
      agent,
      status: RUN_STATUS.DONE,
      meta: { runId, count: staging.stage.length },
    }, runId);
  }

  if (staging.hubspot_ready.length) {
    staging.hubspot_ready.forEach(item => persistHubSpotExport({ runId, payload: item, status: 'queued' }).catch(() => {}));
    createWorkspaceObject(workspaceCtx, {
      type: OBJ_TYPE.HUBSPOT_EXPORT,
      title: 'HubSpot Export Staging',
      content: JSON.stringify(staging.hubspot_ready, null, 2),
      agent,
      status: RUN_STATUS.DONE,
      meta: { runId, count: staging.hubspot_ready.length },
    }, runId);
  }

  if (staging.airtable_ready.length) {
    staging.airtable_ready.forEach(item => persistAirtableExport({ runId, payload: item, status: 'queued' }).catch(() => {}));
    createWorkspaceObject(workspaceCtx, {
      type: OBJ_TYPE.AIRTABLE_EXPORT,
      title: 'Airtable Export Staging',
      content: JSON.stringify(staging.airtable_ready, null, 2),
      agent,
      status: RUN_STATUS.DONE,
      meta: { runId, count: staging.airtable_ready.length },
    }, runId);
  }

  if (staging.runtime_ledger.length) {
    staging.runtime_ledger.forEach(entry => persistRuntimeLedger({ runId, entryType: entry.entry_type || 'event', payload: entry }).catch(() => {}));
    createWorkspaceObject(workspaceCtx, {
      type: OBJ_TYPE.RUNTIME_LEDGER,
      title: 'Runtime Ledger',
      content: JSON.stringify(staging.runtime_ledger, null, 2),
      agent,
      status: RUN_STATUS.DONE,
      meta: { runId, count: staging.runtime_ledger.length },
    }, runId);
  }

  if (staging.recovery_queue.length) {
    staging.recovery_queue.forEach(entry => persistRecoveryQueue({ runId, action: entry.action || 'retry', payload: entry.payload || entry, status: 'queued', lastError: entry.reason || null }).catch(() => {}));
    createWorkspaceObject(workspaceCtx, {
      type: OBJ_TYPE.RECOVERY_QUEUE,
      title: 'Recovery Queue',
      content: JSON.stringify(staging.recovery_queue, null, 2),
      agent,
      status: RUN_STATUS.DONE,
      meta: { runId, count: staging.recovery_queue.length },
    }, runId);
  }
}

async function runWithRetry(fn, retryAttempts, runId, workspaceCtx) {
  let attempt = 0;
  while (attempt <= retryAttempts) {
    try {
      if (attempt > 0) _emitLog(runId, workspaceCtx, `Retrying run (${attempt}/${retryAttempts})…`);
      return await fn();
    } catch (err) {
      if (attempt >= retryAttempts) throw err;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_BASE_MS * (attempt + 1)));
      attempt += 1;
    }
  }
  return null;
}
