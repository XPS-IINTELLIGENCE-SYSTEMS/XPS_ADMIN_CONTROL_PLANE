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
    bytebot: `You are ByteBot, an autonomous multi-step task executor for the XPS Intelligence Command Center.

Connected services: ${connectorSummary}

For the given task, produce a DETAILED structured execution plan with 5-8 concrete steps.
Mark steps that can run in parallel with "parallel": true.
Your response MUST be valid JSON with this exact schema:
{
  "plan": [
    { "step": 1, "label": "...", "action": "...", "parallel": false, "details": "..." },
    { "step": 2, "label": "...", "action": "...", "parallel": true, "details": "..." }
  ],
  "result": "... detailed result text with findings, data, and conclusions ...",
  "artifacts": [
    { "type": "report|code|data", "title": "...", "content": "..." }
  ],
  "summary": "... one-line summary ...",
  "connector_actions": [ "... actions taken using connected services ..." ]
}
Be specific. Produce real, actionable output. Always generate at least one artifact.
Use connected Supabase/Groq services where relevant.`,

    orchestrator: `You are the XPS Orchestrator. Connected: ${connectorSummary}.
Analyze the task and produce a structured JSON response:
{
  "plan": [ { "step": 1, "label": "...", "action": "...", "parallel": false } ],
  "result": "... detailed result ...",
  "artifacts": [],
  "summary": "..."
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
  "summary": "..."
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
      result:     `[Synthetic] ${agent} received task: "${task}"\n\nConnector state: ${connectorSummary}\n\nNo LLM provider configured. Set GROQ_API_KEY or OPENAI_API_KEY to enable live agent execution.`,
      summary:    `Synthetic execution of: ${task}`,
      steps,
      artifacts:  [],
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

    const raw    = await callLLM(messages, { model: 'gpt-4o', json: !!process.env.OPENAI_API_KEY });
    const parsed = safeParseJSON(raw);

    const steps = (parsed?.plan || []).map((p, i) => ({
      step:     p.step ?? i + 1,
      label:    p.label ?? `Step ${i + 1}`,
      status:   'complete',
      parallel: p.parallel ?? false,
      details:  p.details ?? '',
    }));
    if (!steps.length) {
      steps.push(
        { step: 1, label: 'Task received',    status: 'complete', parallel: false },
        { step: 2, label: 'LLM executed',     status: 'complete', parallel: false },
        { step: 3, label: 'Result ready',     status: 'complete', parallel: false },
      );
    }

    const result              = parsed?.result           || raw;
    const summary             = parsed?.summary          || task.slice(0, 80);
    const artifacts           = parsed?.artifacts        || [];
    const connector_actions   = parsed?.connector_actions || [];
    const parallel_groups     = parsed?.parallel_groups  || {};

    return res.status(200).json({
      event_type: 'run_completed',
      run_id:     runId || null,
      task,
      agent,
      mode,
      result,
      summary,
      steps,
      artifacts,
      connector_actions,
      parallel_groups,
      connector_state: connectors,
      workspace_object: {
        type:    inferWsType(result, agent),
        title:   summary,
        content: result,
        steps,
        meta:    { agent, mode, artifacts, connector_actions, parallel_groups },
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

function inferWsType(result, agentId) {
  if (!result) return 'agent_run';
  if (result.includes('```')) return 'code';
  const lower = result.toLowerCase();
  if (agentId === 'builder') return 'ui';
  if (agentId === 'research' || lower.includes('research') || lower.includes('findings')) return 'search';
  if (agentId === 'scraper') return 'scrape';
  return 'agent_run';
}
