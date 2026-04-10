// Connector Reality Matrix
// Status: connected_writable | connected_read_only | referenced_only | blocked | missing

const env = import.meta.env;

function isSet(key) {
  const v = env[key];
  return typeof v === 'string' && v.length > 5;
}

const hasGitHub = isSet('GITHUB_TOKEN') || isSet('GITHUB_API_TOKEN');
const hasSupabase = isSet('SUPABASE_URL') && isSet('SUPABASE_ANON_KEY');
const hasVercel = isSet('VERCEL_TOKEN') || isSet('VERCEL_ACCESS_TOKEN');
const hasHubSpot = isSet('HUBSPOT_API_KEY');
const hasAirtable = isSet('AIRTABLE_API_KEY') && isSet('AIRTABLE_BASE_ID');
const hasBrowserWorker = isSet('BROWSER_WORKER_URL');
const hasGoogle = isSet('GCP_SA_KEY') || isSet('GCP_PROJECT_ID');

export const connectors = [
  {
    id: 'github',
    name: 'GitHub',
    icon: 'git-branch',
    category: 'Source Control',
    status: hasGitHub ? 'connected_writable' : 'referenced_only',
    role: 'Source storage, versioned docs, code repos',
    note: hasGitHub ? 'GitHub API token verified for repo access.' : 'Repo present. No runtime write token verified.',
    lastAttempt: null,
  },
  {
    id: 'vercel',
    name: 'Vercel',
    icon: 'cloud',
    category: 'Deployment',
    status: hasVercel ? 'connected_writable' : 'referenced_only',
    role: 'Deployment and runtime frontend',
    note: hasVercel ? 'Vercel API token configured.' : 'VERCEL_TOKEN not set in environment.',
    lastAttempt: null,
  },
  {
    id: 'google_drive',
    name: 'Google Drive',
    icon: 'folder',
    category: 'Storage',
    status: hasGoogle ? 'blocked' : 'missing',
    role: 'Docs, archives, fallback drops, package storage',
    note: hasGoogle ? 'OAuth user consent required for Drive access.' : 'No OAuth token found.',
    lastAttempt: null,
  },
  {
    id: 'google_sheets',
    name: 'Google Sheets',
    icon: 'table',
    category: 'Control Plane',
    status: hasGoogle ? 'blocked' : 'missing',
    role: 'Workbook control plane, logs, backlog, import-ready control',
    note: hasGoogle ? 'Service account configured; OAuth consent required for full access.' : 'Sheets API credentials not present.',
    lastAttempt: null,
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    icon: 'hexagon',
    category: 'CRM',
    status: hasHubSpot ? 'connected_writable' : 'blocked',
    role: 'Final CRM execution only',
    note: hasHubSpot ? 'HubSpot key configured for export staging.' : 'HubSpot API key missing.',
    lastAttempt: '6h ago',
  },
  {
    id: 'airtable',
    name: 'Airtable',
    icon: 'grid',
    category: 'Staging',
    status: hasAirtable ? 'connected_writable' : 'missing',
    role: 'Staging mirror',
    note: hasAirtable ? 'Airtable base configured for staging sync.' : 'Airtable API key not configured.',
    lastAttempt: null,
  },
  {
    id: 'gmail',
    name: 'Gmail',
    icon: 'mail',
    category: 'Communication',
    status: hasGoogle ? 'blocked' : 'missing',
    role: 'Summaries, alerts, blocker notices',
    note: hasGoogle ? 'OAuth user consent required for Gmail access.' : 'No Gmail OAuth token.',
    lastAttempt: null,
  },
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    icon: 'calendar',
    category: 'Scheduling',
    status: hasGoogle ? 'blocked' : 'missing',
    role: 'Cadence and schedule surface',
    note: hasGoogle ? 'OAuth user consent required for Calendar access.' : 'No Calendar OAuth token.',
    lastAttempt: null,
  },
  {
    id: 'base44',
    name: 'Base44',
    icon: 'layers',
    category: 'Internal Tooling',
    status: 'referenced_only',
    role: 'Rapid internal tooling / prototypes',
    note: 'Referenced in architecture. No runtime API configured.',
    lastAttempt: null,
  },
  {
    id: 'beautiful_ai',
    name: 'Beautiful.ai',
    icon: 'palette',
    category: 'Reporting',
    status: 'missing',
    role: 'Reporting deck surface',
    note: 'No API key configured.',
    lastAttempt: null,
  },
  {
    id: 'redis',
    name: 'Redis',
    icon: 'database',
    category: 'Queue / State',
    status: 'blocked',
    role: 'Queue, locks, heartbeats, short-term state',
    note: 'REDIS_URL missing from environment. Heartbeat offline.',
    lastAttempt: '3d ago',
  },
  {
    id: 'neon',
    name: 'Neon / Supabase / Postgres',
    icon: 'server',
    category: 'Database',
    status: hasSupabase ? 'connected_writable' : 'blocked',
    role: 'Durable relational state, ledgers, taxonomy, history',
    note: hasSupabase ? 'Supabase configured for staging + ledgers.' : 'Supabase keys missing.',
    lastAttempt: '2h ago',
  },
  {
    id: 'browser_worker',
    name: 'Browser Worker',
    icon: 'server',
    category: 'Automation',
    status: hasBrowserWorker ? 'connected_writable' : 'blocked',
    role: 'Playwright automation, scraping, evidence capture',
    note: hasBrowserWorker ? 'Worker URL configured for browser jobs.' : 'BROWSER_WORKER_URL not set.',
    lastAttempt: null,
  },
];

export const statusMeta = {
  connected_writable:  { label: 'Connected (RW)',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  connected_read_only: { label: 'Connected (R only)', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  referenced_only:     { label: 'Referenced Only',    color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  blocked:             { label: 'Blocked',             color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  missing:             { label: 'Missing',             color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};
