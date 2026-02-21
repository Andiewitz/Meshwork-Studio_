import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import memorystore from "memorystore";
import { authStorage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://weaving.studio/oidc"),
      process.env.CLIENT_ID || "studio-dev"
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const connectionString = process.env.AUTH_DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    const MemoryStore = memorystore(session);
    return session({
      secret: process.env.SESSION_SECRET || "dev_secret",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({
        checkPeriod: 86400000 // prune expired entries every 24h
      }),
      cookie: { secure: false }
    });
  }

  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: connectionString,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Changed for local Docker/HTTP support
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(claims: any) {
  try {
    console.log("[Auth] Attempting to upsert user:", claims["sub"]);
    await authStorage.upsertUser({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
    });
    console.log("[Auth] User upserted successfully:", claims["sub"]);
  } catch (err) {
    console.error("[Auth] Failed to upsert user:", err);
    throw err;
  }
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  if (process.env.CLIENT_ID === "local-development") {
    app.get("/api/login", async (req, res) => {
      console.log("Development Login Bypass hit");
      try {
        const mockUser = {
          claims: {
            sub: "dev-user-id",
            email: "dev@example.com",
            first_name: "Development",
            last_name: "User",
            profile_image_url: "https://avatar.vercel.sh/dev",
            exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
          },
          expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
        };

        await upsertUser(mockUser.claims);

        req.login(mockUser, (err) => {
          if (err) {
            console.error("Mock Login req.login() Error:", err);
            return res.status(500).json({ message: "Login failed (req.login)", error: err.message });
          }
          console.log("Mock Login Successful, redirecting to /");
          res.redirect("/");
        });
      } catch (err: any) {
        console.error("Mock Login Overall Error:", err);
        res.status(500).json({ message: "Login failed (overall)", error: err.message });
      }
    });

    app.get("/api/callback", (req, res) => {
      res.redirect("/");
    });

    return;
  }

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Keep track of registered strategies
  const registeredStrategies = new Set<string>();

  // Helper function to ensure strategy exists for a domain
  const ensureStrategy = (domain: string) => {
    const strategyName = `studioauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`studioauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`studioauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.CLIENT_ID || "studio-dev",
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated()) {
    console.log("[Auth Middleware] Not authenticated (passport)");
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!user.expires_at) {
    console.log("[Auth Middleware] Missing expires_at for user:", user.claims?.sub);
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
