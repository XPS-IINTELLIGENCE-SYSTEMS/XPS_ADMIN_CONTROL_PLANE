/**
 * XPS Workspace Engine
 *
 * Provides a React Context + useReducer-based engine that manages "workspace objects":
 * live editor documents, AI output artifacts, run logs, and data results rendered in
 * the center ActiveWorkspace. The right rail (ChatRail) dispatches structured actions
 * to create, update, and drive the lifecycle of these objects.
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { loadWorkspaceSnapshot, saveWorkspaceSnapshot } from './orchestrationPersistence.js';

// ── Object types ──────────────────────────────────────────────────────────────

export const OBJ_TYPE = {
  CODE:             'code',
  SEARCH:           'search',
  SCRAPE:           'scrape',
  REPORT:           'report',
  DATA:             'data',
  LOG:              'log',
  ARTIFACT:         'artifact',
  // Phase 3 — richer types
  UI:               'ui',
  COMPONENT:        'component',
  PREVIEW:          'preview',
  IMAGE:            'image',
  PHOTO:            'photo',
  VIDEO:            'video',
  ARTIFACT_BUNDLE:  'artifact_bundle',
  WORKFLOW:         'workflow',
  CONNECTOR_ACTION: 'connector_action',
  AGENT_RUN:        'agent_run',
  RUNTIME_STATE:    'runtime_state',
  PRE_STAGE:        'pre_stage',
  STAGE:            'stage',
  HUBSPOT_EXPORT:   'hubspot_export',
  AIRTABLE_EXPORT:  'airtable_export',
  RUNTIME_LEDGER:   'runtime_ledger',
  RECOVERY_QUEUE:   'recovery_queue',
  SITE_MUTATION:    'site_mutation',
  // Phase 4 — browser automation + parallel execution
  BROWSER_SESSION:   'browser_session',
  BROWSER_RESULT:    'browser_result',
  PAGE_SNAPSHOT:     'page_snapshot',
  EVIDENCE_BUNDLE:   'evidence_bundle',
  PARALLEL_RUN_GROUP:'parallel_run_group',
};

export const OBJ_TYPE_META = {
  code:             { label: 'Code',             icon: '</>' },
  search:           { label: 'Search',           icon: '[S]' },
  scrape:           { label: 'Scrape',           icon: '[W]' },
  report:           { label: 'Report',           icon: '[R]' },
  data:             { label: 'Data',             icon: '[D]' },
  log:              { label: 'Run Log',          icon: '[L]' },
  artifact:         { label: 'Artifact',         icon: '[A]' },
  ui:               { label: 'UI',               icon: '[U]' },
  component:        { label: 'Component',        icon: '[C]' },
  preview:          { label: 'Preview',          icon: '[P]' },
  image:            { label: 'Image',            icon: '[I]' },
  photo:            { label: 'Photo',            icon: '[F]' },
  video:            { label: 'Video',            icon: '[V]' },
  artifact_bundle:  { label: 'Bundle',           icon: '[B]' },
  workflow:         { label: 'Workflow',         icon: '[F]' },
  connector_action: { label: 'Connector',        icon: '[X]' },
  agent_run:        { label: 'Agent Run',        icon: '[G]' },
  runtime_state:    { label: 'Runtime State',    icon: '[T]' },
  pre_stage:        { label: 'Pre-Stage',        icon: '[P]' },
  stage:            { label: 'Stage',            icon: '[S]' },
  hubspot_export:   { label: 'HubSpot Export',   icon: '[H]' },
  airtable_export:  { label: 'Airtable Export',  icon: '[A]' },
  runtime_ledger:   { label: 'Runtime Ledger',   icon: '[L]' },
  recovery_queue:   { label: 'Recovery Queue',   icon: '[R]' },
  site_mutation:    { label: 'Site Mutation',    icon: '[M]' },
  // Phase 4
  browser_session:    { label: 'Browser Session',    icon: '[N]' },
  browser_result:     { label: 'Browser Result',     icon: '[N]' },
  page_snapshot:      { label: 'Page Snapshot',      icon: '[N]' },
  evidence_bundle:    { label: 'Evidence Bundle',    icon: '[E]' },
  parallel_run_group: { label: 'Parallel Group',     icon: '[M]' },
};

// ── Object statuses ───────────────────────────────────────────────────────────

export const RUN_STATUS = {
  IDLE:      'idle',
  QUEUED:    'queued',
  RUNNING:   'running',
  DONE:      'done',
  ERROR:     'error',
  CANCELLED: 'cancelled',
  RETRY:     'retry',
};

// ── Action types ──────────────────────────────────────────────────────────────

export const WS_CREATE     = 'WS_CREATE';
export const WS_UPDATE     = 'WS_UPDATE';
export const WS_PATCH      = 'WS_PATCH';
export const WS_APPEND_LOG = 'WS_APPEND_LOG';
export const WS_SET_STATUS = 'WS_SET_STATUS';
export const WS_SET_ACTIVE = 'WS_SET_ACTIVE';
export const WS_CLOSE      = 'WS_CLOSE';

// ── Helpers ───────────────────────────────────────────────────────────────────

export function genId() {
  return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeObject({ id, type = OBJ_TYPE.REPORT, title, content = '', agent = null, status = RUN_STATUS.IDLE, meta = {}, steps = [], progress = 0 } = {}) {
  const now = Date.now();
  return {
    id: id || genId(),
    type,
    title: title || `${OBJ_TYPE_META[type]?.label ?? type} — ${new Date(now).toLocaleTimeString()}`,
    content,
    logs: [],
    status,
    agent,
    meta,        // type-specific extra data (steps, urls, connector info, etc.)
    steps,       // run step array [ { step, label, status } ]
    progress,    // 0–100
    createdAt: now,
    updatedAt: now,
  };
}

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case WS_CREATE: {
      const obj = makeObject(action.payload);
      return {
        ...state,
        objects: [...state.objects, obj],
        activeId: obj.id,
      };
    }

    case WS_UPDATE: {
      return {
        ...state,
        objects: state.objects.map(o =>
          o.id === action.payload.id
            ? { ...o, content: action.payload.content, updatedAt: Date.now() }
            : o
        ),
      };
    }

    case WS_PATCH: {
      return {
        ...state,
        objects: state.objects.map(o =>
          o.id === action.payload.id
            ? { ...o, ...action.payload.patch, updatedAt: Date.now() }
            : o
        ),
      };
    }

    case WS_APPEND_LOG: {
      return {
        ...state,
        objects: state.objects.map(o =>
          o.id === action.payload.id
            ? {
                ...o,
                logs: [...o.logs, { ts: Date.now(), line: action.payload.line }],
                updatedAt: Date.now(),
              }
            : o
        ),
      };
    }

    case WS_SET_STATUS: {
      return {
        ...state,
        objects: state.objects.map(o =>
          o.id === action.payload.id
            ? { ...o, status: action.payload.status, updatedAt: Date.now() }
            : o
        ),
      };
    }

    case WS_SET_ACTIVE: {
      return { ...state, activeId: action.payload.id };
    }

    case WS_CLOSE: {
      const filtered = state.objects.filter(o => o.id !== action.payload.id);
      let activeId = state.activeId;
      if (activeId === action.payload.id) {
        activeId = filtered.length > 0 ? filtered[filtered.length - 1].id : null;
      }
      return { ...state, objects: filtered, activeId };
    }

    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [state, dispatch] = useReducer(
    reducer,
    null,
    () => loadWorkspaceSnapshot() || { objects: [], activeId: null },
  );

  const createObject = useCallback((payload) => {
    dispatch({ type: WS_CREATE, payload });
  }, []);

  const updateObject = useCallback((id, content) => {
    dispatch({ type: WS_UPDATE, payload: { id, content } });
  }, []);

  const patchObject = useCallback((id, patch) => {
    dispatch({ type: WS_PATCH, payload: { id, patch } });
  }, []);

  const appendLog = useCallback((id, line) => {
    dispatch({ type: WS_APPEND_LOG, payload: { id, line } });
  }, []);

  const setStatus = useCallback((id, status) => {
    dispatch({ type: WS_SET_STATUS, payload: { id, status } });
  }, []);

  const setActive = useCallback((id) => {
    dispatch({ type: WS_SET_ACTIVE, payload: { id } });
  }, []);

  const closeObject = useCallback((id) => {
    dispatch({ type: WS_CLOSE, payload: { id } });
  }, []);

  const value = {
    objects: state.objects,
    activeId: state.activeId,
    createObject,
    updateObject,
    patchObject,
    appendLog,
    setStatus,
    setActive,
    closeObject,
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveWorkspaceSnapshot(state);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [state]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used inside <WorkspaceProvider>');
  return ctx;
}

// ── Content type detection ────────────────────────────────────────────────────

/**
 * Infer an object type from AI reply text and agent ID.
 */
export function detectObjectType(content, agentId) {
  if (!content) return OBJ_TYPE.REPORT;
  if (content.includes('```')) return OBJ_TYPE.CODE;
  const lower = content.toLowerCase();
  if (agentId === 'scraper' || lower.includes('scrape') || lower.includes('extracted') || lower.includes('crawl')) {
    return OBJ_TYPE.SCRAPE;
  }
  if (agentId === 'research' || lower.includes('search result') || lower.includes('found ') || lower.includes('web search')) {
    return OBJ_TYPE.SEARCH;
  }
  if (agentId === 'builder' || lower.includes('<html') || lower.includes('component') || lower.includes('render(')) {
    return OBJ_TYPE.UI;
  }
  if (agentId === 'bytebot' || lower.includes('step ') || lower.includes('task completed') || lower.includes('run complete')) {
    return OBJ_TYPE.AGENT_RUN;
  }
  if (lower.includes('"items"') || lower.includes('[{') || lower.includes('json') || lower.includes('structured data')) {
    return OBJ_TYPE.DATA;
  }
  return OBJ_TYPE.REPORT;
}

/**
 * Derive a short title from the first non-empty line of agent content.
 */
export function deriveTitle(content, agentId) {
  const fallback = `${agentId ?? 'agent'} output`;
  if (!content) return fallback;
  const firstLine = content.split('\n').find(l => l.trim())?.replace(/^#+\s*/, '').replace(/^```\w*/, '').trim() ?? '';
  if (!firstLine) return fallback;
  return firstLine.length > 60 ? firstLine.slice(0, 60) + '…' : firstLine;
}
