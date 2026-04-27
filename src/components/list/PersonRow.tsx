import type { Person } from '../../types';
import {
  GROUPING_ENABLED,
  UNCERTAINTY_ENABLED,
  UNCERTAINTY_LOCATION,
} from '../../lib/constants';

interface PersonRowProps {
  person: Person;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function formatOne(city: string, country: string): string {
  if (!city && !country) return 'Unknown';
  if (!city) return country;
  if (!country) return city;
  if (city === country) return city;
  return `${city}, ${country}`;
}

export default function PersonRow({ person }: PersonRowProps) {
  const isUncertain =
    UNCERTAINTY_ENABLED && person.locations[0]?.city === UNCERTAINTY_LOCATION.city;
  const label =
    person.locations.length === 0
      ? 'Unknown'
      : person.locations.map((l) => formatOne(l.city, l.country)).join(' · ');
  const showGroup = GROUPING_ENABLED && person.group_value;

  return (
    <div
      className={
        'flex items-center gap-4 border-b border-gray-100 px-4 py-3 transition-colors ' +
        'hover:bg-surface last:border-b-0'
      }
    >
      <div className="flex-shrink-0 relative">
        {person.photo_url ? (
          <img
            src={person.photo_url}
            alt={person.name}
            className="h-10 w-10 rounded-full border border-gray-200 object-cover"
            loading="lazy"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {getInitials(person.name)}
          </div>
        )}
        {isUncertain && (
          <>
            <span className="absolute -top-1 -left-1 text-xs">🌺</span>
            <span className="absolute -top-1 -right-1 text-xs">🌸</span>
          </>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900 font-['DM_Sans',sans-serif]">
          {person.name}
        </p>
        <p className="truncate text-xs text-gray-500 font-['DM_Sans',sans-serif]">
          {label}
        </p>
      </div>

      {showGroup && (
        <span
          className="inline-flex flex-shrink-0 items-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white font-['DM_Sans',sans-serif]"
        >
          {person.group_value}
        </span>
      )}
    </div>
  );
}
