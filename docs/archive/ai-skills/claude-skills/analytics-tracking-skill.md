---
name: analytics-tracking
description: Enforces event tracking strategy, conversion funnel measurement, and analytics integration for data-driven optimization.
---

# Analytics & Tracking Skill

This skill ensures the site is instrumented to measure what matters. A $10K website must prove its ROI. If you can't measure conversions, you can't optimize them.

## Core Rules for Analytics

### 1. Analytics Stack

- **Primary:** Google Analytics 4 (GA4) via `@next/third-parties` or `next/script` with `strategy="afterInteractive"`.
- **Heatmaps (recommended):** Hotjar or Microsoft Clarity for visual behavior analysis.
- **Tag Management:** Google Tag Manager for non-developer event additions post-launch.
- **Server-side tracking (advanced):** Use Next.js API routes as a proxy to avoid ad blockers.

### 2. Core Events to Track

Every $10K site must track these events at minimum:

#### Page-Level:

- `page_view` — automatic via GA4, but verify SPA route changes fire correctly in Next.js App Router.
- `scroll_depth` — track 25%, 50%, 75%, 90% scroll milestones per page.

#### Conversion Events:

- `cta_click` — every CTA button click, with params: `{ cta_text, cta_location, page_section }`.
- `form_start` — user focuses the first field of any form.
- `form_submit` — successful form submission, with params: `{ form_name, form_location }`.
- `form_error` — validation failure, with params: `{ field_name, error_type }`.

#### Engagement Events:

- `video_play` / `video_complete` — if video content exists.
- `testimonial_scroll` — carousel interaction (indicates trust-seeking behavior).
- `pricing_view` — user scrolls pricing section into view (high-intent signal).
- `faq_expand` — which questions get clicked (reveals objections).
- `outbound_link_click` — clicks to external sites.

### 3. Event Naming Convention

- Use `snake_case` for all event names (GA4 standard).
- Prefix with category: `nav_menu_open`, `cta_hero_click`, `form_contact_submit`.
- Event params use `snake_case` too: `button_text`, `section_name`, `page_path`.
- Be consistent. `cta_click` everywhere, not `buttonClick` in one place and `cta_press` in another.

### 4. Implementation Pattern (Next.js)

Create a centralized analytics utility:

```typescript
// src/lib/analytics.ts
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number>,
) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
}
```

- Call `trackEvent('cta_click', { cta_text: 'Get Started', section: 'hero' })` from component handlers.
- NEVER put `gtag()` calls directly in components. Always go through the utility.

### 5. Conversion Goals

Define these in GA4 as conversion events:

- **Primary conversion:** Form submission (lead capture, demo booking, contact form).
- **Secondary conversion:** CTA click on pricing page, download of resource.
- **Micro-conversions:** Email link click, phone number click, social media click.

### 6. UTM & Attribution

- Ensure all inbound campaign links use UTM parameters: `utm_source`, `utm_medium`, `utm_campaign`.
- Store UTM params in session storage on first landing and attach them to form submissions for attribution.
- Track `document.referrer` on page load for organic attribution.

### 7. Privacy & Consent

- **Cookie consent:** Implement a cookie consent banner that blocks analytics scripts until the user accepts (required for GDPR/CCPA compliance).
- **Anonymize IP:** Enable IP anonymization in GA4 config.
- **Privacy policy:** The site MUST have a privacy policy page if analytics are active.
- **Data retention:** Configure GA4 data retention to the minimum needed (14 months default, reduce if possible).

### 8. Performance Impact Rules

- Load analytics scripts with `strategy="afterInteractive"` or `strategy="lazyOnload"` — never `beforeInteractive`.
- Use the `next/script` component, not raw `<script>` tags.
- Analytics must not impact LCP or INP. If it does, defer more aggressively.
