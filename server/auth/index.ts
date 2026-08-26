// Monolith-side auth surface. The Go service owns identity; this package
// only verifies its signed assertions and enforces CSRF on local routes.
import { csrfProtect, isValidOrigin, originAllowed } from "./csrf";
import {
  initAuth,
  optionalAuth,
  requireAuth,
  verifyAssertionToken,
  type AuthContext,
  type AuthUser,
} from "./middleware";
import { revokedSessions } from "./denylist";

export { csrfProtect, isValidOrigin, originAllowed };
export {
  initAuth,
  optionalAuth,
  requireAuth,
  verifyAssertionToken,
  revokedSessions,
};
export type { AuthContext, AuthUser };
