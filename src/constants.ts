/** Spectral palette — ordered by physical wavelength (violet → red). */
export const SPECTRAL_PALETTE = {
  semiotic:     { hex: '#8B5CF6', rgb: [139, 92, 246] },  // violet
  narrative:    { hex: '#6366F1', rgb: [99, 102, 241] },   // indigo
  temporal:     { hex: '#3B82F6', rgb: [59, 130, 246] },   // blue
  ideological:  { hex: '#14B8A6', rgb: [20, 184, 166] },   // teal
  economic:     { hex: '#22C55E', rgb: [34, 197, 94] },    // green
  experiential: { hex: '#F59E0B', rgb: [245, 158, 11] },   // amber
  cultural:     { hex: '#F97316', rgb: [249, 115, 22] },   // orange
  social:       { hex: '#EF4444', rgb: [239, 68, 68] },    // red
} as const;

/**
 * Normalized RGB values [0-1] for CPU-side composite color computation.
 * Each signal's apparent color = additive blend of these 8 colors × intensities.
 * Order matches DIMENSION_NAMES (spectral wavelength: violet → red).
 */
export const SPECTRAL_RGB: readonly [number, number, number][] = [
  [0.545, 0.361, 0.965], // semiotic (violet)
  [0.388, 0.400, 0.945], // narrative (indigo)
  [0.231, 0.510, 0.965], // temporal (blue)
  [0.078, 0.722, 0.651], // ideological (teal)
  [0.133, 0.773, 0.369], // economic (green)
  [0.961, 0.620, 0.043], // experiential (amber)
  [0.976, 0.451, 0.086], // cultural (orange)
  [0.937, 0.267, 0.267], // social (red)
];

/** Dimension names — ordered by physical wavelength (violet → red). */
export const DIMENSION_NAMES = [
  'semiotic',
  'narrative',
  'temporal',
  'ideological',
  'economic',
  'experiential',
  'cultural',
  'social',
] as const;

export type DimensionName = typeof DIMENSION_NAMES[number];

export const PARTICLE_COUNT = 600;
export const PARTICLE_COUNT_MOBILE = 300;

export const FIELD_RADIUS = 8;

/** Seed for deterministic particle placement. */
export const PRNG_SEED = 42;

/** Scroll thresholds for 3-phase animation. */
export const SCROLL_PHASES = {
  fieldEnd: 0.08,
  rotationEnd: 0.30,
} as const;

/** Camera positions for the scroll sequence. */
export const CAMERA_STATES = {
  initial: {
    azimuth: 0,
    elevation: 15,
    distance: 20,
  },
  secondObserver: {
    azimuth: 120,
    elevation: -10,
    distance: 20,
  },
  zoomIn: {
    azimuth: 135,
    elevation: 25,
    distance: 10,
  },
} as const;
