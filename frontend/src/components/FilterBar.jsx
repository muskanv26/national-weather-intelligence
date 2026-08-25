import React from 'react';
import { Search } from 'lucide-react';

const EVENT_TYPES = [
  'RAIN',
  'FLOOD',
  'THUNDERSTORM',
  'HEATWAVE',
  'FOG',
  'DUST_STORM',
  'STRONG_WIND',
  'CYCLONE',
  'OTHER',
];

const SEVERITIES = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

const formatLabel = (value) => {
  const text = value.replaceAll('_', ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const controlClass =
  'h-9 min-w-[8.5rem] flex-1 border-0 bg-transparent px-3 font-mono text-xs text-ink outline-none md:flex-none';

export const FilterBar = ({
  filters,
  search,
  onSearchChange,
  onFilterChange,
  onReset,
  availableStates = [],
  visibleCount = 0,
  totalCount = 0,
  notice = null,
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-hair bg-hover p-1">
        <label className="flex min-w-[14rem] flex-1 items-center gap-2 px-2">
          <Search size={14} className="shrink-0 text-mute" />
          <input
            id="report-search"
            type="search"
            placeholder="Search title, location, description…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full border-0 bg-transparent font-mono text-xs text-ink outline-none placeholder:text-mute"
          />
        </label>

        <select
          id="eventType-select"
          aria-label="Event type"
          value={filters.eventType || ''}
          onChange={(e) => onFilterChange('eventType', e.target.value)}
          className={`${controlClass} md:border-l md:border-hair`}
        >
          <option value="">All events</option>
          {EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {formatLabel(type)}
            </option>
          ))}
        </select>

        <select
          id="severity-select"
          aria-label="Severity"
          value={filters.severity || ''}
          onChange={(e) => onFilterChange('severity', e.target.value)}
          className={`${controlClass} md:border-l md:border-hair`}
        >
          <option value="">All severities</option>
          {SEVERITIES.map((sev) => (
            <option key={sev} value={sev}>
              {formatLabel(sev)}
            </option>
          ))}
        </select>

        <input
          id="state-input"
          type="text"
          aria-label="State"
          placeholder="State"
          value={filters.state || ''}
          onChange={(e) => onFilterChange('state', e.target.value)}
          className={`${controlClass} md:border-l md:border-hair`}
          list="states-list"
        />
        {availableStates.length > 0 && (
          <datalist id="states-list">
            {availableStates.map((st) => (
              <option key={st} value={st} />
            ))}
          </datalist>
        )}

        <input
          id="city-input"
          type="text"
          aria-label="City"
          placeholder="City"
          value={filters.city || ''}
          onChange={(e) => onFilterChange('city', e.target.value)}
          className={`${controlClass} md:border-l md:border-hair`}
        />

        <button
          type="button"
          onClick={onReset}
          className="ml-auto h-9 shrink-0 px-3 font-mono text-xs text-mute hover:text-ink"
        >
          Reset →
        </button>
      </div>

      <p className="font-mono text-[11px] text-mute">
        {visibleCount} of {totalCount} reports visible
      </p>

      {notice && (
        <p className="font-mono text-[11px] text-mute">
          <span className="text-critical">[notice]</span> {notice}
        </p>
      )}
    </div>
  );
};

export default FilterBar;
