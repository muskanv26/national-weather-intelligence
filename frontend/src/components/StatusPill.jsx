import React from 'react';

const SEVERITY_TEXT = {
  CRITICAL: 'text-critical',
  HIGH: 'text-high',
  MODERATE: 'text-moderate',
  LOW: 'text-low',
};

export const BracketTag = ({ children, className = '' }) => (
  <span className={`font-mono text-[11px] lowercase tracking-tight ${className}`}>
    [{children}]
  </span>
);

export const SeverityTag = ({ severity }) => {
  const key = String(severity || 'LOW').toUpperCase();
  return (
    <BracketTag className={SEVERITY_TEXT[key] || 'text-mute'}>
      {key.toLowerCase()}
    </BracketTag>
  );
};

export const VerificationTag = ({ report }) => {
  const status = report?.verificationStatus;
  if (status && status !== 'VERIFIED') {
    return <BracketTag className="text-mute">unverified</BracketTag>;
  }
  if (report?.source === 'GOVERNMENT' || report?.source === 'WEATHER_API' || status === 'VERIFIED') {
    return <BracketTag className="text-mute">verified</BracketTag>;
  }
  return <BracketTag className="text-mute">unverified</BracketTag>;
};

export const SystemLivePill = ({ live }) => (
  <span
    className="inline-flex items-center gap-1.5 font-mono text-[11px] text-ink"
    role="status"
  >
    <span
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${live ? 'status-dot-live' : 'status-dot-fallback'}`}
      aria-hidden="true"
    />
    {live ? 'System live' : 'Fallback'}
  </span>
);

export const StatusPill = ({ active, children, onClick, className = '' }) => {
  const base = 'rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors';
  const tone = active
    ? 'bg-ink text-page'
    : 'bg-transparent text-mute hover:text-ink';

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${tone} ${className}`}>
        {children}
      </button>
    );
  }

  return <span className={`${base} ${tone} ${className}`}>{children}</span>;
};

export default StatusPill;
