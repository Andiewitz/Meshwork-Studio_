import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Create and configure Google OAuth strategy
 */
export function createGoogleStrategy() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.warn("[GoogleAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set");
    return null;
  }

  const callbackURL = `${process.env.APP_URL || "http://localhost:5000"}/api/auth/google/callback`;

  return new GoogleStrategy(
    {
      clientID,
      clientSecret,
      callbackURL,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email provided from Google"));
        }

        const firstName = profile.name?.givenName || "";
        const lastName = profile.name?.familyName || "";
        const profileImageUrl = profile.photos?.[0]?.value || null;

        // Check if user exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        if (existingUser) {
          // Update user info
          await db
            .update(users)
            .set({
              firstName: firstName || existingUser.firstName,
              lastName: lastName || existingUser.lastName,
              profileImageUrl: profileImageUrl || existingUser.profileImageUrl,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingUser.id));

          return done(null, {
            id: existingUser.id,
            email: existingUser.email,
            firstName: firstName || existingUser.firstName,
            lastName: lastName || existingUser.lastName,
            profileImageUrl: profileImageUrl || existingUser.profileImageUrl,
            authProvider: "google",
          });
        }

        // Create new user
        const [newUser] = await db
          .insert(users)
          .values({
            email,
            firstName,
            lastName,
            profileImageUrl,
            authProvider: "google",
          })
          .returning();

        return done(null, {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          profileImageUrl: newUser.profileImageUrl,
          authProvider: "google",
        });
      } catch (err) {
        console.error("[GoogleAuth] Error:", err);
        return done(err as Error);
      }
    }
  );
}
