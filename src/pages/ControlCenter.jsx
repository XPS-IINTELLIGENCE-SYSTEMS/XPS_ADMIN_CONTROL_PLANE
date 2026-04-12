import React, { createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, CheckCircle2, ChevronRight, CirclePlus, DatabaseZap, Download, FolderUp, KeyRound, LayoutDashboard, Pencil, Plug, RefreshCw, Trash2, Upload, Wand2 } from 'lucide-react';
import Panel from '../components/ui/Panel.jsx';
import ActiveWorkspace from '../components/workspace/ActiveWorkspace.jsx';
import { useWorkspace, OBJ_TYPE, RUN_STATUS } from '../lib/workspaceEngine.jsx';
import { getConnectionPrefs, subscribeConnectionPrefs, updateConnectionPrefs, resetConnectionPrefs } from '../lib/connectionPrefs.js';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.API_URL || '';
const CUSTOM_CONNECTORS_STORAGE_KEY = 'xps.custom-connectors.v1';
const INGESTION_QUEUE_STORAGE_KEY = 'xps.ingestion.queue.v1';
const sectionRefs = {
  overview: createRef(),
  workspace: createRef(),
  connectors: createRef(),
  access: createRef(),
};

const CORE_CONNECTORS = [
  {
    id: 'groq',
    label: 'Groq runtime',
    fields: [
      { key: 'groqApiKey', label: 'API key', placeholder: 'gsk_...', secret: true },
      { key: 'groqModel', label: 'Model', placeholder: 'llama-3.3-70b-versatile' },
    ],
  },
  {
    id: 'github',
    label: 'GitHub',
    fields: [
      { key: 'githubRepoOwner', label: 'Owner', placeholder: 'your-org' },
      { key: 'githubRepoName', label: 'Repository', placeholder: 'your-repo' },
      { key: 'githubToken', label: 'Token', placeholder: 'ghp_...', secret: true },
    ],
  },
  {
    id: 'supabase',
    label: 'Supabase',
    fields: [
      { key: 'supabaseUrl', label: 'Project URL', placeholder: 'https://project.supabase.co' },
      { key: 'supabaseAnonKey', label: 'Anon key', placeholder: 'eyJ...', secret: true },
    ],
  },
  {
    id: 'vercel',
    label: 'Vercel',
    fields: [
      { key: 'vercelProjectId', label: 'Project ID', placeholder: 'prj_...' },
      { key: 'vercelToken', label: 'Token', placeholder: 'vercel token', secret: true },
    ],
  },
  {
    id: 'google',
    label: 'Google Drive',
    fields: [
      { key: 'googleWorkspaceAdminEmail', label: 'Admin email', placeholder: 'admin@company.com' },
      { key: 'googleCloudProjectId', label: 'Cloud project', placeholder: 'xps-intelligence' },
    ],
  },
  {
    id: 'twilio',
    label: 'Twilio',
    fields: [
      { key: 'twilioAccountSid', label: 'Account SID', placeholder: 'AC...' },
      { key: 'twilioPhoneNumber', label: 'Phone number', placeholder: '+1 555 555 5555' },
    ],
  },
  {
    id: 'sendgrid',
    label: 'SendGrid',
    fields: [
      { key: 'sendgridApiKey', label: 'API key', placeholder: 'SG...', secret: true },
      { key: 'sendgridFromEmail', label: 'From email', placeholder: 'ops@company.com' },
    ],
  },
  {
    id: 'browser',
    label: 'Browser worker',
    fields: [
      { key: 'browserWorkerUrl', label: 'Worker URL', placeholder: 'https://worker.example.com' },
      { key: 'runtimeTarget', label: 'Runtime target', placeholder: 'local or cloud' },
    ],
  },
  {
    id: 'hubspot',
    label: 'HubSpot',
    fields: [
      { key: 'hubspotApiKey', label: 'Private app token', placeholder: 'pat-...', secret: true },
      { key: 'repoTarget', label: 'Sync target', placeholder: 'contacts, companies, deals' },
    ],
  },
  {
    id: 'airtable',
    label: 'Airtable',
    fields: [
      { key: 'airtableApiKey', label: 'Personal access token', placeholder: 'pat...', secret: true },
      { key: 'airtableBaseId', label: 'Base ID', placeholder: 'app...' },
    ],
  },
];

const SIGN_IN_LINKS = [
  { id: 'login', label: 'XPS sign-in screen', note: 'Return to the built-in sign-in screen.', internal: true },
  { id: 'github', label: 'GitHub sign-in', note: 'Open the real GitHub sign-in page.', url: 'https://github.com/login' },
  { id: 'google', label: 'Google sign-in', note: 'Open the real Google account sign-in page.', url: 'https://accounts.google.com/' },
  { id: 'vercel', label: 'Vercel sign-in', note: 'Open the real Vercel sign-in page.', url: 'https://vercel.com/login' },
  { id: 'supabase', label: 'Supabase dashboard', note: 'Open the Supabase dashboard sign-in page.', url: 'https://supabase.com/dashboard' },
];

const CHAT_RAIL_AGENTS = new Set(['Assistant', 'Research', 'Connectors']);

function loadCustomConnectors() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_CONNECTORS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomConnectors(next) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CUSTOM_CONNECTORS_STORAGE_KEY, JSON.stringify(next));
}

function loadIngestionQueue() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(INGESTION_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveIngestionQueue(next) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(INGESTION_QUEUE_STORAGE_KEY, JSON.stringify(next));
}

function emptyCustomConnector() {
  return {
    id: '',
    name: '',
    type: '',
    endpoint: '',
    note: '',
  };
}

function toneForConnector(status) {
  if (status === 'live') return { label: 'Live', color: '#22c55e' };
  if (status === 'local') return { label: 'Local', color: '#60a5fa' };
  if (status === 'ingest-only') return { label: 'Ingest only', color: '#f59e0b' };
  return { label: 'Blocked', color: '#ef4444' };
}

function ConnectorStatusPill({ status }) {
  const tone = toneForConnector(status);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '5px 10px', background: `${tone.color}14`, border: `1px solid ${tone.color}22`, color: tone.color, fontSize: 12, fontWeight: 700 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: tone.color }} />
      {tone.label}
    </span>
  );
}

function buildConnectorDrafts(connectionPrefs) {
  return Object.fromEntries(
    CORE_CONNECTORS.map((connector) => [
      connector.id,
      Object.fromEntries(connector.fields.map((field) => [field.key, connectionPrefs[field.key] || ''])),
    ]),
  );
}

function readLiveStatus(liveStatus, connectorId, connectionPrefs = {}) {
  const status = liveStatus || {};
  if (connectorId === 'groq') return status.groq?.mode || (connectionPrefs.groqApiKey ? 'live' : 'blocked');
  if (connectorId === 'github') return status.github?.mode || 'blocked';
  if (connectorId === 'supabase') return status.supabase?.mode || 'blocked';
  if (connectorId === 'vercel') return status.vercel?.mode || 'blocked';
  if (connectorId === 'google') return status.google?.mode || ((connectionPrefs.googleWorkspaceAdminEmail || connectionPrefs.googleCloudProjectId) ? 'ingest-only' : 'blocked');
  if (connectorId === 'twilio') return status.twilio?.mode || 'blocked';
  if (connectorId === 'sendgrid') return status.sendgrid?.mode || 'blocked';
  if (connectorId === 'browser') return status.browser?.mode || 'blocked';
  if (connectorId === 'hubspot') return status.hubspot?.mode || (connectionPrefs.hubspotApiKey ? 'ingest-only' : 'blocked');
  if (connectorId === 'airtable') return status.airtable?.mode || ((connectionPrefs.airtableApiKey && connectionPrefs.airtableBaseId) ? 'ingest-only' : 'blocked');
  return 'blocked';
}

function isLegacyChatWorkspaceObject(item) {
  if (!item) return false;
  if (item.meta?.source === 'chat-rail') return true;
  return Boolean(item.meta?.mode && CHAT_RAIL_AGENTS.has(item.agent));
}

function inputStyle() {
  return {
    width: '100%',
    background: 'var(--bg-card-alt)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '11px 12px',
    color: 'var(--text-primary)',
    outline: 'none',
  };
}

export default function ControlCenter({ activeSection, onNavigate, onOpenLogin }) {
  const { objects, createObject, resetWorkspace } = useWorkspace();
  const [liveStatus, setLiveStatus] = useState(null);
  const [statusError, setStatusError] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [connectionPrefs, setConnectionPrefsState] = useState(getConnectionPrefs());
  const [connectorDrafts, setConnectorDrafts] = useState(() => buildConnectorDrafts(getConnectionPrefs()));
  const [customConnectors, setCustomConnectors] = useState(loadCustomConnectors);
  const [customDraft, setCustomDraft] = useState(emptyCustomConnector());
  const [editingCustomId, setEditingCustomId] = useState(null);
  const [connectorMessage, setConnectorMessage] = useState('');
  const [ingestionQueue, setIngestionQueue] = useState(loadIngestionQueue);
  const ingestionInputRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError('');
    try {
      const response = await fetch(`${API_URL}/api/status`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setLiveStatus(await response.json());
    } catch (error) {
      setStatusError(error.message || 'Unable to read runtime status.');
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    setConnectionPrefsState(getConnectionPrefs());
    return subscribeConnectionPrefs((next) => {
      setConnectionPrefsState(next);
      setConnectorDrafts(buildConnectorDrafts(next));
    });
  }, []);

  useEffect(() => {
    const filteredObjects = objects.filter((item) => !isLegacyChatWorkspaceObject(item));
    if (filteredObjects.length !== objects.length) {
      resetWorkspace(filteredObjects);
      return;
    }
    const hasLegacyWorkspace = objects.some((item) => item.type === OBJ_TYPE.UI || item.title === 'UI Editor Canvas' || item.meta?.uiEditor);
    if (objects.length > 0 && !hasLegacyWorkspace) return;
    const content = [
      '# Operations board',
      '',
      '- Use the quick actions above the workspace to create editable outputs.',
      '- Keep the primary chat surface open for live operator work.',
      '- Pull over the dashboard drawer for ingestion and connector setup.',
      '- Return to the sign-in screen from the access section whenever needed.',
    ].join('\n');
    resetWorkspace([
      {
        type: OBJ_TYPE.REPORT,
        title: 'Operations board',
        content,
        status: RUN_STATUS.DONE,
        agent: 'Control Center',
      },
    ]);
  }, [objects, resetWorkspace]);

  useEffect(() => {
    const ref = sectionRefs[activeSection]?.current;
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSection]);

  const connectedCount = liveStatus?.summary?.connectedSystems?.length || 0;
  const blockedCount = liveStatus?.summary?.blockedSystems?.length || 0;
  const activeProvider = liveStatus?.llm?.active || 'synthetic';
  const activeModel = liveStatus?.llm?.model || 'fallback';
  const groqReady = Boolean(connectionPrefs.groqApiKey || liveStatus?.groq?.configured);

  const pushIngestionItems = useCallback((items) => {
    setIngestionQueue((current) => {
      const next = [...items, ...current].slice(0, 12);
      saveIngestionQueue(next);
      return next;
    });
  }, []);

  const createWorkspaceItem = useCallback((title, content) => {
    createObject({
      type: OBJ_TYPE.REPORT,
      title,
      content,
      status: RUN_STATUS.DONE,
      agent: 'Control Center',
    });
    onNavigate?.('workspace');
  }, [createObject, onNavigate]);

  const workspaceActions = useMemo(() => ([
    {
      label: 'Daily brief',
      description: 'Create a short editable status brief for today.',
      action: () => createWorkspaceItem('Daily brief', '# Daily brief\n\n- Review the hottest leads\n- Confirm connector health\n- Send the next outbound action'),
    },
    {
      label: 'Connector handoff',
      description: 'Create a center note that captures connector changes.',
      action: () => createWorkspaceItem('Connector handoff', '# Connector handoff\n\n- Document the connector updates you made\n- Capture any missing credentials\n- Note the next validation step'),
    },
    {
      label: 'Deployment checklist',
      description: 'Create a controlled deploy checklist in the workspace.',
      action: () => createWorkspaceItem('Deployment checklist', '# Deployment checklist\n\n- Confirm runtime status\n- Review connector inputs\n- Validate sign-in routes\n- Rebuild and test'),
    },
  ]), [createWorkspaceItem]);

  const saveConnector = (connector) => {
    const patch = connectorDrafts[connector.id] || {};
    updateConnectionPrefs(patch);
    setConnectorMessage(`${connector.label} inputs saved.`);
  };

  const clearConnector = (connector) => {
    resetConnectionPrefs(connector.fields.map((field) => field.key));
    setConnectorMessage(`${connector.label} inputs cleared.`);
  };

  const saveCustomConnector = () => {
    if (!customDraft.name.trim() || !customDraft.endpoint.trim()) {
      setConnectorMessage('Custom connectors need a name and endpoint.');
      return;
    }
    const id = editingCustomId || `connector-${Date.now()}`;
    const nextItem = { ...customDraft, id };
    const next = editingCustomId
      ? customConnectors.map((item) => (item.id === editingCustomId ? nextItem : item))
      : [...customConnectors, nextItem];
    setCustomConnectors(next);
    saveCustomConnectors(next);
    setCustomDraft(emptyCustomConnector());
    setEditingCustomId(null);
    setConnectorMessage(editingCustomId ? 'Custom connector updated.' : 'Custom connector added.');
  };

  const editCustomConnector = (item) => {
    setEditingCustomId(item.id);
    setCustomDraft(item);
  };

  const deleteCustomConnector = (id) => {
    const next = customConnectors.filter((item) => item.id !== id);
    setCustomConnectors(next);
    saveCustomConnectors(next);
    if (editingCustomId === id) {
      setEditingCustomId(null);
      setCustomDraft(emptyCustomConnector());
    }
    setConnectorMessage('Custom connector deleted.');
  };

  const queueAttachmentIngestion = (event) => {
    const next = Array.from(event.target.files || []).map((file) => ({
      id: `attachment-${Date.now()}-${file.name}`,
      label: file.name,
      source: 'Attachment',
      detail: file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB ready for ingestion`
        : `${Math.max(1, Math.round(file.size / 1024))} KB ready for ingestion`,
      status: 'Queued',
    }));
    if (next.length) {
      pushIngestionItems(next);
      setConnectorMessage(`${next.length} attachment${next.length === 1 ? '' : 's'} queued for ingestion.`);
    }
    event.target.value = '';
  };

  const queueConnectorIngestion = (source, detail, panel = 'connectors') => {
    pushIngestionItems([{
      id: `${source}-${Date.now()}`,
      label: source,
      source,
      detail,
      status: 'Ready',
    }]);
    onNavigate?.(panel);
  };

  const downloadTemplate = () => {
    if (typeof window === 'undefined') return;
    const template = {
      company: '',
      contact: '',
      email: '',
      phone: '',
      notes: '',
      source: 'attachment',
    };
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = 'xps-ingestion-template.json';
    link.click();
    window.URL.revokeObjectURL(url);
    pushIngestionItems([{
      id: `download-${Date.now()}`,
      label: 'Template download',
      source: 'Download',
      detail: 'JSON ingestion template downloaded for offline prep.',
      status: 'Ready',
    }]);
  };

  const ingestionCards = [
    {
      title: 'Upload attachments',
      note: 'Queue CSV, PDF, or spreadsheet files for staged ingestion.',
      icon: Upload,
      actionLabel: 'Choose files',
      onClick: () => ingestionInputRef.current?.click(),
    },
    {
      title: 'Download template',
      note: 'Start from a zeroed JSON template before importing records.',
      icon: Download,
      actionLabel: 'Download',
      onClick: downloadTemplate,
    },
    {
      title: 'Google Drive',
      note: 'Prepare a Drive-based ingest path and jump straight into connector setup.',
      icon: FolderUp,
      actionLabel: 'Connect Drive',
      onClick: () => queueConnectorIngestion('Google Drive', 'Drive ingest handoff created — complete the connector fields to go live.'),
    },
    {
      title: 'HubSpot',
      note: 'Stage HubSpot ingestion and map records to your sales workflow.',
      icon: DatabaseZap,
      actionLabel: 'Connect HubSpot',
      onClick: () => queueConnectorIngestion('HubSpot', 'HubSpot ingest handoff created — add the private app token to continue.'),
    },
    {
      title: 'Airtable',
      note: 'Set up Airtable sync for lightweight table-based ingestion.',
      icon: Bot,
      actionLabel: 'Connect Airtable',
      onClick: () => queueConnectorIngestion('Airtable', 'Airtable ingest handoff created — add token and base ID to continue.'),
    },
  ];

  return (
    <div data-testid="control-center" style={{ display: 'grid', gap: 22, paddingBottom: 28 }}>
      <section ref={sectionRefs.overview} style={{ scrollMarginTop: 84 }}>
        <Panel
          title="Overview"
          subtitle="Zeroed ingestion dashboard with Groq readiness, source handoff, and production checks"
          actions={(
            <button
              type="button"
              onClick={fetchStatus}
              className="xps-electric-hover"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--bg-card-alt)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                color: 'var(--text-primary)',
                padding: '10px 14px',
                fontWeight: 700,
              }}
            >
              <RefreshCw size={14} className="xps-icon" style={{ animation: statusLoading ? 'xpsPulse 1s linear infinite' : 'none' }} />
              Refresh runtime
            </button>
          )}
        >
          <input ref={ingestionInputRef} type="file" multiple hidden onChange={queueAttachmentIngestion} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <SummaryCard label="Records ingested" value="0" note="Dashboard starts clean until data is attached or connected." icon={LayoutDashboard} />
            <SummaryCard label="Datasets live" value="0" note="No synthetic business metrics — waiting for your real inputs." icon={CheckCircle2} />
            <SummaryCard label="Queue ready" value={String(ingestionQueue.length)} note="Attachment, download, and connector handoff queue." icon={FolderUp} />
            <SummaryCard label="Groq runtime" value={groqReady ? 'READY' : 'BLOCKED'} note={groqReady ? (activeProvider === 'groq' ? activeModel : 'Configured and ready for live chat') : 'Add a Groq API key in connectors to activate live reasoning.'} icon={Wand2} />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
            <ActionButton icon={Upload} onClick={() => ingestionInputRef.current?.click()}>Attach files</ActionButton>
            <ActionButton icon={Download} onClick={downloadTemplate}>Download template</ActionButton>
            <ActionButton icon={Plug} onClick={() => onNavigate?.('connectors')}>Open connectors</ActionButton>
            <ActionButton icon={KeyRound} onClick={onOpenLogin}>Return to sign-in</ActionButton>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 18 }}>
            {ingestionCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} style={{ border: '1px solid var(--border)', borderRadius: 16, background: 'var(--bg-card-alt)', padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(198,162,79,0.12)' }}>
                      <Icon size={18} className="xps-icon" />
                    </div>
                    <ChevronRight size={16} className="xps-icon" />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, marginTop: 14 }}>{card.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>{card.note}</div>
                  <div style={{ marginTop: 14 }}>
                    <ActionButton icon={Icon} onClick={card.onClick}>{card.actionLabel}</ActionButton>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 18, border: '1px solid var(--border)', borderRadius: 16, background: 'var(--bg-card-alt)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Ingestion queue</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Zero-state launchpad for attachments, downloads, Google Drive, HubSpot, and Airtable.
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Live connectors: {connectedCount} · Blocked systems: {blockedCount}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {ingestionQueue.length === 0 ? (
                <div style={{ border: '1px dashed var(--border)', borderRadius: 14, padding: 18, color: 'var(--text-secondary)', fontSize: 13 }}>
                  Nothing queued yet. Add an attachment, download the template, or connect a source to start ingestion.
                </div>
              ) : ingestionQueue.map((item) => (
                <div key={item.id} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 14, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{item.detail}</div>
                    </div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '5px 10px', background: 'rgba(34,197,94,0.14)', color: '#22c55e', fontSize: 12, fontWeight: 700 }}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {statusError ? <div style={{ marginTop: 14, color: '#fca5a5', fontSize: 12 }}>{statusError}</div> : null}
        </Panel>
      </section>

      <section ref={sectionRefs.workspace} style={{ scrollMarginTop: 84 }}>
        <Panel title="Interactive workspace" subtitle="Every action below creates an editable output in the center panel">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 18 }}>
            {workspaceActions.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="xps-electric-hover"
                style={{
                  position: 'relative',
                  textAlign: 'left',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card-alt)',
                  borderRadius: 16,
                  padding: '16px 16px 18px',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 800 }}>{item.label}</div>
                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.description}</div>
              </button>
            ))}
          </div>

          <div style={{ height: 560, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', background: '#0f1014' }}>
            <ActiveWorkspace />
          </div>
        </Panel>
      </section>

      <section ref={sectionRefs.connectors} style={{ scrollMarginTop: 84 }}>
        <Panel title="Unified connectors" subtitle="Groq-first runtime setup plus Google Drive, HubSpot, Airtable, and runtime inputs">
          <div style={{ display: 'grid', gap: 16 }}>
            {CORE_CONNECTORS.map((connector) => (
              <div key={connector.id} style={{ border: '1px solid var(--border)', borderRadius: 16, background: 'var(--bg-card-alt)', padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{connector.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                      Keep runtime truth and connector input on the same screen.
                    </div>
                  </div>
                  <ConnectorStatusPill status={readLiveStatus(liveStatus, connector.id, connectionPrefs)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  {connector.fields.map((field) => (
                    <label key={field.key} style={{ display: 'grid', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{field.label}</span>
                      <input
                        type={field.secret ? 'password' : 'text'}
                        value={connectorDrafts[connector.id]?.[field.key] || ''}
                        onChange={(event) => setConnectorDrafts((current) => ({
                          ...current,
                          [connector.id]: {
                            ...current[connector.id],
                            [field.key]: event.target.value,
                          },
                        }))}
                        placeholder={field.placeholder}
                        style={inputStyle()}
                      />
                    </label>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                  <ActionButton icon={Pencil} onClick={() => saveConnector(connector)}>Save changes</ActionButton>
                  <ActionButton icon={Trash2} onClick={() => clearConnector(connector)}>Delete input</ActionButton>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 22, borderTop: '1px solid var(--border)', paddingTop: 22 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Custom connectors</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Add extra webhook or service connectors without leaving this screen.
                </div>
              </div>
              <ActionButton icon={CirclePlus} onClick={() => { setEditingCustomId(null); setCustomDraft(emptyCustomConnector()); }}>Add connector</ActionButton>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div style={{ display: 'grid', gap: 10 }}>
                {customConnectors.length === 0 ? (
                  <div style={{ border: '1px dashed var(--border)', borderRadius: 14, padding: 18, color: 'var(--text-secondary)', fontSize: 13 }}>
                    No custom connectors yet. Use Add connector to create one.
                  </div>
                ) : customConnectors.map((item) => (
                  <div key={item.id} style={{ border: '1px solid var(--border)', background: 'var(--bg-card-alt)', borderRadius: 14, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{item.type || 'Connector'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{item.endpoint}</div>
                        {item.note ? <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>{item.note}</div> : null}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <ActionIconButton icon={Pencil} label="Edit connector" onClick={() => editCustomConnector(item)} />
                        <ActionIconButton icon={Trash2} label="Delete connector" onClick={() => deleteCustomConnector(item.id)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ border: '1px solid var(--border)', background: 'var(--bg-card-alt)', borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>
                  {editingCustomId ? 'Modify connector' : 'Add connector'}
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Name</span>
                    <input data-testid="custom-connector-name" value={customDraft.name} onChange={(event) => setCustomDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Slack webhook" style={inputStyle()} />
                  </label>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Type</span>
                    <input value={customDraft.type} onChange={(event) => setCustomDraft((current) => ({ ...current, type: event.target.value }))} placeholder="Webhook" style={inputStyle()} />
                  </label>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Endpoint</span>
                    <input data-testid="custom-connector-endpoint" value={customDraft.endpoint} onChange={(event) => setCustomDraft((current) => ({ ...current, endpoint: event.target.value }))} placeholder="https://hooks.example.com" style={inputStyle()} />
                  </label>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Notes</span>
                    <textarea value={customDraft.note} onChange={(event) => setCustomDraft((current) => ({ ...current, note: event.target.value }))} placeholder="Purpose, credential owner, or usage notes" style={{ ...inputStyle(), minHeight: 110, resize: 'vertical' }} />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                  <ActionButton icon={editingCustomId ? Pencil : CirclePlus} onClick={saveCustomConnector}>
                    {editingCustomId ? 'Modify connector' : 'Add connector'}
                  </ActionButton>
                  <ActionButton icon={Trash2} onClick={() => { setEditingCustomId(null); setCustomDraft(emptyCustomConnector()); }}>
                    Clear form
                  </ActionButton>
                </div>
              </div>
            </div>
          </div>

          {connectorMessage ? (
            <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-secondary)' }}>{connectorMessage}</div>
          ) : null}
        </Panel>
      </section>

      <section ref={sectionRefs.access} style={{ scrollMarginTop: 84 }}>
        <Panel title="Access and sign-in" subtitle="Every sign-in action now routes to the real sign-in screen or the real external sign-in page">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {SIGN_IN_LINKS.map((item) => (
              <div key={item.id} style={{ border: '1px solid var(--border)', background: 'var(--bg-card-alt)', borderRadius: 16, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 8 }}>{item.note}</div>
                <div style={{ marginTop: 14 }}>
                  <ActionButton
                    icon={KeyRound}
                    onClick={() => {
                      if (item.internal) {
                        onOpenLogin?.();
                        return;
                      }
                      window.open(item.url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    {item.internal ? 'Open sign-in screen' : 'Open sign-in page'}
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, note, icon: Icon }) {
  return (
    <div style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 16, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
        <Icon size={15} className="xps-icon" />
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, marginTop: 10 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{note}</div>
    </div>
  );
}

function ActionButton({ icon: Icon, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="xps-electric-hover"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        borderRadius: 10,
        padding: '10px 14px',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {Icon ? <Icon size={14} className="xps-icon" /> : null}
      {children}
    </button>
  );
}

function ActionIconButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="xps-electric-hover"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
      }}
    >
      <Icon size={14} className="xps-icon" />
    </button>
  );
}
