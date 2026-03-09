# Brand Code

**Executable brand identity specification for [Spectral Brand Theory](https://spectralbranding.com).**

A Brand Code is a machine-readable, version-controlled, executable specification of a brand's visual identity. It replaces the traditional brand guidelines PDF with code that can be read, run, forked, and verified.

## What Is This?

This repository contains the complete visual identity of Spectral Brand Theory — not as a logo file or a design system PDF, but as a function:

```
f(signals, observer_position, time) -> visual_output
```

Every visual artifact the framework produces — the animated particle system on [spectralbranding.com](https://spectralbranding.com), the social cards, the favicon, the OG images — is a rendering of this function with different parameters. Change the parameters, get a different rendering. The same function, the same spectral palette, the same physics.

## Why Code Instead of a Logo?

SBT's foundational claim is that there is no brand-in-itself — only signals and observers. A logo freezes one rendering and declares it permanent. A function renders differently depending on context, which is what brands actually do.

But the concept extends beyond SBT. Any organization could encode its identity as executable code:

- **Verifiable**: Does this campaign follow the brand function? The answer is computable, not subjective.
- **Version-controlled**: Brand evolution is tracked in commits, not lost in email chains.
- **AI-readable**: An LLM can read and evaluate a function. It cannot evaluate a logo for strategic coherence.
- **Forkable**: Partners and agencies run the function locally instead of interpreting a PDF.

## Repository Structure

```
brand-code/
  brand.json          # Brand spectral profile — the identity as structured data
  BRAND.md            # Human-readable brand description
  prompt.md           # LLM prompt for rendering the brand
  src/
    SpectralField.ts  # Core particle system renderer (Three.js)
    constants.ts      # Spectral palette, dimensions, camera states
    scroll-driver.ts  # Scroll-driven camera and decomposition
  LICENSE             # MIT
```

## The Polychromatic Spectral Model

Each particle in the system carries a **spectral profile** — eight intensity values, one per perceptual dimension:

| Dimension | Color | Wavelength Position |
|-----------|-------|-------------------|
| Semiotic | Violet (#8B5CF6) | Shortest |
| Narrative | Indigo (#6366F1) | |
| Temporal | Blue (#3B82F6) | |
| Ideological | Teal (#14B8A6) | |
| Economic | Green (#22C55E) | |
| Experiential | Amber (#F59E0B) | |
| Cultural | Orange (#F97316) | |
| Social | Red (#EF4444) | Longest |

The apparent color of each particle is the **additive blend** of these eight spectral colors weighted by their intensities — exactly how optical spectroscopy works. A particle with strong semiotic (violet) and economic (green) dimensions but zero cultural (orange) will appear as a blue-green composite with a dark gap where orange should be.

**Structural absence** is visible: dimensions with zero intensity produce dark gaps in the spectrograph view — the visual equivalent of SBT's "dark signals" concept.

When the viewer zooms in (scroll decomposition), each composite dot reveals its eight spectral lines — the perceptual dimensions that compose it. The same data, two scales of observation.

## For AI Agents

See [`prompt.md`](prompt.md) for a structured prompt that enables any LLM to understand and reason about this brand's visual identity. See [`brand.json`](brand.json) for the machine-readable specification.

## For Developers

The source files in `src/` are the exact code running on [spectralbranding.com](https://spectralbranding.com). They require:
- Three.js 0.172+ (WebGL2)
- TypeScript

To use in your own project, copy the `src/` directory and wire up a canvas element. See [spectralbranding.com](https://spectralbranding.com) for the live integration.

## The Brand Code Concept

This repository is both SBT's own brand identity and a reference implementation of what "brand codes" could look like. If you're interested in creating a Brand Code for your organization, the structure is:

1. **`brand.json`** — Your brand's spectral profile (dimensional intensities, palette, constraints)
2. **`BRAND.md`** — Human-readable description of the identity and its principles
3. **`prompt.md`** — LLM-readable specification for AI agents
4. **`src/`** — The rendering function itself

A logo is a promise frozen in time. A Brand Code is a promise you can run.

## Related

- [spectralbranding.com](https://spectralbranding.com) — The brand function running live
- [sbt-framework](https://github.com/spectralbranding/sbt-framework) — Framework, templates, taxonomy
- [sbt-papers](https://github.com/spectralbranding/sbt-papers) — Academic papers and case studies
- [Article 07: We Deleted Our Logo and Replaced It with a Function](https://substack.com/@spectralbranding) — The full argument

## License

MIT — read it, run it, fork it.

## Trademarks

"Spectral Brand Theory" and "Brand Code" are trademarks of Dmitry Zharnikov. The MIT license applies to the source code only and does not grant permission to use the project trademarks. You may fork and modify the code freely, but derivative works should not use these names in ways that imply endorsement or official affiliation.
