import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Info, Plus, Search, MapPin, Building, ChevronRight, ChevronLeft, CloudLightning, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import ISO_STATES from '../data/iso_states.json';
import CITIES_BY_STATE from '../data/cities_by_state.json';

import { FilterBar } from '../components/FilterBar';
import KpiCards from '../components/KpiCards';
import { WeatherMap } from '../components/WeatherMap';
import IncidentList from '../components/IncidentList';
import InfoModal from '../components/InfoModal';
import DetailModal from '../components/DetailModal';
import { getWeatherReports, getHealth, triggerScrape } from '../api';
import CitizenReportModal from '../components/CitizenReportModal';
import ErrorToast from '../components/ErrorToast';
import { MOCK_REPORTS } from '../data/mockReports';

const EVENT_TYPES = [
  'RAIN', 'FLOOD', 'THUNDERSTORM', 'HEATWAVE', 'FOG', 
  'DUST_STORM', 'STRONG_WIND', 'CYCLONE', 'OTHER'
];

const SEVERITIES = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

const formatLabel = (value) => {
  const text = value.replaceAll('_', ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const matchesSearch = (report, query) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    report.title,
    report.description,
    report.city,
    report.state,
    report.location,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
};

const hasPlottableCoordinates = (report) => {
  const lat = Number(report?.latitude);
  const lng = Number(report?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng);
};

export const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [allReportsForFilters, setAllReportsForFilters] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalReport, setModalReport] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUsingMock, setIsUsingMock] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorToast, setErrorToast] = useState(null);

  const [filters, setFilters] = useState({
    eventType: '',
    severity: '',
    state: '',
    city: '',
  });
  const [search, setSearch] = useState('');

  const useMockData = useCallback((currentFilters) => {
    setIsUsingMock(true);
    let filtered = [...MOCK_REPORTS];

    if (currentFilters.eventType) {
      filtered = filtered.filter((r) => r.eventType === currentFilters.eventType);
    }
    if (currentFilters.severity) {
      filtered = filtered.filter((r) => r.severity === currentFilters.severity);
    }
    if (currentFilters.state) {
      filtered = filtered.filter(
        (r) => r.state && r.state.toLowerCase().includes(currentFilters.state.toLowerCase())
      );
    }
    if (currentFilters.city) {
      filtered = filtered.filter(
        (r) => r.city && r.city.toLowerCase().includes(currentFilters.city.toLowerCase())
      );
    }

    setReports(filtered);
    setAllReportsForFilters(MOCK_REPORTS);
  }, []);

  const fetchReportData = useCallback(
    async (currentFilters = filters) => {
      setIsLoading(true);
      setError(null);

      try {
        const apiData = await getWeatherReports(currentFilters);

        const healthData = await getHealth().catch(() => null);
        setIsLive(Boolean(healthData && healthData.status === 'UP'));

        if (Array.isArray(apiData)) {
          const sortedData = apiData.sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
          setReports(sortedData);
          setIsUsingMock(false);

          const isFilterActive = Boolean(
            currentFilters.eventType ||
              currentFilters.severity ||
              currentFilters.state ||
              currentFilters.city
          );
          if (!isFilterActive) {
            setAllReportsForFilters(sortedData);
          }
        } else {
          throw new Error('API returned non-array payload');
        }
      } catch (err) {
        console.warn('Backend REST API unavailable, switching to local dev fallback dataset:', err.message);
        setIsLive(false);
        setError('Live API connection unavailable. Displaying local fallback dataset.');
        useMockData(currentFilters);
      } finally {
        setIsLoading(false);
        setLastUpdated(new Date().toISOString());
      }
    },
    [filters, useMockData]
  );

  useEffect(() => {
    fetchReportData(filters);
  }, [filters, fetchReportData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value };
      if (key === 'state') {
        newFilters.city = '';
      }
      return newFilters;
    });
  };

  const handleResetFilters = () => {
    setFilters({ eventType: '', severity: '', state: '', city: '' });
    setSearch('');
  };

  const handleRefresh = async () => {
    try {
      await triggerScrape();
      setTimeout(() => fetchReportData(filters), 3000);
    } catch (err) {
      console.error('Failed to trigger scrape:', err);
      fetchReportData(filters);
    }
  };

  const availableStates = Array.from(
    new Set(allReportsForFilters.map((r) => r.state).filter(Boolean))
  );

  const visibleReports = useMemo(
    () => reports.filter((report) => matchesSearch(report, search)),
    [reports, search]
  );

  const plottableReports = visibleReports.filter(hasPlottableCoordinates);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-page">
      <div className="fixed inset-0 z-0">
        <WeatherMap
          reports={plottableReports}
          selectedReport={selectedReport}
          onSelectReport={(report) => setModalReport(report)}
          selectedState={filters.state}
          onSelectState={(stateName) => handleFilterChange('state', stateName)}
          selectedCity={filters.city}
          onSelectCity={(cityName) => handleFilterChange('city', cityName)}
        />
      </div>
      
      <div className="absolute bottom-6 left-6 z-50 pointer-events-none">
        <KpiCards reports={visibleReports} />
      </div>

      <header className="absolute top-6 left-6 right-6 z-50 pointer-events-none flex items-start gap-4 flex-nowrap overflow-x-auto overflow-y-visible hide-scrollbar">
        {/* Title & Actions */}
        <div className="pointer-events-auto flex flex-col gap-3 shrink-0 hidden xl:flex">
          <div className="inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-[15px] font-semibold text-ink shadow-lg border border-hair whitespace-nowrap">
            India Weather Intelligence
          </div>
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-white hover:bg-gray-50 transition-colors px-6 text-[15px] font-semibold text-ink shadow-lg border border-hair"
            title="Report a weather incident or disaster in your area"
          >
            <Plus size={18} strokeWidth={2.5} />
            Report Incident
          </button>
        </div>

        {/* Search + Filters Group */}
        <div className="pointer-events-auto flex flex-nowrap items-center gap-3 shrink-0">
          <label className="flex h-11 items-center gap-3 rounded-full bg-white px-5 shadow-lg border border-hair w-80 shrink-0">
            <Search size={18} className="shrink-0 text-mute" />
            <input
              id="global-search"
              type="search"
              placeholder="Search reports by title, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-mute"
            />
          </label>

          <label className="flex h-11 items-center gap-2 rounded-full bg-white px-4 shadow-lg border border-hair relative shrink-0">
            <CloudLightning size={16} className="text-mute shrink-0" />
            <select
              id="eventType-select-dash"
              value={filters.eventType || ''}
              onChange={(e) => handleFilterChange('eventType', e.target.value)}
              className="w-24 border-0 bg-transparent text-[14px] text-ink outline-none cursor-pointer"
            >
              <option value="">All Events</option>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {formatLabel(type)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex h-11 items-center gap-2 rounded-full bg-white px-4 shadow-lg border border-hair relative shrink-0">
            <AlertTriangle size={16} className="text-mute shrink-0" />
            <select
              id="severity-select-dash"
              value={filters.severity || ''}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
              className="w-28 border-0 bg-transparent text-[14px] text-ink outline-none cursor-pointer"
            >
              <option value="">All Severities</option>
              {SEVERITIES.map((sev) => (
                <option key={sev} value={sev}>
                  {formatLabel(sev)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex h-11 items-center gap-2 rounded-full bg-white px-4 shadow-lg border border-hair relative w-44 shrink-0">
            <MapPin size={16} className="text-mute shrink-0" />
            <select
              value={filters.state || ''}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              className="w-full border-0 bg-transparent text-[14px] text-ink outline-none cursor-pointer"
            >
              <option value="">All States</option>
              {ISO_STATES.map((s) => (
                <option key={s.code} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <div 
            className={`transition-all duration-500 ease-in-out overflow-hidden flex items-center shrink-0 ${
              ISO_STATES.some(s => s.name === filters.state) ? 'max-w-[200px] opacity-100 translate-x-0' : 'max-w-0 opacity-0 translate-x-4 pointer-events-none'
            }`}
          >
            <label className="flex h-11 items-center gap-2 rounded-full bg-white px-4 shadow-lg border border-hair relative w-44">
              <Building size={16} className="text-mute shrink-0" />
              <select
                value={filters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full border-0 bg-transparent text-[14px] text-ink outline-none cursor-pointer"
              >
                <option value="">All Cities</option>
                {(CITIES_BY_STATE[filters.state] || []).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex-1 min-w-[1rem]"></div>
      </header>

      <div 
        className={`absolute bottom-0 right-6 top-0 z-10 flex transition-transform duration-500 ease-in-out pointer-events-none ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-[440px]'
        }`}
      >
        <button 
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -left-12 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 backdrop-blur-md border border-hair shadow-lg hover:bg-gray-50 pointer-events-auto text-ink transition-transform hover:scale-105"
          title="Toggle Analytics Sidebar"
        >
          {isSidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        <main className="pointer-events-auto flex w-[420px] flex-col h-full overflow-hidden">
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto hide-scrollbar">
              <IncidentList
                reports={plottableReports}
                selectedReport={selectedReport}
                onSelectReport={(report) => {
                  setSelectedReport(report);
                }}
                isLoading={isLoading}
              />
            </div>
          </div>
        </main>
      </div>

      <InfoModal 
        isOpen={isInfoModalOpen} 
        onClose={() => setIsInfoModalOpen(false)} 
        reports={visibleReports} 
      />

      {modalReport && (
        <DetailModal report={modalReport} onClose={() => setModalReport(null)} />
      )}

      <CitizenReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onAccepted={() => {
          fetchReportData(filters);
        }}
        onRejected={(reason) => setErrorToast(reason)}
      />

      <ErrorToast message={errorToast} onDismiss={() => setErrorToast(null)} />
    </div>
  );
};

export default Dashboard;
