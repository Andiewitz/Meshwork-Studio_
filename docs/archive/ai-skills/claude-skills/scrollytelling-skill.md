---
name: scrollytelling
description: Expert instructions for implementing high-end scroll-driven web experiences — pinning, parallax, progressive reveal, and viewport-triggered narrative transitions.
---

# Scrollytelling Skill

This skill enforces strict rules for building scrollytelling interfaces where scrolling drives the narrative, layout changes, and visual reveals. The result must feel cinematic, buttery smooth, and intentional.

## Library Selection

- **Smooth Scroll**: **Lenis** (Current Choice) — Optimized for the App Router, lightweight, and hardware-accelerated.
- **Scroll Logic**: **Framer Motion** (`useScroll`, `useTransform`) — Standard for React.
- **Intersection**: **Intersection Observer API** or Framer Motion's `whileInView`.

## Core Rules for Scroll Implementation

### 1. Pinning & Stacking (Sticky Sections)

- **Do:** Use `position: sticky` combined with `top: 0` and explicit height containers (`100vh`, `200vh`, `300vh`) for section pinning.
- **Avoid:** `position: fixed` with complex JS offset math — this causes jank and z-index nightmares.
- **Overlap technique:** Pin the current section with `position: sticky`, then let the next section's natural document flow scroll over it. Use `z-index` layering to control the visual stacking order.
- **Container height = scroll duration.** A `200vh` container means the pinned content stays for one full viewport of scrolling. `300vh` = two viewports of scroll travel.

### 2. Scroll Progress & Triggers

- **Intersection Observer:** Use native `IntersectionObserver` with `threshold: [0, 0.15, 0.5, 1]` to trigger entrance animations when elements cross the bottom 15-20% of the viewport.
- **Framer Motion (React):** Use `useScroll({ target: ref, offset: ["start end", "end start"] })` + `useTransform` to map scroll position to animation values (opacity, translateY, scale).
- **GSAP (Complex/Canvas):** Use `ScrollTrigger` with `scrub: 1` for smooth, scroll-linked animations. Pin with `pin: true` rather than CSS sticky when GSAP manages the timeline.
- **CSS Native:** For simple progress indicators or parallax, prefer `animation-timeline: scroll()` where browser support permits.

### 3. Parallax Depth

- Apply different scroll speeds to layered elements to create depth. Background moves at `0.3x` scroll speed, midground at `0.6x`, foreground at `1x`.
- Implement via `useTransform(scrollYProgress, [0, 1], ["0%", "-20%"])` in Framer Motion.
- **Subtle is premium.** Parallax offset should be 10-30% max. Anything more feels gimmicky and nauseating.

### 4. Progressive Content Reveal

- Text blocks and cards should fade in and slide up (`opacity: 0 → 1`, `translateY: 40px → 0`) as they enter the viewport.
- Use staggered delays for grouped items (see Motion Design skill).
- **Counter/number animations:** Animate numbers counting up when the stats section scrolls into view. Use `IntersectionObserver` to trigger, then interpolate with `requestAnimationFrame`.

### 5. Performance & Optimization

- **Hardware Acceleration:** Any scroll-animated element MUST have `will-change: transform` in CSS.
- **Transform Only:** Only animate `transform` and `opacity` on scroll. NEVER animate layout properties (`top`, `margin`, `height`, `padding`).
- **Debounce:** If using raw scroll listeners (avoid when possible), debounce with `requestAnimationFrame`, never `setTimeout`.
- **Lazy load:** Images below the fold must use `loading="lazy"` or Next.js `<Image>` with `priority={false}`.

### 6. Accessibility

- **`prefers-reduced-motion`:** If the user prefers reduced motion, disable all scroll pinning, parallax, and scroll-linked animations. Let the page stack naturally as a standard readable document.
- **Keyboard navigation:** Ensure all pinned/scroll-hijacked sections are still navigable via Tab key.
- **Scroll hijacking prohibition:** NEVER override native scroll behavior (custom scroll speeds, scroll snapping that prevents natural scrolling). Users must always feel in control.
