import * as THREE from 'three';
import {
  SPECTRAL_RGB,
  PARTICLE_COUNT,
  PARTICLE_COUNT_MOBILE,
  FIELD_RADIUS,
  PRNG_SEED,
} from './constants';

// --- Seeded PRNG (mulberry32) ---
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Vertex shader ---
// Each particle carries its composite color (aColor) plus the full
// 8-dimensional intensity profile (aIntensityLow, aIntensityHigh)
// for spectral decomposition in the fragment shader.
const vertexShader = `
attribute float aSize;
attribute float aBrightness;
attribute vec3 aColor;
attribute vec4 aIntensityLow;
attribute vec4 aIntensityHigh;

varying vec3 vColor;
varying float vBrightness;
varying vec4 vIntensityLow;
varying vec4 vIntensityHigh;

uniform float uDecompose;

void main() {
  vColor = aColor;
  vBrightness = aBrightness;
  vIntensityLow = aIntensityLow;
  vIntensityHigh = aIntensityHigh;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  // Grow point sprites during decomposition so spectral lines are visible
  float sizeScale = 1.0 + uDecompose * 1.5;
  gl_PointSize = aSize * sizeScale * (300.0 / -mvPosition.z);
  gl_PointSize = clamp(gl_PointSize, 1.0, 128.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

// --- Fragment shader ---
// At uDecompose=0: renders as a soft composite-colored glow (the signal).
// At uDecompose=1: renders as 8 vertical spectral lines (the decomposition).
// Transition is a linear blend driven by scroll.
const fragmentShader = `
varying vec3 vColor;
varying float vBrightness;
varying vec4 vIntensityLow;
varying vec4 vIntensityHigh;

uniform float uDecompose;

// Spectral palette colors (normalized RGB), violet → red
vec3 spectralColor(int idx) {
  if (idx == 0) return vec3(0.545, 0.361, 0.965);
  if (idx == 1) return vec3(0.388, 0.400, 0.945);
  if (idx == 2) return vec3(0.231, 0.510, 0.965);
  if (idx == 3) return vec3(0.078, 0.722, 0.651);
  if (idx == 4) return vec3(0.133, 0.773, 0.369);
  if (idx == 5) return vec3(0.961, 0.620, 0.043);
  if (idx == 6) return vec3(0.976, 0.451, 0.086);
  return vec3(0.937, 0.267, 0.267);
}

// Get this particle's intensity for dimension idx
float spectralIntensity(int idx) {
  if (idx == 0) return vIntensityLow.x;
  if (idx == 1) return vIntensityLow.y;
  if (idx == 2) return vIntensityLow.z;
  if (idx == 3) return vIntensityLow.w;
  if (idx == 4) return vIntensityHigh.x;
  if (idx == 5) return vIntensityHigh.y;
  if (idx == 6) return vIntensityHigh.z;
  return vIntensityHigh.w;
}

void main() {
  vec2 uv = gl_PointCoord;

  // === Composite dot (uDecompose = 0) ===
  float d = length(uv - vec2(0.5));
  float glow = 1.0 - smoothstep(0.0, 0.5, d);
  float core = 1.0 - smoothstep(0.0, 0.15, d);
  vec3 dotColor = vColor * vBrightness;
  float dotAlpha = (glow * 0.5 + core * 0.5) * vBrightness;

  // === Spectral lines (uDecompose = 1) ===
  // 8 vertical lines, one per dimension, violet → red (left → right)
  // Matches "The Eight Lines" brand mark at micro scale
  float slotF = uv.x * 8.0;
  int slot = int(floor(clamp(slotF, 0.0, 7.0)));
  float slotCenter = (float(slot) + 0.5) / 8.0;
  float distFromLine = abs(uv.x - slotCenter);

  // Thin luminous line with soft halo
  float lineCore = 1.0 - smoothstep(0.0, 0.025, distFromLine);
  float lineHalo = (1.0 - smoothstep(0.0, 0.055, distFromLine)) * 0.35;
  float lineBrightness = lineCore + lineHalo;

  // Vertical fade at top/bottom edges
  float vertFade = smoothstep(0.0, 0.06, uv.y) * (1.0 - smoothstep(0.94, 1.0, uv.y));

  float intensity = spectralIntensity(slot);
  vec3 lineColor = spectralColor(slot);

  vec3 specColor = lineColor * intensity * lineBrightness * vertFade;
  float specAlpha = intensity * lineBrightness * vertFade;

  // === Blend composite ↔ decomposed ===
  vec3 finalColor = mix(dotColor, specColor, uDecompose);
  float finalAlpha = mix(dotAlpha, specAlpha, uDecompose);

  if (finalAlpha < 0.005) discard;

  gl_FragColor = vec4(finalColor, finalAlpha);
}
`;

export interface SpectralFieldOptions {
  canvas: HTMLCanvasElement;
  isMobile?: boolean;
}

export class SpectralField {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private particles: THREE.Points;
  private material: THREE.ShaderMaterial;
  private particleCount: number;
  private positions: Float32Array;
  private basePositions: Float32Array;
  private sizes: Float32Array;
  private brightnesses: Float32Array;
  private baseBrightnesses: Float32Array;
  private colors: Float32Array;
  private reducedMotion: boolean;
  private time = 0;
  private animationId: number | null = null;
  private isDisposed = false;

  // Camera spherical coordinates
  private azimuth = 0;
  private elevation = 15;
  private cameraDistance = 20;

  constructor(options: SpectralFieldOptions) {
    const { canvas, isMobile = false } = options;
    this.particleCount = isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.updateCameraPosition();

    // Generate particles with polychromatic spectral profiles
    const rand = mulberry32(PRNG_SEED);
    this.positions = new Float32Array(this.particleCount * 3);
    this.basePositions = new Float32Array(this.particleCount * 3);
    this.sizes = new Float32Array(this.particleCount);
    this.brightnesses = new Float32Array(this.particleCount);
    this.baseBrightnesses = new Float32Array(this.particleCount);
    this.colors = new Float32Array(this.particleCount * 3);

    // 8-dimensional intensity profiles for spectral decomposition
    const intensityLow = new Float32Array(this.particleCount * 4);  // semiotic..ideological
    const intensityHigh = new Float32Array(this.particleCount * 4); // economic..social

    for (let i = 0; i < this.particleCount; i++) {
      // Random position in sphere (cube root for uniform volume)
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = FIELD_RADIUS * Math.cbrt(rand());

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      this.positions[i * 3] = x;
      this.positions[i * 3 + 1] = y;
      this.positions[i * 3 + 2] = z;
      this.basePositions[i * 3] = x;
      this.basePositions[i * 3 + 1] = y;
      this.basePositions[i * 3 + 2] = z;

      // --- Spectral profile generation ---
      // Each signal emits across all 8 dimensions with varying intensities.
      // Some dimensions may be zero (structural absence / dark signals).
      const intensities = new Float32Array(8);

      // Determine signal character
      const roll = rand();
      let numDominant: number;
      let hasAbsence: boolean;
      if (roll < 0.35) {
        // 35%: one dominant dimension (near-pure spectral color)
        numDominant = 1;
        hasAbsence = rand() < 0.4;
      } else if (roll < 0.70) {
        // 35%: two dominant dimensions (rich two-color blend)
        numDominant = 2;
        hasAbsence = rand() < 0.3;
      } else if (roll < 0.90) {
        // 20%: three dominant (complex blend)
        numDominant = 3;
        hasAbsence = rand() < 0.2;
      } else {
        // 10%: broadband (4+ dominant, near-white — rare)
        numDominant = 4 + Math.floor(rand() * 3);
        hasAbsence = false;
      }

      // Base: low ambient intensity across all dimensions
      for (let d = 0; d < 8; d++) {
        intensities[d] = 0.03 + rand() * 0.10;
      }

      // Dominant dimensions: high intensity
      const usedDims = new Set<number>();
      for (let k = 0; k < numDominant; k++) {
        let dIdx: number;
        do { dIdx = Math.floor(rand() * 8); } while (usedDims.has(dIdx) && usedDims.size < 8);
        usedDims.add(dIdx);
        intensities[dIdx] = 0.5 + rand() * 0.5;
      }

      // Structural absence: zero out 1-3 dimensions (dark gaps in spectrograph)
      if (hasAbsence) {
        const numAbsent = 1 + Math.floor(rand() * 2);
        for (let k = 0; k < numAbsent; k++) {
          let dIdx: number;
          do { dIdx = Math.floor(rand() * 8); } while (usedDims.has(dIdx));
          intensities[dIdx] = 0.0;
        }
      }

      // Store intensity profile for shader
      intensityLow[i * 4] = intensities[0];     // semiotic
      intensityLow[i * 4 + 1] = intensities[1]; // narrative
      intensityLow[i * 4 + 2] = intensities[2]; // temporal
      intensityLow[i * 4 + 3] = intensities[3]; // ideological
      intensityHigh[i * 4] = intensities[4];     // economic
      intensityHigh[i * 4 + 1] = intensities[5]; // experiential
      intensityHigh[i * 4 + 2] = intensities[6]; // cultural
      intensityHigh[i * 4 + 3] = intensities[7]; // social

      // Compute composite color: additive blend of 8 spectral colors × intensities
      let cr = 0, cg = 0, cb = 0;
      for (let d = 0; d < 8; d++) {
        cr += SPECTRAL_RGB[d][0] * intensities[d];
        cg += SPECTRAL_RGB[d][1] * intensities[d];
        cb += SPECTRAL_RGB[d][2] * intensities[d];
      }
      // Normalize to preserve hue/saturation, max channel → 1.0
      const maxC = Math.max(cr, cg, cb, 0.001);
      this.colors[i * 3] = cr / maxC;
      this.colors[i * 3 + 1] = cg / maxC;
      this.colors[i * 3 + 2] = cb / maxC;

      // Size (signal reach): 0.5 to 2.0
      this.sizes[i] = 0.5 + rand() * 1.5;

      // Brightness (signal strength): 0.4 to 1.0
      this.brightnesses[i] = 0.4 + rand() * 0.6;
      this.baseBrightnesses[i] = this.brightnesses[i];
    }

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));
    geometry.setAttribute('aBrightness', new THREE.BufferAttribute(this.brightnesses, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3));
    geometry.setAttribute('aIntensityLow', new THREE.BufferAttribute(intensityLow, 4));
    geometry.setAttribute('aIntensityHigh', new THREE.BufferAttribute(intensityHigh, 4));

    // Material with decomposition uniform
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uDecompose: { value: 0.0 },
      },
    });

    this.particles = new THREE.Points(geometry, this.material);
    this.scene.add(this.particles);
  }

  /** Resize renderer to match container. */
  resize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /** Set spectral decomposition progress (0 = composite dots, 1 = spectral lines). */
  setDecomposeProgress(t: number): void {
    this.material.uniforms.uDecompose.value = Math.max(0, Math.min(1, t));
  }

  /** Set camera from spherical coordinates. */
  setCameraState(azimuth: number, elevation: number, distance: number): void {
    this.azimuth = azimuth;
    this.elevation = elevation;
    this.cameraDistance = distance;
    this.updateCameraPosition();
  }

  private updateCameraPosition(): void {
    const azRad = (this.azimuth * Math.PI) / 180;
    const elRad = (this.elevation * Math.PI) / 180;
    const d = this.cameraDistance;

    this.camera.position.set(
      d * Math.cos(elRad) * Math.sin(azRad),
      d * Math.sin(elRad),
      d * Math.cos(elRad) * Math.cos(azRad),
    );
    this.camera.lookAt(0, 0, 0);
  }

  /** Update particle positions — ambient drift. */
  private updatePositions(): void {
    const posAttr = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;

    for (let i = 0; i < this.particleCount; i++) {
      const ix = i * 3;
      const iy = ix + 1;
      const iz = ix + 2;

      let px = this.basePositions[ix];
      let py = this.basePositions[iy];
      let pz = this.basePositions[iz];

      // Add drift animation (skipped for reduced-motion)
      if (!this.reducedMotion) {
        const phase = i * 0.1 + this.time * 0.3;
        const drift = 0.08;
        px += Math.sin(phase) * drift;
        py += Math.cos(phase * 0.7) * drift * 1.2;
        pz += Math.sin(phase * 1.3) * drift * 0.6;
      }

      posAttr.array[ix] = px;
      posAttr.array[iy] = py;
      posAttr.array[iz] = pz;
    }

    posAttr.needsUpdate = true;
  }

  /** Update brightness pulsation (skipped for reduced-motion). */
  private updateBrightness(): void {
    const brightAttr = this.particles.geometry.getAttribute('aBrightness') as THREE.BufferAttribute;

    for (let i = 0; i < this.particleCount; i++) {
      const pulse = 0.9 + 0.1 * Math.sin(this.time * 0.5 + i * 0.7);
      brightAttr.array[i] = this.baseBrightnesses[i] * pulse;
    }

    brightAttr.needsUpdate = true;
  }

  /** Start the render loop. */
  start(): void {
    if (this.isDisposed) return;

    let lastTime = performance.now();

    const loop = (now: number) => {
      if (this.isDisposed) return;

      const dt = (now - lastTime) / 1000;
      lastTime = now;
      this.time += dt;

      this.updatePositions();
      if (!this.reducedMotion) {
        this.updateBrightness();
      }
      this.renderer.render(this.scene, this.camera);
      this.animationId = requestAnimationFrame(loop);
    };

    this.animationId = requestAnimationFrame(loop);
  }

  /** Stop the render loop. */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /** Clean up all resources. */
  dispose(): void {
    this.isDisposed = true;
    this.stop();
    this.particles.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
  }
}
