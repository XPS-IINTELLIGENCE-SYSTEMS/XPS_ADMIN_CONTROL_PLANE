import { recordInboundEvent } from '../_runtimeStore.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const event = `${req?.query?.event || req?.body?.event || ''}`.trim().toLowerCase();
  if (event === 'inbound') return handleInbound(req, res);
  if (event === 'events') return handleEvents(req, res);
  return res.status(400).json({ error: 'Unknown SendGrid webhook event' });
}

function parseBody(req) {
  if (typeof req.body === 'string') {
    return Object.fromEntries(new URLSearchParams(req.body));
  }
  return req.body || {};
}

function handleInbound(req, res) {
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

function handleEvents(req, res) {
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
