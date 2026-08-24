import React from 'react';
import { AlertOctagon, FileText, CheckCircle2, MapPin } from 'lucide-react';

export const KpiCards = ({ reports = [] }) => {
  const totalReports = reports.length;
  
  const highRiskCount = reports.filter(
    (r) => r.severity === 'HIGH' || r.severity === 'CRITICAL'
  ).length;

  const verifiedCount = reports.filter(
    (r) => r.source === 'GOVERNMENT' || r.source === 'WEATHER_API'
  ).length;

  const uniqueStatesCount = new Set(
    reports.map((r) => r.state).filter(Boolean)
  ).size;

  const kpis = [
    {
      id: 'total',
      label: 'Total Reports',
      value: totalReports,
      icon: FileText,
      color: 'cyan',
      badge: 'Active Feeds'
    },
    {
      id: 'high-risk',
      label: 'High & Critical Risk',
      value: highRiskCount,
      icon: AlertOctagon,
      color: 'red',
      badge: highRiskCount > 0 ? `${Math.round((highRiskCount / (totalReports || 1)) * 100)}% of Total` : 'Clear'
    },
    {
      id: 'verified',
      label: 'Verified Reports',
      value: verifiedCount,
      icon: CheckCircle2,
      color: 'emerald',
      badge: 'Official / Sensor'
    },
    {
      id: 'states',
      label: 'States Covered',
      value: uniqueStatesCount,
      icon: MapPin,
      color: 'purple',
      badge: 'Geographic Scope'
    }
  ];

  return (
    <div className="kpi-grid">
      {kpis.map((kpi) => {
        return (
          <div key={kpi.id} className={`kpi-card kpi-card-${kpi.color}`}>
            <div className="kpi-header">
              <span className="kpi-label">{kpi.label}</span>
            </div>
            <div className="kpi-body">
              <span className="kpi-value">{kpi.value}</span>
              <span className="kpi-badge">{kpi.badge}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiCards;
