/**
 * A grouping value (e.g. section, team, cohort). Configurable in `src/config.ts`.
 * Stored as text in the DB; null when grouping is disabled.
 */
export type GroupValue = string;

export interface Location {
  city: string;
  state: string | null;
  country: string;
  zip: string | null;
  latitude: number;
  longitude: number;
}

export interface Person {
  id: string;
  name: string;
  group_value: GroupValue | null;
  locations: Location[];
  photo_url: string | null;
  created_at: string;
}

export interface CityCluster {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  people: Person[];
}

export type TabView = 'map' | 'submit' | 'list' | 'stats';
