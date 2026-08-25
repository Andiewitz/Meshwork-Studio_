import {
  pgTable,
  timestamp,
  integer,
  jsonb,
  varchar,
  index,
  uniqueIndex,
  boolean,
  text,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Canonical User storage table
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar("email", { length: 320 }).unique().notNull(),
    emailNormalized: varchar("email_normalized", { length: 320 }),
    firstName: varchar("first_name", { length: 120 }),
    lastName: varchar("last_name", { length: 120 }),
    profileImageUrl: text("profile_image_url"),
    passwordHash: text("password_hash"),
    authProvider: varchar("auth_provider", { length: 32 })
      .notNull()
      .default("email"),
    isActive: boolean("is_active").notNull().default(true),
    isAdmin: boolean("is_admin").notNull().default(false),
    hasNotifiedTeam: boolean("has_notified_team").default(false),
    readNotificationIds: jsonb("read_notification_ids").default(
      sql`'[]'::jsonb`,
    ),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [index("IDX_users_email_normalized").on(table.emailNormalized)],
);

// Provider-independent OAuth identities
export const authIdentities = pgTable(
  "auth_identities",
  {
    id: varchar("id", { length: 128 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("auth_identity_provider_account_idx").on(
      table.provider,
      table.providerAccountId,
    ),
    index("auth_identity_user_idx").on(table.userId),
  ],
);

// Hashed session tokens
export const authSessions = pgTable(
  "auth_sessions",
  {
    idHash: varchar("id_hash", { length: 128 }).primaryKey(),
    userId: varchar("user_id", { length: 128 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at").notNull(),
    revokedAt: timestamp("revoked_at"),
    userAgent: text("user_agent"),
    ipHash: varchar("ip_hash", { length: 128 }),
  },
  (table) => [
    index("auth_session_user_idx").on(table.userId),
    index("auth_session_expiry_idx").on(table.expiresAt),
  ],
);

// Bound CSRF secrets
export const authCsrfSecrets = pgTable("auth_csrf_secrets", {
  sessionIdHash: varchar("session_id_hash", { length: 128 }).primaryKey(),
  secretHash: varchar("secret_hash", { length: 128 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Login attempt tracking for account lockout protection
export const loginAttempts = pgTable(
  "login_attempts",
  {
    email: varchar("email", { length: 320 }).primaryKey(),
    failed: integer("failed").notNull().default(0),
    lastAttempt: timestamp("last_attempt").notNull().defaultNow(),
    lockedUntil: timestamp("locked_until"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("login_attempts_email_uidx").on(table.email),
    index("IDX_login_attempts_locked_until").on(table.lockedUntil),
  ],
);

// Legacy express-session fallback table (for backward compatibility if needed)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type AuthIdentity = typeof authIdentities.$inferSelect;
export type AuthSession = typeof authSessions.$inferSelect;
export type AuthCsrfSecret = typeof authCsrfSecrets.$inferSelect;
export type LoginAttempt = typeof loginAttempts.$inferSelect;
