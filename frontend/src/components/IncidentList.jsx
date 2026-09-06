import React from 'react';
import { Activity } from 'lucide-react';
import IncidentCard from './IncidentCard';

export const IncidentList = ({ reports = [], selectedReport, onSelectReport, isLoading }) => {
  const sortedReports = [...reports].sort((a, b) => {
    const aTime = new Date(a.reportedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.reportedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  return (
    <div
      id="feed"
      className="flex h-full flex-col overflow-hidden"
    >
      <div className="flex-1 overflow-auto hide-scrollbar">
        {isLoading ? (
          <div className="px-2 py-6">
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-8 font-mono text-[12px] text-mute bg-white/95 backdrop-blur-md rounded-xl border border-hair shadow-lg">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-hair border-t-ink" />
              Fetching feed…
            </div>
          </div>
        ) : sortedReports.length === 0 ? (
          <div className="px-2 py-6">
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center bg-white/95 backdrop-blur-md rounded-xl border border-hair shadow-lg">
              <p className="text-[13px] font-medium text-ink">No incident reports</p>
              <p className="mt-1 font-mono text-[11px] text-mute">
                No weather alerts match the current filters
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-2 py-6">
            {sortedReports.map((report) => (
              <IncidentCard
                key={report.id}
                report={report}
                isSelected={selectedReport?.id === report.id}
                onClick={() => onSelectReport(report)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentList;
