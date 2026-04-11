import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertTriangle, Bot, CheckCircle2, Cloud, Cpu, Database, Send, Sparkles, Zap } from 'lucide-react';
import Panel from '../components/ui/Panel.jsx';
import { useWorkspace, detectObjectType, deriveTitle, RUN_STATUS, genId } from '../lib/workspaceEngine.jsx';
import { getConnectionPrefs, subscribeConnectionPrefs } from '../lib/connectionPrefs.js';
import { resolveClientProviderState } from '../lib/providerState.js';
import { persistWorkspaceObject } from '../lib/supabasePersistence.js';
import { getRunList, startRun, subscribeRuns } from '../lib/bytebotRuntime.js';

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.API_URL || '';
const GOLD = '#c49e3c';

const QUICK_ACTIONS = [
  'Summarize today’s top pipeline risks and next actions.',
  'Draft a concise follow-up for Gulf Coast Logistics.',
  'Research Ace Hardware Distribution and surface competitive signals.',
  'Build an autonomous multi-step plan for stale lead recovery.',
];

function buildCredentialOverrides(connectionPrefs) {
  return {
    openaiApiKey: connectionPrefs.openaiApiKey,
    openaiModel: connectionPrefs.openaiModel,
    groqApiKey: connectionPrefs.groqApiKey,
    groqModel: connectionPrefs.groqModel,
    geminiApiKey: connectionPrefs.geminiApiKey,
    geminiModel: connectionPrefs.geminiModel,
    ollamaBaseUrl: connectionPrefs.ollamaBaseUrl,
    ollamaModel: connectionPrefs.ollamaModel,
    providerPreference: connectionPrefs.providerPreference,
    bytebotProvider: connectionPrefs.bytebotProvider,
  };
}

function resolveSelectedProvider(preferredProvider, llmState) {
  const requestedProvider = preferredProvider || 'groq';
  const fallbackProvider = llmState.active === 'none' ? 'auto' : llmState.active;
  const requestedConfigured = requestedProvider !== 'auto' && !!llmState.providers?.[requestedProvider]?.configured;
  if (requestedProvider === 'auto') {
    return fallbackProvider;
  }
  if (requestedConfigured) {
    return requestedProvider;
  }
  return fallbackProvider;
}

function statusTone(mode) {
  if (mode === 'live') return { color: '#22c55e', label: 'Live' };
  if (mode === 'local') return { color: '#60a5fa', label: 'Local' };
  if (mode === 'ingest-only') return { color: '#f59e0b', label: 'Ingest only' };
  if (mode === 'blocked') return { color: '#ef4444', label: 'Blocked' };
  return { color: '#fbbf24', label: 'Synthetic' };
}

function StatusPill({ mode, label }) {
  const tone = statusTone(mode);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '5px 10px', background: `${tone.color}14`, border: `1px solid ${tone.color}26`, color: tone.color, fontSize: 12, fontWeight: 700 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: tone.color }} />
      {label || tone.label}
    </span>
  );
}

function TruthCard({ title, value, note, mode }) {
  return (
    <div style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{title}</div>
        <StatusPill mode={mode} />
      </div>
      <div style={{ fontSize: 20, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>{note}</div>
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const tone = statusTone(message.mode || 'synthetic');
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 14 }}>
      <div style={{
        maxWidth: '82%',
        background: isUser ? GOLD : 'var(--bg-card-alt)',
        color: isUser ? '#090a0d' : 'var(--text-primary)',
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        padding: '12px 15px',
        border: isUser ? 'none' : '1px solid var(--border)',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.65,
      }}>
        {message.content}
        {!isUser && message.mode && (
          <div style={{ marginTop: 8, fontSize: 11, color: tone.color, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: tone.color }} />
            {tone.label}
          </div>
        )}
      </div>
    </div>
  );
}

function RunRow({ run }) {
  const tone = statusTone(run.mode === 'synthetic' ? 'synthetic' : run.mode === 'local' ? 'local' : run.status === 'error' ? 'blocked' : 'live');
  return (
    <div style={{ background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{run.task}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            {run.agent} · {run.steps?.length || 0} steps · {run.status}
          </div>
        </div>
        <StatusPill mode={tone.label.toLowerCase()} label={run.status} />
      </div>
      <div style={{ marginTop: 10, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ width: `${run.progress || 0}%`, height: '100%', borderRadius: 999, background: tone.color, transition: 'width 0.2s ease' }} />
      </div>
    </div>
  );
}

function WorkspaceRow({ object }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background: 'var(--bg-card-alt)', border: '1px solid var(--border)', borderRadius: 10 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{object.title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{object.type} · {object.status}</div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
        {new Date(object.updatedAt || object.createdAt || Date.now()).toLocaleTimeString()}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const workspace = useWorkspace();
  const bottomRef = useRef(null);
  const [liveStatus, setLiveStatus] = useState(null);
  const [connectionPrefs, setConnectionPrefsState] = useState(getConnectionPrefs());
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'The assistant is ready.\n\nGroq is the primary live lane, and autonomous orchestration will create real workspace runs when available.',
      mode: 'live',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [interactionMode, setInteractionMode] = useState('assistant');
  const [runs, setRuns] = useState(getRunList());

  useEffect(() => {
    fetch(`${API_URL}/api/status`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setLiveStatus(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setConnectionPrefsState(getConnectionPrefs());
    return subscribeConnectionPrefs(setConnectionPrefsState);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeRuns(setRuns);
    setRuns(getRunList());
    return unsubscribe;
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const providerState = resolveClientProviderState(liveStatus, connectionPrefs);
  const llmState = providerState.llm;
  const providerKey = llmState.active !== 'none' ? llmState.active : 'groq';
  const selectedProvider = resolveSelectedProvider(connectionPrefs.providerPreference, llmState);
  const selectedModel = selectedProvider === 'groq'
    ? connectionPrefs.groqModel || llmState.providers.groq?.model
    : selectedProvider === 'openai'
      ? connectionPrefs.openaiModel || llmState.providers.openai?.model
      : selectedProvider === 'gemini'
        ? connectionPrefs.geminiModel || llmState.providers.gemini?.model
        : selectedProvider === 'ollama'
          ? connectionPrefs.ollamaModel || llmState.providers.ollama?.model
          : llmState.model;
  const recentRuns = useMemo(() => runs.slice(0, 4), [runs]);
  const recentWorkspaceObjects = useMemo(
    () => [...workspace.objects].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).slice(0, 5),
    [workspace.objects],
  );

  const commitWorkspaceObject = useCallback((workspaceObject, agent = 'orchestrator', prompt = '') => {
    const type = workspaceObject?.type || detectObjectType(workspaceObject?.content || '', agent);
    const title = workspaceObject?.title || deriveTitle(workspaceObject?.content || '', agent) || prompt.slice(0, 60);
    workspace.createObject({
      type,
      title,
      content: workspaceObject?.content || '',
      agent,
      status: RUN_STATUS.DONE,
      steps: workspaceObject?.steps || [],
      meta: workspaceObject?.meta || {},
    });
    persistWorkspaceObject({
      id: workspaceObject?.id || genId(),
      type,
      title,
      content: workspaceObject?.content || '',
      agent,
      status: 'done',
      steps: workspaceObject?.steps || [],
      progress: 100,
      meta: workspaceObject?.meta || {},
    }).catch(() => {});
  }, [workspace]);

  const handleSend = useCallback(async (seedPrompt) => {
    const prompt = (seedPrompt || input).trim();
    if (!prompt || loading) return;

    setMessages((previous) => [...previous, { role: 'user', content: prompt }]);
    setInput('');
    setLoading(true);

    const credentials = buildCredentialOverrides(connectionPrefs);

    if (interactionMode === 'autonomous') {
      try {
        const runId = await startRun(
          {
            task: prompt,
            agent: 'bytebot',
            context: {
              mode: 'autonomous',
              provider: selectedProvider,
              model: selectedModel,
              credentials,
              runtimeTarget: connectionPrefs.runtimeTarget,
              deploymentTarget: connectionPrefs.deploymentTarget,
              repoTarget: connectionPrefs.repoTarget,
            },
          },
          workspace,
        );
        setMessages((previous) => [...previous, {
          role: 'assistant',
          content: `Autonomous run started.\n\nRun ID: ${runId}\nMode: ${llmState.mode}\nProvider: ${selectedProvider === 'auto' ? llmState.active : selectedProvider}\nThe run lifecycle and workspace artifacts are now live.`,
          mode: llmState.active === 'none' ? 'synthetic' : llmState.mode,
        }]);
      } catch (error) {
        setMessages((previous) => [...previous, {
          role: 'assistant',
          content: `Autonomous run failed to start: ${error.message}`,
          mode: 'blocked',
        }]);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: 'orchestrator',
          provider: selectedProvider,
          model: selectedModel,
          runId: genId(),
          credentials,
          messages: [
            { role: 'system', content: 'You are the XPS AI Sales Assistant. Use the live provider when available, keep runtime truth explicit, and create practical operator-ready output.' },
            { role: 'user', content: prompt },
          ],
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const mode = data.mode || 'synthetic';
      const reply = data.reply || data.error || 'No response returned.';
      setMessages((previous) => [...previous, { role: 'assistant', content: reply, mode }]);
      commitWorkspaceObject(
        data.workspace_object || {
          type: detectObjectType(reply, 'orchestrator'),
          title: deriveTitle(reply, 'orchestrator'),
          content: reply,
          meta: { provider: data.provider || selectedProvider, model: data.model || selectedModel, mode },
        },
        'orchestrator',
        prompt,
      );
    } catch (error) {
      setMessages((previous) => [...previous, {
        role: 'assistant',
        content: `Live assistant request failed.\n\n${error.message}`,
        mode: 'blocked',
      }]);
    } finally {
      setLoading(false);
    }
  }, [commitWorkspaceObject, connectionPrefs, input, interactionMode, llmState.active, llmState.mode, loading, selectedModel, selectedProvider, workspace]);

  const runtimeEnvironment = liveStatus?.runtimeOps?.environment?.runtime || 'local';
  const historyStore = liveStatus?.runtimeOps?.environment?.historyStore || 'ephemeral-process-memory';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18, height: 'calc(100vh - 112px)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Panel
          title="XPS AI Sales Assistant"
          subtitle="Live Groq-first assistant with autonomous orchestration, truthful runtime state, and workspace writes"
          actions={<StatusPill mode={llmState.mode} label={llmState.active === 'none' ? 'Fallback' : `${String(llmState.active).toUpperCase()} primary`} />}
          style={{ marginBottom: 16 }}
        >
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <button onClick={() => setInteractionMode('assistant')} style={modeButtonStyle(interactionMode === 'assistant')}>
              <Bot size={14} />
              Assistant
            </button>
            <button onClick={() => setInteractionMode('autonomous')} style={modeButtonStyle(interactionMode === 'autonomous')}>
              <Zap size={14} />
              Autonomous orchestrator
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <StatusPill mode={llmState.active === 'none' ? 'synthetic' : llmState.mode} label={`${selectedProvider === 'auto' ? llmState.active : selectedProvider} · ${selectedModel || 'model auto'}`} />
              <StatusPill mode={liveStatus?.supabase?.mode || 'blocked'} label={`Supabase · ${liveStatus?.supabase?.configured ? 'ready' : 'blocked'}`} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
            <TruthCard title="Primary provider" value={String(llmState.active).toUpperCase()} note={llmState.active === 'none' ? llmState.reason : `Default model: ${llmState.model}`} mode={llmState.active === 'none' ? 'synthetic' : llmState.mode} />
            <TruthCard title="Supabase" value={liveStatus?.supabase?.projectUrl || 'Unavailable'} note={liveStatus?.supabase?.configured ? `Persistence: ${historyStore}` : (liveStatus?.supabase?.reason || 'Not configured')} mode={liveStatus?.supabase?.mode || 'blocked'} />
            <TruthCard title="Runtime" value={runtimeEnvironment} note={liveStatus?.vercel?.configured ? 'Vercel/runtime truth is connected.' : (liveStatus?.vercel?.reason || 'Runtime status unavailable')} mode={liveStatus?.vercel?.mode || 'blocked'} />
            <TruthCard title="Google" value={liveStatus?.google?.configured ? 'Connected' : 'Available'} note={liveStatus?.google?.configured ? `Project: ${liveStatus.google.project || 'installed'}` : (liveStatus?.google?.reason || 'Not configured')} mode={liveStatus?.google?.mode || 'blocked'} />
          </div>
        </Panel>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(196,158,60,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color={GOLD} />
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>Operational assistant console</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {interactionMode === 'assistant'
                  ? 'Prompt → live chat response → workspace artifact'
                  : 'Prompt → ByteBot run → multi-step lifecycle → workspace artifacts'}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 8px' }}>
            {messages.map((message, index) => <MessageBubble key={`${message.role}-${index}`} message={message} />)}
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
                <Activity size={14} />
                Working…
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: '0 18px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QUICK_ACTIONS.map((action) => (
              <button key={action} onClick={() => handleSend(action)} style={quickActionStyle()}>
                {action}
              </button>
            ))}
          </div>

          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask your AI assistant anything…"
              rows={3}
              style={{
                flex: 1,
                resize: 'none',
                background: 'var(--bg-root)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '11px 14px',
                color: 'var(--text-primary)',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                border: 'none',
                background: input.trim() ? GOLD : 'var(--bg-card-alt)',
                color: input.trim() ? '#090a0d' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
        <Panel title="Run lifecycle" subtitle="Real queued/running/completed orchestrator runs">
          <div style={{ display: 'grid', gap: 10 }}>
            {recentRuns.length ? recentRuns.map((run) => <RunRow key={run.runId} run={run} />) : (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No runs yet. Start autonomous mode to create a live orchestrator run.</div>
            )}
          </div>
        </Panel>

        <Panel title="Workspace interaction" subtitle="Objects created by the assistant and orchestrator">
          <div style={{ display: 'grid', gap: 10 }}>
            {recentWorkspaceObjects.length ? recentWorkspaceObjects.map((object) => <WorkspaceRow key={object.id} object={object} />) : (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No workspace objects yet. Send a prompt to create the first artifact.</div>
            )}
          </div>
        </Panel>

        <Panel title="Runtime truth" subtitle="Only live paths claim live capability">
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={truthRowStyle()}>
              <Cpu size={14} color={GOLD} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Provider lane</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {llmState.active === 'none'
                    ? llmState.reason
                    : `Primary lane is ${llmState.active} with ${llmState.model}. Fallback providers remain secondary.`}
                </div>
              </div>
            </div>
            <div style={truthRowStyle()}>
              <Database size={14} color={GOLD} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Supabase persistence</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {liveStatus?.supabase?.configured
                    ? `Connected to ${liveStatus.supabase.projectUrl}. Runtime history store: ${historyStore}.`
                    : liveStatus?.supabase?.reason || 'Supabase status unavailable.'}
                </div>
              </div>
            </div>
            <div style={truthRowStyle()}>
              <Cloud size={14} color={GOLD} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Vercel/runtime</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {liveStatus?.vercel?.configured
                    ? `Runtime is ${runtimeEnvironment}; deploy controls remain truthful with project ${liveStatus.vercel.projectId || 'connected'}.`
                    : liveStatus?.vercel?.reason || 'Runtime status unavailable.'}
                </div>
              </div>
            </div>
            {llmState.active === 'none' && (
              <div style={truthRowStyle('#f59e0b20', '#f59e0b')}>
                <AlertTriangle size={14} color="#f59e0b" />
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Synthetic mode is visible because no live provider is currently available.
                </div>
              </div>
            )}
            {llmState.active !== 'none' && (
              <div style={truthRowStyle('rgba(34,197,94,0.08)', '#22c55e')}>
                <CheckCircle2 size={14} color="#22c55e" />
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Live provider path is operational. Synthetic fallback remains hidden unless the live request fails.
                </div>
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function quickActionStyle() {
  return {
    background: 'var(--bg-card-alt)',
    border: '1px solid var(--border)',
    borderRadius: 999,
    color: 'var(--text-secondary)',
    padding: '8px 12px',
    fontSize: 12,
    textAlign: 'left',
  };
}

function modeButtonStyle(active) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    border: active ? 'none' : '1px solid var(--border)',
    background: active ? GOLD : 'var(--bg-card-alt)',
    color: active ? '#090a0d' : 'var(--text-primary)',
    padding: '10px 14px',
    fontWeight: 700,
  };
}

function truthRowStyle(background = 'var(--bg-card-alt)', borderColor = 'var(--border)') {
  return {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    padding: '12px 14px',
    background,
    border: `1px solid ${borderColor}`,
    borderRadius: 12,
  };
}
