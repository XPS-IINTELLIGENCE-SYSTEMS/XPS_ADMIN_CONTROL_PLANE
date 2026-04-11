import { genId } from './workspaceEngine.jsx';

function createDefaultPage(overrides = {}) {
  return {
    id: genId(),
    title: 'Overview',
    route: '/workspace',
    navLabel: 'Overview',
    description: 'Primary operator overview page.',
    visible: true,
    ...overrides,
  };
}

function generateRouteFromTitle(title) {
  const slug = `${title || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `/${slug || 'new-page'}`;
}

function ensureUniqueRoute(route, pages = []) {
  const existing = new Set((pages || []).map((page) => page?.route).filter(Boolean));
  if (!existing.has(route)) return route;
  let suffix = 2;
  while (existing.has(`${route}-${suffix}`)) suffix += 1;
  return `${route}-${suffix}`;
}

export const DEFAULT_UI_STATE = {
  site: {
    pageTitle: 'XPS Operator Workspace',
    route: '/workspace',
    description: 'Governed operator workspace for orchestration, research, and site control.',
    navItems: ['Overview', 'Workspace', 'Connectors', 'Deploy'],
    effectPreset: 'operator-grid',
    activePageId: null,
    pages: [
      createDefaultPage({
        title: 'Workspace',
        route: '/workspace',
        navLabel: 'Workspace',
        description: 'Governed operator workspace for orchestration, research, and site control.',
      }),
      createDefaultPage({
        title: 'Connectors',
        route: '/connectors',
        navLabel: 'Connectors',
        description: 'Connector awareness, capability state, and orchestration entry point.',
      }),
      createDefaultPage({
        title: 'Deploy',
        route: '/deploy',
        navLabel: 'Deploy',
        description: 'Preview, deployment, and rollback visibility.',
      }),
    ],
    moduleToggles: {
      navigation: true,
      commandSurface: true,
      runtimePanel: true,
      deploymentPanel: true,
      builderRail: true,
    },
    capabilityToggles: {
      repoLinkedMutation: false,
      connectorActions: true,
      browserResearch: true,
      deploymentPreview: false,
    },
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
    headingScale: 1.2,
    bodyScale: 1,
  },
  components: [
    { id: genId(), type: 'section', title: 'Command Surface', body: 'Editable intelligence surface for ops, research, and deployment.' },
    { id: genId(), type: 'card', title: 'Signal Intake', body: 'Drop files, requests, or resource links to generate new UI assets.' },
    { id: genId(), type: 'button', label: 'Confirm Action', variant: 'primary' },
    { id: genId(), type: 'tabs', tabs: ['Overview', 'Ops', 'Deploy'], active: 0 },
  ],
};

function normalizePages(site = {}) {
  const pages = Array.isArray(site.pages) && site.pages.length
    ? site.pages
    : [createDefaultPage({
      title: site.pageTitle || DEFAULT_UI_STATE.site.pageTitle,
      route: site.route || DEFAULT_UI_STATE.site.route,
      navLabel: site.pageTitle || DEFAULT_UI_STATE.site.pageTitle,
      description: site.description || DEFAULT_UI_STATE.site.description,
    })];

  return pages.map((page, index) => ({
    ...createDefaultPage({
      title: index === 0 ? 'Workspace' : `Page ${index + 1}`,
      route: index === 0 ? '/workspace' : `/page-${index + 1}`,
      navLabel: index === 0 ? 'Workspace' : `Page ${index + 1}`,
    }),
    ...(page || {}),
    id: page?.id || genId(),
    visible: page?.visible !== false,
  }));
}

export function normalizeUiState(state) {
  const site = {
    ...DEFAULT_UI_STATE.site,
    ...(state?.site || {}),
    featureFlags: { ...DEFAULT_UI_STATE.site.featureFlags, ...(state?.site?.featureFlags || {}) },
    moduleToggles: { ...DEFAULT_UI_STATE.site.moduleToggles, ...(state?.site?.moduleToggles || {}) },
    capabilityToggles: { ...DEFAULT_UI_STATE.site.capabilityToggles, ...(state?.site?.capabilityToggles || {}) },
  };
  site.pages = normalizePages(site);
  site.activePageId = site.pages.find((page) => page.id === site.activePageId)?.id || site.pages[0]?.id || null;
  return {
    site,
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
      moduleToggles: {
        ...next.site.moduleToggles,
        ...(patch.site.moduleToggles || {}),
      },
      capabilityToggles: {
        ...next.site.capabilityToggles,
        ...(patch.site.capabilityToggles || {}),
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
  if (patch.toggleModule) {
    next.site = {
      ...next.site,
      moduleToggles: {
        ...next.site.moduleToggles,
        [patch.toggleModule]: !next.site.moduleToggles?.[patch.toggleModule],
      },
    };
  }
  if (patch.toggleCapability) {
    next.site = {
      ...next.site,
      capabilityToggles: {
        ...next.site.capabilityToggles,
        [patch.toggleCapability]: !next.site.capabilityToggles?.[patch.toggleCapability],
      },
    };
  }
  if (patch.addPage) {
    const pagePatch = typeof patch.addPage === 'string'
      ? { title: patch.addPage }
      : (patch.addPage || {});
    const title = pagePatch.title || 'New Page';
    const route = ensureUniqueRoute(pagePatch.route || generateRouteFromTitle(title), normalizePages(next.site));
    const page = createDefaultPage({
      title,
      route,
      navLabel: pagePatch.navLabel || title,
      description: pagePatch.description || 'Governed page mutation staged in builder.',
      ...pagePatch,
    });
    next.site.pages = [...normalizePages(next.site), page];
    next.site.activePageId = page.id;
  }
  if (patch.updatePage?.id) {
    next.site.pages = normalizePages(next.site).map((page) =>
      page.id === patch.updatePage.id ? { ...page, ...patch.updatePage.patch } : page
    );
  }
  if (patch.removePageId) {
    next.site.pages = normalizePages(next.site).filter((page) => page.id !== patch.removePageId);
    if (!next.site.pages.length) {
      next.site.pages = [createDefaultPage({
        title: next.site.pageTitle || 'Workspace',
        route: next.site.route || '/workspace',
        navLabel: next.site.pageTitle || 'Workspace',
        description: next.site.description || DEFAULT_UI_STATE.site.description,
      })];
    }
    if (!next.site.pages.find((page) => page.id === next.site.activePageId)) {
      next.site.activePageId = next.site.pages[0]?.id || null;
    }
  }
  if (patch.movePage?.id) {
    const pages = [...normalizePages(next.site)];
    const idx = pages.findIndex((page) => page.id === patch.movePage.id);
    if (idx >= 0) {
      const nextIndex = Math.max(0, Math.min(pages.length - 1, idx + patch.movePage.direction));
      const [page] = pages.splice(idx, 1);
      pages.splice(nextIndex, 0, page);
      next.site.pages = pages;
    }
  }
  if (patch.setActivePageId) {
    next.site.activePageId = patch.setActivePageId;
  }
  next.site.pages = normalizePages(next.site);
  if (!next.site.pages.find((page) => page.id === next.site.activePageId)) {
    next.site.activePageId = next.site.pages[0]?.id || null;
  }
  return next;
}

export function summarizeUiPatch(patch) {
  if (patch.addComponent) return `Add ${patch.addComponent}`;
  if (patch.addPage) return `Add page ${typeof patch.addPage === 'string' ? patch.addPage : patch.addPage?.title || ''}`.trim();
  if (patch.updatePage) return 'Update page';
  if (patch.removePageId) return 'Remove page';
  if (patch.movePage) return patch.movePage.direction < 0 ? 'Move page up' : 'Move page down';
  if (patch.toggleModule) return `Toggle module: ${patch.toggleModule}`;
  if (patch.toggleCapability) return `Toggle capability: ${patch.toggleCapability}`;
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
  if (!Array.isArray(next.site.pages) || next.site.pages.length === 0) {
    issues.push('At least one page is required.');
  }
  if (!next.site.pages.some((page) => page.visible !== false)) {
    issues.push('At least one visible page is required.');
  }
  if (next.site.activePageId && !next.site.pages.find((page) => page.id === next.site.activePageId)) {
    issues.push('Active page must reference a valid page.');
  }

  next.site.pages.forEach((page, index) => {
    if (!page?.title?.trim()) {
      issues.push(`Page ${index + 1} is missing a title.`);
    }
    if (!page?.route?.trim() || !page.route.startsWith('/')) {
      issues.push(`Page ${index + 1} route must start with /.`);
    }
  });

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
