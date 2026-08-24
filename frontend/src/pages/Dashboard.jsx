import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import KpiCards from '../components/KpiCards';
import FilterBar from '../components/FilterBar';
import WeatherMap from '../components/WeatherMap';
import IncidentList from '../components/IncidentList';
import Analytics from '../components/Analytics';
import DetailModal from '../components/DetailModal';
import CitizenReportModal from '../components/CitizenReportModal';
import { getWeatherReports, getHealth } from '../api';
import { MOCK_REPORTS } from '../data/mockReports';

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

  const [filters, setFilters] = useState({
    eventType: '',
    severity: '',
    state: '',
    city: '',
  });

  // Isolated Fallback Mechanism to local MOCK_REPORTS
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

  // Primary Data Fetch Flow: Spring Boot API -> React State
  const fetchReportData = useCallback(async (currentFilters = filters) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check API health status
      const healthData = await getHealth().catch(() => null);
      const serverLive = Boolean(healthData && healthData.status === 'UP');
      setIsLive(serverLive);

      if (!serverLive) {
        throw new Error('Spring Boot API is unreachable');
      }

      // Fetch weather reports from GET http://localhost:8080/api/v1/reports
      const apiData = await getWeatherReports(currentFilters);

      if (Array.isArray(apiData)) {
        setReports(apiData);
        setIsUsingMock(false);

        // Store unfiltered dataset for autocompletion state dropdowns
        const isFilterActive = Boolean(
          currentFilters.eventType || currentFilters.severity || currentFilters.state || currentFilters.city
        );
        if (!isFilterActive) {
          setAllReportsForFilters(apiData);
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
  }, [filters, useMockData]);

  useEffect(() => {
    fetchReportData(filters);
  }, [filters, fetchReportData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    const resetState = { eventType: '', severity: '', state: '', city: '' };
    setFilters(resetState);
  };

  // Derive unique states for autocompletion
  const availableStates = Array.from(
    new Set(allReportsForFilters.map((r) => r.state).filter(Boolean))
  );

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <Header
        lastUpdated={lastUpdated}
        onRefresh={() => fetchReportData(filters)}
        isUsingMock={isUsingMock}
        isLive={isLive}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      <main className="dashboard-main-content">
        {/* KPI Summary Cards */}
        <KpiCards reports={reports} />

        {/* Filter Toolbar */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          availableStates={availableStates}
        />

        {/* Error Banner if API error */}
        {error && (
          <div className="error-banner">
            <span>{error}</span>
          </div>
        )}

        {/* Main Split Grid: Map on Left, Incident List on Right */}
        <div className="main-split-grid">
          <div className="grid-left">
            <WeatherMap
              reports={reports}
              selectedReport={selectedReport}
              onSelectReport={(report) => setModalReport(report)}
            />
          </div>

          <div className="grid-right">
            <IncidentList
              reports={reports}
              selectedReport={selectedReport}
              onSelectReport={(report) => {
                setSelectedReport(report);
              }}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Analytics Section */}
        <Analytics reports={reports} />
      </main>

      {/* Detail Modal */}
      {modalReport && (
        <DetailModal
          report={modalReport}
          onClose={() => setModalReport(null)}
        />
      )}

      {/* Citizen Report Form Modal */}
      <CitizenReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
