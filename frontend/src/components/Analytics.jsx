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
  Legend,
} from 'recharts';
import { useTheme } from '../theme/ThemeProvider';
import Section from './Section';

const SEVERITY_COLORS = {
  CRITICAL: '#D62839',
  HIGH: '#E8720C',
  MODERATE: '#C79000',
  LOW: '#2563EB',
};

const formatChartLabel = (value) => {
  const text = String(value).replaceAll('_', ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const Analytics = ({ reports = [] }) => {
  const { theme } = useTheme();
  const axis = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const tooltipBg = theme === 'dark' ? '#111111' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#262626' : '#e5e7eb';
  const tooltipColor = theme === 'dark' ? '#fafafa' : '#0a0a0a';
  const barFill = theme === 'dark' ? '#fafafa' : '#0a0a0a';

  const eventTypeCounts = reports.reduce((acc, curr) => {
    const type = curr.eventType || 'OTHER';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const eventTypeData = Object.keys(eventTypeCounts).map((key) => ({
    name: formatChartLabel(key),
    count: eventTypeCounts[key],
  }));

  const severityCounts = reports.reduce((acc, curr) => {
    const sev = curr.severity || 'LOW';
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, {});

  const severityOrder = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];
  const severityData = severityOrder
    .filter((sev) => severityCounts[sev])
    .map((sev) => ({
      name: formatChartLabel(sev),
      value: severityCounts[sev],
      color: SEVERITY_COLORS[sev] || '#6b7280',
    }));

  const hasData = reports.length > 0;

  return (
    <Section title="Analytics" meta={`${reports.length} reports`}>
      {!hasData ? (
        <p className="font-mono text-xs text-mute">
          No report metrics available for the selected criteria
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-4 font-mono text-[11px] text-mute">
              Volume by Event Type
            </h3>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={eventTypeData} margin={{ top: 10, right: 8, left: -20, bottom: 28 }}>
                  <XAxis
                    dataKey="name"
                    stroke={axis}
                    fontSize={11}
                    fontFamily="JetBrains Mono, monospace"
                    tickLine={false}
                    axisLine={{ stroke: tooltipBorder }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke={axis}
                    fontSize={11}
                    fontFamily="JetBrains Mono, monospace"
                    allowDecimals={false}
                    axisLine={{ stroke: tooltipBorder }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '2px',
                      color: tooltipColor,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" fill={barFill} radius={[0, 0, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-mono text-[11px] text-mute">
              Severity Distribution
            </h3>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: tooltipBg,
                      borderColor: tooltipBorder,
                      borderRadius: '2px',
                      color: tooltipColor,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span style={{ color: axis, fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </Section>
  );
};

export default Analytics;
