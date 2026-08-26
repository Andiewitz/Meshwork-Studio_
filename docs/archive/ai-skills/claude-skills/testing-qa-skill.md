---
name: testing-qa
description: Enforces testing standards, component test patterns, and quality assurance workflows for production-ready Next.js + MUI applications.
---

# Testing & QA Skill

This skill defines what "done" means. Code without tests is a liability. A $10K site must ship with confidence — no "it works on my machine" surprises.

## Core Rules for Testing

### 1. Test Stack

- **Unit/Component Tests:** Jest + React Testing Library (already configured in this project)
- **Integration Tests:** Test full page renders with providers, routing, and data
- **E2E Tests (if scope allows):** Playwright for critical user flows (form submissions, navigation)
- **Visual Regression (optional):** Chromatic or Percy for catching unintended UI changes

### 2. What to Test

#### Always Test:

- Every shared component in `src/components/` renders without crashing
- Every feature component in `src/features/` renders its key content
- All interactive behavior: button clicks trigger expected actions, forms validate, modals open/close
- Conditional rendering: loading states, empty states, error states
- Accessibility: components have correct ARIA attributes, roles, and labels

#### Never Test:

- Implementation details (internal state shape, private methods)
- Third-party library internals (MUI, Framer Motion)
- Exact CSS/style values (these are visual regression territory)
- Simple pass-through components that just forward props

### 3. Test File Organization

```
tests/
├── components/           # Shared component tests
│   ├── Section.test.tsx
│   └── Header.test.tsx
├── features/             # Feature module tests
│   ├── hero.test.tsx
│   ├── pricing.test.tsx
│   └── testimonials.test.tsx
├── pages/                # Full page integration tests
│   └── home.test.tsx
└── utils/                # Utility function tests
    └── formatters.test.ts
```

### 4. Component Test Pattern

Every component test follows this structure:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Providers } from "@/providers/Providers";
import { ComponentName } from "@/features/feature-name";

// Helper to wrap with providers
const renderWithProviders = (ui: React.ReactElement) =>
  render(<Providers>{ui}</Providers>);

describe("ComponentName", () => {
  it("renders primary content", () => {
    renderWithProviders(<ComponentName />);
    expect(screen.getByText(/expected text/i)).toBeInTheDocument();
  });

  it("handles user interaction", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ComponentName />);
    await user.click(screen.getByRole("button", { name: /action/i }));
    expect(screen.getByText(/result/i)).toBeInTheDocument();
  });

  it("renders accessible markup", () => {
    renderWithProviders(<ComponentName />);
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
  });
});
```

### 5. Testing Rules

- **Query priority (React Testing Library):** Always query in this order:
  1. `getByRole` (most accessible — matches how users and assistive tech find elements)
  2. `getByLabelText` (form fields)
  3. `getByText` (visible text content)
  4. `getByTestId` (last resort only — add `data-testid` when no semantic query works)
- **Never use:** `getByClassName`, `querySelector`, or snapshot tests for component logic.
- **Async handling:** Always use `findBy` queries (which wait) for content that appears after state changes. Never use `waitFor` + `getBy` when `findBy` does the same thing.
- **User events:** Use `userEvent` (from `@testing-library/user-event`) over `fireEvent`. It simulates real browser behavior (focus, keyboard, pointer).

### 6. Pre-Commit Quality Gates

Before any code is merged:

- [ ] `npm run test` passes with zero failures
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run build` succeeds (catches type errors and SSR issues)
- [ ] New components have at minimum a "renders without crashing" test
- [ ] Interactive components have user interaction tests

### 7. Coverage Philosophy

- Don't chase 100% coverage — it leads to brittle, low-value tests.
- Target **80%+ coverage on `src/components/` and `src/features/`**.
- 0% coverage is acceptable on pure layout components (wrappers, spacers) and third-party integrations.
- High-value coverage: form validation logic, conditional renders, utility functions.
