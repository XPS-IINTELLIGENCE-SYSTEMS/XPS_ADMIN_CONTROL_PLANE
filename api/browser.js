import { upsertJobRecord, recordExecution } from './_runtimeStore.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = getBrowserAction(req);
  if (action === 'run') return handleRun(req, res);
  if (action === 'status') return handleStatus(req, res);
  if (action === 'cancel') return handleCancel(req, res);
  return res.status(400).json({ error: 'Unknown browser action' });
}

function getBrowserAction(req) {
  const action = req?.query?.action || req?.body?.action || '';
  return `${action}`.trim().toLowerCase();
}

async function handleRun(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, action = 'scrape', prompt, job_id, worker_url, runtime_target = 'local', repo_target = null, deployment_target = 'preview' } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url is required' });

  const ts = new Date().toISOString();
  const jobId = job_id || `brw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const workerUrl = worker_url || process.env.BROWSER_WORKER_URL;
  upsertJobRecord({
    jobId,
    kind: 'browser',
    title: `${action} ${url}`,
    status: 'queued',
    mode: workerUrl ? 'local' : 'blocked',
    source: 'api/browser',
    target: workerUrl || null,
    detail: `Browser job queued for ${url} (${runtime_target}/${deployment_target})`,
  });

  if (workerUrl) {
    try {
      const upstream = await fetch(`${workerUrl}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, action, prompt, job_id: jobId, runtime_target, repo_target, deployment_target }),
        signal: AbortSignal.timeout(55000),
      });
      const data = await upstream.json();
      upsertJobRecord({
        jobId,
        kind: 'browser',
        title: `${action} ${url}`,
        status: data.status || (upstream.ok ? 'running' : 'error'),
        mode: data.mode || 'local',
        source: 'api/browser',
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
        source: 'api/browser',
        target: workerUrl,
        error: err.message,
        detail: `Worker proxy error: ${err.message}`,
      });
      return res.status(502).json({
        event_type: 'browser_job_failed',
        job_id: jobId,
        url,
        action,
        status: 'error',
        mode: 'local',
        error: `Worker proxy error: ${err.message}`,
        runtime_target,
        repo_target,
        deployment_target,
        timestamp: ts,
      });
    }
  }

  upsertJobRecord({
    jobId,
    kind: 'browser',
    title: `${action} ${url}`,
    status: 'blocked',
    mode: 'blocked',
    source: 'api/browser',
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
    job_id: jobId,
    url,
    action,
    status: 'blocked',
    mode: 'blocked',
    reason: 'Playwright browser automation requires a persistent worker process. Vercel serverless functions have no filesystem and cannot run Chromium. To enable live browser jobs: set BROWSER_WORKER_URL or provide a session worker URL that runs Playwright.',
    runtime_target,
    repo_target,
    deployment_target,
    instructions: [
      'Run: npx playwright install chromium',
      'Start local worker: node scripts/browser-worker.js',
      'Set env: BROWSER_WORKER_URL=http://localhost:3001',
    ],
    workspace_object: {
      type: 'browser_session',
      title: `Browser: ${url.slice(0, 50)}`,
      content: `Action: ${action}\nURL: ${url}\nRuntime target: ${runtime_target}\nDeployment target: ${deployment_target}\nRepo target: ${repo_target || 'not set'}\nStatus: blocked\n\nBrowser automation is blocked in serverless production. Set BROWSER_WORKER_URL to a Playwright worker to enable.`,
      meta: { url, action, job_id: jobId, mode: 'blocked', runtimeTarget: runtime_target, repoTarget: repo_target, deploymentTarget: deployment_target },
    },
    timestamp: ts,
  });
}

async function handleStatus(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { job_id, worker_url } = req.query || {};
  if (!job_id) return res.status(400).json({ error: 'job_id is required' });

  const workerUrl = worker_url || process.env.BROWSER_WORKER_URL;
  const ts = new Date().toISOString();

  if (workerUrl) {
    try {
      const upstream = await fetch(`${workerUrl}/status?job_id=${encodeURIComponent(job_id)}`, {
        signal: AbortSignal.timeout(10000),
      });
      const data = await upstream.json();
      upsertJobRecord({
        jobId: job_id,
        kind: 'browser',
        title: `browser ${job_id}`,
        status: data.status || (upstream.ok ? 'running' : 'error'),
        mode: data.mode || 'local',
        source: 'api/browser',
        target: workerUrl,
        detail: `Browser status polled: ${data.status || upstream.status}`,
      });
      return res.status(upstream.ok ? 200 : 502).json(data);
    } catch (err) {
      upsertJobRecord({
        jobId: job_id,
        kind: 'browser',
        title: `browser ${job_id}`,
        status: 'error',
        mode: 'local',
        source: 'api/browser',
        target: workerUrl,
        error: err.message,
        detail: `Browser status poll failed: ${err.message}`,
      });
      return res.status(502).json({ error: `Worker error: ${err.message}`, job_id, timestamp: ts });
    }
  }

  upsertJobRecord({
    jobId: job_id,
    kind: 'browser',
    title: `browser ${job_id}`,
    status: 'blocked',
    mode: 'blocked',
    source: 'api/browser',
    blockedReason: 'No browser worker configured.',
    detail: 'Browser status requested without worker target.',
  });
  return res.status(200).json({
    event_type: 'browser_job_status',
    job_id,
    status: 'blocked',
    mode: 'blocked',
    reason: 'No browser worker configured. Set BROWSER_WORKER_URL or provide a session worker URL.',
    timestamp: ts,
  });
}

async function handleCancel(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { job_id } = req.body || {};
  if (!job_id) return res.status(400).json({ error: 'job_id is required' });

  const workerUrl = process.env.BROWSER_WORKER_URL;
  const ts = new Date().toISOString();

  if (workerUrl) {
    try {
      const upstream = await fetch(`${workerUrl}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await upstream.json();
      upsertJobRecord({
        jobId: job_id,
        kind: 'browser',
        title: `browser ${job_id}`,
        status: data.status || 'cancelled',
        mode: data.mode || 'local',
        source: 'api/browser',
        target: workerUrl,
        detail: `Browser job ${job_id} cancel requested.`,
      });
      recordExecution({
        category: 'browser',
        title: 'Browser job cancel',
        status: data.status || 'cancelled',
        mode: data.mode || 'local',
        provider: 'browser_worker',
        detail: `Cancel requested for browser job ${job_id}.`,
        meta: { jobId: job_id, target: workerUrl },
      });
      return res.status(upstream.ok ? 200 : 502).json(data);
    } catch (err) {
      upsertJobRecord({
        jobId: job_id,
        kind: 'browser',
        title: `browser ${job_id}`,
        status: 'error',
        mode: 'local',
        source: 'api/browser',
        target: workerUrl,
        error: err.message,
        detail: `Browser cancel failed: ${err.message}`,
      });
      return res.status(502).json({ error: `Worker error: ${err.message}`, job_id, timestamp: ts });
    }
  }

  upsertJobRecord({
    jobId: job_id,
    kind: 'browser',
    title: `browser ${job_id}`,
    status: 'cancelled',
    mode: 'blocked',
    source: 'api/browser',
    detail: `Browser job ${job_id} cancelled without worker target.`,
  });
  return res.status(200).json({
    event_type: 'browser_job_cancelled',
    job_id,
    status: 'cancelled',
    mode: 'blocked',
    timestamp: ts,
  });
}
