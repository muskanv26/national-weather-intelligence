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
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl bg-white/95 backdrop-blur-md shadow-lg border border-hair p-5 ${
        isSelected ? 'ring-2 ring-primary bg-white' : ''
      }`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="text-[13px] text-ink leading-relaxed">{report.title}</div>
            {report.description && (
              <div className="line-clamp-3 text-[12px] leading-relaxed text-mute">
                {report.description}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
               <SeverityTag severity={report.severity} />
               <VerificationTag report={report} />
               <span className="font-mono text-[11px] text-mute uppercase">{eventType}</span>
               {typeof report.aiConfidenceScore === 'number' && (
                 <span className="font-mono text-[10px] text-mute">
                   · AI {Math.round(report.aiConfidenceScore <= 1 ? report.aiConfidenceScore * 100 : report.aiConfidenceScore)}%
                 </span>
               )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 font-mono text-[11px] text-mute">
            <span>{report.city}</span>
            <span>{timeLabel}</span>
          </div>
        </div>
        
        {report.imageUrl && (
          <div className="-mx-5 -mb-5 mt-3 overflow-hidden rounded-b-xl border-t border-hair">
            <img
              src={report.imageUrl}
              alt="Incident media"
              className="block w-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentCard;
