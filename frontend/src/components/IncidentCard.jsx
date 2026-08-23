import React from 'react';
import {
  CloudRain,
  Waves,
  Zap,
  Sun,
  CloudFog,
  Wind,
  Tornado,
  AlertTriangle,
  MapPin,
  Clock
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
    default:
      return AlertTriangle;
  }
};

export const IncidentCard = ({ report, isSelected, onClick }) => {
  const IconComponent = getEventIcon(report.eventType);

  return (
    <div
      onClick={onClick}
      className={`incident-card ${isSelected ? 'incident-card-selected' : ''}`}
    >
      <div className="incident-card-header">
        <div className="event-icon-badge">
          <IconComponent size={18} />
        </div>
        <div className="incident-meta-top">
          <span className="event-name">{report.eventType?.replace('_', ' ')}</span>
          <span className={`severity-badge badge-${report.severity?.toLowerCase()}`}>
            {report.severity}
          </span>
        </div>
      </div>

      <h4 className="incident-title">{report.title}</h4>

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
