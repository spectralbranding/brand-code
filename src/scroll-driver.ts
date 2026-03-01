import { SCROLL_PHASES, CAMERA_STATES } from './constants';
import type { SpectralField } from './SpectralField';

interface CameraState {
  azimuth: number;
  elevation: number;
  distance: number;
}

/** Linearly interpolate between two values. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Map a value from [inMin, inMax] to [0, 1], clamped. */
function normalize(value: number, inMin: number, inMax: number): number {
  return Math.max(0, Math.min(1, (value - inMin) / (inMax - inMin)));
}

/** Smooth easing (ease-in-out). */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Interpolate between two camera states. */
function lerpCamera(a: CameraState, b: CameraState, t: number): CameraState {
  return {
    azimuth: lerp(a.azimuth, b.azimuth, t),
    elevation: lerp(a.elevation, b.elevation, t),
    distance: lerp(a.distance, b.distance, t),
  };
}

/**
 * Convert scroll progress (0-1) to camera state + decomposition progress.
 *
 * Phase 1 — Field (0–8%):  Composite-colored particles drift
 * Phase 2 — Rotation (8–30%):  Camera orbits to second observer
 * Phase 3 — Zoom + Decompose (30–100%):  Zoom in, each dot reveals its 8 spectral lines
 */
export function scrollToCamera(progress: number): { camera: CameraState; decomposeProgress: number } {
  const { fieldEnd, rotationEnd } = SCROLL_PHASES;

  // Phase 1: Static field
  if (progress <= fieldEnd) {
    return { camera: { ...CAMERA_STATES.initial }, decomposeProgress: 0 };
  }

  // Phase 2: Rotation to second observer
  if (progress <= rotationEnd) {
    const t = easeInOut(normalize(progress, fieldEnd, rotationEnd));
    return { camera: lerpCamera(CAMERA_STATES.initial, CAMERA_STATES.secondObserver, t), decomposeProgress: 0 };
  }

  // Phase 3: Zoom in + spectral decomposition
  const t = easeInOut(normalize(progress, rotationEnd, 1.0));
  return {
    camera: lerpCamera(CAMERA_STATES.secondObserver, CAMERA_STATES.zoomIn, t),
    decomposeProgress: t,
  };
}

/**
 * Connect a SpectralField instance to scroll events on a container element.
 * Returns a cleanup function.
 */
export function connectScrollDriver(
  field: SpectralField,
  _scrollContainer: HTMLElement,
): () => void {
  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const scrollTop = window.scrollY;
      const heroHeight = window.innerHeight * 3; // hero occupies 3 viewport heights
      const progress = Math.min(1, scrollTop / heroHeight);

      const { camera, decomposeProgress } = scrollToCamera(progress);
      field.setCameraState(camera.azimuth, camera.elevation, camera.distance);
      field.setDecomposeProgress(decomposeProgress);

      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', onScroll);
  };
}
