import React from 'react';
import { X } from 'lucide-react';
import { BracketTag, SeverityTag } from './StatusPill';

export const DetailModal = ({ report, onClose }) => {
  if (!report) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/40 p-4 dark:bg-black/70"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden border border-hair bg-page"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-hair px-5 py-4">
          <h2 className="text-sm font-normal text-ink">Incident Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-mute hover:text-ink"
            title="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityTag severity={report.severity} />
            <BracketTag className="text-mute">
              {(report.eventType || 'OTHER').replaceAll('_', ' ').toLowerCase()}
            </BracketTag>
            <BracketTag className="text-mute">
              {String(report.source || '').toLowerCase()}
            </BracketTag>
          </div>

          <h3 className="text-lg font-normal tracking-tight text-ink">{report.title}</h3>

          {report.imageUrl && (
            <img
              src={report.imageUrl}
              alt="Incident media"
              className="max-h-[320px] w-full border border-hair object-contain bg-hover"
            />
          )}

          <div>
            <h4 className="mb-1 font-mono text-[11px] text-mute">Description</h4>
            <p className="text-sm leading-relaxed text-ink">{report.description}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h4 className="mb-1 font-mono text-[11px] text-mute">Location</h4>
              <p className="text-sm text-ink">
                {report.city}, {report.state}
              </p>
              <p className="font-mono text-[11px] text-mute">
                Lat {report.latitude?.toFixed(4)} · Lng {report.longitude?.toFixed(4)}
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-mono text-[11px] text-mute">Reported</h4>
              <p className="font-mono text-xs text-ink">
                {report.reportedAt ? new Date(report.reportedAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-mono text-[11px] text-mute">Ingested</h4>
              <p className="font-mono text-xs text-ink">
                {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-mono text-[11px] text-mute">UUID</h4>
              <p className="break-all font-mono text-[11px] text-mute">{report.id}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-hair px-5 py-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
