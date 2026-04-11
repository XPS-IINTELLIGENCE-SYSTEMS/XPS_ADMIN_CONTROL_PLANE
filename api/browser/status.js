// GET /api/browser/status?job_id=xxx
// Returns status of a browser job. In the absence of a persistent store
// this returns a structured response; a real worker would query job state.
import { upsertJobRecord } from '../_runtimeStore.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
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
        source: 'api/browser/status',
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
        source: 'api/browser/status',
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
    source: 'api/browser/status',
    blockedReason: 'No browser worker configured.',
    detail: 'Browser status requested without worker target.',
  });
  return res.status(200).json({
    event_type: 'browser_job_status',
    job_id,
    status:     'blocked',
    mode:       'blocked',
    reason:     'No browser worker configured. Set BROWSER_WORKER_URL or provide a session worker URL.',
    timestamp:  ts,
  });
}
