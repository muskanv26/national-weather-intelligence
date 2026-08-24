import React from 'react';
import {
  CloudRain,
  Waves,
  Zap,
  Sun,
  CloudFog,
  Wind,
  Tornado,
  HelpCircle,
  MapPin,
  Clock,
  Sparkles
} from 'lucide-react';

const getEventIcon = (eventType) => {
  switch (eventType) {
    case 'RAIN':
      return CloudRain;
    case 'FLOOD':
      return Waves;
    case 'THUNDERSTORM':
      return Zap;
    case 'HEATWAVE':
      return Sun;
    case 'FOG':
      return CloudFog;
    case 'DUST_STORM':
    case 'STRONG_WIND':
      return Wind;
    case 'CYCLONE':
      return Tornado;
    case 'OTHER':
    default:
      return HelpCircle;
  }
};

const isUnverified = (report) => {
  const status = report?.verificationStatus;
  return Boolean(status) && status !== 'VERIFIED';
};

export const IncidentCard = ({ report, isSelected, onClick }) => {
  const eventType = report.eventType || 'OTHER';
  const IconComponent = getEventIcon(eventType);
  const unverified = isUnverified(report);

  return (
    <div
      onClick={onClick}
      className={`incident-card ${isSelected ? 'incident-card-selected' : ''} ${unverified ? 'incident-card-unverified' : ''}`}
    >
      <div className="incident-card-header">
        <div className={`event-icon-badge ${eventType === 'OTHER' ? 'event-icon-badge-other' : ''}`}>
          <IconComponent size={18} />
        </div>
        <div className="incident-meta-top">
          <span className="event-name">{eventType.replace('_', ' ')}</span>
          <span className={`severity-badge badge-${(report.severity || 'low').toLowerCase()}`}>
            {report.severity || 'LOW'}
          </span>
          {unverified && <span className="severity-badge badge-unverified">UNVERIFIED</span>}
        </div>
      </div>

      <h4 className="incident-title">{report.title}</h4>

      {typeof report.aiConfidenceScore === 'number' && (
        <span className="ai-verified-badge" title="Validated by Gemini">
          <Sparkles size={11} />
          AI Verified {Math.round(report.aiConfidenceScore <= 1 ? report.aiConfidenceScore * 100 : report.aiConfidenceScore)}%
        </span>
      )}

      <p className="incident-snippet">{report.description}</p>

      <div className="incident-footer">
        <div className="footer-item">
          <MapPin size={12} className="text-cyan" />
          <span>{report.city}, {report.state}</span>
        </div>
        <div className="footer-item">
          <Clock size={12} className="text-muted" />
          <span>{report.reportedAt ? new Date(report.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
        </div>
      </div>
    </div>
  );
};

export default IncidentCard;
