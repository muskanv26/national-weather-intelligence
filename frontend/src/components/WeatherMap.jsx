import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Clock } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import { BracketTag, SeverityTag } from './StatusPill';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

const MapRecenter = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 8, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
};

const isUnverified = (report) => {
  const status = report?.verificationStatus;
  return Boolean(status) && status !== 'VERIFIED';
};

const createMarkerIcon = (report) => {
  const unverified = isUnverified(report);
  const eventType = report?.eventType || 'OTHER';
  const severity = report?.severity || 'LOW';

  let color = '#2563EB';

  if (unverified) {
    color = '#94A3B8';
  } else if (eventType === 'OTHER') {
    color = '#7C3AED';
  } else {
    switch (severity) {
      case 'CRITICAL':
        color = '#D62839';
        break;
      case 'HIGH':
        color = '#E8720C';
        break;
      case 'MODERATE':
        color = '#C79000';
        break;
      case 'LOW':
      default:
        color = '#2563EB';
        break;
    }
  }

  const pinFill = unverified ? 'none' : color;
  const pinStroke = unverified ? '#64748B' : '#ffffff';
  const innerFill = unverified ? 'none' : '#ffffff';
  const innerStroke = unverified ? '#64748B' : 'none';

  const svgHtml = `
    <div class="custom-marker-container" style="position: relative; width: 32px; height: 42px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.35)); pointer-events: auto;">
      <svg width="32" height="42" viewBox="0 0 24 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 34 12 34C12 34 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="${pinFill}" stroke="${pinStroke}" stroke-width="2"/>
        <circle cx="12" cy="12" r="5" fill="${innerFill}" stroke="${innerStroke}" stroke-width="2"/>
      </svg>
      ${!unverified && severity === 'CRITICAL' ? '<div class="critical-pulse-ring"></div>' : ''}
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

const LEGEND = [
  { className: 'bg-critical', label: 'Critical' },
  { className: 'bg-high', label: 'High' },
  { className: 'bg-moderate', label: 'Moderate' },
  { className: 'bg-low', label: 'Low' },
  { className: 'bg-other', label: 'Other' },
  { className: 'border border-mute bg-transparent', label: 'Unverified' },
];

export const WeatherMap = ({ reports = [], selectedReport = null, onSelectReport }) => {
  const { theme } = useTheme();
  const indiaCenter = [22.5937, 78.9629];
  const markerRefs = useRef({});

  const activeCenter =
    selectedReport &&
    Number.isFinite(Number(selectedReport.latitude)) &&
    Number.isFinite(Number(selectedReport.longitude))
      ? [Number(selectedReport.latitude), Number(selectedReport.longitude)]
      : null;

  useEffect(() => {
    if (selectedReport && selectedReport.id && markerRefs.current[selectedReport.id]) {
      const markerInstance = markerRefs.current[selectedReport.id];
      if (markerInstance && markerInstance.openPopup) {
        markerInstance.openPopup();
      }
    }
  }, [selectedReport]);

  return (
    <div
      id="map"
      className="flex h-full min-h-[520px] scroll-mt-16 flex-col overflow-hidden border border-hair bg-page"
    >
      <div className="flex flex-col gap-3 border-b border-hair px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-normal text-ink">Geographic Map — India</h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-mute">
          {LEGEND.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${item.className}`} />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="leaflet-map-host flex-1">
        <MapContainer
          key={theme}
          center={indiaCenter}
          zoom={5}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={theme === 'dark' ? DARK_TILES : LIGHT_TILES}
          />

          {activeCenter && <MapRecenter center={activeCenter} zoom={9} />}

          {reports.map((report) => {
            const latitude = Number(report.latitude);
            const longitude = Number(report.longitude);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
              return null;
            }

            return (
              <Marker
                key={report.id}
                ref={(el) => {
                  if (el) markerRefs.current[report.id] = el;
                }}
                position={[latitude, longitude]}
                icon={createMarkerIcon(report)}
                eventHandlers={{
                  click: () => onSelectReport && onSelectReport(report),
                }}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="flex w-[250px] flex-col gap-2 p-3 font-sans">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityTag severity={report.severity} />
                      <BracketTag className="text-mute">
                        {(report.eventType || 'OTHER').replaceAll('_', ' ').toLowerCase()}
                      </BracketTag>
                      {isUnverified(report) && (
                        <BracketTag className="text-mute">unverified</BracketTag>
                      )}
                    </div>

                    <h3 className="text-sm font-medium text-ink">{report.title}</h3>

                    <div className="flex flex-col gap-1 font-mono text-[11px] text-mute">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} />
                        <span>
                          {report.city}, {report.state}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>
                          {report.reportedAt ? new Date(report.reportedAt).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      <span>
                        Source:{' '}
                        {String(report.source || '')
                          .replaceAll('_', ' ')
                          .toLowerCase()
                          .replace(/^\w/, (c) => c.toUpperCase())
                          .replace(/\bapi\b/i, 'API')}
                      </span>
                    </div>

                    <p className="line-clamp-2 text-xs text-mute">{report.description}</p>

                    <button
                      type="button"
                      onClick={() => onSelectReport && onSelectReport(report)}
                      className="btn-primary mt-1 self-start"
                    >
                      View Details →
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
