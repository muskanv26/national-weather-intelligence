import React from 'react';
import { X } from 'lucide-react';
import Analytics from './Analytics';
import Section from './Section';

export const InfoModal = ({ isOpen, onClose, reports }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/40 p-4 dark:bg-black/70"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-[900px] flex-col overflow-hidden border border-hair bg-page"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hair px-5 py-4">
          <h2 className="text-sm font-normal text-ink">Analytics & About</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-mute hover:text-ink"
            title="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-8 overflow-y-auto px-5 py-6">
          <Analytics reports={reports} />
          
          <Section id="about" title="About">
            <div className="max-w-2xl space-y-3 text-sm leading-relaxed text-mute">
              <p>
                An SIH 2026 prototype for problem 26069 — a national weather big data analytics
                platform. This dashboard plots crowd reports and official/sensor feeds on a live map,
                with verification status and severity in the incident feed.
              </p>
              <p className="font-mono text-xs">
                Source →{' '}
                <a
                  href="https://github.com/muskanv26/national-weather-intelligence"
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink underline decoration-hair underline-offset-4 hover:decoration-ink"
                >
                  github.com/muskanv26/national-weather-intelligence
                </a>
              </p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
