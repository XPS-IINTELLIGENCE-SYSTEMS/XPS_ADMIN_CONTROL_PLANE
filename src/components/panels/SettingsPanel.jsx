import React from 'react';
import { Palette, Folder, Cpu, Database, Lock } from 'lucide-react';

const gold = '#d4a843';

const SETTINGS = [
  {
    title: 'Appearance',
    icon: Palette,
    items: [
      { label: 'Theme',           value: 'Dark (XPS Luxury)',    locked: true },
      { label: 'Accent Color',    value: '#d4a843 (Gold)',        locked: true },
      { label: 'Sidebar Width',   value: '220px',                locked: false },
    ],
  },
  {
    title: 'Workspace',
    icon: Folder,
    items: [
      { label: 'Default Panel',   value: 'Dashboard',            locked: false },
      { label: 'Auto-render AI',  value: 'Enabled',              locked: false },
      { label: 'Chat Rail Width', value: '340px',                locked: false },
    ],
  },
  {
    title: 'Agents',
    icon: Cpu,
    items: [
      { label: 'Default Agent',      value: 'XPS Orchestrator',  locked: false },
      { label: 'Synthetic Fallback', value: 'Enabled',           locked: false },
      { label: 'Stream Responses',   value: 'Disabled (planned)',locked: true  },
    ],
  },
  {
    title: 'Data',
    icon: Database,
    items: [
      { label: 'Auth Mode',    value: 'Dev (bypassed)',       locked: true },
      { label: 'DB Backend',   value: 'Supabase (not connected)', locked: false },
      { label: 'Local Cache',  value: 'localStorage (safe wrapper)', locked: true },
    ],
  },
];

export default function SettingsPanel() {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '24px 28px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Settings</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Application preferences and configuration
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {SETTINGS.map(section => (
          <div key={section.title} style={{
            background: '#161616',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <section.icon size={14} className="xps-icon" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{section.title}</span>
            </div>
            <div style={{ padding: '4px 0' }}>
              {section.items.map(item => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center',
                  padding: '10px 18px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{item.label}</span>
                  <span style={{ fontSize: 12, color: item.locked ? 'rgba(255,255,255,0.35)' : gold, fontFamily: item.value.startsWith('#') ? 'monospace' : 'inherit' }}>
                    {item.value}
                  </span>
                  {item.locked && (
                    <Lock size={10} className="xps-icon" style={{ marginLeft: 8, opacity: 0.3 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 16, padding: '10px 14px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 8, fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6,
      }}>
        Locked settings reflect hardcoded XPS design system values and cannot be changed without code modification.
      </div>
    </div>
  );
}
