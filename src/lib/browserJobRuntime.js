/**
 * Browser Job Runtime — client-side browser job queue manager.
 *
 * Mirrors bytebotRuntime.js pattern. Manages a queue of browser automation
 * jobs with per-job state, progress, cancellation, and workspace object
 * creation on result. Browser jobs call /api/browser/run and poll
 * /api/browser/status for live results (when worker is available).
 *
 * In production (no BROWSER_WORKER_URL), jobs return blocked status and
 * create a browser_session workspace object explaining how to enable.
 */

import { genId, OBJ_TYPE, RUN_STATUS } from './workspaceEngine.jsx';
import { persistBrowserJob } from './supabasePersistence.js';
import { loadBrowserJobSnapshot, saveBrowserJobSnapshot } from './orchestrationPersistence.js';

const API_URL = import.meta.env.API_URL || '';
const BROWSER_POLL_INTERVAL_MS = 1000;
const BROWSER_MAX_POLL_ATTEMPTS = 20;
// Browser jobs are heavier than standard runs because they may reserve a
// worker process/browser instance. Keep this low unless the worker/runtime
// is explicitly provisioned for higher concurrency.
const MAX_ACTIVE_BROWSER_JOBS = 2;

// ── Job state ─────────────────────────────────────────────────────────────────

const _jobs = new Map();   // jobId → JobState
const _subs = new Set();   // () => void

loadBrowserJobSnapshot().forEach((job) => {
  _jobs.set(job.jobId, job);
});

export function subscribeJobs(cb) {
  _subs.add(cb);
  return () => _subs.delete(cb);
}

function notify() {
  saveBrowserJobSnapshot([..._jobs.values()]);
  for (const cb of _subs) cb([..._jobs.values()]);
}

export function getJobList() {
  return [..._jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function getJob(jobId) {
  return _jobs.get(jobId) || null;
}

// ── Browser job API ───────────────────────────────────────────────────────────

/**
 * Start a browser job.
 *
 * @param {object}   opts
 * @param {string}   opts.url       - Target URL
 * @param {string}   [opts.action]  - 'scrape'|'screenshot'|'extract'|'research'
 * @param {string}   [opts.prompt]  - Extraction/analysis prompt
 * @param {object}   workspaceCtx   - { createObject, appendLog, setStatus, patchObject }
 * @param {function} [onNavigate]   - Called with 'workspace' on job start
 * @returns {string} jobId
 */
export async function startBrowserJob(opts, workspaceCtx, onNavigate) {
  const { url, action = 'scrape', prompt = '', workerUrl = '', runtimeTarget = 'local', repoTarget = null, deploymentTarget = 'preview' } = opts;
  const jobId = genId();
  const now   = Date.now();
  const history = [{ ts: new Date().toISOString(), status: 'queued', detail: `Browser job queued for ${url}` }];

  const jobState = {
    jobId,
    url,
    action,
    prompt,
    status:    'queued',
    progress:  0,
    logs:      [],
    result:    null,
    error:     null,
    mode:      workerUrl ? 'local' : 'blocked',
    createdAt: now,
    updatedAt: now,
    cancelled: false,
    wsObjId:   null,
    attempt:   Number(opts.attempt || 1),
    history,
    runtime:   { workspaceCtx, onNavigate, opts: { url, action, prompt, workerUrl, runtimeTarget, repoTarget, deploymentTarget } },
  };
  _jobs.set(jobId, jobState);
  notify();

  // Create workspace object immediately
  const wsObjId = genId();
  jobState.wsObjId = wsObjId;

  workspaceCtx.createObject({
    id:      wsObjId,
    type:    OBJ_TYPE.BROWSER_SESSION,
    title:   `Browser: ${url.slice(0, 50)}`,
    content: `URL: ${url}\nAction: ${action}\nStatus: queued…`,
    status:  RUN_STATUS.QUEUED,
    meta:    { url, action, job_id: jobId, mode: workerUrl ? 'local' : 'queued', workerUrl: workerUrl || null, runtimeTarget, repoTarget, deploymentTarget, history, attempt: jobState.attempt },
  });
  onNavigate?.('workspace');

  persistBrowserJob({ jobId, url, action, status: 'queued', mode: 'queued' }).catch(() => {});
  _processQueue();

  return jobId;
}

/**
 * Cancel a browser job.
 */
export async function cancelBrowserJob(jobId) {
  const job = _jobs.get(jobId);
  if (!job) return;
  job.cancelled = true;
  _patchJob(jobId, { status: 'cancelled', progress: 100 });
  _recordHistory(jobId, 'cancelled', 'Browser job cancelled by operator.');
  if (job.wsObjId) {
    job.runtime?.workspaceCtx?.setStatus(job.wsObjId, RUN_STATUS.CANCELLED);
    job.runtime?.workspaceCtx?.patchObject(job.wsObjId, {
      progress: 100,
      content: `URL: ${job.url}\nAction: ${job.action}\nStatus: cancelled\n\nCancelled by operator.`,
      meta: { url: job.url, action: job.action, job_id: jobId, mode: job.mode, workerUrl: job.runtime?.opts?.workerUrl || null, runtimeTarget: job.runtime?.opts?.runtimeTarget || 'local', repoTarget: job.runtime?.opts?.repoTarget || null, deploymentTarget: job.runtime?.opts?.deploymentTarget || 'preview', history: job.history, attempt: job.attempt },
    });
  }

  // Notify backend if job is in-flight
  try {
    await fetch(`${API_URL}/api/browser?action=cancel`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ job_id: jobId }),
    });
  } catch {}
  _processQueue();
}

export async function retryBrowserJob(jobId, workspaceCtx, onNavigate, overrides = {}) {
  const job = _jobs.get(jobId);
  if (!job) return null;
  const runtime = job.runtime || {};
  return startBrowserJob(
    {
        ...(runtime.opts || { url: job.url, action: job.action, prompt: job.prompt, workerUrl: job.mode === 'local' ? runtime.opts?.workerUrl : '' }),
      ...overrides,
      attempt: (job.attempt || 1) + 1,
    },
    workspaceCtx || runtime.workspaceCtx,
    onNavigate || runtime.onNavigate,
  );
}

export const recoverBrowserJob = retryBrowserJob;

// ── Internal execution ────────────────────────────────────────────────────────

async function _executeJob(jobId, url, action, prompt, workerUrl, workspaceCtx) {
  const job = _jobs.get(jobId);
  if (!job || job.cancelled) return;

  const wsObjId = job.wsObjId;

  try {
    _emitLog(jobId, workspaceCtx, `[browser] Calling /api/browser?action=run…`);
    _patchJob(jobId, { progress: 15 });
    workspaceCtx.patchObject(wsObjId, { progress: 15 });

    const res = await fetch(`${API_URL}/api/browser?action=run`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        url,
        action,
        prompt,
        job_id: jobId,
        worker_url: workerUrl || undefined,
        runtime_target: job.runtime?.opts?.runtimeTarget || 'local',
        repo_target: job.runtime?.opts?.repoTarget || undefined,
        deployment_target: job.runtime?.opts?.deploymentTarget || 'preview',
      }),
    });

    if (job.cancelled) return;

    const data = await res.json();

    if (job.cancelled) return;

    const status  = data.status || 'blocked';
    const mode    = data.mode   || (workerUrl ? 'local' : 'blocked');

    _emitLog(jobId, workspaceCtx, `[browser] Response: status=${status} mode=${mode}`);

    if (status === 'blocked') {
      // Honest blocked result
      _patchJob(jobId, { status: 'blocked', mode: 'blocked', result: data.reason, progress: 100 });
      _recordHistory(jobId, 'blocked', data.reason || 'Browser automation blocked.');
      workspaceCtx.setStatus(wsObjId, RUN_STATUS.DONE);
      workspaceCtx.patchObject(wsObjId, {
        progress: 100,
        content:  `URL: ${url}\nAction: ${action}\nStatus: blocked\n\n${data.reason || 'Browser automation requires a local worker.'}`,
        meta:     { url, action, job_id: jobId, mode: 'blocked', workerUrl: workerUrl || null, reason: data.reason, instructions: data.instructions, history: getJob(jobId)?.history || [], attempt: getJob(jobId)?.attempt || 1 },
      });
      _emitLog(jobId, workspaceCtx, `[browser] Blocked — ${data.reason}`);

      persistBrowserJob({ jobId, url, action, status: 'blocked', mode: 'blocked', result: data.reason }).catch(() => {});
      _processQueue();
      return;
    }

    if (status === 'queued' || status === 'running') {
      _patchJob(jobId, { status, mode, progress: status === 'running' ? 55 : 30 });
      _recordHistory(jobId, status, `Browser worker reported ${status}.`);
      workspaceCtx.patchObject(wsObjId, {
        progress: status === 'running' ? 55 : 30,
        content: `URL: ${url}\nAction: ${action}\nStatus: ${status}\n\nAwaiting worker completion…`,
        meta: { url, action, job_id: jobId, mode, workerUrl: workerUrl || null, history: getJob(jobId)?.history || [], attempt: getJob(jobId)?.attempt || 1 },
      });
      _emitLog(jobId, workspaceCtx, `[browser] Polling worker status…`);
      const settled = await pollBrowserStatus(jobId, workerUrl, workspaceCtx, wsObjId, url, action);
      return finalizeBrowserJob(jobId, wsObjId, url, action, settled, workspaceCtx, workerUrl);
    }

    return finalizeBrowserJob(jobId, wsObjId, url, action, data, workspaceCtx, workerUrl);

  } catch (err) {
    if (job.cancelled) return;
    _patchJob(jobId, { status: 'error', error: err.message, progress: 100 });
    _recordHistory(jobId, 'error', err.message);
    workspaceCtx.setStatus(wsObjId, RUN_STATUS.ERROR);
    workspaceCtx.patchObject(wsObjId, {
      progress: 100,
      content:  `URL: ${url}\nAction: ${action}\nError: ${err.message}`,
      meta:     { url, action, job_id: jobId, mode: 'error', error: err.message, history: getJob(jobId)?.history || [], attempt: getJob(jobId)?.attempt || 1 },
    });
    _emitLog(jobId, workspaceCtx, `Error: ${err.message}`);
    persistBrowserJob({ jobId, url, action, status: 'error', mode: 'error', result: err.message }).catch(() => {});
    _processQueue();
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _patchJob(jobId, patch) {
  const job = _jobs.get(jobId);
  if (!job) return;
  Object.assign(job, patch, { updatedAt: Date.now() });
  notify();
}

function _recordHistory(jobId, status, detail) {
  const job = _jobs.get(jobId);
  if (!job) return;
  job.history.unshift({ ts: new Date().toISOString(), status, detail });
  if (job.history.length > 20) job.history.length = 20;
  if (job.wsObjId) {
    job.runtime?.workspaceCtx?.patchObject(job.wsObjId, {
      meta: {
        url: job.url,
        action: job.action,
        job_id: jobId,
        mode: job.mode,
        workerUrl: job.runtime?.opts?.workerUrl || null,
        runtimeTarget: job.runtime?.opts?.runtimeTarget || 'local',
        repoTarget: job.runtime?.opts?.repoTarget || null,
        deploymentTarget: job.runtime?.opts?.deploymentTarget || 'preview',
        history: job.history,
        attempt: job.attempt,
      },
    });
  }
  notify();
}

function _emitLog(jobId, workspaceCtx, line) {
  const job = _jobs.get(jobId);
  if (!job) return;
  job.logs.push({ ts: Date.now(), line });
  if (job.wsObjId) workspaceCtx.appendLog(job.wsObjId, line);
  notify();
}

async function pollBrowserStatus(jobId, workerUrl, workspaceCtx, wsObjId, url, action) {
  for (let attempt = 0; attempt < BROWSER_MAX_POLL_ATTEMPTS; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, BROWSER_POLL_INTERVAL_MS));
    let data;
    try {
      const res = await fetch(`${API_URL}/api/browser?action=status&job_id=${encodeURIComponent(jobId)}${workerUrl ? `&worker_url=${encodeURIComponent(workerUrl)}` : ''}`);
      data = await res.json();
    } catch (err) {
      return {
        status: 'error',
        mode: workerUrl ? 'local' : 'blocked',
        error: `Browser worker status check failed: ${err.message}`,
      };
    }
    const nextStatus = data.status || 'running';
    _emitLog(jobId, workspaceCtx, `[browser] Poll ${attempt + 1}: ${nextStatus}`);
    if (nextStatus === 'queued' || nextStatus === 'running') {
      _recordHistory(jobId, nextStatus, `Worker poll ${attempt + 1}: ${nextStatus}`);
      workspaceCtx.patchObject(wsObjId, {
        progress: Math.min(90, 40 + attempt * 3),
        content: `URL: ${url}\nAction: ${action}\nStatus: ${nextStatus}\n\nWorker poll ${attempt + 1}…`,
        meta: { url, action, job_id: jobId, mode: data.mode || 'local', workerUrl: workerUrl || null, runtimeTarget: getJob(jobId)?.runtime?.opts?.runtimeTarget || 'local', repoTarget: getJob(jobId)?.runtime?.opts?.repoTarget || null, deploymentTarget: getJob(jobId)?.runtime?.opts?.deploymentTarget || 'preview', lastPollStatus: nextStatus, history: getJob(jobId)?.history || [], attempt: getJob(jobId)?.attempt || 1 },
      });
      continue;
    }
    return data;
  }
  return {
    status: 'error',
    mode: workerUrl ? 'local' : 'blocked',
    error: 'Browser worker polling timed out before completion.',
  };
}

function finalizeBrowserJob(jobId, wsObjId, url, action, data, workspaceCtx, workerUrl) {
  const mode = data.mode || (workerUrl ? 'local' : 'blocked');
  const status = data.status || 'error';

  if (status === 'blocked') {
    _patchJob(jobId, { status: 'blocked', mode, result: data.reason, progress: 100 });
    _recordHistory(jobId, 'blocked', data.reason || 'Browser job blocked.');
    workspaceCtx.setStatus(wsObjId, RUN_STATUS.DONE);
    workspaceCtx.patchObject(wsObjId, {
      progress: 100,
      content: `URL: ${url}\nAction: ${action}\nStatus: blocked\n\n${data.reason || 'Browser automation requires a worker.'}`,
      meta: { url, action, job_id: jobId, mode: 'blocked', workerUrl: workerUrl || null, runtimeTarget: getJob(jobId)?.runtime?.opts?.runtimeTarget || 'local', repoTarget: getJob(jobId)?.runtime?.opts?.repoTarget || null, deploymentTarget: getJob(jobId)?.runtime?.opts?.deploymentTarget || 'preview', reason: data.reason, instructions: data.instructions, history: getJob(jobId)?.history || [], attempt: getJob(jobId)?.attempt || 1 },
    });
    persistBrowserJob({ jobId, url, action, status: 'blocked', mode: 'blocked', result: data.reason }).catch(() => {});
    _processQueue();
    return data;
  }

  if (status === 'error') {
    const error = data.error || data.reason || 'Browser execution failed.';
    _patchJob(jobId, { status: 'error', error, progress: 100, mode });
    _recordHistory(jobId, 'error', error);
    workspaceCtx.setStatus(wsObjId, RUN_STATUS.ERROR);
    workspaceCtx.patchObject(wsObjId, {
      progress: 100,
      content: `URL: ${url}\nAction: ${action}\nStatus: error\n\n${error}`,
      meta: { url, action, job_id: jobId, mode, workerUrl: workerUrl || null, runtimeTarget: getJob(jobId)?.runtime?.opts?.runtimeTarget || 'local', repoTarget: getJob(jobId)?.runtime?.opts?.repoTarget || null, deploymentTarget: getJob(jobId)?.runtime?.opts?.deploymentTarget || 'preview', error, history: getJob(jobId)?.history || [], attempt: getJob(jobId)?.attempt || 1 },
    });
    _emitLog(jobId, workspaceCtx, `[browser] Error — ${error}`);
    persistBrowserJob({ jobId, url, action, status: 'error', mode, result: error }).catch(() => {});
    _processQueue();
    return data;
  }

  const resultText = data.extracted_text || data.result || data.summary || '';
  const screenshotUrl = data.screenshot_url || null;
  const evidence = Array.isArray(data.evidence) ? data.evidence : [];

  _patchJob(jobId, { status: 'complete', mode, result: resultText, progress: 100 });
  _recordHistory(jobId, 'complete', data.summary || 'Browser execution complete.');
  workspaceCtx.setStatus(wsObjId, RUN_STATUS.DONE);
  workspaceCtx.patchObject(wsObjId, {
    progress: 100,
    content: `URL: ${url}\nAction: ${action}\nStatus: complete\n\n${data.summary || resultText || 'Browser execution finished.'}`,
    meta: { url, action, job_id: jobId, mode, workerUrl: workerUrl || null, runtimeTarget: getJob(jobId)?.runtime?.opts?.runtimeTarget || 'local', repoTarget: getJob(jobId)?.runtime?.opts?.repoTarget || null, deploymentTarget: getJob(jobId)?.runtime?.opts?.deploymentTarget || 'preview', screenshot_url: screenshotUrl, history: getJob(jobId)?.history || [], attempt: getJob(jobId)?.attempt || 1 },
  });

  workspaceCtx.createObject({
    type: OBJ_TYPE.BROWSER_RESULT,
    title: `Result: ${url.slice(0, 50)}`,
    content: resultText,
    status: RUN_STATUS.DONE,
    meta: {
      url,
      action,
      job_id: jobId,
      mode,
      workerUrl: workerUrl || null,
      runtimeTarget: getJob(jobId)?.runtime?.opts?.runtimeTarget || 'local',
      repoTarget: getJob(jobId)?.runtime?.opts?.repoTarget || null,
      deploymentTarget: getJob(jobId)?.runtime?.opts?.deploymentTarget || 'preview',
      screenshot_url: screenshotUrl,
      extracted_text: resultText,
      evidence,
    },
  });

  if (screenshotUrl) {
    workspaceCtx.createObject({
      type: OBJ_TYPE.PAGE_SNAPSHOT,
      title: `Snapshot: ${url.slice(0, 40)}`,
      content: screenshotUrl,
      status: RUN_STATUS.DONE,
      meta: { url, action, job_id: jobId, mode, runtimeTarget: getJob(jobId)?.runtime?.opts?.runtimeTarget || 'local', repoTarget: getJob(jobId)?.runtime?.opts?.repoTarget || null, deploymentTarget: getJob(jobId)?.runtime?.opts?.deploymentTarget || 'preview', screenshot_url: screenshotUrl },
    });
  }

  if (evidence.length > 0) {
    workspaceCtx.createObject({
      type: OBJ_TYPE.EVIDENCE_BUNDLE,
      title: `Evidence: ${url.slice(0, 40)}`,
      content: evidence.map(e => `- ${e.title || e.url}: ${e.summary || ''}`).join('\n'),
      status: RUN_STATUS.DONE,
      meta: { items: evidence, source_url: url, job_id: jobId, mode },
    });
  }

  _emitLog(jobId, workspaceCtx, '[browser] Browser job complete');
  persistBrowserJob({ jobId, url, action, status: 'complete', mode, result: resultText }).catch(() => {});
  _processQueue();
  return data;
}

function _activeCount() {
  return [..._jobs.values()].filter((job) => job.status === 'running').length;
}

function _processQueue() {
  if (_activeCount() >= MAX_ACTIVE_BROWSER_JOBS) return;
  const next = [..._jobs.values()]
    .filter((job) => job.status === 'queued' && !job.cancelled)
    .sort((a, b) => a.createdAt - b.createdAt)[0];
  if (!next) return;
  _launchJob(next.jobId);
  if (_activeCount() < MAX_ACTIVE_BROWSER_JOBS) _processQueue();
}

function _launchJob(jobId) {
  const job = _jobs.get(jobId);
  if (!job || job.cancelled || job.status !== 'queued') return;
  const workspaceCtx = job.runtime?.workspaceCtx;
  _patchJob(jobId, { status: 'running' });
  _recordHistory(jobId, 'running', `Browser job started (attempt ${job.attempt}).`);
  workspaceCtx?.setStatus(job.wsObjId, RUN_STATUS.RUNNING);
  workspaceCtx?.patchObject(job.wsObjId, {
    content: `URL: ${job.url}\nAction: ${job.action}\nStatus: running…`,
    meta: {
      url: job.url,
      action: job.action,
      job_id: jobId,
      mode: job.runtime?.opts?.workerUrl ? 'local' : 'blocked',
      workerUrl: job.runtime?.opts?.workerUrl || null,
      history: job.history,
      attempt: job.attempt,
    },
  });
  _emitLog(jobId, workspaceCtx, `[browser] Starting ${job.action} job for ${job.url}`);
  _executeJob(jobId, job.url, job.action, job.prompt, job.runtime?.opts?.workerUrl || '', workspaceCtx).catch((err) => {
    _patchJob(jobId, { status: 'error', error: err.message, progress: 100 });
    _recordHistory(jobId, 'error', err.message);
    workspaceCtx?.setStatus(job.wsObjId, RUN_STATUS.ERROR);
    _emitLog(jobId, workspaceCtx, `Error: ${err.message}`);
    _processQueue();
  });
}
