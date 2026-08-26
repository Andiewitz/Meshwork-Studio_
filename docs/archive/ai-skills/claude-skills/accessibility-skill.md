---
name: accessibility
description: Enforces WCAG 2.1 AA compliance, keyboard navigation, screen reader compatibility, and inclusive design patterns across the entire site.
---

# Accessibility Skill

This skill ensures the site is usable by everyone — including users with visual, motor, cognitive, and auditory disabilities. Accessibility is not optional on a professional build. It's a legal requirement in many jurisdictions and a quality signal to clients.

## Core Rules for Accessibility

### 1. Semantic HTML (Non-Negotiable)

- Use `<button>` for actions, `<a>` for navigation. NEVER use `<div onClick>` as a button.
- Use `<nav>` for navigation, `<main>` for primary content, `<aside>` for sidebars, `<footer>` for footer.
- Use `<section>` with an `aria-labelledby` pointing to the section's heading.
- Use `<ul>/<ol>` for lists. Don't fake lists with `<div>` and CSS bullets.
- Use `<table>` for tabular data, with `<thead>`, `<th scope="col">`, and `<caption>`.

### 2. Heading Hierarchy

- Exactly ONE `<h1>` per page — the page title.
- Headings must follow sequential order: `h1 → h2 → h3`. Never skip from `h1` to `h4`.
- Headings define the page outline. A screen reader user navigates by headings — they are the site's table of contents.
- Visual styling does NOT dictate heading level. Use CSS to make an `h3` look large if needed.

### 3. Keyboard Navigation

- **Tab order:** All interactive elements must be reachable via `Tab` key in a logical order matching visual layout.
- **Focus indicators:** NEVER remove `:focus` outlines globally (`outline: none`). Instead, replace with a custom, high-visibility focus ring: `box-shadow: 0 0 0 3px var(--color-accent)` with `outline: 2px solid transparent` for high contrast mode.
- **Focus trapping:** Modals and drawers MUST trap focus inside when open. Focus must return to the trigger element on close.
- **Skip link:** Include a "Skip to main content" link as the first focusable element on every page. Hidden visually, visible on focus.
- **Escape key:** All modals, dropdowns, and overlays must close on `Escape` key press.

### 4. Color & Contrast

- **Text contrast:** Body text must have a minimum 4.5:1 contrast ratio against its background (WCAG AA).
- **Large text (18px+ or 14px+ bold):** Minimum 3:1 contrast ratio.
- **Interactive elements:** Buttons, links, and form controls must have 3:1 contrast against adjacent colors.
- **Don't rely on color alone:** Error states must use icons or text alongside red color. "Required" fields need more than just a red asterisk.
- **Test tool:** Use Chrome DevTools Accessibility panel or the axe browser extension.

### 5. Images & Media

- **Meaningful images:** Must have descriptive `alt` text that conveys the content and function. "Team collaborating on a whiteboard during a strategy session" not "photo" or "image."
- **Decorative images:** Set `alt=""` (empty string) so screen readers skip them. Never omit the `alt` attribute entirely.
- **Icons:** If an icon is the only content of a button, add `aria-label` to the button. If the icon is beside text, set `aria-hidden="true"` on the icon.
- **Video:** Provide captions/subtitles. Include a text transcript for audio content.

### 6. Forms

- Every `<input>` MUST have an associated `<label>` using `htmlFor` / `id` pairing. Placeholder text is NOT a label.
- Group related fields with `<fieldset>` and `<legend>`.
- Error messages must be associated to the input via `aria-describedby`.
- Required fields must use `aria-required="true"` in addition to visual indicators.
- Form submission success/error must be announced to screen readers via `aria-live="polite"` region.

### 7. Dynamic Content & ARIA

- **Live regions:** Use `aria-live="polite"` for non-urgent updates (toast notifications, form status). Use `aria-live="assertive"` only for critical alerts.
- **Expanded/collapsed:** Accordions and dropdowns must use `aria-expanded="true/false"` on the trigger.
- **Loading states:** Use `aria-busy="true"` on containers that are loading. Announce completion.
- **Modals:** Use `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` pointing to the modal's title.
- **Don't overuse ARIA.** Native HTML semantics are always preferred. ARIA is a supplement, not a replacement.

### 8. Motion & Vestibular

- Respect `prefers-reduced-motion: reduce`. Wrap all animations in a media query or Framer Motion's `useReducedMotion()` hook.
- When reduced motion is active: disable parallax, auto-playing carousels, scroll-linked animations, and spring physics. Fall back to simple opacity fades or instant state changes.
- Never auto-play video with motion unless the user has explicitly opted in.

### 9. Testing Checklist

Before any page ships:

- [ ] Navigate entire page using only keyboard (Tab, Enter, Escape, Arrow keys)
- [ ] Run axe DevTools extension — zero critical or serious violations
- [ ] Test with a screen reader (NVDA on Windows, VoiceOver on Mac)
- [ ] Verify all images have appropriate alt text
- [ ] Verify color contrast passes 4.5:1 for body text
- [ ] Test with 200% browser zoom — layout must not break
- [ ] Check `prefers-reduced-motion` behavior
