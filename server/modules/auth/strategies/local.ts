import { Strategy as LocalStrategy, VerifyFunction } from "passport-local";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { verifyPassword } from "../password";

/**
 * Create and configure Local (email/password) strategy
 */
export function createLocalStrategy() {
  return new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email: string, password: string, done) => {
      try {
        console.log("[LocalAuth] Login attempt for email:", email);
        
        // Find user by email
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        console.log("[LocalAuth] User found:", user ? "yes" : "no");

        if (!user) {
          console.log("[LocalAuth] User not found:", email);
          return done(null, false, { message: "No account found with this email address" });
        }

        // Check if user has a password (email auth)
        if (!user.passwordHash) {
          console.log("[LocalAuth] No password hash - social login account");
          return done(null, false, { message: "This account uses social login" });
        }

        // Verify password
        console.log("[LocalAuth] Verifying password...");
        const isValid = await verifyPassword(password, user.passwordHash);
        console.log("[LocalAuth] Password valid:", isValid);
        
        if (!isValid) {
          console.log("[LocalAuth] Password incorrect for user:", email);
          return done(null, false, { message: "Incorrect password" });
        }

        console.log("[LocalAuth] Login successful for:", user.id);
        return done(null, {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          authProvider: user.authProvider,
        });
      } catch (err) {
        console.error("[LocalAuth] Error:", err);
        return done(err);
      }
    }
  );
}
