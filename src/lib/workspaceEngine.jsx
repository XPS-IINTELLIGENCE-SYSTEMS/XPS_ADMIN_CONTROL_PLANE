/**
 * XPS Workspace Engine
 *
 * Provides a React Context + useReducer-based engine that manages "workspace objects":
 * live editor documents, AI output artifacts, run logs, and data results rendered in
 * the center ActiveWorkspace. The right rail (ChatRail) dispatches structured actions
 * to create, update, and drive the lifecycle of these objects.
 */

import React, { createContext, useContext, useReducer, useCallback } from 'react';

// ── Object types ──────────────────────────────────────────────────────────────

export const OBJ_TYPE = {
  CODE:     'code',
  SEARCH:   'search',
  SCRAPE:   'scrape',
  REPORT:   'report',
  DATA:     'data',
  LOG:      'log',
  ARTIFACT: 'artifact',
};

export const OBJ_TYPE_META = {
  code:     { label: 'Code',         icon: '</>' },
  search:   { label: 'Search',       icon: '🔍' },
  scrape:   { label: 'Scrape',       icon: '🕷️' },
  report:   { label: 'Report',       icon: '📄' },
  data:     { label: 'Data',         icon: '📊' },
  log:      { label: 'Run Log',      icon: '📋' },
  artifact: { label: 'Artifact',     icon: '📦' },
};

// ── Object statuses ───────────────────────────────────────────────────────────

export const RUN_STATUS = {
  IDLE:    'idle',
  RUNNING: 'running',
  DONE:    'done',
  ERROR:   'error',
};

// ── Action types ──────────────────────────────────────────────────────────────

export const WS_CREATE     = 'WS_CREATE';
export const WS_UPDATE     = 'WS_UPDATE';
export const WS_APPEND_LOG = 'WS_APPEND_LOG';
export const WS_SET_STATUS = 'WS_SET_STATUS';
export const WS_SET_ACTIVE = 'WS_SET_ACTIVE';
export const WS_CLOSE      = 'WS_CLOSE';

// ── Helpers ───────────────────────────────────────────────────────────────────

function genId() {
  return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function makeObject({ type = OBJ_TYPE.REPORT, title, content = '', agent = null, status = RUN_STATUS.IDLE } = {}) {
  const now = Date.now();
  return {
    id: genId(),
    type,
    title: title || `${OBJ_TYPE_META[type]?.label ?? type} — ${new Date(now).toLocaleTimeString()}`,
    content,
    logs: [],
    status,
    agent,
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
  const [state, dispatch] = useReducer(reducer, { objects: [], activeId: null });

  const createObject = useCallback((payload) => {
    dispatch({ type: WS_CREATE, payload });
  }, []);

  const updateObject = useCallback((id, content) => {
    dispatch({ type: WS_UPDATE, payload: { id, content } });
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
    appendLog,
    setStatus,
    setActive,
    closeObject,
  };

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
  if (lower.includes('"items"') || lower.includes('[{') || lower.includes('json') || lower.includes('structured data')) {
    return OBJ_TYPE.DATA;
  }
  return OBJ_TYPE.REPORT;
}

/**
 * Derive a short title from the first non-empty line of agent content.
 */
export function deriveTitle(content, agentId) {
  if (!content) return `${agentId ?? 'agent'} output`;
  const firstLine = content.split('\n').find(l => l.trim())?.replace(/^#+\s*/, '').replace(/^```\w*/, '').trim() ?? '';
  return firstLine.length > 60 ? firstLine.slice(0, 60) + '…' : firstLine || `${agentId ?? 'agent'} output`;
}
