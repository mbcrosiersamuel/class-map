import type { Location } from '../types';

/** "City, State, Country", omitting empty parts. Used in form previews. */
export function formatLocationFull(loc: Location | null): string {
  if (!loc) return '';
  return [loc.city, loc.state, loc.country].filter(Boolean).join(', ');
}

/** "City, Country", collapsing duplicates (e.g. "Singapore, Singapore" → "Singapore"). */
export function formatCityCountry(city: string, country: string): string {
  if (!city && !country) return 'Unknown';
  if (!city) return country;
  if (!country) return city;
  if (city === country) return city;
  return `${city}, ${country}`;
}

/** Stable key for grouping people by city. Lowercased so casing variants collapse. */
export function getCityCountryKey(city: string, country: string): string {
  return `${city.toLowerCase()}|${country.toLowerCase()}`;
}

/** True when two locations refer to the same city. */
export function sameCity(a: Location, b: Location): boolean {
  return (
    a.city.toLowerCase() === b.city.toLowerCase() &&
    a.country.toLowerCase() === b.country.toLowerCase()
  );
}

/** "AB" from "Alice Bobson"; "A" from "Alice"; "?" from "". */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
