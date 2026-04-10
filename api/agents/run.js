// Vercel serverless function: POST /api/agents/run
// Autonomous agent task execution — emits structured run contracts
import { callLLM, llmMode, hasLLM } from '../_llm.js';

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

  const mode = llmMode();
  const ts   = new Date().toISOString();

  const agentSystemPrompts = {
    bytebot: `You are ByteBot, an autonomous multi-step task executor for the XPS Intelligence Command Center.

For the given task, produce a structured execution plan and result. Your response must be valid JSON with this exact schema:
{
  "plan": [ { "step": 1, "label": "...", "action": "..." } ],
  "result": "... detailed result text ...",
  "artifacts": [ { "type": "code|report|data", "title": "...", "content": "..." } ],
  "summary": "... one-line summary ..."
}
Be specific and produce real, actionable output.`,
    orchestrator: `You are the XPS Orchestrator. Analyze the task and produce a structured JSON response:
{
  "plan": [ { "step": 1, "label": "...", "action": "..." } ],
  "result": "... detailed result ...",
  "artifacts": [],
  "summary": "..."
}`,
    research: `You are the XPS Research Agent. Research the given topic. Return JSON:
{
  "plan": [ { "step": 1, "label": "Research", "action": "query" } ],
  "result": "... full research report ...",
  "artifacts": [ { "type": "report", "title": "Research: ${task}", "content": "..." } ],
  "summary": "..."
}`,
    scraper: `You are the XPS Scraper Agent. Return JSON:
{
  "plan": [ { "step": 1, "label": "Analyze target", "action": "scrape" } ],
  "result": "... scrape analysis ...",
  "artifacts": [],
  "summary": "..."
}`,
    builder: `You are the XPS Auto Builder. Generate code or UI. Return JSON:
{
  "plan": [ { "step": 1, "label": "Generate", "action": "build" } ],
  "result": "... implementation ...",
  "artifacts": [ { "type": "code", "title": "Generated Output", "content": "..." } ],
  "summary": "..."
}`,
    default: `You are an XPS Intelligence agent. Return JSON:
{
  "plan": [ { "step": 1, "label": "Execute", "action": "run" } ],
  "result": "...",
  "artifacts": [],
  "summary": "..."
}`,
  };

  // Synthetic fallback
  if (!hasLLM()) {
    const steps = [
      { step: 1, label: 'Task received',   status: 'complete' },
      { step: 2, label: 'Analyzing task',  status: 'complete' },
      { step: 3, label: 'Backend offline', status: 'skipped'  },
    ];
    return res.status(200).json({
      event_type: 'run_completed',
      run_id:     runId || null,
      task,
      agent,
      mode:       'synthetic',
      result:     `[Synthetic] ${agent} received task: "${task}"\n\nNo LLM provider configured. Set OPENAI_API_KEY to enable live agent execution.\n\nTo run this live:\n1. Set OPENAI_API_KEY in your Vercel environment\n2. Redeploy\n3. Re-run this task`,
      summary:    `Synthetic execution of: ${task}`,
      steps,
      artifacts:  [],
      workspace_object: {
        type:    'agent_run',
        title:   `[Synthetic] ${agent}: ${task.slice(0, 50)}`,
        content: `Task: ${task}\n\nStatus: synthetic — no LLM configured.`,
        steps,
        meta:    { agent, mode: 'synthetic' },
      },
      timestamp: ts,
    });
  }

  const systemPrompt = (agentSystemPrompts[agent] || agentSystemPrompts.default).replace('${task}', task);

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: buildUserPrompt(task, context) },
    ];

    const raw    = await callLLM(messages, { model: 'gpt-4o', json: !!process.env.OPENAI_API_KEY });
    const parsed = safeParseJSON(raw);

    const steps = (parsed?.plan || []).map((p, i) => ({
      step:   p.step ?? i + 1,
      label:  p.label ?? `Step ${i + 1}`,
      status: 'complete',
    }));
    if (!steps.length) {
      steps.push(
        { step: 1, label: 'Task received', status: 'complete' },
        { step: 2, label: 'LLM executed',  status: 'complete' },
        { step: 3, label: 'Result ready',  status: 'complete' },
      );
    }

    const result   = parsed?.result   || raw;
    const summary  = parsed?.summary  || task.slice(0, 80);
    const artifacts = (parsed?.artifacts || []);

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
      workspace_object: {
        type:    inferWsType(result, agent),
        title:   summary,
        content: result,
        steps,
        meta:    { agent, mode, artifacts },
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
