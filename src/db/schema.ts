import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

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
 * - 'wed_pm': Day 3 Afternoon
 */
export const sessionAttendance = sqliteTable(
  "session_attendance",
  {
    id: text("id").primaryKey(), // e.g. "att_xyz789"
    registrationId: text("registration_id")
      .notNull()
      .references(() => registrations.id, { onDelete: "cascade" }),
    sessionKey: text("session_key").notNull(), // 'mon_am' | 'mon_pm' | 'tue_am' | 'tue_pm' | 'wed_pm'
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
