// Canonical mirror of the `users` table owned by server/services/auth
// (see its migrations/). This definition exists ONLY so other domains can
// declare foreign-key relationships and the client can share row types —
// no monolith code may query auth tables directly.
import {
  pgTable,
  varchar,
  boolean,
  jsonb,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id", { length: 128 }).primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  firstName: varchar("first_name", { length: 120 }),
  lastName: varchar("last_name", { length: 120 }),
  profileImageUrl: text("profile_image_url"),
  authProvider: varchar("auth_provider", { length: 32 })
    .notNull()
    .default("email"),
  isActive: boolean("is_active").default(true),
  hasNotifiedTeam: boolean("has_notified_team").default(false),
  readNotificationIds: jsonb("read_notification_ids").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type User = typeof users.$inferSelect;
