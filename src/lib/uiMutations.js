import { genId } from './workspaceEngine.jsx';

export const DEFAULT_UI_STATE = {
  site: {
    pageTitle: 'XPS Operator Workspace',
    route: '/workspace',
    description: 'Governed operator workspace for orchestration, research, and site control.',
    navItems: ['Overview', 'Workspace', 'Connectors', 'Deploy'],
    effectPreset: 'operator-grid',
    featureFlags: {
      liveChat: true,
      browserResearch: true,
      mediaWorkbench: false,
      outboundComms: false,
    },
  },
  theme: {
    primaryColor: '#d4a843',
    accentColor: '#3b82f6',
    background: '#0f0f0f',
    surface: '#161616',
    textColor: '#f8fafc',
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.08)',
    gradient: 'linear-gradient(135deg, rgba(212,168,67,0.18), rgba(59,130,246,0.12))',
    shadow: '0 18px 32px rgba(0,0,0,0.35)',
    animation: 'none',
  },
  components: [
    { id: genId(), type: 'section', title: 'Command Surface', body: 'Editable intelligence surface for ops, research, and deployment.' },
    { id: genId(), type: 'card', title: 'Signal Intake', body: 'Drop files, requests, or resource links to generate new UI assets.' },
    { id: genId(), type: 'button', label: 'Confirm Action', variant: 'primary' },
    { id: genId(), type: 'tabs', tabs: ['Overview', 'Ops', 'Deploy'], active: 0 },
  ],
};

export function normalizeUiState(state) {
  return {
    site: { ...DEFAULT_UI_STATE.site, ...(state?.site || {}), featureFlags: { ...DEFAULT_UI_STATE.site.featureFlags, ...(state?.site?.featureFlags || {}) } },
    theme: { ...DEFAULT_UI_STATE.theme, ...(state?.theme || {}) },
    components: Array.isArray(state?.components) ? state.components : DEFAULT_UI_STATE.components,
  };
}

export function cloneUiState(state) {
  return JSON.parse(JSON.stringify(state));
}

export function createComponent(type) {
  const base = { id: genId(), type };
  switch (type) {
    case 'card':
      return { ...base, title: 'New Card', body: 'Describe this card.' };
    case 'button':
      return { ...base, label: 'New Button', variant: 'secondary' };
    case 'tabs':
      return { ...base, tabs: ['Tab A', 'Tab B', 'Tab C'], active: 0 };
    case 'section':
    default:
      return { ...base, title: 'New Section', body: 'Section description.' };
  }
}

export function applyUiPatch(state, patch) {
  const next = cloneUiState(state);
  if (patch.site) {
    next.site = {
      ...next.site,
      ...patch.site,
      featureFlags: {
        ...next.site.featureFlags,
        ...(patch.site.featureFlags || {}),
      },
    };
  }
  if (patch.theme) {
    next.theme = { ...next.theme, ...patch.theme };
  }
  if (patch.components) {
    next.components = patch.components;
  }
  if (patch.addComponent) {
    next.components = [...next.components, createComponent(patch.addComponent)];
  }
  if (patch.updateComponent?.id) {
    next.components = next.components.map(c =>
      c.id === patch.updateComponent.id ? { ...c, ...patch.updateComponent.patch } : c
    );
  }
  if (patch.removeComponentId) {
    next.components = next.components.filter(c => c.id !== patch.removeComponentId);
  }
  if (patch.moveComponent?.id) {
    const idx = next.components.findIndex(c => c.id === patch.moveComponent.id);
    if (idx >= 0) {
      const nextIndex = Math.max(0, Math.min(next.components.length - 1, idx + patch.moveComponent.direction));
      const reordered = [...next.components];
      const [item] = reordered.splice(idx, 1);
      reordered.splice(nextIndex, 0, item);
      next.components = reordered;
    }
  }
  if (patch.toggleFeatureFlag) {
    next.site = {
      ...next.site,
      featureFlags: {
        ...next.site.featureFlags,
        [patch.toggleFeatureFlag]: !next.site.featureFlags?.[patch.toggleFeatureFlag],
      },
    };
  }
  return next;
}

export function summarizeUiPatch(patch) {
  if (patch.addComponent) return `Add ${patch.addComponent}`;
  if (patch.removeComponentId) return 'Remove component';
  if (patch.moveComponent) return patch.moveComponent.direction < 0 ? 'Move component up' : 'Move component down';
  if (patch.updateComponent) return 'Update component';
  if (patch.toggleFeatureFlag) return `Toggle feature flag: ${patch.toggleFeatureFlag}`;
  if (patch.site) {
    const keys = Object.keys(patch.site);
    return `Update site: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '…' : ''}`;
  }
  if (patch.theme) {
    const keys = Object.keys(patch.theme);
    return `Update theme: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '…' : ''}`;
  }
  return 'UI update';
}

export function createHistoryEntry(state, summary, source = 'apply') {
  return {
    id: genId(),
    ts: new Date().toISOString(),
    state: cloneUiState(state),
    summary,
    source,
  };
}

export function createDefaultUiState() {
  const base = cloneUiState(DEFAULT_UI_STATE);
  base.components = base.components.map(component => ({ ...component, id: genId() }));
  return base;
}

export function validateUiState(state) {
  const next = normalizeUiState(state);
  const issues = [];

  if (!next.site.pageTitle?.trim()) {
    issues.push('Page title is required.');
  }
  if (!next.site.route?.trim() || !next.site.route.startsWith('/')) {
    issues.push('Route must start with /.');
  }
  if (!Array.isArray(next.components) || next.components.length === 0) {
    issues.push('At least one component is required.');
  }

  next.components.forEach((component, index) => {
    if (!component?.id) {
      issues.push(`Component ${index + 1} is missing an id.`);
    }
    if (!component?.type) {
      issues.push(`Component ${index + 1} is missing a type.`);
    }
    if (component?.type === 'button' && !component?.label?.trim()) {
      issues.push(`Button ${index + 1} is missing a label.`);
    }
    if ((component?.type === 'card' || component?.type === 'section') && !component?.title?.trim()) {
      issues.push(`${component.type === 'card' ? 'Card' : 'Section'} ${index + 1} is missing a title.`);
    }
    if (component?.type === 'tabs' && (!Array.isArray(component.tabs) || component.tabs.length === 0)) {
      issues.push(`Tabs component ${index + 1} needs at least one tab.`);
    }
  });

  return {
    valid: issues.length === 0,
    issues,
    summary: issues.length === 0 ? 'Validation passed.' : `${issues.length} validation issue${issues.length === 1 ? '' : 's'} found.`,
  };
}
