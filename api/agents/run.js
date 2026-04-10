// Vercel serverless function: POST /api/agents/run
// Autonomous agent task execution — emits structured run contracts
import { callLLM, llmMode, hasLLM, connectorState } from '../_llm.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { task, agent = 'bytebot', context = {}, history = [], runId } = req.body || {};
  if (!task) {
    return res.status(400).json({ error: 'task is required' });
  }

  const mode       = llmMode();
  const ts         = new Date().toISOString();
  const connectors = connectorState();

  const connectorSummary = Object.entries(connectors)
    .map(([k, v]) => `${k}: ${v.status} (${v.mode})`)
    .join(', ');

  const agentSystemPrompts = {
    bytebot: `You are ByteBot, an autonomous multi-step executor for the XPS Intelligence Command Center.

Connected services: ${connectorSummary}

For the given task, produce a detailed structured execution plan with 5-8 concrete steps.
Mark steps that can run in parallel with "parallel": true and group them with "group".
Your response MUST be valid JSON with this exact schema:
{
  "plan": [
    { "step": 1, "label": "...", "action": "search|scrape|browser|analyze|build|export|connector_status", "agent": "bytebot|research|scraper|builder", "parallel": false, "group": "A", "details": "..." }
  ],
  "result": "... detailed result text with findings, data, and conclusions ...",
  "artifacts": [
    { "type": "report|code|data|ui|workflow", "title": "...", "content": "...", "meta": {} }
  ],
  "summary": "... one-line summary ...",
  "connector_actions": [
    { "connector": "supabase|github|hubspot|airtable|browser_worker", "action": "read|write|blocked|queued", "status": "complete|blocked|error", "reason": "..." }
  ],
  "staging": {
    "pre_stage": [ { "type": "...", "payload": {} } ],
    "stage": [ { "type": "...", "payload": {} } ],
    "hubspot_ready": [ { "object": "contact|company|deal", "payload": {} } ],
    "airtable_ready": [ { "table": "...", "payload": {} } ],
    "runtime_ledger": [ { "entry_type": "decision|action|result", "payload": {} } ],
    "recovery_queue": [ { "action": "...", "payload": {}, "reason": "..." } ]
  },
  "workspace_objects": [
    { "type": "report|data|code|ui|workflow|runtime_state", "title": "...", "content": "...", "meta": {} }
  ],
  "parallel_groups": { "A": ["1","2"] }
}
Be specific. Produce real, actionable output. Always generate at least one artifact.`,

    orchestrator: `You are the XPS Orchestrator. Connected: ${connectorSummary}.
Analyze the task and produce a structured JSON response:
{
  "plan": [ { "step": 1, "label": "...", "action": "...", "agent": "bytebot|research|builder", "parallel": false, "details": "..." } ],
  "result": "... detailed result ...",
  "artifacts": [],
  "summary": "...",
  "staging": { "pre_stage": [], "stage": [], "hubspot_ready": [], "airtable_ready": [], "runtime_ledger": [], "recovery_queue": [] }
}`,

    research: `You are the XPS Research Agent. Connected: ${connectorSummary}.
Research the given topic thoroughly. Return JSON:
{
  "plan": [
    { "step": 1, "label": "Define research scope", "action": "scope", "parallel": false },
    { "step": 2, "label": "Gather primary data", "action": "query", "parallel": true },
    { "step": 3, "label": "Analyze findings", "action": "analyze", "parallel": false },
    { "step": 4, "label": "Compile report", "action": "report", "parallel": false }
  ],
  "result": "... full research report with citations and analysis ...",
  "artifacts": [ { "type": "report", "title": "Research Report", "content": "..." } ],
   "summary": "..."
}`,

    scraper: `You are the XPS Scraper Agent. Return JSON:
{
  "plan": [ { "step": 1, "label": "Analyze target", "action": "scrape", "parallel": false } ],
  "result": "... scrape analysis ...",
  "artifacts": [],
  "summary": "..."
}`,

    builder: `You are the XPS Auto Builder. Generate production-quality code or UI. Return JSON:
{
  "plan": [
    { "step": 1, "label": "Analyze requirements", "action": "analyze", "parallel": false },
    { "step": 2, "label": "Design structure", "action": "design", "parallel": false },
    { "step": 3, "label": "Generate implementation", "action": "build", "parallel": false },
    { "step": 4, "label": "Add tests/docs", "action": "finalize", "parallel": true }
  ],
  "result": "... full implementation ...",
  "artifacts": [ { "type": "code", "title": "Generated Output", "content": "..." } ],
  "summary": "..."
}`,

    parallel_bytebot: `You are ByteBot running in PARALLEL mode. Connected: ${connectorSummary}.
Break the task into independent parallel subtasks. Return JSON:
{
  "plan": [
    { "step": 1, "label": "...", "action": "...", "parallel": true, "group": "A" },
    { "step": 2, "label": "...", "action": "...", "parallel": true, "group": "A" },
    { "step": 3, "label": "...", "action": "...", "parallel": true, "group": "B" },
    { "step": 4, "label": "Synthesize results", "action": "synthesize", "parallel": false }
  ],
  "result": "... combined result from all parallel subtasks ...",
  "artifacts": [ { "type": "report", "title": "Parallel Run Summary", "content": "..." } ],
  "summary": "...",
  "parallel_groups": { "A": ["step1","step2"], "B": ["step3"] }
}`,

    default: `You are an XPS Intelligence agent. Connected: ${connectorSummary}. Return JSON:
{
  "plan": [ { "step": 1, "label": "Execute", "action": "run", "parallel": false } ],
  "result": "...",
  "artifacts": [],
  "summary": "...",
  "staging": { "pre_stage": [], "stage": [], "hubspot_ready": [], "airtable_ready": [], "runtime_ledger": [], "recovery_queue": [] }
}`,
  };

  // Synthetic fallback
  if (!hasLLM()) {
    const steps = [
      { step: 1, label: 'Task received',           status: 'complete', parallel: false },
      { step: 2, label: 'Connector state checked', status: 'complete', parallel: false },
      { step: 3, label: 'LLM provider offline',    status: 'skipped',  parallel: false },
      { step: 4, label: 'Synthetic fallback',      status: 'complete', parallel: false },
    ];
    return res.status(200).json({
      event_type: 'run_completed',
      run_id:     runId || null,
      task,
      agent,
      mode:       'synthetic',
      plan:       steps.map(s => ({ step: s.step, label: s.label, action: 'synth', parallel: false })),
      result:     `[Synthetic] ${agent} received task: "${task}"\n\nConnector state: ${connectorSummary}\n\nNo LLM provider configured. Set GROQ_API_KEY or OPENAI_API_KEY to enable live agent execution.`,
      summary:    `Synthetic execution of: ${task}`,
      steps,
      artifacts:  [],
      connector_actions: [],
      staging: {
        pre_stage: [],
        stage: [],
        hubspot_ready: [],
        airtable_ready: [],
        runtime_ledger: [],
        recovery_queue: [],
      },
      parallel_groups: {},
      blocked_capabilities: deriveBlockedCapabilities(),
      connector_state: connectors,
      workspace_object: {
        type:    'agent_run',
        title:   `[Synthetic] ${agent}: ${task.slice(0, 50)}`,
        content: `Task: ${task}\n\nConnectors: ${connectorSummary}\n\nStatus: synthetic — no LLM configured.`,
        steps,
        meta:    { agent, mode: 'synthetic', connectors },
      },
      timestamp: ts,
    });
  }

  const systemPrompt = (agentSystemPrompts[agent] || agentSystemPrompts.default);

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: buildUserPrompt(task, context) },
    ];

    const raw    = await callLLM(messages, { model: process.env.OPENAI_MODEL || 'gpt-4o', json: !!process.env.OPENAI_API_KEY });
    const parsed = safeParseJSON(raw);

    const plan = Array.isArray(parsed?.plan) ? parsed.plan : [];
    const steps = plan.map((p, i) => ({
      step:     p.step ?? i + 1,
      label:    p.label ?? `Step ${i + 1}`,
      status:   'complete',
      parallel: p.parallel ?? false,
      action:   p.action ?? 'run',
      agent:    p.agent ?? agent,
      group:    p.group ?? null,
      details:  p.details ?? '',
    }));
    if (!steps.length) {
      steps.push(
        { step: 1, label: 'Task received',    status: 'complete', parallel: false, action: 'receive', agent },
        { step: 2, label: 'LLM executed',     status: 'complete', parallel: false, action: 'analyze', agent },
        { step: 3, label: 'Result ready',     status: 'complete', parallel: false, action: 'synthesize', agent },
      );
    }

    const result              = parsed?.result           || raw;
    const summary             = parsed?.summary          || task.slice(0, 80);
    const artifacts           = parsed?.artifacts        || [];
    const connector_actions   = parsed?.connector_actions || [];
    const parallel_groups     = parsed?.parallel_groups  || {};
    const staging             = normalizeStaging(parsed?.staging);
    const workspace_objects   = Array.isArray(parsed?.workspace_objects) ? parsed.workspace_objects : [];

    return res.status(200).json({
      event_type: 'run_completed',
      run_id:     runId || null,
      task,
      agent,
      mode,
      plan,
      result,
      summary,
      steps,
      artifacts,
      connector_actions,
      parallel_groups,
      staging,
      workspace_objects,
      blocked_capabilities: deriveBlockedCapabilities(),
      connector_state: connectors,
      workspace_object: {
        type:    inferWsType(result, agent),
        title:   summary,
        content: result,
        steps,
        meta:    { agent, mode, artifacts, connector_actions, parallel_groups, staging, connectors },
      },
      timestamp: ts,
    });
  } catch (err) {
    console.error('[agents/run] error:', err.message);
    return res.status(500).json({
      event_type: 'run_failed',
      run_id:     runId || null,
      task,
      agent,
      mode,
      error:      err.message,
      timestamp:  ts,
    });
  }
}

function buildUserPrompt(task, context) {
  let p = `Task: ${task}`;
  if (context.url)  p += `\nURL: ${context.url}`;
  if (context.data) p += `\nContext: ${JSON.stringify(context.data).slice(0, 2000)}`;
  return p;
}

function safeParseJSON(raw) {
  if (!raw) return null;
  try {
    // Extract JSON from markdown code blocks if present
    const m = raw.match(/```(?:json)?\s*([\s\S]+?)```/);
    return JSON.parse(m ? m[1] : raw);
  } catch {
    return null;
  }
}

function normalizeStaging(staging) {
  return {
    pre_stage: Array.isArray(staging?.pre_stage) ? staging.pre_stage : [],
    stage: Array.isArray(staging?.stage) ? staging.stage : [],
    hubspot_ready: Array.isArray(staging?.hubspot_ready) ? staging.hubspot_ready : [],
    airtable_ready: Array.isArray(staging?.airtable_ready) ? staging.airtable_ready : [],
    runtime_ledger: Array.isArray(staging?.runtime_ledger) ? staging.runtime_ledger : [],
    recovery_queue: Array.isArray(staging?.recovery_queue) ? staging.recovery_queue : [],
  };
}

function deriveBlockedCapabilities() {
  const blocked = [];
  if (!process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY && !process.env.GCP_GEMINI_KEY && !process.env.OLLAMA_BASE_URL) {
    blocked.push({ capability: 'llm', reason: 'No LLM provider configured', required_env: ['OPENAI_API_KEY', 'GROQ_API_KEY', 'GEMINI_API_KEY', 'OLLAMA_BASE_URL'] });
  }
  if (!process.env.SUPABASE_URL) {
    blocked.push({ capability: 'supabase', reason: 'SUPABASE_URL not set', required_env: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] });
  }
  if (!process.env.HUBSPOT_API_KEY) {
    blocked.push({ capability: 'hubspot', reason: 'HUBSPOT_API_KEY not set', required_env: ['HUBSPOT_API_KEY'] });
  }
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    blocked.push({ capability: 'airtable', reason: 'AIRTABLE_API_KEY or AIRTABLE_BASE_ID not set', required_env: ['AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID'] });
  }
  if (!process.env.BROWSER_WORKER_URL) {
    blocked.push({ capability: 'browser_worker', reason: 'BROWSER_WORKER_URL not set', required_env: ['BROWSER_WORKER_URL'] });
  }
  return blocked;
}

function inferWsType(result, agentId) {
  if (!result) return 'agent_run';
  if (result.includes('```')) return 'code';
  const lower = result.toLowerCase();
  if (agentId === 'builder') return 'ui';
  if (agentId === 'research' || lower.includes('research') || lower.includes('findings')) return 'search';
  if (agentId === 'scraper') return 'scrape';
  return 'agent_run';
}
