import { useMemo } from 'react';
import { GROUP_VALUES, GROUP_LABEL, GROUPING_ENABLED } from '../../lib/constants';
import { INITIAL_FILTERS, type ListFilterValues } from './listFilterDefaults';
import Dropdown from '../ui/Dropdown';

interface ListFiltersProps {
  filters: ListFilterValues;
  onChange: (filters: ListFilterValues) => void;
  cities: string[];
  countries: string[];
}

export default function ListFilters({ filters, onChange, cities, countries }: ListFiltersProps) {
  const update = (patch: Partial<ListFilterValues>) => {
    onChange({ ...filters, ...patch });
  };

  const allGroupsLabel = `All ${GROUP_LABEL}s`;
  const groupOptions = useMemo(
    () => [
      { value: '', label: allGroupsLabel },
      ...GROUP_VALUES.map((v) => ({ value: v, label: `${GROUP_LABEL} ${v}` })),
    ],
    [allGroupsLabel],
  );

  const cityOptions = useMemo(
    () => [{ value: '', label: 'All Cities' }, ...cities.map((c) => ({ value: c, label: c }))],
    [cities],
  );

  const countryOptions = useMemo(
    () => [
      { value: '', label: 'All Countries' },
      ...countries.map((c) => ({ value: c, label: c })),
    ],
    [countries],
  );

  const hasActiveFilters =
    filters.search !== '' ||
    filters.group !== '' ||
    filters.city !== '' ||
    filters.country !== '';

  const gridClass = GROUPING_ENABLED
    ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5'
    : 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className={gridClass}>
        {/* Search by name */}
        <div className="lg:col-span-2">
          <label htmlFor="list-search" className="sr-only">
            Search by name
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              id="list-search"
              type="text"
              placeholder="Search by name..."
              value={filters.search}
              onChange={(e) => update({ search: e.target.value })}
              className={
                'w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm ' +
                'text-gray-700 shadow-sm transition-colors placeholder:text-gray-400 ' +
                "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 font-['DM_Sans',sans-serif]"
              }
            />
          </div>
        </div>

        {GROUPING_ENABLED && (
          <Dropdown
            value={filters.group}
            onChange={(v) => update({ group: v })}
            options={groupOptions}
            placeholder={allGroupsLabel}
            ariaLabel={`Filter by ${GROUP_LABEL.toLowerCase()}`}
          />
        )}

        <Dropdown
          value={filters.city}
          onChange={(v) => update({ city: v })}
          options={cityOptions}
          placeholder="All Cities"
          ariaLabel="Filter by city"
        />

        <Dropdown
          value={filters.country}
          onChange={(v) => update({ country: v })}
          options={countryOptions}
          placeholder="All Countries"
          ariaLabel="Filter by country"
        />
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => onChange(INITIAL_FILTERS)}
            className="text-xs font-medium text-primary transition-colors hover:text-primary/70"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
