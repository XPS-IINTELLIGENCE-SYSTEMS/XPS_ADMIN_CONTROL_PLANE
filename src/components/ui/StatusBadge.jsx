import React from 'react';

const STATUS = {
  // Lead pipeline stages
  Proposal:     { bg: 'rgba(196,158,60,0.15)',  color: '#c49e3c' },
  Qualified:    { bg: 'rgba(59,130,246,0.15)',   color: '#3b82f6' },
  Prospecting:  { bg: 'rgba(107,114,128,0.15)',  color: '#9ca3af' },
  Contacted:    { bg: 'rgba(139,92,246,0.15)',   color: '#a78bfa' },
  Negotiation:  { bg: 'rgba(249,115,22,0.15)',   color: '#fb923c' },
  'Closed Won': { bg: 'rgba(34,197,94,0.15)',    color: '#22c55e' },
  New:          { bg: 'rgba(107,114,128,0.12)',  color: '#6b7280' },

  // System statuses
  operational:  { bg: 'rgba(34,197,94,0.12)',    color: '#22c55e' },
  degraded:     { bg: 'rgba(249,115,22,0.12)',   color: '#f97316' },
  blocked:      { bg: 'rgba(239,68,68,0.12)',    color: '#ef4444' },
  idle:         { bg: 'rgba(107,114,128,0.12)',  color: '#6b7280' },
  active:       { bg: 'rgba(34,197,94,0.12)',    color: '#22c55e' },
  paused:       { bg: 'rgba(234,179,8,0.12)',    color: '#eab308' },
  running:      { bg: 'rgba(34,197,94,0.12)',    color: '#22c55e' },

  // Build statuses
  deployed:     { bg: 'rgba(34,197,94,0.12)',    color: '#22c55e' },
  draft:        { bg: 'rgba(107,114,128,0.12)',  color: '#9ca3af' },
  review:       { bg: 'rgba(59,130,246,0.12)',   color: '#3b82f6' },
  queued:       { bg: 'rgba(139,92,246,0.12)',   color: '#a78bfa' },
  in_progress:  { bg: 'rgba(234,179,8,0.12)',    color: '#eab308' },

  // Touchdown
  complete:     { bg: 'rgba(34,197,94,0.12)',    color: '#22c55e' },
  partial:      { bg: 'rgba(234,179,8,0.12)',    color: '#eab308' },

  // Check results
  pass:         { bg: 'rgba(34,197,94,0.12)',    color: '#22c55e' },
  warn:         { bg: 'rgba(234,179,8,0.12)',    color: '#eab308' },
  fail:         { bg: 'rgba(239,68,68,0.12)',    color: '#ef4444' },

  // Risk
  low:          { bg: 'rgba(34,197,94,0.12)',    color: '#22c55e' },
  medium:       { bg: 'rgba(234,179,8,0.12)',    color: '#eab308' },
  high:         { bg: 'rgba(239,68,68,0.12)',    color: '#ef4444' },

  // ledger
  ok:           { bg: 'rgba(34,197,94,0.12)',    color: '#22c55e' },
};

export default function StatusBadge({ status, label }) {
  const meta = STATUS[status] || { bg: 'rgba(107,114,128,0.12)', color: '#9ca3af' };
  const text = label || status;
  return (
    <span style={{
      display: 'inline-block',
      background: meta.bg,
      color: meta.color,
      borderRadius: 99,
      padding: '2px 10px',
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 0.2,
      whiteSpace: 'nowrap',
    }}>
      {text}
    </span>
  );
}
