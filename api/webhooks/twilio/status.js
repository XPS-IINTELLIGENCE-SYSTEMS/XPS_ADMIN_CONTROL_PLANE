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
    provider: 'twilio',
    eventType: 'call_status',
    channel: 'status_callback',
    status: payload.CallStatus || payload.CallStatusCallbackEvent || 'received',
    mode: 'live',
    payload,
    target: '/api/webhooks/twilio/status',
  });

  return res.status(200).json({
    ok: true,
    event_type: 'twilio_status_received',
    event_id: event.eventId,
    status: event.status,
    timestamp: event.receivedAt,
  });
}
