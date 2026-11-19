# Architecture Decision Records (DECISIONS.md)

## ADR-001: Cloudflare Pages + Cloudflare D1 with Drizzle ORM
- **Status:** Approved
- **Context:** The registration system runs once a month with ~150–200 attendees. It must be 100% cost-effective ($0/month), highly reliable, and not suffer from sleeping/pausing issues between monthly intervals.
- **Decision:** Use Cloudflare Pages + Cloudflare D1 (serverless relational SQLite) with Drizzle ORM for type-safe schema definitions and migrations.
- **Consequences:**
  - Zero ongoing hosting cost on Cloudflare free tier.
  - Zero database pause or cold start downtime (avoiding Supabase free tier 7-day auto-pause).
  - Aligns with the mobile app's Cloudflare infrastructure for future interoperability without coupling them today.

---

## ADR-002: Stable Participant Profile Decoupled from Event Registrations
- **Status:** Approved
- **Context:** Attendees attend recurring monthly programmes and need to be recognized without forcing them to remember passwords or undergo complex sign-in flows.
- **Decision:** Split the relational schema into:
  1. `participants`: Persistent master profile with a human-readable unique ID (`EQ-XXXXX`).
  2. `events`: Monthly event definition (e.g. `2026-12`).
  3. `registrations`: Bridge table linking participant to event instance with a unique compound constraint (`participant_id`, `event_id`).
  4. `session_attendance`: Records check-in per session across the 5 event sessions.
- **Consequences:**
  - Returning participants can register for future months in seconds using their Unique ID or Phone Number.
  - Historical attendance across multiple months is cleanly preserved.

---

## ADR-003: Passwordless Unique ID & Admin Phone Lookup
- **Status:** Approved
- **Context:** Requiring passwords causes high drop-off and friction during church event registration.
- **Decision:** Use a generated 5-digit Unique ID (e.g. `EQ-82914`) displayed on confirmation and provided via copy/screenshot. If an attendee forgets their ID, administrators can search by Name or Phone in the admin lookup directory.
- **Consequences:**
  - Frictionless registration for attendees of all technical backgrounds.
  - Admin help desk has instant visibility to resolve lookup issues at the door.
