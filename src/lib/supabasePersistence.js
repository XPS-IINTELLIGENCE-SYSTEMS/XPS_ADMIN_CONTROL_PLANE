/**
 * Supabase persistence layer for XPS Phase 3 runtime state.
 *
 * All functions are graceful no-ops when Supabase is not configured.
 * Never throws — errors are swallowed so the UI never breaks due to
 * persistence failures.
 */

import { supabase } from './supabaseClient.js';

const enabled = !!(
  import.meta.env.SUPABASE_URL &&
  import.meta.env.SUPABASE_ANON_KEY
);

// ── Agent runs ────────────────────────────────────────────────────────────────

export async function persistRun({ runId, agent, task, status, mode, steps = [], result = null, error = null }) {
  if (!enabled) return null;
  try {
    const { data, error: err } = await supabase
      .from('agent_runs')
      .upsert({
        id:           runId,
        agent,
        task,
        status,
        mode,
        steps:        steps,
        result:       result ?? null,
        error_msg:    error ?? null,
        progress:     status === 'complete' ? 100 : status === 'running' ? 50 : 0,
        started_at:   status === 'running'  ? new Date().toISOString() : undefined,
        completed_at: status === 'complete' || status === 'error' ? new Date().toISOString() : undefined,
      }, { onConflict: 'id' })
      .select()
      .single();
    if (err) console.warn('[persist] run upsert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] run error:', e.message);
    return null;
  }
}

// ── Agent logs ────────────────────────────────────────────────────────────────

export async function persistLog(runId, level, message, data = null) {
  if (!enabled) return null;
  try {
    const { error: err } = await supabase
      .from('agent_logs')
      .insert({ run_id: runId, level, message, data });
    if (err) console.warn('[persist] log insert:', err.message);
  } catch (e) {
    console.warn('[persist] log error:', e.message);
  }
  return null;
}

// ── Artifacts ─────────────────────────────────────────────────────────────────

export async function persistArtifact({ type, title, content, agent, runId = null, meta = {} }) {
  if (!enabled) return null;
  try {
    const { data, error: err } = await supabase
      .from('artifacts')
      .insert({ type, title, content, agent, run_id: runId, meta })
      .select()
      .single();
    if (err) console.warn('[persist] artifact insert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] artifact error:', e.message);
    return null;
  }
}

// ── Workspace objects ─────────────────────────────────────────────────────────

export async function persistWorkspaceObject({ id, type, title, content, agent, meta = {} }) {
  if (!enabled) return null;
  try {
    const { error: err } = await supabase
      .from('workspace_objects')
      .insert({ ws_obj_id: id, type, title, content, agent, meta });
    if (err) console.warn('[persist] workspace_object insert:', err.message);
  } catch (e) {
    console.warn('[persist] workspace_object error:', e.message);
  }
  return null;
}

// ── Scrape jobs ───────────────────────────────────────────────────────────────

export async function persistScrapeJob({ url, prompt, status, result = null, rawContent = null, mode = 'synthetic' }) {
  if (!enabled) return null;
  try {
    const { data, error: err } = await supabase
      .from('scrape_jobs')
      .insert({
        url, prompt, status, result, raw_content: rawContent, mode,
        completed_at: status === 'complete' ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (err) console.warn('[persist] scrape_job insert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] scrape_job error:', e.message);
    return null;
  }
}

// ── Search jobs ───────────────────────────────────────────────────────────────

export async function persistSearchJob({ query, context, status, summary = null, sources = [], mode = 'synthetic' }) {
  if (!enabled) return null;
  try {
    const { data, error: err } = await supabase
      .from('search_jobs')
      .insert({
        query, context, status, summary, sources, mode,
        completed_at: status === 'complete' ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (err) console.warn('[persist] search_job insert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] search_job error:', e.message);
    return null;
  }
}

// ── Control plane action log ──────────────────────────────────────────────────

export async function persistControlAction(action, payload, result, status = 'complete') {
  if (!enabled) return null;
  try {
    const { error: err } = await supabase
      .from('control_plane_actions')
      .insert({ action, payload, result, status });
    if (err) console.warn('[persist] control_action insert:', err.message);
  } catch (e) {
    console.warn('[persist] control_action error:', e.message);
  }
  return null;
}

// ── Recent runs query ─────────────────────────────────────────────────────────

export async function fetchRecentRuns(limit = 20) {
  if (!enabled) return [];
  try {
    const { data, error: err } = await supabase
      .from('agent_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (err) console.warn('[persist] fetchRecentRuns:', err.message);
    return data || [];
  } catch (e) {
    console.warn('[persist] fetchRecentRuns error:', e.message);
    return [];
  }
}

export { enabled as supabaseEnabled };

// ── Browser jobs ──────────────────────────────────────────────────────────────

export async function persistBrowserJob({ jobId, url, action, status, mode, result = null, evidence = null }) {
  if (!enabled) return null;
  try {
    const { data, error: err } = await supabase
      .from('browser_jobs')
      .upsert({
        id:           jobId,
        url,
        action,
        status,
        mode,
        result:       result ?? null,
        evidence:     evidence ?? null,
        completed_at: ['complete','error','blocked'].includes(status) ? new Date().toISOString() : null,
      }, { onConflict: 'id' })
      .select()
      .single();
    if (err) console.warn('[persist] browser_job upsert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] browser_job error:', e.message);
    return null;
  }
}

// ── Parallel run groups ───────────────────────────────────────────────────────

export async function persistParallelGroup({ groupId, title, jobIds = [], status }) {
  if (!enabled) return null;
  try {
    const { data, error: err } = await supabase
      .from('parallel_run_groups')
      .upsert({
        id:      groupId,
        title,
        job_ids: jobIds,
        status,
        completed_at: ['complete','error'].includes(status) ? new Date().toISOString() : null,
      }, { onConflict: 'id' })
      .select()
      .single();
    if (err) console.warn('[persist] parallel_group upsert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] parallel_group error:', e.message);
    return null;
  }
}

// ── Page snapshots ────────────────────────────────────────────────────────────

export async function persistSnapshot({ jobId, url, snapshotText, extractedData = null }) {
  if (!enabled) return null;
  try {
    const { data, error: err } = await supabase
      .from('page_snapshots')
      .insert({ job_id: jobId, url, snapshot_text: snapshotText, extracted_data: extractedData })
      .select()
      .single();
    if (err) console.warn('[persist] snapshot insert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] snapshot error:', e.message);
    return null;
  }
}
