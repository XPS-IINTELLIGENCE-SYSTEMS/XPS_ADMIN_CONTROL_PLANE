// XPS Orchestrator — maps assistant prompts to app actions
// Routes commands to correct surfaces. Operates in synthetic mode when no live AI available.

import { pageChangeLog } from '../data/synthetic.js';

export const ORCHESTRATOR_MODE = import.meta.env.OPENAI_API_KEY ? 'live' : 'synthetic';

// Intent detection patterns
const INTENTS = [
  { pattern: /add.*panel|new.*panel|create.*panel/i,      action: 'add_panel' },
  { pattern: /reorganize|reorder|sort.*by/i,              action: 'reorganize' },
  { pattern: /create.*view|new.*view|add.*view/i,         action: 'create_view' },
  { pattern: /update.*card|change.*card|edit.*card/i,     action: 'update_card' },
  { pattern: /add.*drawer|recovery.*drawer/i,             action: 'add_drawer' },
  { pattern: /change.*layout|update.*layout/i,            action: 'change_layout' },
  { pattern: /navigate|go to|open/i,                      action: 'navigate' },
  { pattern: /connector|integration/i,                    action: 'connector_query' },
  { pattern: /status|health|system/i,                     action: 'system_status' },
  { pattern: /lead|pipeline|deal/i,                       action: 'lead_query' },
  { pattern: /draft|email|outreach/i,                     action: 'draft_content' },
  { pattern: /blocker|blocked|recovery/i,                 action: 'blocker_query' },
  { pattern: /search|research|find/i,                     action: 'search_query' },
  { pattern: /scrape|extract/i,                           action: 'scrape_query' },
  { pattern: /browser|snapshot|evidence/i,                action: 'browser_query' },
  { pattern: /export|hubspot|airtable/i,                  action: 'export_query' },
  { pattern: /stage|staging|ledger/i,                     action: 'staging_query' },
];

export function detectIntent(prompt) {
  for (const { pattern, action } of INTENTS) {
    if (pattern.test(prompt)) return action;
  }
  return 'general';
}

// Route a prompt to a system surface
export function routeToSurface(intent) {
  const map = {
    add_panel:      'Admin Control Plane',
    reorganize:     'current page',
    create_view:    'Auto Builder',
    update_card:    'current page',
    add_drawer:     'Admin Control Plane',
    change_layout:  'current page',
    navigate:       'Router',
    connector_query:'Connectors',
    system_status:  'Intel Core',
    lead_query:     'Leads / CRM',
    draft_content:  'AI Assistant',
    blocker_query:  'Admin Control Plane',
    search_query:   'Research Lab',
    scrape_query:   'Scraper',
    browser_query:  'Research Lab',
    export_query:   'Admin Control Plane',
    staging_query:  'Admin Control Plane',
    general:        'AI Assistant',
  };
  return map[intent] || 'AI Assistant';
}

// Log a change for audit trail
export function logChange(action, detail, surface) {
  const entry = {
    id: `CHG-${Date.now()}`,
    ts: new Date().toISOString(),
    action,
    detail,
    surface,
    status: 'synthetic',
  };
  pageChangeLog.unshift(entry);
  if (pageChangeLog.length > 100) pageChangeLog.pop();
  return entry;
}

// Synthetic responses for demo mode
const syntheticResponses = {
  add_panel: (p) => `Panel request acknowledged. In live mode this would add a new panel to the target surface.\n\nAction logged: \`add_panel\`\nTarget: ${p}\nStatus: **synthetic** — no live mutation performed.`,
  reorganize: (p) => `Reorganization request received.\n\nIn live mode the UI config for this page would be updated and re-rendered.\nStatus: **synthetic** — layout unchanged.`,
  create_view: (p) => `View creation queued in Auto Builder backlog.\n\nArtifact type: \`view\`\nPrompt: "${p}"\nStatus: **synthetic** — added to build backlog schema.`,
  connector_query: (p) => `Here is the current Connector Reality Matrix status:\n\n- GitHub: referenced_only\n- Vercel: referenced_only\n- HubSpot: blocked (key unverified)\n- Redis: blocked (URL missing)\n- Neon DB: blocked (connection refused)\n- Google Drive, Sheets, Gmail, Calendar, Airtable, Beautiful.ai, Base44: missing\n\nNo live connectors are currently active. All surfaces run on synthetic data.`,
  system_status: () => `Current XPS System Health:\n\nAdmin Control Plane — operational (v2.4.1)\nVision Cortex — operational (v1.9.3)\nAuto Builder — degraded (last sync 12m ago)\nIntel Core — operational (v3.1.2)\nSandbox — idle\nQuarantine — 4 blocked items\n\nMode: **synthetic** — no live backend.`,
  blocker_query: () => `Current Blocker Queue:\n\n1. **BLK-001** — Ledger Write: Neon DB unavailable (2h, HIGH)\n2. **BLK-002** — HubSpot Sync: API key unverified (6h, MEDIUM)\n3. **BLK-003** — Redis Heartbeat: URL missing (1d, HIGH)\n\nRecommended action: Set REDIS_URL and NEON_DATABASE_URL in environment and re-run connector health check.`,
  search_query: (p) => `Search request received: "${p}".\n\nIn live mode this would call the Research Agent and return structured findings. Synthetic mode active — no live LLM or browser worker configured.`,
  scrape_query: (p) => `Scrape request queued for: "${p}".\n\nLive scrape requires a configured browser worker or the /api/scrape endpoint. Synthetic mode active.`,
  browser_query: (p) => `Browser automation requested: "${p}".\n\nBrowser worker is blocked until BROWSER_WORKER_URL is configured.`,
  export_query: (p) => `Export request received: "${p}".\n\nHubSpot/Airtable exports are staged in Supabase when configured. Live write is blocked until connector keys are configured.`,
  staging_query: () => `Staging pipeline status:\n\n- Pre-stage queue: active\n- Stage queue: active\n- HubSpot export staging: waiting for API key\n- Airtable staging: waiting for API key\n\nSynthetic mode — no live persistence configured.`,
  lead_query: (p) => `Pipeline snapshot (synthetic):\n\n- Active Leads: 2,847\n- Pipeline Value: $4.2M\n- Close Rate: 34.2%\n- Hottest lead: Ace Hardware Distribution (score 92, Proposal stage)\n- At risk: Gulf Coast Logistics (no contact in 8 days)\n\nWould you like me to draft a follow-up for Gulf Coast Logistics?`,
  draft_content: (p) => `Drafting content based on your prompt...\n\nI'll need context — which lead or company should this be directed to? You can also type something like:\n\n"Draft a follow-up email for [Company Name]"\n\nor\n\n"Write a cold outreach for [Vertical] prospects"`,
  general: (p) => `I'm the XPS AI Orchestrator running in **synthetic mode** (no live LLM connected).\n\nI can help you:\n- Navigate the platform\n- Summarize system status\n- Draft content (synthetic)\n- Query lead/pipeline data\n- Explain blockers and recoveries\n- Modify UI surfaces via prompt\n\nSet OPENAI_API_KEY or GROQ_API_KEY to enable live intelligence.`,
};

export async function orchestrate(prompt, currentPage = '') {
  const intent = detectIntent(prompt);
  const surface = routeToSurface(intent);
  logChange(intent, prompt, surface);

  // Try live LLM first
  if (ORCHESTRATOR_MODE === 'live') {
    try {
      const { safeFetch } = await import('./safeFetch.js');
      const systemPrompt = `You are the XPS Intelligence AI Orchestrator — the operating brain of the XPS Admin Control Plane. You have full context of the XPS canonical systems (Admin Control Plane, Vision Cortex, Auto Builder, Intel Core, Sandbox, Quarantine). Current page: ${currentPage}. Respond as an intelligent operator assistant. Be concise but precise.`;
      const result = await safeFetch('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
        }),
      });
      if (result.ok && result.data?.reply) {
        return { reply: result.data.reply, intent, surface, mode: 'live' };
      }
    } catch {}
  }

  // Fallback to synthetic
  const handler = syntheticResponses[intent] || syntheticResponses.general;
  return { reply: handler(prompt), intent, surface, mode: 'synthetic' };
}
