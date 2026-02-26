import type { Express, Request, Response } from "express";
import passport from "passport";
import { db } from "./db";
import { users, workspaces, nodes, edges, collections } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword, verifyPassword } from "./password";
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

  // Update user profile
  app.patch("/api/user/profile", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { firstName, lastName } = req.body;

      const [updatedUser] = await db
        .update(users)
        .set({
          firstName: firstName || null,
          lastName: lastName || null,
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          authProvider: users.authProvider,
          createdAt: users.createdAt,
        });

      res.json(updatedUser);
    } catch (error) {
      console.error("[Auth] Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Change password
  app.post("/api/user/change-password", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "New password must be at least 8 characters" });
      }

      // Get user with password hash
      const [user] = await db
        .select({ passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.id, userId));

      if (!user || !user.passwordHash) {
        return res.status(400).json({ message: "Cannot change password for OAuth accounts" });
      }

      // Verify current password
      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword);

      // Update password
      await db
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, userId));

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("[Auth] Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Delete all user data (workspaces, nodes, edges, collections)
  app.delete("/api/user/data", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;

      // Get all user workspaces first
      const userWorkspaces = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.userId, userId));

      const workspaceIds = userWorkspaces.map(w => w.id);

      if (workspaceIds.length > 0) {
        // Delete edges for user's workspaces
        await db.delete(edges).where(and(...workspaceIds.map(id => eq(edges.workspaceId, id))));

        // Delete nodes for user's workspaces
        await db.delete(nodes).where(and(...workspaceIds.map(id => eq(nodes.workspaceId, id))));

        // Delete workspaces
        await db.delete(workspaces).where(eq(workspaces.userId, userId));
      }

      // Delete collections
      await db.delete(collections).where(eq(collections.userId, userId));

      res.json({ message: "All data deleted successfully" });
    } catch (error) {
      console.error("[Auth] Error deleting user data:", error);
      res.status(500).json({ message: "Failed to delete user data" });
    }
  });

  // Delete account and all data
  app.delete("/api/user/account", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.id;

      // Get all user workspaces first
      const userWorkspaces = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.userId, userId));

      const workspaceIds = userWorkspaces.map(w => w.id);

      if (workspaceIds.length > 0) {
        // Delete edges for user's workspaces
        await db.delete(edges).where(and(...workspaceIds.map(id => eq(edges.workspaceId, id))));

        // Delete nodes for user's workspaces
        await db.delete(nodes).where(and(...workspaceIds.map(id => eq(nodes.workspaceId, id))));

        // Delete workspaces
        await db.delete(workspaces).where(eq(workspaces.userId, userId));
      }

      // Delete collections
      await db.delete(collections).where(eq(collections.userId, userId));

      // Delete user
      await db.delete(users).where(eq(users.id, userId));

      // Logout user
      req.logout(() => {
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error) {
      console.error("[Auth] Error deleting account:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });
}
