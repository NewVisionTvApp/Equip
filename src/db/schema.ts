import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const platformSyncState = sqliteTable("platform_sync_state", {
  id: text("id").primaryKey(),
  stateJson: text("state_json").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const requestLimits = sqliteTable("request_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expiresAt: integer("expires_at").notNull(),
});

/* =========================================================================
   1. BETTER AUTH CORE TABLES (Managed by Better Auth on Cloudflare D1)
   ========================================================================= */

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  role: text("role").default("attendee"), // 'attendee' | 'admin'
  twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export const twoFactor = sqliteTable("twoFactor", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  verified: integer("verified", { mode: "boolean" }).notNull().default(true),
  failedVerificationCount: integer("failed_verification_count").notNull().default(0),
  lockedUntil: integer("locked_until", { mode: "timestamp" }),
}, table => ({ userIdIndex: index("two_factor_user_id_idx").on(table.userId) }));

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  actorUserId: text("actor_user_id").notNull(),
  action: text("action").notNull(),
  targetId: text("target_id").notNull(),
  eventId: text("event_id"),
  sessionKey: text("session_key"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: integer("created_at").notNull(),
}, table => ({ createdAtIndex: index("audit_log_created_at_idx").on(table.createdAt) }));

/* =========================================================================
   2. EQUIP DOMAIN TABLES (Participants, Monthly Events, Registrations, Attendance)
   ========================================================================= */

/**
 * Persistent Participant Profiles:
 * Holds persistent contact information and unique participant ID across all monthly events.
 */
export const participants = sqliteTable("participants", {
  id: text("id").primaryKey(), // e.g. "EQ-82914"
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }), // Optional link to auth user
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull().unique(), // Primary lookup key
  email: text("email"),
  churchName: text("church_name").notNull(), // Home church
  isHostChurch: integer("is_host_church", { mode: "boolean" }).notNull().default(false),
  roleOffice: text("role_office").notNull(), // 'Pastor' | 'Elder' | 'Minister' | 'Member' | 'Guest'
  location: text("location").notNull(), // City, Branch, Region
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

/**
 * Monthly Event Instances:
 * E.g., "2026-12-EQUIP"
 */
export const events = sqliteTable("events", {
  id: text("id").primaryKey(), // e.g. "2026-12"
  title: text("title").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  status: text("status").notNull().default("open"), // 'draft' | 'open' | 'closed' | 'completed'
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

/**
 * Event Registrations:
 * Links a persistent participant to a specific monthly event.
 * Unique constraint on (participantId, eventId) prevents duplicate event registrations.
 */
export const registrations = sqliteTable(
  "registrations",
  {
    id: text("id").primaryKey(), // e.g. "reg_abc123"
    participantId: text("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "cascade" }),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    registrationType: text("registration_type").notNull().default("standard"),
    registeredAt: integer("registered_at", { mode: "timestamp" }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
    status: text("status").notNull().default("confirmed"), // 'confirmed' | 'cancelled'
  },
  (table) => ({
    uniqueParticipantEvent: uniqueIndex("unique_participant_event_idx").on(
      table.participantId,
      table.eventId
    ),
  })
);

/**
 * Multi-Session Attendance:
 * Tracks check-ins across the 5 specific sessions of the 3-day programme:
 * - 'mon_am': Day 1 Morning
 * - 'mon_pm': Day 1 Evening
 * - 'tue_am': Day 2 Morning
 * - 'tue_pm': Day 2 Evening
 * - 'wed_am': Day 3 Morning (Grand Finale)
 */
export const sessionAttendance = sqliteTable(
  "session_attendance",
  {
    id: text("id").primaryKey(), // e.g. "att_xyz789"
    registrationId: text("registration_id")
      .notNull()
      .references(() => registrations.id, { onDelete: "cascade" }),
    sessionKey: text("session_key").notNull(), // 'mon_am' | 'mon_pm' | 'tue_am' | 'tue_pm' | 'wed_am'
    checkedInAt: integer("checked_in_at", { mode: "timestamp" }).notNull().default(sql`(CURRENT_TIMESTAMP)`),
    checkedInBy: text("checked_in_by"), // Admin user ID / name
  },
  (table) => ({
    uniqueRegistrationSession: uniqueIndex("unique_registration_session_idx").on(
      table.registrationId,
      table.sessionKey
    ),
  })
);

/* Type helpers */
export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;
export type Event = typeof events.$inferSelect;
export type Registration = typeof registrations.$inferSelect;
export type SessionAttendance = typeof sessionAttendance.$inferSelect;
