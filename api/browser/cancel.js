// POST /api/browser/cancel
// Cancels a queued or running browser job.
import { upsertJobRecord, recordExecution } from '../_runtimeStore.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { job_id } = req.body || {};
  if (!job_id) return res.status(400).json({ error: 'job_id is required' });

  const workerUrl = process.env.BROWSER_WORKER_URL;
  const ts = new Date().toISOString();

  if (workerUrl) {
    try {
      const upstream = await fetch(`${workerUrl}/cancel`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ job_id }),
        signal:  AbortSignal.timeout(10000),
      });
      const data = await upstream.json();
      upsertJobRecord({
        jobId: job_id,
        kind: 'browser',
        title: `browser ${job_id}`,
        status: data.status || 'cancelled',
        mode: data.mode || 'local',
        source: 'api/browser/cancel',
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
        source: 'api/browser/cancel',
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
    source: 'api/browser/cancel',
    detail: `Browser job ${job_id} cancelled without worker target.`,
  });
  return res.status(200).json({
    event_type: 'browser_job_cancelled',
    job_id,
    status:     'cancelled',
    mode:       'blocked',
    timestamp:  ts,
  });
}
