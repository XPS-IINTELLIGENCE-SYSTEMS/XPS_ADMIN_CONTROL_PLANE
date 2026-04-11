/**
 * Parallel Run Group manager.
 *
 * Tracks groups of concurrent jobs (browser/bytebot/search/scrape).
 * When all jobs in a group complete, emits a parallel_run_group workspace
 * object with a summary.
 */

import { genId, OBJ_TYPE, RUN_STATUS } from './workspaceEngine.jsx';
import { persistParallelGroup } from './supabasePersistence.js';

const _groups = new Map();  // groupId → GroupState
const _subs   = new Set();

function createHistory(status, detail) {
  return { ts: new Date().toISOString(), status, detail };
}

export function subscribeGroups(cb) {
  _subs.add(cb);
  return () => _subs.delete(cb);
}

function notify() {
  for (const cb of _subs) cb([..._groups.values()]);
}

export function getGroupList() {
  return [..._groups.values()].sort((a, b) => b.createdAt - a.createdAt);
}

export function getGroup(groupId) {
  return _groups.get(groupId) || null;
}

/**
 * Create a new parallel run group.
 *
 * @param {string}   title         - Display title for the group
 * @param {Array}    initialJobs   - [{ jobId, title, type, status }]
 * @param {object}   workspaceCtx  - workspace engine context
 * @returns {string} groupId
 */
export function createRunGroup(title, initialJobs = [], workspaceCtx) {
  const groupId = genId();
  const now     = Date.now();

  const group = {
    groupId,
    title,
    jobs:      initialJobs.map(j => ({ ...j, status: j.status || 'queued' })),
    status:    'running',
    wsObjId:   null,
    createdAt: now,
    updatedAt: now,
    history:   [createHistory('running', `${title} created with ${initialJobs.length} job(s).`)],
  };
  _groups.set(groupId, group);

  // Create workspace object
  const wsObjId = genId();
  group.wsObjId = wsObjId;

  workspaceCtx?.createObject({
    id:      wsObjId,
    type:    OBJ_TYPE.PARALLEL_RUN_GROUP,
    title,
    content: `Parallel group: ${initialJobs.length} jobs running`,
    status:  RUN_STATUS.RUNNING,
    progress: 0,
    meta:    { groupId, jobs: group.jobs },
  });

  persistParallelGroup({ groupId, title, jobIds: initialJobs.map(j => j.jobId), status: 'running' }).catch(() => {});
  notify();
  return groupId;
}

/**
 * Add a job to an existing group.
 */
export function addJobToGroup(groupId, job, workspaceCtx) {
  const group = _groups.get(groupId);
  if (!group) return;
  group.jobs.push({ ...job, status: job.status || 'queued' });
  group.updatedAt = Date.now();
  group.history.unshift(createHistory('updated', `Added ${job.title || job.jobId || 'job'} to group.`));
  if (group.history.length > 20) group.history.length = 20;
  _refreshGroupObject(groupId, workspaceCtx);
  notify();
}

/**
 * Update a specific job's status in a group.
 * When all jobs reach terminal state, marks the group complete.
 */
export function updateGroupJobStatus(groupId, jobId, status, workspaceCtx) {
  const group = _groups.get(groupId);
  if (!group) return;

  const job = group.jobs.find(j => j.jobId === jobId);
  if (job) job.status = status;
  group.updatedAt = Date.now();

  const done     = ['complete', 'error', 'cancelled', 'blocked'];
  const allDone  = group.jobs.every(j => done.includes(j.status));
  const anyError = group.jobs.some(j => j.status === 'error');
  const anyBlocked = group.jobs.some(j => j.status === 'blocked');
  const anyCancelled = group.jobs.some(j => j.status === 'cancelled');
  group.history.unshift(createHistory(status, `${jobId} → ${status}`));
  if (group.history.length > 20) group.history.length = 20;

  if (allDone) {
    group.status = anyError || anyBlocked || anyCancelled ? 'partial-failure' : 'complete';

    if (group.wsObjId) {
      const completed = group.jobs.filter(j => j.status === 'complete').length;
      const failed = group.jobs.filter(j => ['error', 'blocked', 'cancelled'].includes(j.status)).length;
      const summary   = failed > 0
        ? `${completed}/${group.jobs.length} jobs completed, ${failed} ended blocked/error/cancelled`
        : `${completed}/${group.jobs.length} jobs completed`;
      workspaceCtx?.patchObject(group.wsObjId, {
        status:   failed > 0 ? RUN_STATUS.ERROR : RUN_STATUS.DONE,
        progress: 100,
        content:  `Parallel group complete: ${summary}`,
        meta:     { groupId, jobs: group.jobs, summary, history: group.history, status: group.status },
      });
      workspaceCtx?.setStatus(group.wsObjId, failed > 0 ? RUN_STATUS.ERROR : RUN_STATUS.DONE);
    }
    persistParallelGroup({ groupId, title: group.title, jobIds: group.jobs.map(j => j.jobId), status: group.status }).catch(() => {});
  } else {
    _refreshGroupObject(groupId, workspaceCtx);
  }

  notify();
}

function _refreshGroupObject(groupId, workspaceCtx) {
  const group = _groups.get(groupId);
  if (!group?.wsObjId) return;
  const done   = group.jobs.filter(j => ['complete','error','cancelled','blocked'].includes(j.status)).length;
  const total  = group.jobs.length;
  const prog   = total > 0 ? Math.round((done / total) * 100) : 0;
  workspaceCtx?.patchObject(group.wsObjId, {
    progress: prog,
    meta:     { groupId, jobs: group.jobs, history: group.history, status: group.status },
    content:  `Parallel group: ${done}/${total} jobs done`,
  });
}
