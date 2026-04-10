import React, { useState } from 'react';

const GOLD = '#d4a843';

const NAV_ITEMS = ['Profile', 'Notifications', 'Appearance', 'Integrations', 'Security', 'Territory', 'AI Preferences'];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('Profile');
  const [toggles, setToggles] = useState({
    emailNotif: true, pushNotif: true, weeklyDigest: true, leadAlerts: true,
    darkMode: true, compactMode: false, autoSave: true,
  });

  const toggle = (key) => setToggles(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div>
      <div className="page-heading">Settings</div>
      <div className="page-sub">Configure your account and workspace preferences</div>

      <div className="settings-grid">
        {/* Left Nav */}
        <div>
          <div className="settings-nav">
            {NAV_ITEMS.map(item => (
              <div key={item} className={`settings-nav-item${activeSection === item ? ' active' : ''}`} onClick={() => setActiveSection(item)}>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Right Content */}
        <div>
          {activeSection === 'Profile' && (
            <div className="chart-card">
              <div className="chart-title" style={{ marginBottom: 20 }}>Profile Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input className="xps-input" defaultValue="Marcus" />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="xps-input" defaultValue="Rodriguez" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="xps-input" defaultValue="marcus@xps.com" type="email" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="xps-input" defaultValue="+1 (813) 555-0142" />
                </div>
                <div className="form-group">
                  <label className="form-label">Territory</label>
                  <input className="xps-input" defaultValue="Southeast FL" />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <input className="xps-input" defaultValue="Admin" readOnly style={{ opacity: 0.6 }} />
                </div>
              </div>
              <button className="btn-gold" style={{ marginTop: 4 }}>Save Changes</button>
            </div>
          )}

          {activeSection === 'Notifications' && (
            <div className="chart-card">
              <div className="chart-title" style={{ marginBottom: 20 }}>Notification Preferences</div>
              {[
                { key: 'emailNotif', label: 'Email Notifications', desc: 'Receive email alerts for important events' },
                { key: 'pushNotif', label: 'Push Notifications', desc: 'Browser push notifications' },
                { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly pipeline summary email every Monday' },
                { key: 'leadAlerts', label: 'Lead Activity Alerts', desc: 'Notify when leads open proposals or take actions' },
              ].map(({ key, label, desc }) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{desc}</div>
                  </div>
                  <Toggle on={toggles[key]} onClick={() => toggle(key)} />
                </div>
              ))}
            </div>
          )}

          {activeSection === 'Appearance' && (
            <div className="chart-card">
              <div className="chart-title" style={{ marginBottom: 20 }}>Appearance</div>
              {[
                { key: 'darkMode', label: 'Dark Mode', desc: 'Use the premium dark theme' },
                { key: 'compactMode', label: 'Compact Mode', desc: 'Reduce spacing for denser information layout' },
                { key: 'autoSave', label: 'Auto-save', desc: 'Automatically save changes as you work' },
              ].map(({ key, label, desc }) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{desc}</div>
                  </div>
                  <Toggle on={toggles[key]} onClick={() => toggle(key)} />
                </div>
              ))}
            </div>
          )}

          {activeSection === 'AI Preferences' && (
            <div className="chart-card">
              <div className="chart-title" style={{ marginBottom: 20 }}>AI Preferences</div>
              <div className="form-group">
                <label className="form-label">Default LLM Model</label>
                <select className="xps-input">
                  <option>gpt-4o-mini (OpenAI)</option>
                  <option>llama3-8b-8192 (Groq)</option>
                  <option>llama3-70b-8192 (Groq)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">AI Tone</label>
                <select className="xps-input">
                  <option>Professional</option>
                  <option>Friendly</option>
                  <option>Direct</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Context Window</label>
                <select className="xps-input">
                  <option>Last 20 messages</option>
                  <option>Last 50 messages</option>
                  <option>Full session</option>
                </select>
              </div>
              <button className="btn-gold">Save AI Settings</button>
            </div>
          )}

          {activeSection === 'Security' && (
            <div className="chart-card">
              <div className="chart-title" style={{ marginBottom: 20 }}>Security</div>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input className="xps-input" type="password" placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="xps-input" type="password" placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input className="xps-input" type="password" placeholder="••••••••" />
              </div>
              <button className="btn-gold">Update Password</button>
            </div>
          )}

          {!['Profile', 'Notifications', 'Appearance', 'AI Preferences', 'Security'].includes(activeSection) && (
            <div className="chart-card" style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚙️</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: 'rgba(255,255,255,0.8)' }}>{activeSection}</div>
              <div style={{ fontSize: 13 }}>Configuration for this section is managed by your administrator.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Toggle({ on, onClick }) {
  return (
    <button className={`xps-toggle ${on ? 'on' : 'off'}`} onClick={onClick} />
  );
}
