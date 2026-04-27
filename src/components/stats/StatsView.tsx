import { useMemo, useState } from 'react';
import type { Person, GroupValue } from '../../types';
import {
  GROUP_VALUES,
  GROUP_LABEL,
  GROUPING_ENABLED,
  PRIMARY_COLOR,
  UNCERTAINTY_ENABLED,
  UNCERTAINTY_LOCATION,
} from '../../lib/constants';
import Dropdown from '../ui/Dropdown';

interface StatsViewProps {
  people: Person[];
}

interface BarItem {
  key: string;
  label: string;
  count: number;
}

export default function StatsView({ people }: StatsViewProps) {
  const [cityGroupFilter, setCityGroupFilter] = useState<GroupValue | ''>('');

  const cityStats = useMemo<BarItem[]>(() => {
    const groups = new Map<string, BarItem>();
    for (const p of people) {
      if (cityGroupFilter !== '' && p.group_value !== cityGroupFilter) continue;
      for (const loc of p.locations) {
        const key = `${loc.city.toLowerCase()}|${loc.country.toLowerCase()}`;
        const label =
          loc.country && loc.country !== loc.city ? `${loc.city}, ${loc.country}` : loc.city;
        const existing = groups.get(key);
        if (existing) existing.count += 1;
        else groups.set(key, { key, label, count: 1 });
      }
    }
    return Array.from(groups.values()).sort((a, b) => b.count - a.count);
  }, [people, cityGroupFilter]);

  const allGroupsLabel = `All ${GROUP_LABEL}s`;
  const groupOptions = useMemo(
    () => [
      { value: '', label: allGroupsLabel },
      ...GROUP_VALUES.map((v) => ({ value: v, label: `${GROUP_LABEL} ${v}` })),
    ],
    [allGroupsLabel],
  );

  const groupStats = useMemo<BarItem[]>(() => {
    if (!GROUPING_ENABLED) return [];
    const counts: Record<string, number> = Object.fromEntries(GROUP_VALUES.map((v) => [v, 0]));
    for (const p of people) {
      if (p.group_value && p.group_value in counts) counts[p.group_value] += 1;
    }
    return GROUP_VALUES.map((v) => ({
      key: v,
      label: `${GROUP_LABEL} ${v}`,
      count: counts[v],
    })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  }, [people]);

  const [expanded, setExpanded] = useState(false);
  const visibleCities = expanded ? cityStats : cityStats.slice(0, 10);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h2 className="font-display text-2xl text-gray-900 mb-1">Stats</h2>
        <p className="text-gray-500 font-sans text-sm">
          {people.length} {people.length === 1 ? 'person' : 'people'} on the map.
        </p>
      </div>

      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-display text-lg text-gray-900">Most Popular Cities</h3>
          {GROUPING_ENABLED && (
            <div className="w-40 flex-shrink-0">
              <Dropdown
                value={cityGroupFilter}
                onChange={(v) => {
                  setCityGroupFilter(v);
                  setExpanded(false);
                }}
                options={groupOptions}
                placeholder={allGroupsLabel}
                menuAlign="right"
                ariaLabel={`Filter cities by ${GROUP_LABEL.toLowerCase()}`}
              />
            </div>
          )}
        </div>
        {cityStats.length === 0 ? (
          <p className="text-sm text-gray-400 font-sans">
            {cityGroupFilter === ''
              ? 'No cities yet.'
              : `No cities for ${GROUP_LABEL} ${cityGroupFilter} yet.`}
          </p>
        ) : (
          <>
            <StackedBarChart items={visibleCities} />
            {cityStats.length > 10 && (
              <button
                type="button"
                onClick={() => setExpanded((e) => !e)}
                className="mt-4 text-sm font-sans font-medium hover:underline"
                style={{ color: PRIMARY_COLOR }}
              >
                {expanded ? 'Show top 10' : `Show all ${cityStats.length}`}
              </button>
            )}
          </>
        )}
      </section>

      {GROUPING_ENABLED && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <h3 className="font-display text-lg text-gray-900 mb-4">{GROUP_LABEL} Participation</h3>
          <StackedBarChart items={groupStats} />
        </section>
      )}
    </div>
  );
}

function StackedBarChart({ items }: { items: BarItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const pct = (item.count / max) * 100;
        return (
          <li key={item.key} className="font-sans">
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-sm text-gray-700 truncate" title={item.label}>
                {UNCERTAINTY_ENABLED && item.label.startsWith(UNCERTAINTY_LOCATION.city) && (
                  <span className="mr-1" aria-hidden>
                    🌺🌸🌼
                  </span>
                )}
                {item.label}
              </span>
              <span className="text-sm font-medium text-gray-600 tabular-nums flex-shrink-0">
                {item.count}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-300 ease-out"
                style={{
                  width: `${pct}%`,
                  backgroundColor: PRIMARY_COLOR,
                  minWidth: item.count > 0 ? '2px' : '0',
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
