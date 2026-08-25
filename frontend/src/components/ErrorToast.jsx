import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { BracketTag } from './StatusPill';

export const ErrorToast = ({ message, onDismiss, durationMs = 8000 }) => {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => onDismiss?.(), durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  return (
    <div
      className="fixed right-5 top-5 z-[10050] flex max-w-[420px] items-start gap-3 border border-hair bg-page px-4 py-3 text-sm text-ink shadow-sm"
      role="alert"
    >
      <BracketTag className="text-critical">error</BracketTag>
      <span className="flex-1 leading-relaxed">{message}</span>
      <button type="button" className="text-mute hover:text-ink" onClick={onDismiss} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
};

export default ErrorToast;
