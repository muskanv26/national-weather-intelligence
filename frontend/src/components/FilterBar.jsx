import React from 'react';
import { Search } from 'lucide-react';

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
      <div className="flex flex-wrap items-center justify-end gap-1 rounded-lg border border-hair bg-hover p-1">
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
