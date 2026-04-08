// Synthetic runtime data — used when live connectors are unavailable.
// All values are clearly marked synthetic. Never presented as live data.

export const MODE = 'synthetic'; // 'live' | 'synthetic' | 'local' | 'blocked'

export const userContext = {
  name: 'Marcus',
  role: 'Operator',
  location: 'Tampa, FL',
  territory: 'Southeast FL',
  avatar: 'MR',
};

export const dashboardStats = [
  { id: 'leads',     label: 'Active Leads',    value: '2,847', delta: '+12.4%', positive: true,  icon: 'users' },
  { id: 'pipeline',  label: 'Pipeline Value',  value: '$4.2M', delta: '+8.7%',  positive: true,  icon: 'dollar-sign' },
  { id: 'proposals', label: 'Proposals Sent',  value: '342',   delta: '+23.1%', positive: true,  icon: 'file-text' },
  { id: 'close',     label: 'Close Rate',      value: '34.2%', delta: '-1.3%',  positive: false, icon: 'target' },
];

export const crmStats = [
  { id: 'contacts',  label: 'Total Contacts', value: '1,842', icon: 'users' },
  { id: 'companies', label: 'Companies',      value: '647',   icon: 'building' },
  { id: 'deals',     label: 'Active Deals',   value: '234',   icon: 'star' },
  { id: 'pipeline',  label: 'Pipeline Value', value: '$8.4M', icon: 'map-pin' },
];

export const pipelineStages = [
  { stage: 'New',         count: 42,  value: '$840K',  color: '#6b7280' },
  { stage: 'Contacted',   count: 38,  value: '$720K',  color: '#3b82f6' },
  { stage: 'Qualified',   count: 31,  value: '$1.2M',  color: '#8b5cf6' },
  { stage: 'Proposal',    count: 24,  value: '$2.1M',  color: '#f59e0b' },
  { stage: 'Negotiation', count: 12,  value: '$1.8M',  color: '#f97316' },
  { stage: 'Closed Won',  count: 87,  value: '$1.7M',  color: '#22c55e' },
];

export const revenueData = [
  { month: 'Jul',  value: 310000 },
  { month: 'Aug',  value: 295000 },
  { month: 'Sep',  value: 340000 },
  { month: 'Oct',  value: 370000 },
  { month: 'Nov',  value: 420000 },
  { month: 'Dec',  value: 480000 },
  { month: 'Jan',  value: 510000 },
  { month: 'Feb',  value: 555000 },
  { month: 'Mar',  value: 610000 },
];

export const donutData = [
  { name: 'Prospecting', value: 420, color: '#c49e3c' },
  { name: 'Qualified',   value: 310, color: '#d4af50' },
  { name: 'Proposal',    value: 180, color: '#6b7280' },
  { name: 'Negotiation', value: 90,  color: '#4b5563' },
  { name: 'Closed Won',  value: 140, color: '#22c55e' },
];

export const leads = [
  { id: 1,  company: 'Ace Hardware Distribution',  contact: 'Robert Chen',    email: 'robert@acehw.com',        vertical: 'Retail',     location: 'Tampa, FL',          score: 92, stage: 'Proposal',     value: '$45,000', rating: 4.6, reviews: 128 },
  { id: 2,  company: 'Tampa Bay Brewing Co.',       contact: 'Sarah Mills',    email: 'sarah@tbbrewing.com',     vertical: 'Food & Bev', location: 'St. Petersburg, FL', score: 87, stage: 'Qualified',    value: '$28,000', rating: 4.8, reviews: 89  },
  { id: 3,  company: 'Sunshine Auto Group',         contact: 'Mike Torres',    email: 'mike@sunshineauto.com',   vertical: 'Automotive', location: 'Orlando, FL',        score: 84, stage: 'Prospecting',  value: '$62,000', rating: 4.2, reviews: 256 },
  { id: 4,  company: 'Gulf Coast Logistics',        contact: 'Diana Patel',    email: 'diana@gulfcoast.com',     vertical: 'Warehouse',  location: 'Jacksonville, FL',   score: 79, stage: 'Contacted',    value: '$38,000', rating: 4.4, reviews: 67  },
  { id: 5,  company: 'Palm Medical Center',         contact: 'Dr. James Liu',  email: 'jliu@palmmed.org',        vertical: 'Healthcare', location: 'Miami, FL',          score: 75, stage: 'Qualified',    value: '$55,000', rating: 4.7, reviews: 312 },
  { id: 6,  company: 'Metro Fitness Chain',         contact: 'Lisa Wang',      email: 'lisa@metrofit.com',       vertical: 'Fitness',    location: 'Fort Lauderdale, FL',score: 71, stage: 'New',          value: '$22,000', rating: 4.1, reviews: 145 },
  { id: 7,  company: 'Coastal Warehousing Inc.',    contact: 'Tom Bradley',    email: 'tom@coastalwh.com',       vertical: 'Warehouse',  location: 'Clearwater, FL',     score: 68, stage: 'Contacted',    value: '$41,000', rating: 3.9, reviews: 42  },
  { id: 8,  company: 'Seminole School District',   contact: 'Jennifer Adams', email: 'jadams@seminoleschools.edu',vertical: 'Education',location: 'Sanford, FL',        score: 65, stage: 'Prospecting',  value: '$19,000', rating: 4.3, reviews: 78  },
];

export const recentActivity = [
  { id: 1, type: 'proposal', text: 'Proposal sent to Ace Hardware Distribution', time: '2m ago',   color: '#c49e3c' },
  { id: 2, type: 'lead',     text: 'New lead: Coastal Warehousing Inc.',         time: '14m ago',  color: '#3b82f6' },
  { id: 3, type: 'win',      text: 'Deal closed — Tampa Bay Brewing Co.',        time: '1h ago',   color: '#22c55e' },
  { id: 4, type: 'follow',   text: 'Follow-up scheduled: Gulf Coast Logistics',  time: '2h ago',   color: '#8b5cf6' },
  { id: 5, type: 'alert',    text: 'Gulf Coast Logistics: no contact in 8 days', time: '3h ago',   color: '#ef4444' },
];

export const aiConversationSeed = [
  {
    role: 'assistant',
    content: `Good morning, Marcus! I've analyzed your pipeline overnight. Here are 3 key insights:\n\n1. **Gulf Coast Logistics** hasn't been contacted in 8 days — I recommend a follow-up call today with the new pricing sheet.\n\n2. **Ace Hardware** proposal is pending review. The decision-maker, Robert Chen, typically responds within 48 hours.\n\n3. Your territory close rate is up 4.2% this month. Great work on the Tampa Bay Brewing deal!`,
  },
  {
    role: 'user',
    content: 'Draft a follow-up email for Gulf Coast Logistics',
  },
  {
    role: 'assistant',
    content: `Here's a personalized follow-up for Diana Patel at Gulf Coast Logistics:\n\n**Subject:** Quick Update on Your Warehouse Floor Project — New Options Available\n\n**Body:**\nHi Diana,\n\nI hope this week is treating you well. I wanted to circle back on our conversation about upgrading the floor finishing process at your Jacksonville facility.\n\nWe recently added two new options that could significantly reduce your downtime during application — I'd love to walk you through them in a quick 20-minute call this week.\n\nWould Thursday at 2pm or Friday morning work for you?\n\nBest,\nMarcus`,
  },
];

export const quickActions = [
  { id: 'research',  icon: 'search',        label: 'Research a lead',       desc: 'Get AI-powered intelligence on any company' },
  { id: 'draft',     icon: 'mail',          label: 'Draft outreach email',  desc: 'Create personalized cold outreach for a lead' },
  { id: 'objection', icon: 'book-open',     label: 'Objection handling',    desc: 'Get rebuttals for common sales objections' },
  { id: 'followup',  icon: 'clock',         label: 'Follow-up strategy',    desc: 'AI-recommended next steps for stale leads' },
];

export const userContextPanel = {
  territory: 'Southeast FL',
  activeLeads: 47,
  pendingProposals: 8,
  followupsDue: 5,
};

// XPS System status
export const xpsSystemStatus = {
  adminControlPlane: { status: 'operational', lastSync: '2m ago',   version: 'v2.4.1' },
  visionCortex:      { status: 'operational', lastSync: '5m ago',   version: 'v1.9.3' },
  autoBuilder:       { status: 'degraded',    lastSync: '12m ago',  version: 'v1.2.0' },
  intelCore:         { status: 'operational', lastSync: '1m ago',   version: 'v3.1.2' },
  sandbox:           { status: 'idle',        lastSync: '1h ago',   version: 'v0.8.4' },
  quarantine:        { status: 'blocked',     lastSync: '45m ago',  version: 'v0.3.1' },
};

export const adminControlPlaneData = {
  canonStatus: { state: 'active', locked: true, version: 'v2.4.1', lastVerified: '2m ago' },
  scheduleState: [
    { job: 'Pipeline Sync',         status: 'running',  next: 'in 3m',   cadence: '5m' },
    { job: 'Lead Score Refresh',    status: 'running',  next: 'in 8m',   cadence: '15m' },
    { job: 'Connector Health Check',status: 'running',  next: 'in 1m',   cadence: '2m' },
    { job: 'Ledger Write',          status: 'paused',   next: 'blocked', cadence: '10m' },
    { job: 'Quarantine Scan',       status: 'running',  next: 'in 5m',   cadence: '10m' },
  ],
  blockerQueue: [
    { id: 'BLK-001', surface: 'Ledger Write',     reason: 'Neon DB connection unavailable',  severity: 'high',   age: '2h' },
    { id: 'BLK-002', surface: 'HubSpot Sync',     reason: 'API key not verified at runtime', severity: 'medium', age: '6h' },
    { id: 'BLK-003', surface: 'Redis Heartbeat',  reason: 'Redis URL missing',               severity: 'high',   age: '1d' },
  ],
  runtimeLedger: [
    { ts: '17:44:01', event: 'pipeline_sync_complete',     status: 'ok',      surface: 'Google Sheets' },
    { ts: '17:43:58', event: 'lead_score_batch_finish',    status: 'ok',      surface: 'Intel Core' },
    { ts: '17:43:10', event: 'connector_health_pass',      status: 'ok',      surface: 'Admin CP' },
    { ts: '17:42:55', event: 'ledger_write_blocked',       status: 'blocked', surface: 'Neon DB' },
    { ts: '17:42:00', event: 'quarantine_scan_complete',   status: 'ok',      surface: 'Quarantine' },
    { ts: '17:41:30', event: 'hubspot_sync_skipped',       status: 'blocked', surface: 'HubSpot' },
  ],
};

export const visionCortexData = {
  strategyBriefs: [
    { id: 'SB-01', title: 'Q2 Territory Expansion — Southeast FL',       status: 'active',  updated: '1h ago',  priority: 'high' },
    { id: 'SB-02', title: 'Warehouse Vertical Saturation Model',         status: 'draft',   updated: '3h ago',  priority: 'medium' },
    { id: 'SB-03', title: 'Competitor Response: FloorGuard Launch',      status: 'active',  updated: '6h ago',  priority: 'high' },
    { id: 'SB-04', title: 'Healthcare Vertical Entry Strategy',          status: 'pending', updated: '1d ago',  priority: 'low' },
  ],
  simulations: [
    { id: 'SIM-01', name: 'Close Rate if Response Time < 2h',  result: '+18.4%', confidence: '87%', runs: 500 },
    { id: 'SIM-02', name: 'Revenue if 10 Proposals Unlocked',  result: '+$340K', confidence: '79%', runs: 250 },
    { id: 'SIM-03', name: 'Churn Risk — Inactive > 14 days',   result: '23 leads at risk', confidence: '91%', runs: 1000 },
  ],
  predictions: [
    { metric: 'Pipeline Value',   current: '$4.2M', predicted: '$5.1M', horizon: '30d', confidence: '82%' },
    { metric: 'Close Rate',       current: '34.2%', predicted: '37.1%', horizon: '30d', confidence: '74%' },
    { metric: 'Active Leads',     current: '2,847', predicted: '3,100', horizon: '30d', confidence: '88%' },
  ],
};

export const autoBuilderData = {
  artifacts: [
    { id: 'ART-001', name: 'Lead Score Model v3',        type: 'model',    status: 'deployed', updated: '2h ago' },
    { id: 'ART-002', name: 'Proposal Template Pack v2',  type: 'template', status: 'deployed', updated: '4h ago' },
    { id: 'ART-003', name: 'Territory Map Schema',       type: 'schema',   status: 'draft',    updated: '1d ago' },
    { id: 'ART-004', name: 'Outreach Prompt Pack v4',    type: 'prompts',  status: 'review',   updated: '6h ago' },
    { id: 'ART-005', name: 'Connector Adapter: Sheets',  type: 'adapter',  status: 'deployed', updated: '3d ago' },
  ],
  buildBacklog: [
    { id: 'BLD-01', task: 'Build Airtable staging mirror adapter',  priority: 'high',   status: 'queued',      assigned: 'Auto Builder' },
    { id: 'BLD-02', task: 'Generate Redis queue heartbeat module',  priority: 'high',   status: 'in_progress', assigned: 'Auto Builder' },
    { id: 'BLD-03', task: 'Scaffold Neon DB ledger tables',         priority: 'medium', status: 'blocked',     assigned: 'Intel Core' },
    { id: 'BLD-04', task: 'Create HubSpot CRM sync adapter',       priority: 'medium', status: 'queued',      assigned: 'Auto Builder' },
    { id: 'BLD-05', task: 'Beautiful.ai deck template pack',        priority: 'low',    status: 'queued',      assigned: 'Auto Builder' },
  ],
};

export const intelCoreData = {
  systemHealth: { score: 87, status: 'healthy', lastCheck: '1m ago' },
  selfValidate: [
    { check: 'Schema integrity',      result: 'pass',  note: '' },
    { check: 'Duplicate lead scan',   result: 'pass',  note: '3 deduped this cycle' },
    { check: 'Evidence packaging',    result: 'pass',  note: '' },
    { check: 'Safe-write gate',       result: 'warn',  note: 'Neon DB offline — writes queued locally' },
    { check: 'Queue continuity',      result: 'warn',  note: 'Redis unavailable — fallback to local queue' },
  ],
  touchdownSummaries: [
    { id: 'TD-001', ts: '17:00', title: 'Pipeline Sync Cycle',       items: 14, status: 'complete' },
    { id: 'TD-002', ts: '16:00', title: 'Lead Intelligence Refresh', items: 8,  status: 'complete' },
    { id: 'TD-003', ts: '15:00', title: 'Connector Health Sweep',    items: 12, status: 'partial'  },
    { id: 'TD-004', ts: '14:00', title: 'Auto Builder Artifact Run', items: 3,  status: 'blocked'  },
  ],
};

export const sandboxItems = [
  { id: 'SBX-01', name: 'Dynamic Pricing Algo Test',      status: 'running',  risk: 'low',    started: '2h ago' },
  { id: 'SBX-02', name: 'NLP Objection Classifier v2',    status: 'complete', risk: 'low',    started: '1d ago' },
  { id: 'SBX-03', name: 'Multi-territory Lead Routing',   status: 'running',  risk: 'medium', started: '4h ago' },
];

export const quarantineItems = [
  { id: 'QRN-01', name: 'Malformed HubSpot payload',       reason: 'Schema validation failure',  severity: 'high',   since: '6h ago' },
  { id: 'QRN-02', name: 'Duplicate lead batch import',     reason: 'Duplicate threshold exceeded',severity: 'medium', since: '1d ago' },
  { id: 'QRN-03', name: 'Redis write — unverified key',    reason: 'Missing credential at runtime',severity: 'high',  since: '3d ago' },
  { id: 'QRN-04', name: 'Vision Cortex sim — invalid ref', reason: 'Referenced non-existent lead', severity: 'low',  since: '2d ago' },
];

export const pageChangeLog = [];
