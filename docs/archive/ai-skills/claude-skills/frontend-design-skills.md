---
name: frontend-design
description: Enforces premium visual design standards, spatial composition, and typographic hierarchy for $10K-tier web builds. Prevents generic "AI slop" aesthetics.
---

# Frontend Design Skill

This skill governs all visual design decisions. Every component, page, and layout MUST follow these rules to produce interfaces that feel bespoke and high-end — never templated.

## Core Design Rules

### 1. Typography System

- **Avoid:** Inter, Roboto, Arial, system-ui as primary display fonts. These are default and signal "template."
- **Do:** Select a distinctive pairing. Use a bold display face for headings (e.g., Outfit, Clash Display, Cabinet Grotesk, Syne) and a clean readable face for body (e.g., Plus Jakarta Sans, DM Sans, Satoshi).
- **Scale:** Enforce a modular type scale. Headings should feel massive — `clamp(2.5rem, 5vw, 5rem)` for hero h1s. Body text at `1rem/1.125rem` minimum.
- **Weight Contrast:** Use extreme weight contrast. 800-900 for headings, 400 for body, 500 for UI labels.
- **Letter Spacing:** Tighten heading letter-spacing (`-0.02em` to `-0.04em`). Widen uppercase labels (`0.08em` to `0.12em`).

### 2. Color & Theme Architecture

- **Avoid:** Raw Tailwind palette colors (`blue-500`, `slate-700`). These scream default.
- **Do:** Define a curated, intentional palette using HSL values. Every project needs:
  - `--color-surface-0` through `--color-surface-3` (layered depth system)
  - `--color-accent` (single strong accent — used sparingly)
  - `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`
- **Dark Mode First:** Design for dark mode as the primary experience. Light mode is secondary. Dark backgrounds with high-contrast text and luminous accents feel premium.
- **Gradients:** Use subtle, low-opacity radial gradients as ambient glow behind key sections. Never hard linear gradients across full-width backgrounds.

### 3. Spatial Composition & Layout

- **Avoid:** Symmetrical 3-column card grids with equal padding. This is the #1 template tell.
- **Do:** Use asymmetric layouts, bento grids, overlapping elements, and generous whitespace.
- **Spacing System:** Use an 8px baseline grid. All padding and margin values must be multiples of 8 (8, 16, 24, 32, 48, 64, 96, 128).
- **Sections:** Each major section should have `py: 96px` to `py: 128px` minimum. Cramped sections feel amateur.
- **Max-Width:** Content containers should be `max-width: 1200px` for readability. Hero headlines can break wider.

### 4. Component Quality Standards

- Every interactive component MUST have four visual states: **default, hover, active/pressed, disabled**.
- Buttons must have `border-radius: 8-12px`, never fully rounded (`9999px`) unless it's a pill tag.
- Cards must use layered surfaces (`surface-1` on `surface-0`) with subtle border (`1px solid rgba(255,255,255,0.06)`) — never box-shadow alone.
- Form inputs must have visible focus rings with the accent color, not browser defaults.

### 5. Image & Media Treatment

- Never use raw placeholder images. All images must be properly sized, lazy-loaded, and use `object-fit: cover`.
- Use subtle CSS `filter: brightness(0.9) contrast(1.05)` on hero images to unify them with the dark palette.
- Background patterns or noise textures (`opacity: 0.03-0.05`) add depth to flat surfaces.

## Implementation Stack for This Project

- **Framework:** Next.js (App Router) + TypeScript
- **Components:** MUI as the component library base, styled via `sx` prop and theme overrides
- **Styling:** Tailwind CSS for utility layout, CSS variables for the design token system
- **Motion:** Framer Motion for React animations
- **Icons:** MUI Icons or Lucide React
