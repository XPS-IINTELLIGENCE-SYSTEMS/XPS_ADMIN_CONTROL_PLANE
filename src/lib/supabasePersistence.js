/**
 * Supabase persistence layer for XPS Phase 3 runtime state.
 *
 * All functions are graceful no-ops when Supabase is not configured.
 * Never throws — errors are swallowed so the UI never breaks due to
 * persistence failures.
 */

import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient.js';

// ── Agent runs ────────────────────────────────────────────────────────────────

export async function persistRun({ runId, agent, task, status, mode, steps = [], result = null, error = null, summary = null, artifacts = [] }) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
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
        summary:      summary ?? null,
        artifacts:    artifacts ?? [],
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
  if (!isSupabaseConfigured()) return null;
  try {
    const { error: err } = await getSupabaseClient()
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
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
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

export async function persistWorkspaceObject({ id, type, title, content, agent, runId = null, status = 'done', steps = [], progress = 0, meta = {} }) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { error: err } = await getSupabaseClient()
      .from('workspace_objects')
      .insert({
        ws_obj_id: id,
        type,
        title,
        content,
        agent,
        run_id: runId,
        status,
        steps,
        progress,
        meta,
      });
    if (err) console.warn('[persist] workspace_object insert:', err.message);
  } catch (e) {
    console.warn('[persist] workspace_object error:', e.message);
  }
  return null;
}

// ── Scrape jobs ───────────────────────────────────────────────────────────────

export async function persistScrapeJob({ url, prompt, status, result = null, rawContent = null, mode = 'synthetic' }) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
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
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
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
  if (!isSupabaseConfigured()) return null;
  try {
    const { error: err } = await getSupabaseClient()
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
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error: err } = await getSupabaseClient()
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

export function supabaseEnabled() {
  return isSupabaseConfigured();
}

// ── Browser jobs ──────────────────────────────────────────────────────────────

export async function persistBrowserJob({ jobId, url, action, status, mode, result = null, evidence = null }) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
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
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
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

// ── UI mutation pipeline ───────────────────────────────────────────────────────

export async function persistUiPreview({ previewId, targetId, state, summary, source = 'manual', status = 'preview' }) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
      .from('ui_mutation_previews')
      .insert({
        id: previewId,
        target_id: targetId,
        state,
        summary,
        source,
        status,
      })
      .select()
      .single();
    if (err) console.warn('[persist] ui preview insert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] ui preview error:', e.message);
    return null;
  }
}

export async function persistUiVersion({ versionId, targetId, state, summary, source = 'apply' }) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
      .from('ui_versions')
      .insert({
        id: versionId,
        target_id: targetId,
        state,
        summary,
        source,
      })
      .select()
      .single();
    if (err) console.warn('[persist] ui version insert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] ui version error:', e.message);
    return null;
  }
}

export async function persistUiRollback({ rollbackId, targetId, fromVersion, toVersion, summary }) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
      .from('ui_rollbacks')
      .insert({
        id: rollbackId,
        target_id: targetId,
        from_version: fromVersion,
        to_version: toVersion,
        summary,
      })
      .select()
      .single();
    if (err) console.warn('[persist] ui rollback insert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] ui rollback error:', e.message);
    return null;
  }
}

export async function persistGovernanceSettings(settings) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
      .from('governance_settings')
      .insert({ settings })
      .select()
      .single();
    if (err) console.warn('[persist] governance insert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] governance error:', e.message);
    return null;
  }
}

// ── Page snapshots ────────────────────────────────────────────────────────────

export async function persistSnapshot({ jobId, url, snapshotText, extractedData = null }) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
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

// ── Connector snapshots ────────────────────────────────────────────────────────

export async function persistConnectorSnapshot({ connectors, mode = 'synthetic', triggeredBy = 'auto' }) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
      .from('connector_snapshots')
      .insert({ connectors, mode, triggered_by: triggeredBy })
      .select()
      .single();
    if (err) console.warn('[persist] connector_snapshot insert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] connector_snapshot error:', e.message);
    return null;
  }
}

// ── Staging / exports ─────────────────────────────────────────────────────────

export async function persistPreStageItem({ runId = null, source = 'runtime', payload = {}, status = 'queued' }) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
      .from('pre_stage_items')
      .insert({ run_id: runId, source, payload, status })
      .select()
      .single();
    if (err) console.warn('[persist] pre_stage insert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] pre_stage error:', e.message);
    return null;
  }
}

export async function persistStageItem({ runId = null, source = 'runtime', payload = {}, status = 'queued' }) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
      .from('stage_items')
      .insert({ run_id: runId, source, payload, status })
      .select()
      .single();
    if (err) console.warn('[persist] stage insert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] stage error:', e.message);
    return null;
  }
}

export async function persistHubSpotExport({ runId = null, payload = {}, status = 'queued', blockedReason = null }) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
      .from('hubspot_exports')
      .insert({ run_id: runId, payload, status, blocked_reason: blockedReason })
      .select()
      .single();
    if (err) console.warn('[persist] hubspot export insert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] hubspot export error:', e.message);
    return null;
  }
}

export async function persistAirtableExport({ runId = null, payload = {}, status = 'queued', blockedReason = null }) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
      .from('airtable_exports')
      .insert({ run_id: runId, payload, status, blocked_reason: blockedReason })
      .select()
      .single();
    if (err) console.warn('[persist] airtable export insert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] airtable export error:', e.message);
    return null;
  }
}

// ── Runtime ledger / recovery ─────────────────────────────────────────────────

export async function persistRuntimeLedger({ runId = null, entryType, payload = {}, status = 'recorded' }) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
      .from('runtime_ledgers')
      .insert({ run_id: runId, entry_type: entryType, payload, status })
      .select()
      .single();
    if (err) console.warn('[persist] ledger insert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] ledger error:', e.message);
    return null;
  }
}

export async function persistRecoveryQueue({ runId = null, action, payload = {}, status = 'queued', retryCount = 0, lastError = null }) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error: err } = await getSupabaseClient()
      .from('recovery_queue')
      .insert({ run_id: runId, action, payload, status, retry_count: retryCount, last_error: lastError })
      .select()
      .single();
    if (err) console.warn('[persist] recovery insert:', err.message);
    return data;
  } catch (e) {
    console.warn('[persist] recovery error:', e.message);
    return null;
  }
}
