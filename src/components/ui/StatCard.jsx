import React from 'react';
import { TrendingUp, TrendingDown, Users, DollarSign, FileText, Target, Building, Star, MapPin, Activity } from 'lucide-react';

const ICONS = {
  users:        Users,
  'dollar-sign': DollarSign,
  'file-text':  FileText,
  target:       Target,
  building:     Building,
  star:         Star,
  'map-pin':    MapPin,
  activity:     Activity,
};

export default function StatCard({ label, value, delta, positive, icon }) {
  const Icon = ICONS[icon] || Activity;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      flex: 1,
      minWidth: 0,
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'rgba(196,158,60,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} color="var(--gold)" strokeWidth={1.8} />
        </div>
        {delta && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 12, fontWeight: 600,
            color: positive ? 'var(--green)' : 'var(--red)',
          }}>
            {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {delta}
          </div>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}
