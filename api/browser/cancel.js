// POST /api/browser/cancel
// Cancels a queued or running browser job.
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
      return res.status(upstream.ok ? 200 : 502).json(data);
    } catch (err) {
      return res.status(502).json({ error: `Worker error: ${err.message}`, job_id, timestamp: ts });
    }
  }

  return res.status(200).json({
    event_type: 'browser_job_cancelled',
    job_id,
    status:     'cancelled',
    mode:       'blocked',
    timestamp:  ts,
  });
}
