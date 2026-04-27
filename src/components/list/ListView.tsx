import { useMemo, useState, useRef, useCallback } from 'react';
import type { Person } from '../../types';
import ListFilters from './ListFilters';
import { INITIAL_FILTERS, type ListFilterValues } from './listFilterDefaults';
import PersonRow from './PersonRow';

interface ListViewProps {
  people: Person[];
  loading: boolean;
}

export default function ListView({ people, loading }: ListViewProps) {
  const [filters, setFilters] = useState<ListFilterValues>(INITIAL_FILTERS);

  // Derive sorted unique cities and countries across all locations for the filter dropdowns.
  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const p of people) for (const l of p.locations) if (l.city) set.add(l.city);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [people]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    for (const p of people) for (const l of p.locations) if (l.country) set.add(l.country);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [people]);

  // Apply filters. A person matches city/country if ANY of their locations match.
  const filtered = useMemo(() => {
    const searchLower = filters.search.toLowerCase().trim();

    return people.filter((p) => {
      if (searchLower && !p.name.toLowerCase().includes(searchLower)) return false;
      if (filters.group && p.group_value !== filters.group) return false;
      if (filters.city && !p.locations.some((l) => l.city === filters.city)) return false;
      if (filters.country && !p.locations.some((l) => l.country === filters.country)) return false;
      return true;
    });
  }, [people, filters]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4">
      {/* Filters */}
      <ListFilters
        filters={filters}
        onChange={setFilters}
        cities={cities}
        countries={countries}
      />

      {/* Results header */}
      {!loading && (
        <p className="text-sm text-gray-500 font-['DM_Sans',sans-serif]">
          {filtered.length === people.length
            ? `${people.length} classmate${people.length === 1 ? '' : 's'}`
            : `${filtered.length} of ${people.length} classmate${people.length === 1 ? '' : 's'}`}
        </p>
      )}

      {/* Content area */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          /* Loading skeleton */
          <div className="divide-y divide-gray-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 animate-pulse">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3.5 w-36 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-100" />
                </div>
                <div className="h-5 w-8 flex-shrink-0 rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <svg
              className="mb-4 h-12 w-12 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-900 font-['DM_Sans',sans-serif]">
              No classmates found
            </p>
            <p className="mt-1 text-xs text-gray-500 font-['DM_Sans',sans-serif]">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          /* Person list — render in batches for scale */
          <VirtualizedList people={filtered} />
        )}
      </div>
    </div>
  );
}

const BATCH_SIZE = 50;

function VirtualizedList({ people }: { people: Person[] }) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [prevPeople, setPrevPeople] = useState(people);
  const observerRef = useRef<HTMLDivElement>(null);

  // Reset visible count when the underlying list changes (e.g. new filter).
  // This is React's documented "setState during render" pattern for prop-derived state.
  if (prevPeople !== people) {
    setPrevPeople(people);
    setVisibleCount(BATCH_SIZE);
  }

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, people.length));
  }, [people.length]);

  const visible = people.slice(0, visibleCount);
  const hasMore = visibleCount < people.length;

  return (
    <div>
      {visible.map((person) => (
        <PersonRow key={person.id} person={person} />
      ))}
      {hasMore && (
        <div
          ref={observerRef}
          className="flex items-center justify-center py-3"
        >
          <button
            onClick={handleLoadMore}
            className="text-xs font-medium text-primary hover:text-primary/70 transition-colors font-sans"
          >
            Show more ({people.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
