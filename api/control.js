// Vercel serverless function: POST/GET /api/control
// Control plane actions — connector state, agent dispatch, workspace actions
import { llmMode, hasLLM, connectorState } from './_llm.js';

const MAX_TWILIO_MESSAGE_LENGTH = 800;
const MAX_EMAIL_SUBJECT_LENGTH = 160;
const MAX_EMAIL_PREVIEW_LENGTH = 500;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!['POST', 'GET'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ts = new Date().toISOString();

  if (req.method === 'GET') {
    return res.status(200).json({
      event_type:   'connector_state',
      status:       'ok',
      service:      'xps-control-plane',
      mode:         llmMode(),
      connectors:   connectorState(),
      capabilities: ['connector_status', 'agent_dispatch', 'workspace_action', 'runtime_settings', 'run_cancel'],
      timestamp:    ts,
    });
  }

  const { action, payload } = req.body || {};
  if (!action) {
    return res.status(400).json({ error: 'action is required' });
  }

  try {
    switch (action) {
      case 'connector_status': {
        const cs = connectorState();
        return res.status(200).json({
          event_type: 'connector_state',
          action,
          connectors: cs,
          mode:       llmMode(),
          timestamp:  ts,
          workspace_object: {
            type:    'runtime_state',
            title:   'Connector Status',
            content: formatConnectorStatus(cs),
            meta:    { connectors: cs, mode: llmMode() },
          },
        });
      }

      case 'runtime_settings': {
        return res.status(200).json({
          event_type:     'connector_state',
          action,
          dev_auth:       true,
          runtime_mode:   llmMode(),
          supabase_ready: !!process.env.SUPABASE_URL,
          llm_ready:      hasLLM(),
          timestamp:      ts,
        });
      }

      case 'blocked_capabilities': {
        const blocked = [];
        if (!process.env.OPENAI_API_KEY) blocked.push({ capability: 'openai', reason: 'OPENAI_API_KEY not set', required_env: ['OPENAI_API_KEY'] });
        if (!process.env.SUPABASE_URL)   blocked.push({ capability: 'supabase', reason: 'SUPABASE_URL not set', required_env: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] });
        if (!process.env.GROQ_API_KEY && !process.env.OPENAI_API_KEY) blocked.push({ capability: 'llm', reason: 'No LLM provider configured', required_env: ['OPENAI_API_KEY', 'GROQ_API_KEY'] });
        return res.status(200).json({
          event_type:         'blocked_capability',
          action,
          blocked_capabilities: blocked,
          mode:               llmMode(),
          timestamp:          ts,
          workspace_object: {
            type:    'runtime_state',
            title:   'Capability Report',
            content: blocked.length === 0
              ? '✓ All configured capabilities active.'
              : blocked.map(b => `⛔ ${b.capability}: ${b.reason}\n   Required: ${b.required_env.join(', ')}`).join('\n\n'),
            meta:    { blocked, mode: llmMode() },
          },
        });
      }

      case 'run_cancel': {
        // Acknowledge cancellation — actual ByteBot run cancellation is client-side
        return res.status(200).json({
          event_type: 'run_failed',
          action,
          run_id:     payload?.runId || null,
          status:     'cancelled',
          timestamp:  ts,
        });
      }

      case 'twilio_call': {
        const result = await executeTwilioCall(payload || {});
        return res.status(result.status === 'error' ? 502 : 200).json({
          event_type: 'connector_action',
          action,
          connector: 'twilio',
          ...result,
          timestamp: ts,
        });
      }

      case 'sendgrid_email': {
        const result = await executeSendGridEmail(payload || {});
        return res.status(result.status === 'error' ? 502 : 200).json({
          event_type: 'connector_action',
          action,
          connector: 'sendgrid',
          ...result,
          timestamp: ts,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('[control] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

function formatConnectorStatus(cs) {
  return Object.entries(cs)
    .map(([name, { status, mode }]) => {
      const icon = status === 'connected' ? '✓' : '⛔';
      return `${icon} ${name}: ${status} (${mode})`;
    })
    .join('\n');
}

function resolveRuntimeConfig(payload = {}) {
  const credentials = payload.credentials || {};
  return {
    twilioAccountSid: credentials.twilioAccountSid || process.env.TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: credentials.twilioAuthToken || process.env.TWILIO_AUTH_TOKEN || '',
    twilioPhoneNumber: credentials.twilioPhoneNumber || process.env.TWILIO_PHONE_NUMBER || '',
    sendgridApiKey: credentials.sendgridApiKey || process.env.SENDGRID_API_KEY || '',
    sendgridFromEmail: credentials.sendgridFromEmail || process.env.SENDGRID_FROM_EMAIL || '',
  };
}

async function executeTwilioCall(payload = {}) {
  const cfg = resolveRuntimeConfig(payload);
  const to = `${payload.to || ''}`.trim();
  const message = `${payload.message || payload.body || 'This is an automated call from the XPS control plane.'}`.trim().slice(0, MAX_TWILIO_MESSAGE_LENGTH);
  const voice = `${payload.voice || process.env.TWILIO_SAY_VOICE || 'alice'}`.trim();

  if (!cfg.twilioAccountSid || !cfg.twilioAuthToken) {
    return buildBlockedConnectorResponse('twilio', 'Twilio credentials are not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN or provide session-scoped credentials.', {
      to,
      message,
      capabilityState: 'blocked',
    });
  }

  if (!cfg.twilioPhoneNumber) {
    return buildBlockedConnectorResponse('twilio', 'TWILIO_PHONE_NUMBER is not configured. Outbound call execution remains blocked until a verified origin number is available.', {
      to,
      message,
      capabilityState: 'token-configured',
    });
  }

  if (!to) {
    return buildBlockedConnectorResponse('twilio', 'A destination phone number is required to place a call.', {
      to,
      message,
      capabilityState: 'write-enabled',
    });
  }

  const twiml = `<Response><Say voice="${escapeXml(voice)}">${escapeXml(message)}</Say></Response>`;
  const form = new URLSearchParams({
    To: to,
    From: cfg.twilioPhoneNumber,
    Twiml: twiml,
  });

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(cfg.twilioAccountSid)}/Calls.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${cfg.twilioAccountSid}:${cfg.twilioAuthToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      return buildErrorConnectorResponse('twilio', `Twilio call request failed (${response.status}). ${errText}`, {
        to,
        from: cfg.twilioPhoneNumber,
      });
    }

    const data = await response.json();
    const sid = data?.sid || null;
    return {
      status: 'complete',
      mode: 'live',
      message: `Twilio outbound call queued.\n\nTo: ${to}\nFrom: ${cfg.twilioPhoneNumber}\nCall SID: ${sid || 'pending'}\nExecution path: live Twilio REST API`,
      external_id: sid,
      workspace_object: {
        type: 'connector_action',
        title: 'Twilio Outbound Call',
        content: `Twilio outbound call queued.\n\nTo: ${to}\nFrom: ${cfg.twilioPhoneNumber}\nCall SID: ${sid || 'pending'}\nMessage: ${message}`,
        meta: {
          connector: 'twilio',
          mode: 'live',
          status: 'complete',
          capabilityState: 'write-enabled',
          to,
          from: cfg.twilioPhoneNumber,
          message,
          externalId: sid,
        },
      },
    };
  } catch (err) {
    return buildErrorConnectorResponse('twilio', `Twilio call request failed: ${err.message}`, {
      to,
      from: cfg.twilioPhoneNumber,
    });
  }
}

async function executeSendGridEmail(payload = {}) {
  const cfg = resolveRuntimeConfig(payload);
  const to = `${payload.to || ''}`.trim();
  const subject = `${payload.subject || 'XPS control plane message'}`.trim().slice(0, MAX_EMAIL_SUBJECT_LENGTH);
  const text = `${payload.text || payload.body || ''}`.trim();
  const html = `${payload.html || ''}`.trim();

  if (!cfg.sendgridApiKey) {
    return buildBlockedConnectorResponse('sendgrid', 'SendGrid credentials are not configured. Set SENDGRID_API_KEY or provide a session-scoped API key.', {
      to,
      subject,
      capabilityState: 'blocked',
    });
  }

  if (!cfg.sendgridFromEmail) {
    return buildBlockedConnectorResponse('sendgrid', 'SENDGRID_FROM_EMAIL is not configured. Outbound email requires a verified sender address.', {
      to,
      subject,
      capabilityState: 'token-configured',
    });
  }

  if (!to) {
    return buildBlockedConnectorResponse('sendgrid', 'A destination email address is required to send email.', {
      to,
      subject,
      capabilityState: 'write-enabled',
    });
  }

  if (!text && !html) {
    return buildBlockedConnectorResponse('sendgrid', 'Email content is required before sending.', {
      to,
      subject,
      capabilityState: 'write-enabled',
    });
  }

  const content = [];
  if (text) content.push({ type: 'text/plain', value: text });
  if (html) content.push({ type: 'text/html', value: html });

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }], subject }],
        from: { email: cfg.sendgridFromEmail },
        content,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return buildErrorConnectorResponse('sendgrid', `SendGrid send failed (${response.status}). ${errText}`, {
        to,
        from: cfg.sendgridFromEmail,
        subject,
      });
    }

    return {
      status: 'complete',
      mode: 'live',
      message: `SendGrid email accepted.\n\nTo: ${to}\nFrom: ${cfg.sendgridFromEmail}\nSubject: ${subject}\nExecution path: live SendGrid REST API`,
      external_id: response.headers.get('x-message-id') || null,
      workspace_object: {
        type: 'connector_action',
        title: 'SendGrid Email Send',
        content: `SendGrid email accepted.\n\nTo: ${to}\nFrom: ${cfg.sendgridFromEmail}\nSubject: ${subject}\n\nPreview:\n${buildEmailPreview(text, html)}`,
        meta: {
          connector: 'sendgrid',
          mode: 'live',
          status: 'complete',
          capabilityState: 'write-enabled',
          to,
          from: cfg.sendgridFromEmail,
          subject,
          externalId: response.headers.get('x-message-id') || null,
        },
      },
    };
  } catch (err) {
    return buildErrorConnectorResponse('sendgrid', `SendGrid send failed: ${err.message}`, {
      to,
      from: cfg.sendgridFromEmail,
      subject,
    });
  }
}

function buildBlockedConnectorResponse(connector, reason, meta = {}) {
  return {
    status: 'blocked',
    mode: 'blocked',
    reason,
    message: reason,
    workspace_object: {
      type: 'connector_action',
      title: connector === 'twilio' ? 'Twilio Call Blocked' : 'SendGrid Send Blocked',
      content: `${connector === 'twilio' ? 'Twilio' : 'SendGrid'} action blocked.\n\nReason: ${reason}`,
      meta: {
        connector,
        mode: 'blocked',
        status: 'blocked',
        reason,
        ...meta,
      },
    },
  };
}

function buildErrorConnectorResponse(connector, reason, meta = {}) {
  return {
    status: 'error',
    mode: 'live',
    reason,
    message: reason,
    workspace_object: {
      type: 'connector_action',
      title: connector === 'twilio' ? 'Twilio Call Error' : 'SendGrid Send Error',
      content: `${connector === 'twilio' ? 'Twilio' : 'SendGrid'} execution failed.\n\nReason: ${reason}`,
      meta: {
        connector,
        mode: 'live',
        status: 'error',
        reason,
        ...meta,
      },
    },
  };
}

function escapeXml(value) {
  return `${value || ''}`
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildEmailPreview(text, html) {
  if (text) return text.slice(0, MAX_EMAIL_PREVIEW_LENGTH);
  return `${html || ''}`.replace(/\s+/g, ' ').slice(0, MAX_EMAIL_PREVIEW_LENGTH);
}
