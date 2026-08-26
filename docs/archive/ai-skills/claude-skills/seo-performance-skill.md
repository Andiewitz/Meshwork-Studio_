---
name: seo-performance
description: Enforces Core Web Vitals optimization, semantic HTML, structured data, and technical SEO best practices for maximum search visibility and page speed.
---

# SEO & Performance Skill

This skill ensures the site is fast, discoverable, and technically sound. A $10K website that loads slowly or doesn't rank is a waste of money. Performance IS a feature.

## Core Rules for Performance

### 1. Core Web Vitals Targets

- **LCP (Largest Contentful Paint):** < 2.5 seconds. The hero image or headline must render within this window.
- **FID/INP (Interaction to Next Paint):** < 200ms. No janky button clicks or delayed form responses.
- **CLS (Cumulative Layout Shift):** < 0.1. No elements jumping around after load.

### 2. Image Optimization

- **Always use Next.js `<Image>` component** — it handles lazy loading, responsive sizing, and WebP/AVIF format conversion automatically.
- **Set explicit `width` and `height`** on all images to prevent CLS.
- **Hero images:** Use `priority={true}` and `fetchPriority="high"` to preload.
- **Below-fold images:** Default `loading="lazy"` (Next.js default).
- **Avoid raw `<img>` tags** unless there's a specific technical reason.

### 3. Font Loading Strategy

- Use `next/font/google` for all Google Fonts — it self-hosts and eliminates render-blocking network requests.
- Load only the weights you actually use (e.g., `weight: ['400', '600', '800']`), not the full family.
- Always set `display: 'swap'` to prevent FOIT (Flash of Invisible Text).
- Define font variables in the layout and apply via CSS custom properties.

### 4. Bundle Size & Code Splitting

- **Dynamic imports:** Use `next/dynamic` with `ssr: false` for heavy client-only components (charts, maps, rich text editors, animation-heavy sections).
- **Tree shaking:** Import MUI components individually (`import Button from '@mui/material/Button'`), not from the barrel export (`import { Button } from '@mui/material'`).
- **No unnecessary dependencies:** Before adding a library, check if the functionality can be achieved with native APIs or existing deps.
- **Analyze:** Periodically run `npx @next/bundle-analyzer` to identify bloat.

### 5. Semantic HTML & Accessibility

- **Heading hierarchy:** Exactly one `<h1>` per page. Then `<h2>` for sections, `<h3>` for subsections. Never skip levels.
- **Landmarks:** Use `<header>`, `<main>`, `<section>`, `<nav>`, `<footer>` — not `<div>` for everything.
- **ARIA labels:** Interactive elements that lack visible text MUST have `aria-label`.
- **Alt text:** Every `<Image>` must have meaningful alt text. Decorative images get `alt=""`.
- **Color contrast:** All text must meet WCAG 2.1 AA (4.5:1 for body text, 3:1 for large text).

### 6. Technical SEO

- **Metadata:** Every page needs unique `title` and `description` via Next.js `metadata` export.
- **Open Graph:** Include `og:title`, `og:description`, `og:image` for social sharing previews.
- **Canonical URLs:** Set canonical URLs to prevent duplicate content issues.
- **Sitemap:** Generate with `next-sitemap` or a custom `sitemap.ts` route.
- **Robots:** Configure `robots.txt` to allow crawling of public pages and block admin/API routes.
- **Structured Data (JSON-LD):** Add schema markup for the business type (Organization, LocalBusiness, Product, FAQ) in the layout or page head.

### 7. Caching & Delivery

- **Static Generation:** Default to static rendering (`generateStaticParams`) for content pages that don't change per-request.
- **ISR:** Use Incremental Static Regeneration for content that updates periodically (blog posts, pricing).
- **Cache headers:** Set appropriate `Cache-Control` headers for API routes.
- **CDN:** Ensure static assets (images, fonts, CSS, JS) are served from the edge via Vercel/CDN.

### 8. Monitoring

- Set up Vercel Analytics or Google PageSpeed Insights for ongoing CWV monitoring.
- Run Lighthouse audit before every deploy — score must be 90+ on Performance, Accessibility, Best Practices, and SEO.
