import React from 'react';
import Shell from './components/layout/Shell.jsx';

function SvgDefs() {
  return (
    <svg
      width="0"
      height="0"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="xps-electric-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--electric-gold)" />
          <stop offset="40%" stopColor="var(--electric-silver)" />
          <stop offset="60%" stopColor="var(--electric-silver-bright)" />
          <stop offset="100%" stopColor="var(--electric-gold)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function App() {
  return (
    <>
      <SvgDefs />
      <Shell />
    </>
  );
}
