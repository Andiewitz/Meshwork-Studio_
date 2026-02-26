import type { Express, Request, Response } from "express";
import passport from "passport";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./password";
import { isAuthenticated } from "./authCore";
import { captchaMiddleware } from "./captcha";

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Google OAuth routes
  app.get("/api/auth/google", passport.authenticate("google", {
    scope: ["profile", "email"],
  }));

  app.get("/api/auth/google/callback",
    passport.authenticate("google", {
      successRedirect: "/",
      failureRedirect: "/auth/login?error=google",
    })
  );

  // Register with email/password (with CAPTCHA)
  app.post("/api/auth/register", captchaMiddleware, async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existingUser) {
        return res.status(409).json({ message: "Email already registered" });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          passwordHash,
          firstName: firstName || null,
          lastName: lastName || null,
          authProvider: "email",
        })
        .returning();

      res.status(201).json({
        message: "Registration successful",
        userId: newUser.id,
      });
    } catch (err: any) {
      console.error("[Auth] Registration error:", err);
      res.status(500).json({ message: err.message || "Registration failed due to server error" });
    }
  });

  // Login with email/password (NO CAPTCHA for returning users)
  app.post("/api/auth/login", (req: Request, res: Response, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed - please check your credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({ user });
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        console.error("[Auth] Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current authenticated user
  app.get("/api/auth/me", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          authProvider: users.authProvider,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("[Auth] Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user profile - please try again" });
    }
  });
}
