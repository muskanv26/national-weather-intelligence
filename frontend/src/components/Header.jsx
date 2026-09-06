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
    <header id="overview" className="scroll-mt-16 pb-6 pt-6">
      <div className="flex flex-col gap-3">
        <div className="min-w-0 flex-1">
          <KpiCards reports={reports} />
        </div>
      </div>
    </header>
  );
};

export default Header;
