# Brand Code Prompt — Spectral Brand Theory

Use this prompt to render or reason about SBT's visual identity in any AI system.

---

## Identity Specification

You are rendering the visual identity of **Spectral Brand Theory** (spectralbranding.com). The identity has no logo. It is a function:

```
f(signals, observer_position, time) -> visual_output
```

### Palette (use ONLY these colors)

Eight spectral colors ordered by wavelength (violet to red), plus black and white:

- Semiotic: #8B5CF6 (violet)
- Narrative: #6366F1 (indigo)
- Temporal: #3B82F6 (blue)
- Ideological: #14B8A6 (teal)
- Economic: #22C55E (green)
- Experiential: #F59E0B (amber)
- Cultural: #F97316 (orange)
- Social: #EF4444 (red)
- Background: #000000 (black)
- Text: #FFFFFF (white)

No other colors. No gradients that break spectral ordering.

### The Particle System

600 particles in 3D space. Each particle carries a **spectral profile** — eight intensity values (0.0 to 1.0), one per dimension. The apparent color of each particle is the **additive blend** of the eight spectral colors weighted by these intensities.

Signal distribution:
- 35% have one dominant dimension (near-pure spectral color)
- 35% have two dominant dimensions (two-color blend)
- 20% have three dominant dimensions (complex blend)
- 10% are broadband (4+ dimensions, near-white)

About 30% of particles have **structural absence** — one or more dimensions at zero intensity, producing dark gaps when decomposed into spectral lines.

### Decomposition

When zooming in, each composite dot reveals eight vertical spectral lines (violet on left, red on right). Line brightness = that dimension's intensity. Zero-intensity dimensions appear as dark gaps. This is the "spectrograph" view — the analytical decomposition of the composite signal.

### Static Renderings

For OG images, social cards, or print: render the particle field at `time=0` from a fixed camera angle. The minimum viable rendering is **The Eight Lines** — eight vertical bars in spectral order on black.

### Key Principle

The framework claims that brand perception depends on observer position. The visual identity changes with observer position (scroll/camera angle). The theory is demonstrated, not illustrated.

---

## For Generating New Visuals

When asked to create visual content for SBT:
1. Use ONLY the spectral palette + black + white
2. Every element must be a rendering of the brand function or derive from it
3. No decorative elements, photography, or illustration
4. Typography: Space Grotesk (display), Inter (body), JetBrains Mono (code)
5. The absence of a logo IS the identity signal — never create or suggest a logo

## Source

Full implementation: https://github.com/spectralbranding/brand-code
Live rendering: https://spectralbranding.com
Framework paper (SSRN): https://papers.ssrn.com/sol3/papers.cfm?abstract_id=6318718
Framework version: 2.1 (non-ergodic perception dynamics)
