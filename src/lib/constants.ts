// Constants are derived from src/config.ts. To rebrand the app, edit config.ts,
// not this file.

import { config } from '../config';
import type { GroupValue } from '../types';

export const GROUP_VALUES: GroupValue[] = config.grouping.values;
export const GROUP_LABEL: string = config.grouping.label;
export const GROUPING_ENABLED: boolean = config.grouping.enabled;

export const PRIMARY_COLOR: string = config.primaryColor;
export const BACKGROUND_COLOR: string = config.backgroundColor;

export const DEFAULT_CENTER = config.defaultCenter;
export const DEFAULT_ZOOM = config.defaultZoom;

// Optional fictional pin for "I don't know yet" submissions.
export const UNCERTAINTY_ENABLED: boolean = config.uncertainty.enabled;
export const UNCERTAINTY_LOCATION = {
  city: config.uncertainty.label,
  state: null as string | null,
  country: config.uncertainty.country,
  latitude: config.uncertainty.coords.latitude,
  longitude: config.uncertainty.coords.longitude,
};
