import { storage } from './safeStorage.js';
import { persistGovernanceSettings } from './supabasePersistence.js';

const STORAGE_KEY = 'governance_settings';

export const DEFAULT_GOVERNANCE = {
  allowUiEdits: true,
  allowSiteMutations: true,
  allowGitHubWrites: false,
  requireApproval: false,
  previewOnly: false,
  deploymentPermission: false,
  connectorPermissions: true,
  browserExecution: false,
  exportStaging: true,
  communicationActions: false,
  mediaActions: false,
  rollbackRetention: '30 days',
  autonomyLevel: 'assisted',
};

let cached = storage.get(STORAGE_KEY, DEFAULT_GOVERNANCE);
const subscribers = new Set();

function notify() {
  subscribers.forEach(cb => cb(cached));
}

export function getGovernance() {
  return cached;
}

export function setGovernance(next) {
  const updated = { ...cached, ...next };
  cached = updated;
  storage.set(STORAGE_KEY, updated);
  persistGovernanceSettings(updated).catch(() => {});
  notify();
  return updated;
}

export function subscribeGovernance(cb) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}
