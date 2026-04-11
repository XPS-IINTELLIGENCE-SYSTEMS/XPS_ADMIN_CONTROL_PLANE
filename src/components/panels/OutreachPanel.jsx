import React from 'react';
import { Mail, Clock, FileText, Zap } from 'lucide-react';
import { requestAppShellNavigation } from '../../lib/appShellEvents.js';

const gold = '#d4a843';

const OUTREACH_SECTIONS = [
  {
    title: 'Email Campaigns',
    icon: Mail,
    count: 0,
    status: 'awaiting_config',
    desc: 'No active campaigns — connect email provider to begin',
  },
  {
    title: 'Follow-up Queue',
    icon: Clock,
    count: 0,
    status: 'awaiting_config',
    desc: 'No follow-ups queued — sync CRM to populate',
  },
  {
    title: 'Outbound Templates',
    icon: FileText,
    count: 0,
    status: 'not_loaded',
    desc: 'Load prompt library to see outreach templates',
  },
];

export default function OutreachPanel() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 28px' }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Outreach</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Email campaigns, follow-up sequences, and outreach automation — awaiting configuration
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {OUTREACH_SECTIONS.map(s => (
          <div key={s.title} style={{
            background: '#161616',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <s.icon size={22} className="xps-icon" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{s.title}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: 'rgba(255,255,255,0.2)', letterSpacing: 0.6,
                }}>
                  {s.count} ACTIVE
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{s.desc}</div>
            </div>
            <button
              onClick={() => requestAppShellNavigation({ page: 'admin', adminSection: s.title === 'Email Campaigns' ? 'google' : 'integrations' })}
              className="xps-electric-hover"
              style={{
              padding: '7px 16px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7,
              color: 'rgba(255,255,255,0.4)',
              fontSize: 12, cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}>
              Configure
            </button>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 20, padding: '14px 16px',
        background: 'rgba(212,168,67,0.05)',
        border: '1px solid rgba(212,168,67,0.15)',
        borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6,
      }}>
        <Zap size={14} className="xps-icon" style={{ marginRight: 6 }} />
        Use the ByteBot orchestrator or agent rail to generate and queue outreach sequences automatically
      </div>
    </div>
  );
}
