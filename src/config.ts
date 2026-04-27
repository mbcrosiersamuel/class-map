// ============================================================================
// CLASS MAP CONFIG — edit this file to brand the app for your school/class.
// Everything else (colors, copy, sections) flows from here.
// ============================================================================

export interface ClassMapConfig {
  // -- Identity ----------------------------------------------------------------
  /** Shown in the header, tab title, and social meta tags. */
  schoolName: string;
  /** Shown alongside the school name (e.g. "2030"). Leave empty to omit. */
  classYear: string;
  /** Shown in the header subtitle and meta description. */
  tagline: string;
  /** Shown in the page <title>. Falls back to "{schoolName} {classYear}". */
  siteTitle?: string;
  /** Shown under the header, e.g. school motto or instruction. */
  subtitle: string;
  /** Small attribution shown in the header. Set href to your own repo. */
  credit: { text: string; href: string };

  // -- Theme -------------------------------------------------------------------
  /** Primary brand color (hex). Used for buttons, pins, accents. */
  primaryColor: string;
  /** Page/background color (hex). */
  backgroundColor: string;
  /** Optional logo to render alongside the school name. null = text only. */
  logoSrc: string | null;

  // -- Map ---------------------------------------------------------------------
  /** Initial map center. */
  defaultCenter: { latitude: number; longitude: number };
  /** Initial zoom level (0 = whole globe, ~14 = street level). */
  defaultZoom: number;

  // -- Grouping (sections / teams / cohorts) -----------------------------------
  grouping: {
    /** When false, all grouping UI is hidden and entries save with no group. */
    enabled: boolean;
    /** Singular noun shown in the UI: "Section", "Team", "Cohort", "House". */
    label: string;
    /** Allowed values, e.g. ["A","B","C"] or ["Red","Blue","Green"]. */
    values: string[];
  };

  // -- "Island of Uncertainty" (a fictional pin for "I don't know yet") --------
  uncertainty: {
    /** When false, the "I don't know yet" checkbox and pin are hidden. */
    enabled: boolean;
    /** City name shown on the marker and card. */
    label: string;
    /** Country name shown on the card. */
    country: string;
    /** [latitude, longitude] for the fictional pin. */
    coords: { latitude: number; longitude: number };
  };
}

export const config: ClassMapConfig = {
  // -- Identity --
  schoolName: 'Example University',
  classYear: '2030',
  tagline: 'Class Map',
  subtitle: 'Where are you headed?',
  credit: {
    text: 'Powered by class-map',
    href: 'https://github.com/mbcrosiersamuel/class-map',
  },

  // -- Theme --
  primaryColor: '#A51C30',
  backgroundColor: '#FAF9F6',
  logoSrc: null,

  // -- Map --
  defaultCenter: { latitude: 42.37, longitude: -71.11 },
  defaultZoom: 2,

  // -- Grouping --
  grouping: {
    enabled: true,
    label: 'Section',
    values: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
  },

  // -- Island of Uncertainty --
  uncertainty: {
    enabled: true,
    label: 'Island of Uncertainty',
    country: 'Pacific Ocean',
    coords: { latitude: 5.0, longitude: -170.0 },
  },
};
