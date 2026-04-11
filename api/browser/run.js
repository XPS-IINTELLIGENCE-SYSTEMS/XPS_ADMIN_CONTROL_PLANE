// POST /api/browser/run
// Browser automation job endpoint.
// Playwright cannot run inside Vercel serverless functions.
// In production: returns mode:'blocked' with clear explanation.
// When BROWSER_WORKER_URL is set: proxies to a local/dedicated worker.
import { upsertJobRecord, recordExecution } from '../_runtimeStore.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, action = 'scrape', prompt, job_id, worker_url, runtime_target = 'local', repo_target = null, deployment_target = 'preview' } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is required' });

  const ts     = new Date().toISOString();
  const jobId  = job_id || `brw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const workerUrl = worker_url || process.env.BROWSER_WORKER_URL;
  upsertJobRecord({
    jobId,
    kind: 'browser',
    title: `${action} ${url}`,
    status: 'queued',
    mode: workerUrl ? 'local' : 'blocked',
    source: 'api/browser/run',
    target: workerUrl || null,
    detail: `Browser job queued for ${url} (${runtime_target}/${deployment_target})`,
  });

  // ── Local worker proxy ─────────────────────────────────────────────────────
  if (workerUrl) {
    try {
      const upstream = await fetch(`${workerUrl}/run`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url, action, prompt, job_id: jobId, runtime_target, repo_target, deployment_target }),
        signal:  AbortSignal.timeout(55000),
      });
      const data = await upstream.json();
      upsertJobRecord({
        jobId,
        kind: 'browser',
        title: `${action} ${url}`,
        status: data.status || (upstream.ok ? 'running' : 'error'),
        mode: data.mode || 'local',
        source: 'api/browser/run',
        target: workerUrl,
        detail: `Browser worker responded with ${data.status || upstream.status}`,
      });
      recordExecution({
        category: 'browser',
        title: 'Browser job dispatch',
        status: data.status || (upstream.ok ? 'running' : 'error'),
        mode: data.mode || 'local',
        provider: 'browser_worker',
        detail: `Browser job ${jobId} dispatched to worker.`,
        meta: { jobId, url, action, target: workerUrl, runtimeTarget: runtime_target, repoTarget: repo_target, deploymentTarget: deployment_target },
      });
      return res.status(upstream.ok ? 200 : 502).json({
        ...data,
        job_id: jobId,
        worker_mode: worker_url ? 'session' : 'backend',
        runtime_target,
        repo_target,
        deployment_target,
      });
    } catch (err) {
      upsertJobRecord({
        jobId,
        kind: 'browser',
        title: `${action} ${url}`,
        status: 'error',
        mode: 'local',
        source: 'api/browser/run',
        target: workerUrl,
        error: err.message,
      detail: `Worker proxy error: ${err.message}`,
      });
      return res.status(502).json({
        event_type: 'browser_job_failed',
        job_id:     jobId,
        url,
        action,
        status:     'error',
        mode:       'local',
        error:      `Worker proxy error: ${err.message}`,
        runtime_target,
        repo_target,
        deployment_target,
        timestamp:  ts,
      });
    }
  }

  // ── Serverless / blocked ───────────────────────────────────────────────────
  upsertJobRecord({
    jobId,
    kind: 'browser',
    title: `${action} ${url}`,
    status: 'blocked',
    mode: 'blocked',
    source: 'api/browser/run',
    blockedReason: 'BROWSER_WORKER_URL not configured.',
    detail: 'Browser job blocked because no worker target exists.',
  });
  recordExecution({
    category: 'browser',
    title: 'Browser job blocked',
    status: 'blocked',
    mode: 'blocked',
    provider: 'browser_worker',
    detail: 'Browser job blocked because BROWSER_WORKER_URL is not configured.',
    meta: { jobId, url, action, runtimeTarget: runtime_target, repoTarget: repo_target, deploymentTarget: deployment_target },
  });
  return res.status(200).json({
    event_type: 'browser_job_queued',
    job_id:     jobId,
    url,
    action,
    status:     'blocked',
    mode:       'blocked',
    reason:     'Playwright browser automation requires a persistent worker process. Vercel serverless functions have no filesystem and cannot run Chromium. To enable live browser jobs: set BROWSER_WORKER_URL or provide a session worker URL that runs Playwright.',
    runtime_target,
    repo_target,
    deployment_target,
    instructions: [
      'Run: npx playwright install chromium',
      'Start local worker: node scripts/browser-worker.js',
      'Set env: BROWSER_WORKER_URL=http://localhost:3001',
    ],
    workspace_object: {
      type:    'browser_session',
      title:   `Browser: ${url.slice(0, 50)}`,
      content: `Action: ${action}\nURL: ${url}\nRuntime target: ${runtime_target}\nDeployment target: ${deployment_target}\nRepo target: ${repo_target || 'not set'}\nStatus: blocked\n\nBrowser automation is blocked in serverless production. Set BROWSER_WORKER_URL to a Playwright worker to enable.`,
      meta:    { url, action, job_id: jobId, mode: 'blocked', runtimeTarget: runtime_target, repoTarget: repo_target, deploymentTarget: deployment_target },
    },
    timestamp: ts,
  });
}
