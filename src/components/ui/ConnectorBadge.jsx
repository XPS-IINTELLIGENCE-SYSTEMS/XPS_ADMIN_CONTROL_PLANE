import React from 'react';
import { statusMeta } from '../../data/connectors.js';

export default function ConnectorBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.missing;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: meta.bg, color: meta.color,
      borderRadius: 99, padding: '3px 10px',
      fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
      {meta.label}
    </span>
  );
}
