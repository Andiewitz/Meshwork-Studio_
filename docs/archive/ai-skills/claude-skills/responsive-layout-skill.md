---
name: responsive-layout
description: Enforces mobile-first responsive design, breakpoint strategy, and fluid scaling that ensures the site looks premium on every screen size from 320px to 2560px.
---

# Responsive Layout Skill

This skill ensures every page and component is truly responsive — not just "doesn't break on mobile." A $10K site must feel intentionally designed for every viewport, not just scaled down from desktop.

## Core Rules for Responsive Design

### 1. Mobile-First Development

- **Write mobile styles first.** Use `min-width` media queries to scale UP, not `max-width` to scale down.
- **Breakpoint system:**
  - `sm: 640px` — Large phones / small tablets
  - `md: 768px` — Tablets
  - `lg: 1024px` — Small laptops
  - `xl: 1280px` — Standard desktops
  - `2xl: 1536px` — Large displays
- **Test at:** 375px (iPhone SE), 390px (iPhone 14), 768px (iPad), 1440px (MacBook Pro), 1920px (Desktop).

### 2. Fluid Typography

- Use `clamp()` for all heading sizes. Never use fixed `px` values for text that spans viewports.
  - **Hero h1:** `font-size: clamp(2.25rem, 5vw + 1rem, 5rem)`
  - **Section h2:** `font-size: clamp(1.75rem, 3vw + 0.5rem, 3rem)`
  - **Body:** `font-size: clamp(1rem, 0.5vw + 0.875rem, 1.125rem)`
- Line height should be tighter on large headings (`1.1`) and looser on body text (`1.6-1.7`).

### 3. Layout Adaptation Rules

- **Navigation:** Desktop = horizontal nav bar. Mobile = hamburger menu with full-screen overlay or drawer. Breakpoint: `lg (1024px)`.
- **Hero sections:** Stack vertically on mobile (text above image). Side-by-side on desktop.
- **Feature grids:** 1 column on mobile → 2 columns on tablet → 3 or 4 columns on desktop.
- **Testimonials:** Single card with swipe on mobile. Multi-card grid on desktop.
- **Pricing tables:** Stack cards vertically on mobile with the recommended plan first. Horizontal comparison on desktop.
- **Footer:** Stack columns vertically on mobile. Multi-column grid on desktop.

### 4. Touch & Mobile UX

- **Touch targets:** Minimum 44×44px for all interactive elements (buttons, links, form inputs).
- **Thumb zone:** Primary CTAs should be in the bottom 60% of the mobile viewport.
- **Horizontal scroll:** NEVER allow unintentional horizontal scrolling. Use `overflow-x: hidden` on the body as a safety net, but fix the root cause.
- **Input zoom prevention:** Set `font-size: 16px` minimum on mobile inputs to prevent iOS Safari auto-zoom.

### 5. Image Responsiveness

- Use Next.js `<Image>` component with `sizes` prop for automatic responsive image serving.
- Provide `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"` for grid-based images.
- Hero images: `sizes="100vw"` with `priority={true}`.
- Use `aspect-ratio` CSS property to prevent layout shift before images load.

### 6. Container Strategy

- **Max-width containers:** Use a centered container with `max-width: 1200px` and `padding-inline: 1.5rem` (mobile) / `3rem` (desktop).
- **Full-bleed sections:** Background colors/images span full width, but content stays within the container.
- **MUI Container:** Use `<Container maxWidth="lg">` consistently. Override with `disableGutters` when doing custom edge-to-edge layouts.

### 7. Testing Checklist

Before any page is considered "done":

- [ ] Looks correct at 375px wide (iPhone SE — the acid test)
- [ ] Looks correct at 768px wide (iPad portrait)
- [ ] Looks correct at 1440px wide (standard laptop)
- [ ] No horizontal scrollbar at any width
- [ ] All text is readable without zooming
- [ ] All CTAs are tappable without precision
- [ ] Images don't overflow or get distorted
