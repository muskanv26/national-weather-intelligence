import React from 'react';
import { AlertTriangle, Check, FileText, Globe } from 'lucide-react';

const isVerified = (report) => {
  const status = report?.verificationStatus;
  return (
    report?.source === 'GOVERNMENT' ||
    report?.source === 'WEATHER_API' ||
    status === 'VERIFIED'
  );
};

const dayKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const countOnDay = (reports, key) =>
  reports.filter((report) => dayKey(report.reportedAt || report.createdAt) === key).length;

const dayOverDaySubstat = (reports) => {
  const now = new Date();
  const todayKey = dayKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dayKey(yesterday);

  const todayCount = countOnDay(reports, todayKey);
  const yesterdayCount = countOnDay(reports, yesterdayKey);

  if (todayCount === 0 && yesterdayCount === 0) {
    return 'Active feeds';
  }

  const delta = todayCount - yesterdayCount;
  if (delta === 0) return 'No change from yesterday';
  const signed = delta > 0 ? `+${delta}` : `${delta}`;
  return `${signed} from yesterday`;
};

const formatRate = (part, whole) => {
  if (!whole) return '0.0%';
  return `${((part / whole) * 100).toFixed(1)}%`;
};

const formatShare = (part, whole) => {
  if (!whole) return null;
  return `${Math.round((part / whole) * 100)}% of total`;
};

const MetricCard = ({ label, value, accentClass }) => (
  <article className="pointer-events-auto rounded-xl border border-hair bg-white/95 backdrop-blur-md px-4 py-3 shadow-xl flex items-center gap-4 whitespace-nowrap">
    <span className={`font-mono text-xs font-semibold ${accentClass}`}>{label}</span>
    <span className="font-mono text-2xl leading-none tracking-tight text-ink tabular-nums">
      {value}
    </span>
  </article>
);

export const KpiCards = ({ reports = [] }) => {
  const totalReports = reports.length;

  const verifiedCount = reports.filter(isVerified).length;

  const criticalCount = reports.filter(
    (r) => r.severity === 'HIGH' || r.severity === 'CRITICAL'
  ).length;

  const uniqueStatesCount = new Set(reports.map((r) => r.state).filter(Boolean)).size;

  const criticalShare = formatShare(criticalCount, totalReports);
  const criticalSubstat =
    criticalShare ?? (criticalCount > 0 ? 'High priority' : '0% of total');

  const cards = [
    {
      key: 'active',
      icon: FileText,
      label: 'Active',
      value: totalReports,
      substat: dayOverDaySubstat(reports),
      accentClass: 'text-[#2563EB]',
    },
    {
      key: 'verified',
      icon: Check,
      label: 'Verified',
      value: verifiedCount,
      substat: `${formatRate(verifiedCount, totalReports)} verification rate`,
      accentClass: 'text-[#16a34a]',
    },
    {
      key: 'critical',
      icon: AlertTriangle,
      label: 'Critical',
      value: criticalCount,
      substat: criticalSubstat,
      accentClass: 'text-[#D62839]',
    },
  ];

  return (
    <div className="flex flex-row gap-4 flex-nowrap">
      {cards.map((card) => (
        <MetricCard
          key={card.key}
          label={card.label}
          value={card.value}
          accentClass={card.accentClass}
        />
      ))}
    </div>
  );
};

export default KpiCards;
