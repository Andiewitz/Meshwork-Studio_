# Post-Mortem: UI Interaction Bugs & Infrastructure Issues

## Date: February 25-26, 2026

## Issues Investigated and Fixed

---

## February 26, 2026 Session

### 4. White Screen on Login Page

**The Problem:**
Login page displayed a blank white screen instead of the login form. This occurred after PC shutdown/restart.

**Root Cause:**
Multiple issues compounded:
1. **Stale Nginx cache**: After rebuild, frontend container served old `index.html` referencing non-existent JS chunks (e.g., `index-t9Tdg8vJ.js` not found)
2. **Missing wouter context**: `useLocation()` was called outside of `<Router>` context
3. **Docker bind mount staleness**: Nginx container didn't auto-pick up new assets from host

**The Fix:**
1. Wrapped app with `WouterRouter` in `App.tsx`:
```tsx
import { Router as WouterRouter } from "wouter";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter>  // Added
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </WouterRouter>  // Added
    </QueryClientProvider>
  );
}
```

2. Force container restart after builds to pick up new assets:
```bash
docker-compose restart emnesh-frontend
```

**Files Changed:** `client/src/App.tsx`

---

### 5. /api/login Serving index.html Instead of Login Page

**The Problem:**
Navigating to `/api/login` returned a white screen or backend API response instead of the frontend login page.

**Root Cause:**
Legacy links in the frontend pointed to `/api/login` instead of the correct frontend route `/auth/login`. Nginx had no rule to handle this legacy path, so it fell through to backend API or served HTML.

**The Fix:**
Added explicit Nginx redirect in `nginx.conf`:
```nginx
# Redirect old/broken /api/login to correct frontend route
location = /api/login {
    return 302 /auth/login;
}
```

Also updated all frontend links from `/api/login` to `/auth/login` in:
- `client/src/pages/Landing.tsx`
- `client/src/pages/AuthPage.tsx`
- `client/src/lib/auth-utils.ts`

**Files Changed:** `nginx.conf`, `client/src/pages/Landing.tsx`, `client/src/pages/AuthPage.tsx`, `client/src/lib/auth-utils.ts`

---

### 6. Brief 404 Flash Before Login Page

**The Problem:**
Navigating to `/auth` showed a 404 error briefly before redirecting to `/auth/login`.

**Root Cause:**
The frontend routing handled `/auth` as a catch-all redirect, but the redirect wasn't immediate. The `NotFound` route could trigger briefly.

**The Fix:**
Added explicit redirect route in `App.tsx` Router component:
```tsx
if (location.startsWith("/auth/") || location === "/auth") {
  return (
    <AnimatePresence mode="wait">
      <Switch location={location} key={location}>
        <Route path="/auth/login"><Login /></Route>
        <Route path="/auth/register"><Register /></Route>
        <Route path="/auth">
          <Redirect to="/auth/login" />  // Added
        </Route>
      </Switch>
    </AnimatePresence>
  );
}
```

**Files Changed:** `client/src/App.tsx`

---

### 7. Generic "Invalid" Error Messages

**The Problem:**
Authentication errors showed generic messages like "Invalid email or password" instead of specific feedback.

**Root Cause:**
Backend auth strategies and routes used vague error messages that didn't distinguish between "user not found" vs "wrong password" vs "social login account".

**The Fix:**
Updated auth module with specific error messages:
- `server/modules/auth/strategies/local.ts`: Separate "No account found with this email address" from "Incorrect password" from "This account uses social login"
- `server/modules/auth/authCore.ts`: Changed "Unauthorized" to "Session expired or not logged in"
- `server/modules/auth/routes.ts`: Added descriptive messages for registration failures, login failures, and user fetch failures
- `server/modules/auth/captcha.ts`: Improved CAPTCHA error messages

**Files Changed:** `server/modules/auth/strategies/local.ts`, `server/modules/auth/authCore.ts`, `server/modules/auth/routes.ts`, `server/modules/auth/captcha.ts`

---

### 8. CAPTCHA Not Production-Grade + Required for Login

**The Problem:**
CAPTCHA was basic and required for login, which is annoying for returning users.

**Root Cause:**
1. CAPTCHA middleware lacked replay protection, IP validation, proper error handling
2. CAPTCHA was applied to both login and registration

**The Fix:**
1. Made CAPTCHA production-grade:
   - Token deduplication (replay attack prevention)
   - IP-based validation
   - Token format validation and 5-minute expiration
   - reCAPTCHA v3 score threshold support
   - User-friendly error code mapping
   - Added `optionalCaptchaMiddleware` for dev mode

2. Removed CAPTCHA from login - now only required for registration:
```typescript
// Registration still requires CAPTCHA
app.post("/api/auth/register", captchaMiddleware, async (req, res) => {...});

// Login does NOT require CAPTCHA
app.post("/api/auth/login", (req, res, next) => {...});
```

**Files Changed:** `server/modules/auth/captcha.ts`, `server/modules/auth/routes.ts`

---

### 9. Awkward Page Transition Animations

**The Problem:**
Page transitions felt awkward with scale and blur effects.

**Root Cause:**
Framer Motion transitions used `scale: 0.99`, `filter: "blur(4px)"` which looked jarring and slow (0.4s duration).

**The Fix:**
Simplified to clean fade with subtle slide:
```tsx
const PageTransition = ({ children, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}        // Changed from scale+blur
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.2 }}         // Changed from 0.4s
    className={cn("flex-1", className)}
  >
    {children}
  </motion.div>
);
```

**Files Changed:** `client/src/App.tsx`

---

## Key Takeaways (Updated)

1. **Event handling in React requires specificity** - Always check which mouse button triggered an action if you want different behaviors for left vs right clicks.

2. **Dialog components need careful configuration** - Radix UI dialogs have multiple interaction points that can trigger closing; understand `onPointerDownOutside` and `onInteractOutside` when you need to prevent accidental closes.

3. **Event bubbling is easy to miss** - When inline editing inputs are children of clickable elements, always use `stopPropagation()` to prevent parent handlers from firing.

4. **Consistency across components** - The `WorkspaceCard` had proper event handling that `FeaturedCard` lacked. When components share similar functionality, ensure they share similar event handling patterns.

5. **Docker volume staleness** - Bind-mounted volumes don't auto-update when host files change. Always restart containers after frontend builds to serve fresh assets.

6. **Router context is critical** - `wouter`'s `useLocation()` must be inside `<Router>` context. Wrap root App with router provider.

7. **Nginx location order matters** - Specific redirects (`location = /api/login`) should come before catch-all fallbacks. Use exact matches (`=`) for redirects.

8. **Frontend links must match routes** - Legacy `/api/*` paths won't work with Nginx SPA setup. Update all client-side links to use frontend routes (`/auth/*`).

9. **Security should be specific** - Generic error messages help attackers. Distinguish between "user not found" and "wrong password" at the backend level.

10. **CAPTCHA UX matters** - Only require CAPTCHA for high-risk actions (registration), not for returning users (login). Implement replay protection and proper error handling.

11. **Animations should be invisible** - If users notice the transition, it's too flashy. Subtle fades + small movements beat scale/blur effects.
