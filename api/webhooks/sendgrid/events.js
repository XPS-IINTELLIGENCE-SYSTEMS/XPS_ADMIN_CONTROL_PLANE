import { recordInboundEvent } from '../../_runtimeStore.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const payload = Array.isArray(req.body) ? req.body : Array.isArray(req.body?.events) ? req.body.events : [req.body || {}];
  const events = payload.map((item) => recordInboundEvent({
    provider: 'sendgrid',
    eventType: item.event || 'event_webhook',
    channel: 'event_webhook',
    status: item.event || 'received',
    mode: 'live',
    payload: item,
    target: '/api/webhooks/sendgrid/events',
  }));

  return res.status(200).json({
    ok: true,
    event_type: 'sendgrid_events_received',
    count: events.length,
    event_ids: events.map((event) => event.eventId),
    timestamp: new Date().toISOString(),
  });
}
