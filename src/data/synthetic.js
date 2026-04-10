// Synthetic runtime data — zero-state safe values only.
// No fake business intelligence, names, companies, or CRM records.
// All surfaces show honest "awaiting configuration" / "no live data" states.

export const MODE = 'synthetic'; // 'live' | 'synthetic' | 'local' | 'blocked'

export const userContext = {
  name: '',
  role: 'Operator',
  location: '',
  territory: '',
  avatar: 'XP',
};

// Zero-state stats — all surfaces await real data sync
export const dashboardStats = [
  { id: 'leads',     label: 'Active Leads',    value: '—', delta: null, positive: null, icon: 'users' },
  { id: 'pipeline',  label: 'Pipeline Value',  value: '—', delta: null, positive: null, icon: 'dollar-sign' },
  { id: 'proposals', label: 'Proposals Sent',  value: '—', delta: null, positive: null, icon: 'file-text' },
  { id: 'close',     label: 'Close Rate',      value: '—', delta: null, positive: null, icon: 'target' },
];

export const crmStats = [
  { id: 'contacts',  label: 'Total Contacts', value: '—', icon: 'users' },
  { id: 'companies', label: 'Companies',      value: '—', icon: 'building' },
  { id: 'deals',     label: 'Active Deals',   value: '—', icon: 'star' },
  { id: 'pipeline',  label: 'Pipeline Value', value: '—', icon: 'map-pin' },
];

export const pipelineStages = [
  { stage: 'New',         count: 0, value: '—', color: '#6b7280' },
  { stage: 'Contacted',   count: 0, value: '—', color: '#3b82f6' },
  { stage: 'Qualified',   count: 0, value: '—', color: '#8b5cf6' },
  { stage: 'Proposal',    count: 0, value: '—', color: '#f59e0b' },
  { stage: 'Negotiation', count: 0, value: '—', color: '#f97316' },
  { stage: 'Closed Won',  count: 0, value: '—', color: '#22c55e' },
];

export const revenueData = [];

export const donutData = [];

export const leads = [];

export const recentActivity = [];

// Initial chat message — honest zero-state
export const aiConversationSeed = [
  {
    role: 'assistant',
    content: '— awaiting configuration —\n\nSelect an agent and configure your API key to begin live orchestration. Running in synthetic mode.',
    agent: 'orchestrator',
  },
];

export const quickActions = [
  { id: 'research',  icon: 'search',    label: 'Research a company',    desc: 'Get AI-powered intelligence on any company' },
  { id: 'draft',     icon: 'mail',      label: 'Draft outreach email',  desc: 'Create personalized cold outreach' },
  { id: 'objection', icon: 'book-open', label: 'Objection handling',    desc: 'Get rebuttals for common objections' },
  { id: 'followup',  icon: 'clock',     label: 'Follow-up strategy',    desc: 'AI-recommended next steps' },
];

export const userContextPanel = {
  territory: '',
  activeLeads: 0,
  pendingProposals: 0,
  followupsDue: 0,
};

// XPS System status — awaiting config until real env vars are present
export const xpsSystemStatus = {
  adminControlPlane: { status: 'awaiting_config', lastSync: null, version: null },
  visionCortex:      { status: 'awaiting_config', lastSync: null, version: null },
  autoBuilder:       { status: 'awaiting_config', lastSync: null, version: null },
  intelCore:         { status: 'awaiting_config', lastSync: null, version: null },
  sandbox:           { status: 'awaiting_config', lastSync: null, version: null },
  quarantine:        { status: 'awaiting_config', lastSync: null, version: null },
};

export const adminControlPlaneData = {
  canonStatus: { state: 'awaiting_config', locked: false, version: null, lastVerified: null },
  scheduleState: [],
  blockerQueue: [],
  runtimeLedger: [],
};

export const visionCortexData = {
  strategyBriefs: [],
  simulations: [],
  predictions: [],
};

export const autoBuilderData = {
  artifacts: [],
  buildBacklog: [],
};

export const intelCoreData = {
  systemHealth: { score: null, status: 'awaiting_config', lastCheck: null },
  selfValidate: [],
  touchdownSummaries: [],
};

export const sandboxItems = [];

export const quarantineItems = [];

export const pageChangeLog = [];
