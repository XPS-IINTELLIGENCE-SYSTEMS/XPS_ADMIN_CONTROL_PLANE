import { recordInboundEvent } from '../../_runtimeStore.js';

function parseBody(req) {
  if (typeof req.body === 'string') {
    return Object.fromEntries(new URLSearchParams(req.body));
  }
  return req.body || {};
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const payload = parseBody(req);
  const event = recordInboundEvent({
    provider: 'sendgrid',
    eventType: 'inbound_email',
    channel: 'parse_webhook',
    status: 'received',
    mode: 'live',
    payload,
    target: '/api/webhooks/sendgrid/inbound',
  });

  return res.status(200).json({
    ok: true,
    event_type: 'sendgrid_inbound_received',
    event_id: event.eventId,
    subject: payload.subject || null,
    timestamp: event.receivedAt,
  });
}
