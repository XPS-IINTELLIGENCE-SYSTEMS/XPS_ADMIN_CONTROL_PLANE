import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const gold = '#d4a843';
const API_URL = import.meta.env.API_URL || '';

const TASK_STATES = {
  idle:       { color: 'rgba(255,255,255,0.3)', label: 'IDLE' },
  queued:     { color: '#60a5fa',               label: 'QUEUED' },
  running:    { color: gold,                    label: 'RUNNING' },
  complete:   { color: '#4ade80',               label: 'COMPLETE' },
  cancelled:  { color: '#f87171',               label: 'CANCELLED' },
  error:      { color: '#f87171',               label: 'ERROR' },
};

function generateId() {
  return 'task_' + Math.random().toString(36).slice(2, 9);
}

export default function ByteBotPanel() {
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([
    { ts: new Date().toISOString(), level: 'info', msg: 'ByteBot initialized — awaiting task queue.' },
  ]);

  const appendLog = (level, msg) => {
    setLogs(prev => [...prev, { ts: new Date().toISOString(), level, msg }]);
  };

  const queueTask = (e) => {
    e?.preventDefault();
    if (!taskInput.trim()) return;
    const task = {
      id: generateId(),
      description: taskInput.trim(),
      state: 'queued',
      progress: 0,
      result: null,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, task]);
    appendLog('info', `Task queued: "${task.description}" [${task.id}]`);
    setTaskInput('');
  };

  const runNextTask = async () => {
    const queued = tasks.find(t => t.state === 'queued');
    if (!queued || running) return;
    setRunning(true);
    appendLog('info', `Starting task: ${queued.id}`);

    // Update state to running
    setTasks(prev => prev.map(t => t.id === queued.id ? { ...t, state: 'running', progress: 10 } : t));

    try {
      // Simulate progress steps
      await sleep(400);
      setTasks(prev => prev.map(t => t.id === queued.id ? { ...t, progress: 30 } : t));
      appendLog('debug', `[${queued.id}] Step 1/3 — analyzing task…`);

      await sleep(500);
      setTasks(prev => prev.map(t => t.id === queued.id ? { ...t, progress: 60 } : t));
      appendLog('debug', `[${queued.id}] Step 2/3 — executing…`);

      // Call backend
      const res = await fetch(`${API_URL}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: queued.description, agent: 'bytebot' }),
      });

      let result;
      if (res.ok) {
        const data = await res.json();
        result = data.result || data.reply || data.output || 'Task completed.';
        appendLog('info', `[${queued.id}] Step 3/3 — complete.`);
      } else {
        // Synthetic fallback
        await sleep(400);
        result = `[Synthetic] ByteBot received task: "${queued.description}"\n\nNo live backend configured. Add OPENAI_API_KEY + deploy /api/agents/run to enable autonomous execution.`;
        appendLog('warn', `[${queued.id}] Live backend unavailable — synthetic result.`);
      }

      setTasks(prev => prev.map(t =>
        t.id === queued.id ? { ...t, state: 'complete', progress: 100, result } : t
      ));
      appendLog('info', `[${queued.id}] Task complete.`);
    } catch (err) {
      const errMsg = `[Synthetic] ByteBot task failed: ${err.message}. Running in offline mode.`;
      setTasks(prev => prev.map(t =>
        t.id === queued.id ? { ...t, state: 'complete', progress: 100, result: errMsg } : t
      ));
      appendLog('warn', `[${queued.id}] Synthetic fallback: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const cancelTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id && (t.state === 'queued' || t.state === 'running')
      ? { ...t, state: 'cancelled' } : t
    ));
    appendLog('warn', `Task cancelled: ${id}`);
  };

  const clearCompleted = () => {
    setTasks(prev => prev.filter(t => t.state === 'queued' || t.state === 'running'));
    appendLog('info', 'Cleared completed/cancelled tasks.');
  };

  const queuedCount  = tasks.filter(t => t.state === 'queued').length;
  const activeCount  = tasks.filter(t => t.state === 'running').length;
  const doneCount    = tasks.filter(t => t.state === 'complete').length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(212,168,67,0.12)',
            border: '1px solid rgba(212,168,67,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>BOT</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>ByteBot Orchestrator</h2>
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Autonomous multi-step task execution</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <StatChip label="Queued" value={queuedCount} color="#60a5fa" />
            <StatChip label="Active" value={activeCount} color={gold} />
            <StatChip label="Done"   value={doneCount}   color="#4ade80" />
          </div>
        </div>

        {/* Runtime notice */}
        <div style={{
          margin: '12px 0',
          padding: '8px 14px',
          background: 'rgba(251,191,36,0.06)',
          border: '1px solid rgba(251,191,36,0.2)',
          borderRadius: 8,
          fontSize: 12,
          color: 'rgba(255,255,255,0.5)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AlertTriangle size={14} className="xps-icon" />
          Running in <strong style={{ color: '#fbbf24' }}>synthetic mode</strong> — configure OPENAI_API_KEY and deploy <code style={{ fontSize: 11 }}>/api/agents/run</code> for live execution
        </div>
      </div>

      {/* Main content: task queue + log */}
      <div style={{ flex: 1, display: 'flex', gap: 14, overflow: 'hidden', padding: '14px 24px 20px' }}>
        {/* Left: task queue */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Task input */}
          <form onSubmit={queueTask} style={{ display: 'flex', gap: 8, marginBottom: 14, flexShrink: 0 }}>
            <input
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              placeholder="Describe a task for ByteBot to execute…"
              style={{
                flex: 1, padding: '9px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#fff', fontSize: 13,
              }}
            />
            <button
              type="submit"
              disabled={!taskInput.trim()}
              style={{
                padding: '9px 16px',
                background: taskInput.trim() ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${taskInput.trim() ? 'rgba(212,168,67,0.35)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 8,
                color: taskInput.trim() ? gold : 'rgba(255,255,255,0.3)',
                fontSize: 13, fontWeight: 600, cursor: taskInput.trim() ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap',
              }}
            >
              + Queue
            </button>
            <button
              type="button"
              onClick={runNextTask}
              disabled={running || queuedCount === 0}
              style={{
                padding: '9px 16px',
                background: (!running && queuedCount > 0) ? gold : 'rgba(255,255,255,0.04)',
                border: 'none',
                borderRadius: 8,
                color: (!running && queuedCount > 0) ? '#0a0a0a' : 'rgba(255,255,255,0.3)',
                fontSize: 13, fontWeight: 700,
                cursor: (!running && queuedCount > 0) ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap',
              }}
            >
              ▶ Run
            </button>
          </form>

          {/* Task list */}
          <div style={{
            flex: 1, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {tasks.length === 0 ? (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 8, border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 10, padding: 32,
              }}>
                <span style={{ fontSize: 18, color: "rgba(196,158,60,0.3)", fontWeight: 700}}>BOT</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Queue is empty — add a task above</span>
              </div>
            ) : (
              <>
                {tasks.map(task => (
                  <TaskCard key={task.id} task={task} onCancel={cancelTask} />
                ))}
                {doneCount > 0 && (
                  <button
                    onClick={clearCompleted}
                    style={{
                      alignSelf: 'flex-end', padding: '5px 12px',
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6, color: 'rgba(255,255,255,0.35)',
                      fontSize: 11, cursor: 'pointer',
                    }}
                  >
                    Clear completed
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: action log */}
        <div style={{
          width: 300,
          display: 'flex', flexDirection: 'column',
          background: '#111',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10,
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <div style={{
            padding: '10px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            fontSize: 11, fontWeight: 600, letterSpacing: 1.2,
            color: 'rgba(255,255,255,0.3)',
          }}>
            ACTION LOG
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {logs.map((log, i) => (
              <div key={i} style={{
                padding: '3px 14px',
                fontSize: 11,
                fontFamily: "'JetBrains Mono','Courier New',monospace",
                color: log.level === 'warn' ? '#fbbf24' : log.level === 'error' ? '#f87171' : 'rgba(255,255,255,0.45)',
                lineHeight: 1.6,
                wordBreak: 'break-all',
              }}>
                <span style={{ opacity: 0.4 }}>{log.ts.split('T')[1].slice(0,8)}</span>{' '}
                <span style={{ color: log.level === 'warn' ? '#fbbf24' : log.level === 'debug' ? '#60a5fa' : 'rgba(255,255,255,0.6)' }}>
                  [{log.level}]
                </span>{' '}
                {log.msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const stateConfig = TASK_STATES[task.state] || TASK_STATES.idle;

  return (
    <div style={{
      background: '#161616',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: stateConfig.color,
          boxShadow: task.state === 'running' ? `0 0 6px ${stateConfig.color}` : 'none',
          flexShrink: 0,
        }} />
        <div style={{ flex: 1, fontSize: 13, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.description}
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.6, color: stateConfig.color, flexShrink: 0 }}>
          {stateConfig.label}
        </span>
        {(task.state === 'queued' || task.state === 'running') && (
          <button
            onClick={() => onCancel(task.id)}
            style={{
              padding: '2px 8px', background: 'transparent',
              border: '1px solid rgba(248,113,113,0.3)',
              borderRadius: 4, color: '#f87171',
              fontSize: 10, cursor: 'pointer', flexShrink: 0,
            }}
          >
            <X size={12} className="xps-icon" />
          </button>
        )}
        {task.result && (
          <button
            onClick={() => setExpanded(prev => !prev)}
            style={{
              padding: '2px 8px', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4, color: 'rgba(255,255,255,0.4)',
              fontSize: 10, cursor: 'pointer', flexShrink: 0,
            }}
          >
            {expanded ? '▲' : '▼'}
          </button>
        )}
      </div>

      {/* Progress bar */}
      {task.state === 'running' && (
        <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 99, height: 3 }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: gold,
            width: `${task.progress}%`,
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {/* Result */}
      {expanded && task.result && (
        <div style={{
          marginTop: 10,
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 6,
          fontSize: 12,
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          maxHeight: 160,
          overflowY: 'auto',
        }}>
          {task.result}
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value, color }) {
  return (
    <div style={{
      padding: '5px 12px',
      background: `${color}10`,
      border: `1px solid ${color}30`,
      borderRadius: 8,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <span style={{ fontSize: 16, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.6 }}>{label.toUpperCase()}</span>
    </div>
  );
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
