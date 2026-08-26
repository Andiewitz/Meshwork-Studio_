---
name: motion-design
description: Standardizes animation curves, spring physics, entrance choreography, and interactive feedback for premium feel. Prevents cheap default transitions.
---

# Motion Design Skill

This skill overrides all default browser animations with professional motion design principles. Every transition on the site must feel intentional, weighted, and polished.

## Core Rules for Motion

### 1. Banish Default Easing

- **Never use:** `ease`, `ease-in-out`, `linear`, or default CSS transitions. They feel mechanical and cheap.
- **Standard Curves:**
  - **Snappy UI (buttons, toggles, dropdowns):** `cubic-bezier(0.16, 1, 0.3, 1)` — fast attack, smooth resolve.
  - **Smooth Entrance (sections, cards fading in):** `cubic-bezier(0.22, 1, 0.36, 1)` — gentle deceleration.
  - **Dramatic Exit (modals, overlays closing):** `cubic-bezier(0.55, 0, 1, 0.45)` — accelerating departure.

### 2. Spring Physics (Framer Motion)

- Default to spring-based animations for ALL interactive elements (buttons, modals, cards, drawers, tooltips).
- **Premium Spring Spec:** `{ stiffness: 100, damping: 20, mass: 1 }` — natural weight, no childish bounce.
- **Snappy Spring (toggles, small UI):** `{ stiffness: 300, damping: 30 }` — crisp and immediate.
- **Dramatic Spring (page transitions, hero entrances):** `{ stiffness: 60, damping: 15 }` — cinematic settle.
- Never use `type: "tween"` with a fixed `duration` for interactive elements. Springs respond to velocity; tweens don't.

### 3. Staggered Entrance Choreography

- **Rule:** Never animate a group of elements simultaneously. Always stagger.
- **Stagger timing:** `0.05s` to `0.08s` per child item. Slower than 0.1s feels sluggish. Faster than 0.04s is invisible.
- **Pattern:** Each child enters with `opacity: 0 → 1` and `translateY: 16px → 0`. Subtle, not dramatic.
- **Container orchestration:** The parent container should use `staggerChildren` in Framer Motion's `variants` system, not individual `delay` values on each child.

### 4. Micro-Interactions & Feedback

- **Hover:** Scale up `1.02` to `1.04` with a simultaneous box-shadow expansion. Never just change background color.
- **Press/Active:** Scale down to `0.98` to simulate physical depression.
- **Focus:** Use a glowing ring (`box-shadow: 0 0 0 3px var(--color-accent-glow)`) rather than browser default outline.
- **Loading states:** Use skeleton shimmer animations (`background-position` shift on a gradient), never a plain spinner unless it's a small inline indicator.

### 5. Page & Route Transitions

- Wrap page content in `<AnimatePresence>` with `mode="wait"`.
- **Enter:** Fade in + slide up 20px, duration 0.3s.
- **Exit:** Fade out + slide down 10px, duration 0.15s (exits should always be faster than entrances).

### 6. Performance Guardrails

- Only animate `transform` and `opacity`. NEVER animate `width`, `height`, `top`, `left`, `margin`, or `padding`.
- Apply `will-change: transform` on any element that animates on scroll or on hover.
- Use `transform: translateZ(0)` to force GPU compositing on persistent animated elements.
