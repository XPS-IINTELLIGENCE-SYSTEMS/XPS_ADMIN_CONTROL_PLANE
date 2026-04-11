import { recordInboundEvent } from '../_runtimeStore.js';

const INBOUND_TWIML_MESSAGE = 'Inbound Twilio call received. Event recorded by the XPS runtime. Operator continuation remains governed by the active runtime path.';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const event = `${req?.query?.event || ''}`.trim().toLowerCase();
  if (event === 'inbound') return handleInbound(req, res);
  if (event === 'status') return handleStatus(req, res);
  return res.status(400).json({ error: 'Unknown Twilio webhook event' });
}

function parseBody(req) {
  if (typeof req.body === 'string') {
    return Object.fromEntries(new URLSearchParams(req.body));
  }
  return req.body || {};
}

function twiml(message) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${`${message}`.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Say></Response>`;
}

function handleInbound(req, res) {
  if (!['POST', 'GET'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });

  const payload = req.method === 'GET' ? (req.query || {}) : parseBody(req);
  recordInboundEvent({
    provider: 'twilio',
    eventType: 'voice_inbound',
    channel: 'call_webhook',
    status: 'received',
    mode: 'live',
    payload,
    target: '/api/webhooks/twilio/inbound',
  });

  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  return res.status(200).send(twiml(INBOUND_TWIML_MESSAGE));
}

function handleStatus(req, res) {
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
