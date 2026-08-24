import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, AlertCircle, Clock, Navigation } from 'lucide-react';

// Fix default Leaflet asset path resolution for Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to center and zoom map when a report is selected
const MapRecenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 8, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

// Create custom vector SVG map pin markers based on severity
const createSeverityIcon = (severity) => {
  let color = '#0B5FA5'; // LOW (Official Blue)
  let badgeClass = 'marker-low';

  switch (severity) {
    case 'CRITICAL':
      color = '#D62839'; // Red
      badgeClass = 'marker-critical';
      break;
    case 'HIGH':
      color = '#E8720C'; // Saffron/Orange
      badgeClass = 'marker-high';
      break;
    case 'MODERATE':
      color = '#C79000'; // Amber/Yellow
      badgeClass = 'marker-moderate';
      break;
    case 'LOW':
    default:
      color = '#0B5FA5'; // Official Blue
      badgeClass = 'marker-low';
      break;
  }


  const svgHtml = `
    <div class="custom-marker-container ${badgeClass}" style="position: relative; width: 32px; height: 42px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.6)); pointer-events: auto;">
      <svg width="32" height="42" viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 34 12 34C12 34 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="${color}" stroke="#ffffff" stroke-width="2"/>
        <circle cx="12" cy="12" r="5" fill="#ffffff"/>
      </svg>
      ${severity === 'CRITICAL' ? '<div class="critical-pulse-ring"></div>' : ''}
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-div-icon',
    html: svgHtml,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
};

export const WeatherMap = ({ reports = [], selectedReport = null, onSelectReport }) => {
  const indiaCenter = [22.5937, 78.9629];
  const markerRefs = useRef({});

  const activeCenter = selectedReport
    ? [selectedReport.latitude, selectedReport.longitude]
    : null;

  // Open marker popup automatically when selected from incident list
  useEffect(() => {
    if (selectedReport && selectedReport.id && markerRefs.current[selectedReport.id]) {
      const markerInstance = markerRefs.current[selectedReport.id];
      if (markerInstance && markerInstance.openPopup) {
        markerInstance.openPopup();
      }
    }
  }, [selectedReport]);

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
            if (
              typeof report.latitude !== 'number' ||
              typeof report.longitude !== 'number' ||
              isNaN(report.latitude) ||
              isNaN(report.longitude)
            ) {
              return null;
            }

            return (
              <Marker
                key={report.id}
                ref={(el) => {
                  if (el) markerRefs.current[report.id] = el;
                }}
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
