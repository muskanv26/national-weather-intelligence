import React from 'react';
import { X, MapPin, Clock, Calendar, Database, ShieldAlert } from 'lucide-react';

export const DetailModal = ({ report, onClose }) => {
  if (!report) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <ShieldAlert size={22} className="text-cyan" />
            <h2>Weather Incident Details</h2>
          </div>
          <button onClick={onClose} className="modal-close-btn" title="Close Modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-badges">
            <span className={`severity-badge badge-${report.severity?.toLowerCase()}`}>
              Severity: {report.severity}
            </span>
            <span className="event-type-tag">
              Event: {report.eventType?.replace('_', ' ')}
            </span>
            <span className="source-tag">
              Source: {report.source}
            </span>
          </div>

          <h3 className="modal-incident-title">{report.title}</h3>

          {report.imageUrl && (
            <div className="modal-image-container" style={{ margin: '1rem 0', borderRadius: '8px', overflow: 'hidden' }}>
              <img 
                src={report.imageUrl} 
                alt="Incident media" 
                style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', backgroundColor: '#0f172a' }} 
              />
            </div>
          )}

          <div className="modal-section">
            <h4>Incident Description</h4>
            <p className="modal-description">{report.description}</p>
          </div>

          <div className="modal-grid">
            <div className="modal-info-box">
              <MapPin size={16} className="text-cyan" />
              <div>
                <label>Location & Coordinates</label>
                <span>{report.city}, {report.state}</span>
                <span className="sub-text">
                  Lat: {report.latitude?.toFixed(4)}°, Lng: {report.longitude?.toFixed(4)}°
                </span>
              </div>
            </div>

            <div className="modal-info-box">
              <Clock size={16} className="text-amber" />
              <div>
                <label>Reported Timestamp</label>
                <span>{report.reportedAt ? new Date(report.reportedAt).toLocaleString() : 'N/A'}</span>
              </div>
            </div>

            <div className="modal-info-box">
              <Calendar size={16} className="text-purple" />
              <div>
                <label>System Ingestion Time</label>
                <span>{report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}</span>
              </div>
            </div>

            <div className="modal-info-box">
              <Database size={16} className="text-emerald" />
              <div>
                <label>System UUID</label>
                <span className="font-mono text-xs text-muted">{report.id}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-modal-close">
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
