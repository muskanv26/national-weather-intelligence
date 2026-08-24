import React from 'react';
import IncidentCard from './IncidentCard';
import { Radio, AlertCircle } from 'lucide-react';

export const IncidentList = ({ reports = [], selectedReport, onSelectReport, isLoading }) => {
  const sortedReports = [...reports].sort((a, b) => {
    const aTime = new Date(a.reportedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.reportedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  });
  return (
    <div className="incident-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <Radio size={16} className="text-red pulse-fast" />
          <h3 className="panel-title">Recent Incidents Feed</h3>
        </div>
        <span className="panel-count">{sortedReports.length} Reports</span>
      </div>

      <div className="panel-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Fetching incident feed...</p>
          </div>
        ) : sortedReports.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={32} className="text-muted mb-2" />
            <p className="empty-title">No Incident Reports</p>
            <p className="empty-subtitle">No weather alerts match the current filter selection.</p>
          </div>
        ) : (
          <div className="incident-scroll-list">
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
