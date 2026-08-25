import React from 'react';
import { SeverityTag, VerificationTag } from './StatusPill';

export const IncidentCard = ({ report, isSelected, onClick }) => {
  const eventType = (report.eventType || 'OTHER')
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
  const timeLabel = report.reportedAt
    ? new Date(report.reportedAt).toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer border-b border-hair text-[13px] transition-colors hover:bg-hover ${
        isSelected ? 'bg-hover' : ''
      }`}
    >
      <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] text-mute">
        {eventType}
      </td>
      <td className="max-w-[180px] px-3 py-3">
        <div className="truncate text-ink">{report.title}</div>
        {(typeof report.aiConfidenceScore === 'number' || report.imageUrl) && (
          <div className="mt-0.5 font-mono text-[10px] text-mute">
            {typeof report.aiConfidenceScore === 'number'
              ? `AI ${Math.round(report.aiConfidenceScore <= 1 ? report.aiConfidenceScore * 100 : report.aiConfidenceScore)}%`
              : null}
            {typeof report.aiConfidenceScore === 'number' && report.imageUrl ? ' · ' : null}
            {report.imageUrl ? 'Media' : null}
          </div>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] text-mute">
        {report.city}
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <SeverityTag severity={report.severity} />
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        <VerificationTag report={report} />
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] text-mute">
        {timeLabel}
      </td>
    </tr>
  );
};

export default IncidentCard;
