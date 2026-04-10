import React from 'react';

const GOLD = '#d4a843';

const users = [
  { name: 'Marcus Rodriguez', email: 'marcus@xps.com', role: 'Admin', territory: 'Southeast FL', status: 'Active', lastLogin: '2 min ago' },
  { name: 'Sarah Chen', email: 'sarah.chen@xps.com', role: 'Sales Rep', territory: 'Tampa Bay', status: 'Active', lastLogin: '1 hr ago' },
  { name: 'Jason Williams', email: 'jason@xps.com', role: 'Sales Rep', territory: 'Orlando', status: 'Active', lastLogin: '3 hr ago' },
  { name: 'Priya Sharma', email: 'priya@xps.com', role: 'Manager', territory: 'South FL', status: 'Active', lastLogin: 'Yesterday' },
  { name: 'Dave Kowalski', email: 'dave@xps.com', role: 'Sales Rep', territory: 'Northeast FL', status: 'Inactive', lastLogin: '5 days ago' },
];

export default function Admin() {
  return (
    <div>
      <div className="page-heading">Admin</div>
      <div className="page-sub">Manage users, teams, and system configuration</div>

      {/* Stats */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {[
          { value: '5', label: 'Total Users' },
          { value: '4', label: 'Active Users' },
          { value: '3', label: 'Territories' },
          { value: '99.8%', label: 'System Uptime' },
        ].map((k) => (
          <div key={k.label} className="kpi-card">
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="chart-card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="chart-title" style={{ margin: 0 }}>Users</div>
          <button className="btn-gold" style={{ fontSize: 12, padding: '7px 14px' }}>
            + Invite User
          </button>
        </div>
        <table className="xps-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>NAME</th>
              <th>EMAIL</th>
              <th>ROLE</th>
              <th>TERRITORY</th>
              <th>STATUS</th>
              <th style={{ paddingRight: 20 }}>LAST LOGIN</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.email}>
                <td style={{ paddingLeft: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(212,168,67,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: GOLD, flexShrink: 0 }}>
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{u.email}</td>
                <td>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                    background: u.role === 'Admin' ? 'rgba(212,168,67,0.12)' : 'rgba(255,255,255,0.06)',
                    color: u.role === 'Admin' ? GOLD : 'rgba(255,255,255,0.7)',
                    border: `1px solid ${u.role === 'Admin' ? 'rgba(212,168,67,0.25)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                    {u.role}
                  </span>
                </td>
                <td style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{u.territory}</td>
                <td>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                    background: u.status === 'Active' ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
                    color: u.status === 'Active' ? '#4ade80' : 'rgba(255,255,255,0.4)',
                    border: `1px solid ${u.status === 'Active' ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                    {u.status}
                  </span>
                </td>
                <td style={{ paddingRight: 20, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{u.lastLogin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* System Health */}
      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'API Server', status: 'Operational', uptime: '99.9%', color: '#22c55e' },
          { label: 'Database (Supabase)', status: 'Operational', uptime: '100%', color: '#22c55e' },
          { label: 'AI Engine (Groq)', status: 'Degraded', uptime: '98.1%', color: '#fbbf24' },
        ].map((s) => (
          <div key={s.label} className="chart-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</span>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
            </div>
            <div style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.status}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>Uptime: {s.uptime}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
