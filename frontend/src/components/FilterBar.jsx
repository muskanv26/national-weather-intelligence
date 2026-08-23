import React from 'react';
import { Filter, RotateCcw, Search } from 'lucide-react';

const EVENT_TYPES = [
  'RAIN',
  'FLOOD',
  'THUNDERSTORM',
  'HEATWAVE',
  'FOG',
  'DUST_STORM',
  'STRONG_WIND',
  'CYCLONE',
  'OTHER'
];

const SEVERITIES = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

export const FilterBar = ({ filters, onFilterChange, onReset, availableStates = [] }) => {
  return (
    <div className="filter-bar">
      <div className="filter-title">
        <Filter size={16} className="text-cyan" />
        <span>Filter Reports</span>
      </div>

      <div className="filter-inputs">
        {/* Event Type Filter */}
        <div className="filter-group">
          <label htmlFor="eventType-select">Event Type</label>
          <select
            id="eventType-select"
            value={filters.eventType || ''}
            onChange={(e) => onFilterChange('eventType', e.target.value)}
            className="filter-select"
          >
            <option value="">All Event Types</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Severity Filter */}
        <div className="filter-group">
          <label htmlFor="severity-select">Severity</label>
          <select
            id="severity-select"
            value={filters.severity || ''}
            onChange={(e) => onFilterChange('severity', e.target.value)}
            className="filter-select"
          >
            <option value="">All Severities</option>
            {SEVERITIES.map((sev) => (
              <option key={sev} value={sev}>
                {sev}
              </option>
            ))}
          </select>
        </div>

        {/* State Filter */}
        <div className="filter-group">
          <label htmlFor="state-input">State</label>
          <input
            id="state-input"
            type="text"
            placeholder="e.g. Haryana, Rajasthan..."
            value={filters.state || ''}
            onChange={(e) => onFilterChange('state', e.target.value)}
            className="filter-input"
            list="states-list"
          />
          {availableStates.length > 0 && (
            <datalist id="states-list">
              {availableStates.map((st) => (
                <option key={st} value={st} />
              ))}
            </datalist>
          )}
        </div>

        {/* City Filter */}
        <div className="filter-group">
          <label htmlFor="city-input">City</label>
          <div className="input-with-icon">
            <input
              id="city-input"
              type="text"
              placeholder="e.g. Gurugram, Jaipur..."
              value={filters.city || ''}
              onChange={(e) => onFilterChange('city', e.target.value)}
              className="filter-input"
            />
          </div>
        </div>

        {/* Reset Button */}
        <div className="filter-group reset-group">
          <label className="invisible-label">Actions</label>
          <button
            type="button"
            onClick={onReset}
            className="btn-reset"
            title="Reset all filters"
          >
            <RotateCcw size={14} />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
