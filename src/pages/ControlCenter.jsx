import React, { createRef, useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CirclePlus, KeyRound, LayoutDashboard, Pencil, Plug, RefreshCw, Trash2, Wand2 } from 'lucide-react';
import Panel from '../components/ui/Panel.jsx';
import ActiveWorkspace from '../components/workspace/ActiveWorkspace.jsx';
import { useWorkspace, OBJ_TYPE, RUN_STATUS } from '../lib/workspaceEngine.jsx';
import { getConnectionPrefs, subscribeConnectionPrefs, updateConnectionPrefs, resetConnectionPrefs } from '../lib/connectionPrefs.js';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.API_URL || '';
const CUSTOM_CONNECTORS_STORAGE_KEY = 'xps.custom-connectors.v1';
const sectionRefs = {
  overview: createRef(),
  workspace: createRef(),
  connectors: createRef(),
  access: createRef(),
};

const CORE_CONNECTORS = [
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
    label: 'Google Workspace',
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
];

const SIGN_IN_LINKS = [
  { id: 'login', label: 'XPS sign-in screen', note: 'Return to the built-in sign-in screen.', internal: true },
  { id: 'github', label: 'GitHub sign-in', note: 'Open the real GitHub sign-in page.', url: 'https://github.com/login' },
  { id: 'google', label: 'Google sign-in', note: 'Open the real Google account sign-in page.', url: 'https://accounts.google.com/' },
  { id: 'vercel', label: 'Vercel sign-in', note: 'Open the real Vercel sign-in page.', url: 'https://vercel.com/login' },
  { id: 'supabase', label: 'Supabase dashboard', note: 'Open the Supabase dashboard sign-in page.', url: 'https://supabase.com/dashboard' },
];

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

function readLiveStatus(liveStatus, connectorId) {
  if (!liveStatus) return 'blocked';
  if (connectorId === 'github') return liveStatus.github?.mode || 'blocked';
  if (connectorId === 'supabase') return liveStatus.supabase?.mode || 'blocked';
  if (connectorId === 'vercel') return liveStatus.vercel?.mode || 'blocked';
  if (connectorId === 'google') return liveStatus.google?.mode || 'blocked';
  if (connectorId === 'twilio') return liveStatus.twilio?.mode || 'blocked';
  if (connectorId === 'sendgrid') return liveStatus.sendgrid?.mode || 'blocked';
  if (connectorId === 'browser') return liveStatus.browser?.mode || 'blocked';
  return 'blocked';
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
    const hasLegacyWorkspace = objects.some((item) => item.type === OBJ_TYPE.UI || item.title === 'UI Editor Canvas' || item.meta?.uiEditor);
    if (objects.length > 0 && !hasLegacyWorkspace) return;
    const content = [
      '# Operations board',
      '',
      '- Use the quick actions above the workspace to create editable outputs.',
      '- Keep chat pinned on the right for persistent command entry.',
      '- Manage every connector from the unified section below.',
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

  return (
    <div data-testid="control-center" style={{ display: 'grid', gap: 22, paddingBottom: 28 }}>
      <section ref={sectionRefs.overview} style={{ scrollMarginTop: 84 }}>
        <Panel
          title="Overview"
          subtitle="One operational screen with the center workspace, unified connectors, access, and persistent chat"
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <SummaryCard label="Active provider" value={String(activeProvider).toUpperCase()} note={activeModel} icon={Wand2} />
            <SummaryCard label="Connected systems" value={String(connectedCount)} note="Live connectors reporting ready" icon={CheckCircle2} />
            <SummaryCard label="Blocked systems" value={String(blockedCount)} note="Needs credentials or runtime input" icon={Plug} />
            <SummaryCard label="Workspace tabs" value={String(objects.length)} note="Editable outputs in the center workspace" icon={LayoutDashboard} />
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
            <ActionButton icon={LayoutDashboard} onClick={() => onNavigate?.('workspace')}>Open workspace</ActionButton>
            <ActionButton icon={Plug} onClick={() => onNavigate?.('connectors')}>Open connectors</ActionButton>
            <ActionButton icon={KeyRound} onClick={() => onNavigate?.('access')}>Open access</ActionButton>
            <ActionButton icon={KeyRound} onClick={onOpenLogin}>Return to sign-in</ActionButton>
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
        <Panel title="Unified connectors" subtitle="All connector inputs live here, with working add, modify, and delete actions">
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
                  <ConnectorStatusPill status={readLiveStatus(liveStatus, connector.id)} />
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

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.8fr)', gap: 16 }}>
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
