import React from 'react';
import {
  Users,
  Mail,
  Calendar,
  BarChart3,
  Cloud,
  Database,
  Cpu,
  Link,
  Plug,
} from 'lucide-react';
import { requestAppShellNavigation } from '../../lib/appShellEvents.js';

const gold = '#d4a843';

const CONNECTORS = [
  { id: 'crm',        name: 'CRM Sync',         desc: 'Customer relationship management integration', icon: Users, status: 'not_connected', adminSection: 'integrations' },
  { id: 'email',      name: 'Email / Outreach',  desc: 'Email send and tracking integration',          icon: Mail, status: 'not_connected', adminSection: 'google' },
  { id: 'calendar',   name: 'Calendar',          desc: 'Calendar and scheduling integration',           icon: Calendar, status: 'not_connected', adminSection: 'google' },
  { id: 'analytics',  name: 'Analytics Source',  desc: 'Analytics and reporting data source',           icon: BarChart3, status: 'not_connected', adminSection: 'system' },
  { id: 'storage',    name: 'Cloud Storage',     desc: 'Document and file storage integration',         icon: Cloud, status: 'not_connected', adminSection: 'google' },
  { id: 'supabase',   name: 'Supabase',          desc: 'Primary durable backend database',              icon: Database, status: 'awaiting_config', adminSection: 'supabase' },
  { id: 'openai',     name: 'OpenAI',            desc: 'GPT-4 / chat completion backend',               icon: Cpu, status: 'awaiting_config', adminSection: 'integrations' },
  { id: 'webhook',    name: 'Webhooks',          desc: 'Outbound webhook endpoints',                    icon: Link, status: 'not_connected', adminSection: 'system' },
];

const STATUS_CONFIG = {
  connected:       { color: '#4ade80', label: 'Connected',        dot: '#4ade80' },
  not_connected:   { color: 'rgba(255,255,255,0.3)', label: 'Not Connected', dot: 'rgba(255,255,255,0.2)' },
  awaiting_config: { color: '#fbbf24', label: 'Awaiting Config',  dot: '#fbbf24' },
  error:           { color: '#f87171', label: 'Error',            dot: '#f87171' },
};

export default function ConnectorsPanel() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 28px' }}>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Connectors</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Manage integrations and data source connections — awaiting configuration
        </p>
      </div>

      {/* Status summary */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap',
      }}>
        {[
          { label: 'Connected', value: 0, color: '#4ade80' },
          { label: 'Awaiting Config', value: 2, color: '#fbbf24' },
          { label: 'Not Connected', value: 6, color: 'rgba(255,255,255,0.3)' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '8px 14px',
            background: `${s.color}0f`,
            border: `1px solid ${s.color}30`,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Connector cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {CONNECTORS.map(conn => {
          const st = STATUS_CONFIG[conn.status] || STATUS_CONFIG.not_connected;
          const Icon = conn.icon || Plug;
          return (
            <div key={conn.id} style={{
              background: '#161616',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>
                <Icon size={20} className="xps-icon" />
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{conn.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conn.desc}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: st.dot }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: st.color, letterSpacing: 0.4 }}>{st.label}</span>
                </div>
                <button
                  onClick={() => requestAppShellNavigation({ page: 'admin', adminSection: conn.adminSection })}
                  className="xps-electric-hover"
                  style={{
                  padding: '4px 12px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 6,
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: 11, cursor: 'pointer',
                }}>
                  Configure
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
