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

const API_URL = import.meta.env.API_URL || '';
const BROWSER_POLL_INTERVAL_MS = 1000;
const BROWSER_MAX_POLL_ATTEMPTS = 20;

// ── Job state ─────────────────────────────────────────────────────────────────

const _jobs = new Map();   // jobId → JobState
const _subs = new Set();   // () => void

export function subscribeJobs(cb) {
  _subs.add(cb);
  return () => _subs.delete(cb);
}

function notify() {
  for (const cb of _subs) cb([..._jobs.values()]);
}

export function getJobList() {
  return [..._jobs.values()].sort((a, b) => b.createdAt - a.createdAt);
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
  const { url, action = 'scrape', prompt = '', workerUrl = '' } = opts;
  const jobId = genId();
  const now   = Date.now();

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
      meta:    { url, action, job_id: jobId, mode: workerUrl ? 'local' : 'queued', workerUrl: workerUrl || null },
  });
  onNavigate?.('workspace');

  persistBrowserJob({ jobId, url, action, status: 'queued', mode: 'queued' }).catch(() => {});

  // Advance to running
  _patchJob(jobId, { status: 'running' });
  workspaceCtx.setStatus(wsObjId, RUN_STATUS.RUNNING);
  _emitLog(jobId, workspaceCtx, `[browser] Starting ${action} job for ${url}`);

  // Execute in background
  _executeJob(jobId, url, action, prompt, workerUrl, workspaceCtx).catch(err => {
    _patchJob(jobId, { status: 'error', error: err.message });
    workspaceCtx.setStatus(wsObjId, RUN_STATUS.ERROR);
    _emitLog(jobId, workspaceCtx, `Error: ${err.message}`);
  });

  return jobId;
}

/**
 * Cancel a browser job.
 */
export async function cancelBrowserJob(jobId) {
  const job = _jobs.get(jobId);
  if (!job) return;
  job.cancelled = true;
  _patchJob(jobId, { status: 'cancelled' });

  // Notify backend if job is in-flight
  try {
    await fetch(`${API_URL}/api/browser/cancel`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ job_id: jobId }),
    });
  } catch {}
}

// ── Internal execution ────────────────────────────────────────────────────────

async function _executeJob(jobId, url, action, prompt, workerUrl, workspaceCtx) {
  const job = _jobs.get(jobId);
  if (!job || job.cancelled) return;

  const wsObjId = job.wsObjId;

  try {
    _emitLog(jobId, workspaceCtx, `[browser] Calling /api/browser/run…`);
    _patchJob(jobId, { progress: 15 });
    workspaceCtx.patchObject(wsObjId, { progress: 15 });

    const res = await fetch(`${API_URL}/api/browser/run`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url, action, prompt, job_id: jobId, worker_url: workerUrl || undefined }),
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
      workspaceCtx.setStatus(wsObjId, RUN_STATUS.DONE);
      workspaceCtx.patchObject(wsObjId, {
        progress: 100,
        content:  `URL: ${url}\nAction: ${action}\nStatus: blocked\n\n${data.reason || 'Browser automation requires a local worker.'}`,
        meta:     { url, action, job_id: jobId, mode: 'blocked', workerUrl: workerUrl || null, reason: data.reason, instructions: data.instructions },
      });
      _emitLog(jobId, workspaceCtx, `[browser] Blocked — ${data.reason}`);

      persistBrowserJob({ jobId, url, action, status: 'blocked', mode: 'blocked', result: data.reason }).catch(() => {});
      return;
    }

    if (status === 'queued' || status === 'running') {
      _patchJob(jobId, { status, mode, progress: status === 'running' ? 55 : 30 });
      workspaceCtx.patchObject(wsObjId, {
        progress: status === 'running' ? 55 : 30,
        content: `URL: ${url}\nAction: ${action}\nStatus: ${status}\n\nAwaiting worker completion…`,
        meta: { url, action, job_id: jobId, mode, workerUrl: workerUrl || null },
      });
      _emitLog(jobId, workspaceCtx, `[browser] Polling worker status…`);
      const settled = await pollBrowserStatus(jobId, workerUrl, workspaceCtx, wsObjId, url, action);
      return finalizeBrowserJob(jobId, wsObjId, url, action, settled, workspaceCtx, workerUrl);
    }

    return finalizeBrowserJob(jobId, wsObjId, url, action, data, workspaceCtx, workerUrl);

  } catch (err) {
    if (job.cancelled) return;
    _patchJob(jobId, { status: 'error', error: err.message, progress: 100 });
    workspaceCtx.setStatus(wsObjId, RUN_STATUS.ERROR);
    workspaceCtx.patchObject(wsObjId, {
      progress: 100,
      content:  `URL: ${url}\nAction: ${action}\nError: ${err.message}`,
      meta:     { url, action, job_id: jobId, mode: 'error', error: err.message },
    });
    _emitLog(jobId, workspaceCtx, `Error: ${err.message}`);
    persistBrowserJob({ jobId, url, action, status: 'error', mode: 'error', result: err.message }).catch(() => {});
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _patchJob(jobId, patch) {
  const job = _jobs.get(jobId);
  if (!job) return;
  Object.assign(job, patch, { updatedAt: Date.now() });
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
      const res = await fetch(`${API_URL}/api/browser/status?job_id=${encodeURIComponent(jobId)}${workerUrl ? `&worker_url=${encodeURIComponent(workerUrl)}` : ''}`);
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
      workspaceCtx.patchObject(wsObjId, {
        progress: Math.min(90, 40 + attempt * 3),
        content: `URL: ${url}\nAction: ${action}\nStatus: ${nextStatus}\n\nWorker poll ${attempt + 1}…`,
        meta: { url, action, job_id: jobId, mode: data.mode || 'local', workerUrl: workerUrl || null, lastPollStatus: nextStatus },
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
    workspaceCtx.setStatus(wsObjId, RUN_STATUS.DONE);
    workspaceCtx.patchObject(wsObjId, {
      progress: 100,
      content: `URL: ${url}\nAction: ${action}\nStatus: blocked\n\n${data.reason || 'Browser automation requires a worker.'}`,
      meta: { url, action, job_id: jobId, mode: 'blocked', workerUrl: workerUrl || null, reason: data.reason, instructions: data.instructions },
    });
    persistBrowserJob({ jobId, url, action, status: 'blocked', mode: 'blocked', result: data.reason }).catch(() => {});
    return data;
  }

  if (status === 'error') {
    const error = data.error || data.reason || 'Browser execution failed.';
    _patchJob(jobId, { status: 'error', error, progress: 100, mode });
    workspaceCtx.setStatus(wsObjId, RUN_STATUS.ERROR);
    workspaceCtx.patchObject(wsObjId, {
      progress: 100,
      content: `URL: ${url}\nAction: ${action}\nStatus: error\n\n${error}`,
      meta: { url, action, job_id: jobId, mode, workerUrl: workerUrl || null, error },
    });
    _emitLog(jobId, workspaceCtx, `[browser] Error — ${error}`);
    persistBrowserJob({ jobId, url, action, status: 'error', mode, result: error }).catch(() => {});
    return data;
  }

  const resultText = data.extracted_text || data.result || data.summary || '';
  const screenshotUrl = data.screenshot_url || null;
  const evidence = Array.isArray(data.evidence) ? data.evidence : [];

  _patchJob(jobId, { status: 'complete', mode, result: resultText, progress: 100 });
  workspaceCtx.setStatus(wsObjId, RUN_STATUS.DONE);
  workspaceCtx.patchObject(wsObjId, {
    progress: 100,
    content: `URL: ${url}\nAction: ${action}\nStatus: complete\n\n${data.summary || resultText || 'Browser execution finished.'}`,
    meta: { url, action, job_id: jobId, mode, workerUrl: workerUrl || null, screenshot_url: screenshotUrl },
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
      meta: { url, action, job_id: jobId, mode, screenshot_url: screenshotUrl },
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
  return data;
}
