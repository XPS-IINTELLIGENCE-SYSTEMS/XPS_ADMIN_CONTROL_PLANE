import React, { useState } from 'react';

const GOLD = '#d4a843';

const WORKFLOW_TEMPLATES = [
  { name: 'Lead Onboarding', desc: 'Auto-assign and welcome new leads', steps: 5, trigger: 'New Lead' },
  { name: 'Proposal Follow-up', desc: 'Follow up after proposal is sent', steps: 4, trigger: 'Proposal Sent' },
  { name: 'Win/Loss Routing', desc: 'Route closed deals to next action', steps: 3, trigger: 'Deal Closed' },
  { name: 'Stale Lead Nurture', desc: 'Re-engage leads inactive for 7+ days', steps: 6, trigger: 'Inactivity Timer' },
  { name: 'Weekly Pipeline Review', desc: 'Scheduled pipeline health report', steps: 4, trigger: 'Schedule' },
];

const STEP_TYPES = [
  { type: 'trigger', icon: '⚡', label: 'Trigger', color: 'rgba(212,168,67,0.15)', border: 'rgba(212,168,67,0.3)' },
  { type: 'action', icon: '[A]', label: 'Action', color: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' },
  { type: 'condition', icon: '❓', label: 'Condition', color: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)' },
  { type: 'ai', icon: '[AI]', label: 'AI Step', color: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)' },
  { type: 'wait', icon: '⏱️', label: 'Wait / Delay', color: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.15)' },
  { type: 'notify', icon: '📧', label: 'Notify', color: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
];

const INIT_STEPS = [
  { id: 1, type: 'trigger', icon: '⚡', label: 'New Lead Added', color: 'rgba(212,168,67,0.15)', border: 'rgba(212,168,67,0.3)' },
  { id: 2, type: 'ai', icon: '[AI]', label: 'AI: Research Company', color: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.3)' },
  { id: 3, type: 'condition', icon: '❓', label: 'Score ≥ 70?', color: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.3)' },
  { id: 4, type: 'action', icon: '[A]', label: 'Assign to Sales Rep', color: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.3)' },
  { id: 5, type: 'notify', icon: '📧', label: 'Send Welcome Email', color: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
];

export default function WorkflowBuilder() {
  const [steps, setSteps] = useState(INIT_STEPS);
  const [activeTemplate, setActiveTemplate] = useState('Lead Onboarding');

  const addStep = (type) => {
    const def = STEP_TYPES.find(s => s.type === type) || STEP_TYPES[1];
    setSteps(prev => [...prev, { id: Date.now(), ...def, label: `New ${def.label}` }]);
  };

  const removeStep = (id) => setSteps(prev => prev.filter(s => s.id !== id));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div className="page-heading">Workflow Builder</div>
          <div className="page-sub" style={{ marginBottom: 0 }}>Automate your sales and CRM processes</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline">Load Template</button>
          <button className="btn-gold">Save Workflow</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        {/* Left: Templates + Step Types */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="chart-card">
            <div style={{ fontSize: 10, letterSpacing: 1.2, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 12 }}>Templates</div>
            {WORKFLOW_TEMPLATES.map(t => (
              <div key={t.name}
                style={{ padding: '10px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, background: activeTemplate === t.name ? 'rgba(212,168,67,0.08)' : 'transparent', border: `1px solid ${activeTemplate === t.name ? 'rgba(212,168,67,0.2)' : 'transparent'}`, transition: 'all 0.15s' }}
                onClick={() => setActiveTemplate(t.name)}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{t.desc}</div>
                <div style={{ fontSize: 10, color: GOLD }}>{t.steps} steps · {t.trigger}</div>
              </div>
            ))}
          </div>

          <div className="chart-card">
            <div style={{ fontSize: 10, letterSpacing: 1.2, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 12 }}>Add Step</div>
            {STEP_TYPES.map(s => (
              <button key={s.type} className="btn-outline" style={{ width: '100%', marginBottom: 6, fontSize: 12, justifyContent: 'flex-start' }} onClick={() => addStep(s.type)}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Builder Canvas */}
        <div className="chart-card" style={{ minHeight: 400 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div className="chart-title" style={{ margin: 0 }}>{activeTemplate}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{steps.length} steps · Last modified: just now</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-outline" style={{ fontSize: 12, padding: '6px 12px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                Test Run
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0, maxWidth: 540 }}>
            {steps.map((step, i) => (
              <React.Fragment key={step.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: step.color, border: `1.5px solid ${step.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {step.icon}
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>{step.type}</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{step.label}</div>
                    </div>
                    <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }} onClick={() => removeStep(step.id)}>×</button>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ width: 2, height: 20, background: 'rgba(255,255,255,0.08)', marginLeft: 19 }} />
                )}
              </React.Fragment>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }} onClick={() => addStep('action')}>
                +
              </div>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Add step</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
