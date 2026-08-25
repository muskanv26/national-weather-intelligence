import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Filter } from 'lucide-react';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import FilterBar from '../components/FilterBar';
import WeatherMap from '../components/WeatherMap';
import IncidentList from '../components/IncidentList';
import Analytics from '../components/Analytics';
import DetailModal from '../components/DetailModal';
import { getWeatherReports, getHealth, triggerScrape } from '../api';
import CitizenReportModal from '../components/CitizenReportModal';
import ErrorToast from '../components/ErrorToast';
import Section from '../components/Section';
import { MOCK_REPORTS } from '../data/mockReports';

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
    setFilters((prev) => ({ ...prev, [key]: value }));
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
    <div className="flex min-h-screen flex-col bg-page">
      <Navbar onRefresh={handleRefresh} />

      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-6 pb-16">
        <Header
          lastUpdated={lastUpdated}
          isUsingMock={isUsingMock}
          isLive={isLive}
          onOpenReportModal={() => setIsReportModalOpen(true)}
          reports={visibleReports}
        />

        <Section title="Filters" icon={<Filter size={14} strokeWidth={1.75} />}>
          <FilterBar
            filters={filters}
            search={search}
            onSearchChange={setSearch}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            availableStates={availableStates}
            visibleCount={visibleReports.length}
            totalCount={allReportsForFilters.length}
            notice={error}
          />
        </Section>

        <Section title="Operations" meta={`${plottableReports.length} plotted`} className="mt-0">
          <div className="grid min-h-[540px] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <WeatherMap
              reports={plottableReports}
              selectedReport={selectedReport}
              onSelectReport={(report) => setModalReport(report)}
            />
            <IncidentList
              reports={plottableReports}
              selectedReport={selectedReport}
              onSelectReport={(report) => {
                setSelectedReport(report);
              }}
              isLoading={isLoading}
            />
          </div>
        </Section>

        <Analytics reports={visibleReports} />

        <Section id="about" title="About">
          <div className="max-w-2xl space-y-3 text-sm leading-relaxed text-mute">
            <p>
              An SIH 2026 prototype for problem 26069 — a national weather big data analytics
              platform. This dashboard plots crowd reports and official/sensor feeds on a live map,
              with verification status and severity in the incident feed.
            </p>
            <p className="font-mono text-xs">
              Source →{' '}
              <a
                href="https://github.com/muskanv26/national-weather-intelligence"
                target="_blank"
                rel="noreferrer"
                className="text-ink underline decoration-hair underline-offset-4 hover:decoration-ink"
              >
                github.com/muskanv26/national-weather-intelligence
              </a>
            </p>
          </div>
        </Section>
      </main>

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
