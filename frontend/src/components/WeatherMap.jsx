import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, AlertCircle, Clock, Navigation } from 'lucide-react';

// Fix for default Leaflet icon paths in React Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to center map on selected report
const MapRecenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 8, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

// Create custom colored div markers based on severity
const createSeverityIcon = (severity) => {
  let colorClass = 'marker-low';
  let pulseClass = '';

  switch (severity) {
    case 'CRITICAL':
      colorClass = 'marker-critical';
      pulseClass = 'pulse-ring-critical';
      break;
    case 'HIGH':
      colorClass = 'marker-high';
      pulseClass = 'pulse-ring-high';
      break;
    case 'MODERATE':
      colorClass = 'marker-moderate';
      break;
    case 'LOW':
    default:
      colorClass = 'marker-low';
      break;
  }

  const html = `
    <div className="custom-leaflet-marker ${colorClass}">
      <div className="marker-pin"></div>
      ${pulseClass ? `<div className="${pulseClass}"></div>` : ''}
    </div>
  `;

  return L.divIcon({
    className: 'custom-marker-wrapper',
    html: html,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
};

export const WeatherMap = ({ reports = [], selectedReport = null, onSelectReport }) => {
  const indiaCenter = [22.5937, 78.9629];

  const activeCenter = selectedReport
    ? [selectedReport.latitude, selectedReport.longitude]
    : null;

  return (
    <div className="map-container-wrapper">
      <div className="map-header">
        <div className="map-title-group">
          <Navigation size={16} className="text-cyan" />
          <h2 className="map-title">Geographic Situational Map — India</h2>
        </div>
        <div className="map-legend">
          <span className="legend-item"><span className="legend-dot critical"></span> Critical</span>
          <span className="legend-item"><span className="legend-dot high"></span> High</span>
          <span className="legend-item"><span className="legend-dot moderate"></span> Moderate</span>
          <span className="legend-item"><span className="legend-dot low"></span> Low</span>
        </div>
      </div>

      <div className="leaflet-map-host">
        <MapContainer
          center={indiaCenter}
          zoom={5}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', borderRadius: '0 0 12px 12px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {activeCenter && <MapRecenter center={activeCenter} zoom={9} />}

          {reports.map((report) => {
            if (!report.latitude || !report.longitude) return null;

            return (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={createSeverityIcon(report.severity)}
                eventHandlers={{
                  click: () => onSelectReport && onSelectReport(report),
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="popup-card">
                    <div className="popup-header">
                      <span className={`severity-badge badge-${report.severity?.toLowerCase()}`}>
                        {report.severity}
                      </span>
                      <span className="event-type-tag">{report.eventType?.replace('_', ' ')}</span>
                    </div>

                    <h3 className="popup-title">{report.title}</h3>

                    <div className="popup-meta">
                      <div className="meta-row">
                        <MapPin size={13} className="text-cyan" />
                        <span>{report.city}, {report.state}</span>
                      </div>
                      <div className="meta-row">
                        <Clock size={13} className="text-muted" />
                        <span>{report.reportedAt ? new Date(report.reportedAt).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="meta-row">
                        <AlertCircle size={13} className="text-muted" />
                        <span>Source: <strong>{report.source}</strong></span>
                      </div>
                    </div>

                    <p className="popup-description">{report.description}</p>

                    <button
                      onClick={() => onSelectReport && onSelectReport(report)}
                      className="popup-btn"
                    >
                      View Full Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default WeatherMap;
