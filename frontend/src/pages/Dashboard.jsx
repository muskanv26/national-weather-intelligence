import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import KpiCards from '../components/KpiCards';
import FilterBar from '../components/FilterBar';
import WeatherMap from '../components/WeatherMap';
import IncidentList from '../components/IncidentList';
import Analytics from '../components/Analytics';
import DetailModal from '../components/DetailModal';
import { getReports, getHealth } from '../api';
import { MOCK_REPORTS } from '../data/mockReports';

export const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [allReportsForFilters, setAllReportsForFilters] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [modalReport, setModalReport] = useState(null);
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

  // Fetch reports from backend API or fallback to mock dataset
  const fetchReportData = useCallback(async (currentFilters = filters) => {
    setIsLoading(true);
    setError(null);

    try {
      // First check health
      const healthData = await getHealth().catch(() => null);
      const serverLive = Boolean(healthData && healthData.status === 'UP');
      setIsLive(serverLive);

      const apiData = await getReports(currentFilters);

      if (Array.isArray(apiData) && apiData.length > 0) {
        setReports(apiData);
        setIsUsingMock(false);
        if (!currentFilters.eventType && !currentFilters.severity && !currentFilters.state && !currentFilters.city) {
          setAllReportsForFilters(apiData);
        }
      } else if (serverLive) {
        // Server live but returned empty data -> show empty or fallback
        setReports([]);
        setIsUsingMock(false);
      } else {
        // Fallback to mock data if API unavailable
        useMockData(currentFilters);
      }
    } catch (err) {
      console.warn('Backend API connection failed, using dev mock fallback:', err.message);
      setIsLive(false);
      useMockData(currentFilters);
    } finally {
      setIsLoading(false);
      setLastUpdated(new Date().toISOString());
    }
  }, [filters]);

  const useMockData = (currentFilters) => {
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
  };

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
    </div>
  );
};

export default Dashboard;
