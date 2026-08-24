import React, { useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

export const ErrorToast = ({ message, onDismiss, durationMs = 8000 }) => {
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => onDismiss?.(), durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  return (
    <div className="error-toast" role="alert">
      <AlertCircle size={18} />
      <span className="error-toast-message">{message}</span>
      <button type="button" className="error-toast-close" onClick={onDismiss} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
};

export default ErrorToast;
