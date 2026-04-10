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
  const { url, action = 'scrape', prompt = '' } = opts;
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
    mode:      'blocked',
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
    meta:    { url, action, job_id: jobId, mode: 'queued' },
  });
  onNavigate?.('workspace');

  persistBrowserJob({ jobId, url, action, status: 'queued', mode: 'queued' }).catch(() => {});

  // Advance to running
  _patchJob(jobId, { status: 'running' });
  workspaceCtx.setStatus(wsObjId, RUN_STATUS.RUNNING);
  _emitLog(jobId, workspaceCtx, `[browser] Starting ${action} job for ${url}`);

  // Execute in background
  _executeJob(jobId, url, action, prompt, workspaceCtx).catch(err => {
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

async function _executeJob(jobId, url, action, prompt, workspaceCtx) {
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
      body:    JSON.stringify({ url, action, prompt, job_id: jobId }),
    });

    if (job.cancelled) return;

    const data = await res.json();

    if (job.cancelled) return;

    const status  = data.status || 'blocked';
    const mode    = data.mode   || 'blocked';
    const wsObj   = data.workspace_object || null;

    _emitLog(jobId, workspaceCtx, `[browser] Response: status=${status} mode=${mode}`);

    if (status === 'blocked') {
      // Honest blocked result
      _patchJob(jobId, { status: 'blocked', mode: 'blocked', result: data.reason, progress: 100 });
      workspaceCtx.setStatus(wsObjId, RUN_STATUS.DONE);
      workspaceCtx.patchObject(wsObjId, {
        progress: 100,
        content:  `URL: ${url}\nAction: ${action}\nStatus: blocked\n\n${data.reason || 'Browser automation requires a local worker.'}`,
        meta:     { url, action, job_id: jobId, mode: 'blocked', reason: data.reason, instructions: data.instructions },
      });
      _emitLog(jobId, workspaceCtx, `[browser] Blocked — ${data.reason}`);

      persistBrowserJob({ jobId, url, action, status: 'blocked', mode: 'blocked', result: data.reason }).catch(() => {});
      return;
    }

    // Got a real result
    const resultText  = data.extracted_text || data.result || data.summary || '';
    const screenshotUrl = data.screenshot_url || null;
    const evidence    = data.evidence || [];

    _patchJob(jobId, { status: 'complete', mode, result: resultText, progress: 100 });
    workspaceCtx.setStatus(wsObjId, RUN_STATUS.DONE);

    // Create a richer browser_result object
    workspaceCtx.createObject({
      type:    OBJ_TYPE.BROWSER_RESULT,
      title:   `Result: ${url.slice(0, 50)}`,
      content: resultText,
      status:  RUN_STATUS.DONE,
      meta: {
        url,
        action,
        job_id:          jobId,
        mode,
        screenshot_url:  screenshotUrl,
        extracted_text:  resultText,
        evidence,
      },
    });

    // If evidence items present, also create evidence_bundle
    if (evidence.length > 0) {
      workspaceCtx.createObject({
        type:    OBJ_TYPE.EVIDENCE_BUNDLE,
        title:   `Evidence: ${url.slice(0, 40)}`,
        content: evidence.map(e => `- ${e.title || e.url}: ${e.summary || ''}`).join('\n'),
        meta:    { items: evidence, source_url: url, job_id: jobId, mode },
      });
    }

    _emitLog(jobId, workspaceCtx, `Browser job complete`);
    persistBrowserJob({ jobId, url, action, status: 'complete', mode, result: resultText }).catch(() => {});

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
