import { recordInboundEvent } from '../../_runtimeStore.js';

function parseBody(req) {
  if (typeof req.body === 'string') {
    return Object.fromEntries(new URLSearchParams(req.body));
  }
  return req.body || {};
}

function twiml(message) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${`${message}`.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</Say></Response>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!['POST', 'GET'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });

  const payload = req.method === 'GET' ? (req.query || {}) : parseBody(req);
  const event = recordInboundEvent({
    provider: 'twilio',
    eventType: 'voice_inbound',
    channel: 'call_webhook',
    status: 'received',
    mode: 'live',
    payload,
    target: '/api/webhooks/twilio/inbound',
  });

  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  return res.status(200).send(twiml('Inbound Twilio call received. Event recorded by the XPS runtime. Operator continuation remains governed by the active runtime path.'));
}
