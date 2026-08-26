// Monolith-side auth surface. The Go service owns identity; this package
// only verifies its signed assertions and enforces CSRF on local routes.
import {
  authenticateUpgrade,
  initAuth,
  optionalAuth,
  requireAuth,
  verifyAssertionToken,
} from "./middleware";
import type { AuthContext, AuthUser } from "./middleware";
import { csrfProtect, isValidOrigin, originAllowed } from "./csrf";
import { revokedSessions } from "./denylist";

export {
  authenticateUpgrade,
  initAuth,
  optionalAuth,
  requireAuth,
  verifyAssertionToken,
};
export { csrfProtect, isValidOrigin, originAllowed };
export { revokedSessions };
export type { AuthContext, AuthUser };
