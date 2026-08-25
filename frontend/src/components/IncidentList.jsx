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
      className="flex h-full min-h-[520px] scroll-mt-16 flex-col overflow-hidden border border-hair bg-page"
    >
      <div className="flex items-center justify-between gap-3 border-b border-hair px-4 py-3">
        <h3 className="inline-flex items-center gap-2 text-sm font-normal text-ink">
          <Activity size={14} strokeWidth={1.75} className="text-mute" />
          Incident Feed
        </h3>
        <span className="font-mono text-[11px] text-mute">
          N: {sortedReports.length}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 py-16 font-mono text-xs text-mute">
            <div className="h-5 w-5 animate-spin rounded-full border border-hair border-t-ink" />
            Fetching feed…
          </div>
        ) : sortedReports.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-16 text-center">
            <p className="text-sm text-ink">No incident reports</p>
            <p className="mt-1 font-mono text-xs text-mute">
              No weather alerts match the current filters
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead className="sticky top-0 bg-page">
              <tr className="border-b border-hair font-mono text-[10px] uppercase tracking-wide text-mute">
                <th className="px-3 py-2 font-normal">event</th>
                <th className="px-3 py-2 font-normal">title</th>
                <th className="px-3 py-2 font-normal">loc</th>
                <th className="px-3 py-2 font-normal">sev</th>
                <th className="px-3 py-2 font-normal">status</th>
                <th className="px-3 py-2 font-normal">time</th>
              </tr>
            </thead>
            <tbody>
              {sortedReports.map((report) => (
                <IncidentCard
                  key={report.id}
                  report={report}
                  isSelected={selectedReport?.id === report.id}
                  onClick={() => onSelectReport(report)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default IncidentList;
