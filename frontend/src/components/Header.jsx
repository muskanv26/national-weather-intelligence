import React from 'react';
import { Database, Plus } from 'lucide-react';
import KpiCards from './KpiCards';
import { SystemLivePill } from './StatusPill';

export const Header = ({
  lastUpdated,
  isUsingMock,
  isLive,
  onOpenReportModal,
  reports = [],
}) => {
  const connected = isLive && !isUsingMock;

  return (
    <header id="overview" className="scroll-mt-16 pb-12 pt-10 sm:pb-16 sm:pt-16">
      <div className="min-w-0">
        <span className="inline-flex rounded-full border border-ink px-2.5 py-0.5 font-mono text-[11px] text-ink">
          SIH 2026 Prototype
        </span>
        <h1 className="mt-5 text-[2rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
          National Weather Intelligence
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-mute sm:text-base">
          Real-time weather and disaster situational awareness for India — combining verified citizen reports with live sensor feeds.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenReportModal}
            className="btn-primary h-9 px-3.5"
            title="Report a weather incident or disaster in your area"
          >
            <Plus size={14} />
            Report Incident →
          </button>
          <a href="#map" className="btn-secondary h-9 px-3.5">
            View Live Map →
          </a>
        </div>

        <a
          href="#feed"
          className="mt-5 inline-flex items-center gap-1.5 text-sm text-mute hover:text-ink"
        >
          ↓ Jump to Live Feed
        </a>
      </div>

      <div className="mt-10 flex flex-col gap-3 xl:flex-row xl:items-stretch">
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 xl:w-44 xl:flex-col xl:items-start xl:justify-center xl:gap-2">
          <SystemLivePill live={connected} />
          {connected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink px-2.5 py-0.5 font-mono text-[11px] text-ink">
              <Database size={11} strokeWidth={1.75} />
              Live DB
            </span>
          ) : null}
          <span className="font-mono text-[11px] text-mute">
            Updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—'}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <KpiCards reports={reports} />
        </div>
      </div>
    </header>
  );
};

export default Header;
