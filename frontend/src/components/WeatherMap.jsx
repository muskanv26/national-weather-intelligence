import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, ZoomControl, GeoJSON } from 'react-leaflet';
import indiaGeoJson from '../data/india.json';
import indiaMask from '../data/india_mask.json';
import ISO_STATES from '../data/iso_states.json';
import CITIES_BY_STATE from '../data/cities_by_state.json';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToString } from 'react-dom/server';
import { 
  MapPin, Clock, CloudLightning, AlertTriangle, CloudRain, 
  Wind, Flame, Droplet, Snowflake, ThermometerSun, 
  Activity, AlertOctagon, MountainSnow 
} from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';
import { BracketTag, SeverityTag } from './StatusPill';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getEventIcon = (eventType, color) => {
  const props = { size: 14, strokeWidth: 2.5, color };
  switch (eventType) {
    case 'FLOOD': return <Droplet {...props} />;
    case 'CYCLONE': return <Wind {...props} />;
    case 'EARTHQUAKE': return <Activity {...props} />;
    case 'LANDSLIDE': return <MountainSnow {...props} />;
    case 'HEAT_WAVE': return <ThermometerSun {...props} />;
    case 'COLD_WAVE': return <Snowflake {...props} />;
    case 'HEAVY_RAIN': return <CloudRain {...props} />;
    case 'LIGHTNING': return <CloudLightning {...props} />;
    case 'FOREST_FIRE': return <Flame {...props} />;
    default: return <AlertTriangle {...props} />;
  }
};

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

  const pinFill = unverified ? 'white' : color;
  const pinStroke = unverified ? '#94A3B8' : 'white';
  const iconColor = unverified ? '#94A3B8' : 'white';
  
  const iconHtml = renderToString(getEventIcon(eventType, iconColor));

  const svgHtml = `
    <div class="custom-marker-container" style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background-color: ${pinFill}; border: 2px solid ${pinStroke}; border-radius: 50%; filter: drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.35)); pointer-events: auto;">
      <div style="z-index: 10; display: flex; align-items: center; justify-content: center;">
        ${iconHtml}
      </div>
      ${!unverified && severity === 'CRITICAL' ? '<div class="critical-pulse-ring"></div>' : ''}
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-div-icon',
    html: svgHtml,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};


const INDIA_BOUNDS = [
  [5.0, 65.0],
  [38.0, 100.0]
];

const CityFocuser = ({ selectedCity, selectedState, isValidCity }) => {
  const map = useMap();
  useEffect(() => {
    if (!selectedCity || !selectedState) return;
    
    // Only zoom if it's a valid city (either from dropdown or from map click validation)
    if (!isValidCity) return;

    // Use Nominatim to geocode the city and get a precise bounding box
    const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(selectedCity)}&state=${encodeURIComponent(selectedState)}&country=India&format=json`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const bbox = data[0].boundingbox; // [latMin, latMax, lonMin, lonMax]
          if (bbox) {
            const bounds = [
              [parseFloat(bbox[0]), parseFloat(bbox[2])],
              [parseFloat(bbox[1]), parseFloat(bbox[3])]
            ];
            map.flyToBounds(bounds, { duration: 1.5, padding: [30, 30] });
          }
        }
      })
      .catch(err => console.error("Geocoding failed", err));
  }, [selectedCity, selectedState, map]);
  return null;
};

const DistrictRenderer = ({ selectedState, selectedCity, onSelectCity, districtData, isValidCity }) => {
  if (!districtData) return null;
  const validCities = CITIES_BY_STATE[selectedState] || [];

  return (
    <GeoJSON
      key={`districts-${selectedState}-${isValidCity ? selectedCity : 'none'}`}
      data={districtData}
      style={(feature) => {
        const isCitySelected = isValidCity && feature.properties?.NAME_2 &&
          feature.properties.NAME_2.toLowerCase().replace(/[^a-z]/g, '') === selectedCity.toLowerCase().replace(/[^a-z]/g, '');

        if (isCitySelected) {
          return {
            color: "#000",
            weight: 2,
            fillColor: "#4CAF50",
            fillOpacity: 0.7
          };
        }
        
        return {
          color: "#1f2937", // dark gray outline
          weight: 1,
          dashArray: "3, 3",
          fillColor: "transparent",
          fillOpacity: 0
        };
      }}
      onEachFeature={(feature, layer) => {
        const isCitySelected = isValidCity && feature.properties?.NAME_2 &&
          feature.properties.NAME_2.toLowerCase().replace(/[^a-z]/g, '') === selectedCity.toLowerCase().replace(/[^a-z]/g, '');

        layer.on({
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({
              fillOpacity: 0.5,
              weight: 2,
            });
            l.bringToFront();
          },
          mouseout: (e) => {
            const l = e.target;
            if (!isCitySelected) {
              l.setStyle({
                weight: 1,
                fillOpacity: 0,
              });
            } else {
              l.setStyle({
                fillOpacity: 0.7,
                weight: 2,
              });
            }
          },
          click: () => {
            if (feature.properties && feature.properties.NAME_2 && onSelectCity) {
              const clickedName = feature.properties.NAME_2;
              const normalizedClicked = clickedName.toLowerCase().replace(/[^a-z]/g, '');
              
              // Fuzzy match the clicked district to our official CITIES_BY_STATE list
              const match = validCities.find(c => c.toLowerCase().replace(/[^a-z]/g, '') === normalizedClicked);
              onSelectCity(match || clickedName);
            }
          }
        });
        if (feature.properties && feature.properties.NAME_2) {
          layer.bindTooltip(feature.properties.NAME_2, { sticky: true });
        }
      }}
    />
  );
};

const StateFocuser = ({ selectedState, selectedCity, isValidCity, geoJsonData, defaultBounds }) => {
  const map = useMap();
  useEffect(() => {
    // If a valid city is selected, CityFocuser handles zooming instead
    if (isValidCity) return;

    if (selectedState && geoJsonData) {
      const normalizedSelected = selectedState.toLowerCase().replace(/[^a-z]/g, '');
      const feature = geoJsonData.features.find((f) => {
        if (!f.properties || !f.properties.NAME_1) return false;
        const normalizedFeature = f.properties.NAME_1.toLowerCase().replace(/[^a-z]/g, '');
        return normalizedFeature === normalizedSelected;
      });
      
      if (feature) {
        const layer = L.geoJSON(feature);
        map.flyToBounds(layer.getBounds(), { duration: 1.2, padding: [20, 20] });
        return;
      }
    }
    // Zoom out if no state is selected
    if (!selectedState && defaultBounds) {
      map.flyToBounds(defaultBounds, { duration: 1.2 });
    }
  }, [selectedState, selectedCity, geoJsonData, map, defaultBounds]);
  return null;
};

export const WeatherMap = ({ reports = [], selectedReport = null, onSelectReport, selectedState, onSelectState, selectedCity, onSelectCity }) => {
  const { theme } = useTheme();
  const indiaCenter = [22.5937, 78.9629];
  const markerRefs = useRef({});
  const [districtData, setDistrictData] = React.useState(null);
  const [loadedState, setLoadedState] = React.useState(null);

  useEffect(() => {
    if (!selectedState) {
      setDistrictData(null);
      setLoadedState(null);
      return;
    }

    setDistrictData(null); // Clear old data to unmount GeoJSON

    const normName = selectedState.toLowerCase().replace(/[^a-z]/g, '');
    fetch(`/districts/${normName}.json`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setDistrictData(data);
          setLoadedState(selectedState);
        }
      })
      .catch(() => setDistrictData(null));
  }, [selectedState]);

  // Master validation check: is the selectedCity valid either in the dropdown list or in the loaded district map data?
  const isCityValid = React.useMemo(() => {
    if (!selectedCity || !selectedState) return false;
    const validDropdownCities = CITIES_BY_STATE[selectedState] || [];
    if (validDropdownCities.includes(selectedCity)) return true;
    
    // Fallback: check if it matches a loaded district polygon exactly
    if (districtData && loadedState === selectedState) {
      const normSelected = selectedCity.toLowerCase().replace(/[^a-z]/g, '');
      return districtData.features.some(f => 
        f.properties?.NAME_2 && f.properties.NAME_2.toLowerCase().replace(/[^a-z]/g, '') === normSelected
      );
    }
    return false;
  }, [selectedCity, selectedState, districtData, loadedState]);

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
    <div className="leaflet-map-host h-full w-full">
      <MapContainer
        key={theme}
        center={indiaCenter}
        zoom={5}
        minZoom={4}
        maxBounds={INDIA_BOUNDS}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ width: '100%', height: '100%', background: 'var(--nwi-page)' }}
      >
        <ZoomControl position="bottomright" />
        <StateFocuser selectedState={selectedState} selectedCity={selectedCity} isValidCity={isCityValid} geoJsonData={indiaGeoJson} defaultBounds={INDIA_BOUNDS} />
        <CityFocuser selectedState={selectedState} selectedCity={selectedCity} isValidCity={isCityValid} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON 
          data={indiaMask} 
          style={{ 
            fillColor: '#000000', 
            fillOpacity: 0.3, 
            stroke: false 
          }} 
        />
        <GeoJSON 
          key={`india-geo-${selectedState || 'all'}-${isCityValid ? 'city' : 'nocity'}`}
          data={indiaGeoJson} 
          style={(feature) => {
            const isStateSelected = selectedState && !isCityValid && feature.properties?.NAME_1 &&
              feature.properties.NAME_1.toLowerCase().replace(/[^a-z]/g, '') === selectedState.toLowerCase().replace(/[^a-z]/g, '');
            return {
              color: "#000", 
              weight: isStateSelected ? 2 : 1, 
              fillColor: "#4CAF50", 
              fillOpacity: isStateSelected ? 0.7 : 0.3 
            };
          }}
          onEachFeature={(feature, layer) => {
            const isStateSelected = selectedState && !isCityValid && feature.properties?.NAME_1 &&
              feature.properties.NAME_1.toLowerCase().replace(/[^a-z]/g, '') === selectedState.toLowerCase().replace(/[^a-z]/g, '');

            layer.on({
              mouseover: (e) => {
                const l = e.target;
                l.setStyle({
                  fillOpacity: 0.7,
                  weight: 2,
                });
                l.bringToFront();
              },
              mouseout: (e) => {
                const l = e.target;
                if (!isStateSelected) {
                  l.setStyle({
                    weight: 1,
                    fillOpacity: 0.3,
                  });
                }
              },
              click: () => {
                if (feature.properties && feature.properties.NAME_1 && onSelectState) {
                  // Try to find the exact matching name from our ISO_STATES to ensure the city dropdown works
                  const clickedName = feature.properties.NAME_1;
                  const normalizedClicked = clickedName.toLowerCase().replace(/[^a-z]/g, '');
                  const match = ISO_STATES.find(s => s.name.toLowerCase().replace(/[^a-z]/g, '') === normalizedClicked);
                  onSelectState(match ? match.name : clickedName);
                }
              }
            });
            if (feature.properties && feature.properties.NAME_1) {
              layer.bindTooltip(feature.properties.NAME_1, { sticky: true });
            }
          }}
        />

        <DistrictRenderer selectedState={selectedState} selectedCity={selectedCity} onSelectCity={onSelectCity} districtData={districtData} isValidCity={isCityValid} />

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
  );
};

export default WeatherMap;
