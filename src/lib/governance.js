import { storage } from './safeStorage.js';
import { persistGovernanceSettings } from './supabasePersistence.js';

const STORAGE_KEY = 'governance_settings';

export const DEFAULT_GOVERNANCE = {
  allowUiEdits: true,
  allowGitHubWrites: false,
  requireApproval: false,
  previewOnly: false,
  deploymentPermission: false,
  connectorPermissions: true,
  browserExecution: false,
  exportStaging: true,
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
  cached = { ...cached, ...next };
  storage.set(STORAGE_KEY, cached);
  persistGovernanceSettings(cached).catch(() => {});
  notify();
  return cached;
}

export function subscribeGovernance(cb) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}
