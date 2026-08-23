import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react';

const SEVERITY_COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MODERATE: '#eab308',
  LOW: '#06b6d4',
};

const EVENT_COLOR = '#38bdf8';

export const Analytics = ({ reports = [] }) => {
  // Aggregate data for Event Type chart
  const eventTypeCounts = reports.reduce((acc, curr) => {
    const type = curr.eventType || 'OTHER';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const eventTypeData = Object.keys(eventTypeCounts).map((key) => ({
    name: key.replace('_', ' '),
    count: eventTypeCounts[key],
  }));

  // Aggregate data for Severity chart
  const severityCounts = reports.reduce((acc, curr) => {
    const sev = curr.severity || 'LOW';
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, {});

  const severityOrder = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
  const severityData = severityOrder
    .filter((sev) => severityCounts[sev])
    .map((sev) => ({
      name: sev,
      value: severityCounts[sev],
      color: SEVERITY_COLORS[sev] || '#64748b',
    }));

  const hasData = reports.length > 0;

  return (
    <div className="analytics-section">
      <div className="section-title-group">
        <BarChart3 className="text-cyan" size={20} />
        <h2 className="section-title">Weather Intelligence Analytics</h2>
      </div>

      {!hasData ? (
        <div className="analytics-empty-card">
          <p>No report metrics available to analyze for the selected criteria.</p>
        </div>
      ) : (
        <div className="analytics-grid">
          {/* Chart 1: Reports by Event Type */}
          <div className="chart-card">
            <div className="chart-header">
              <BarChart3 size={16} className="text-cyan" />
              <h3>Incident Volume by Event Type</h3>
            </div>
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={eventTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <Bar dataKey="count" fill={EVENT_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Reports by Severity */}
          <div className="chart-card">
            <div className="chart-header">
              <PieChartIcon size={16} className="text-amber" />
              <h3>Severity Distribution</h3>
            </div>
            <div className="chart-body">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: '12px' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
