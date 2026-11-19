# Architecture & Technology Evaluation

## 1. Technology Evaluation & Recommendations

### Context & Goals
- Scale: 150 – 200 participants monthly.
- Longevity: Highly stable, low maintenance, zero-cost or near-zero cost indefinitely.
- Portability: Independent from TV app, but able to share or interface via API/database relations in the future if desired.
- Constraint: No database sleeping / pausing issues between monthly intervals.

### Option A: Cloudflare Workers / Pages + Cloudflare D1 (SQL)
- **Cost:** **$0 / month** (Free tier covers 100,000 requests/day, 5 million D1 reads/day, 100,000 writes/day, and 5 GB storage). At 200 attendees/month, usage will be well under 1% of the free limits.
- **Downtime / Sleeping:** **Zero.** D1 does not "sleep" or pause due to inactivity, unlike free-tier PaaS Postgres instances.
- **Ecosystem Alignment:** Since the mobile app already runs on Cloudflare, using Cloudflare (either within the same account or a cleanly separated account) allows direct cross-service bindings, Cloudflare Access (for free, passwordless zero-trust admin login), and unified billing if upgraded in the future.
- **Stack:** Astro or Next.js / Remix / Hono on Cloudflare Pages/Workers + D1 + Drizzle ORM.
- **Trade-offs:** D1 is serverless SQLite. For 200–5,000 users, relational SQLite is lightning fast, reliable, and handles transactions cleanly. If massive complex analytical queries across millions of rows are needed down the line, exporting or federating is straightforward.

### Option B: Vercel + Supabase (Managed PostgreSQL)
- **Cost:** Free tier available, but **Supabase free projects automatically pause after 7 days of inactivity**.
  - *Risk:* Since this is a **monthly** event, if there is a 2-week quiet period between monthly events, the Supabase database may pause. When the next registration opens, requests will fail or stall until someone manually unpauses it in the dashboard, unless you pay $25/month for the Pro plan.
- **Admin UI:** Supabase provides an out-of-the-box Table Editor, which is convenient during early testing.
- **Ecosystem:** Different platform from Cloudflare. Linking with Cloudflare mobile app requires HTTP/REST endpoints rather than native edge bindings.

### Recommendation
**Cloudflare Pages + D1 (with Drizzle ORM)** is strongly recommended as the best long-term, cost-effective choice:
1. **Never Pauses:** Continuous availability 365 days a year on the free tier.
2. **Unified Cloudflare Ecosystem:** Shares the exact same operational and database paradigm as the mobile app.
3. **Built-in Security:** Admin portal can be secured via Cloudflare Access (email one-time PIN or Google login) for free without writing fragile custom authentication code.
4. **Clean Codebase:** Modern TypeScript, Drizzle ORM for typed schemas and migrations, and fast edge SSR.

---

## 2. Proposed Data Schema (Relational)

```sql
-- 1. Persistent Participant Profiles
CREATE TABLE participants (
  id TEXT PRIMARY KEY,               -- e.g. 'EQ-82914' (human-friendly unique ID)
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,        -- Primary identifier for lookup
  email TEXT,
  church_name TEXT NOT NULL,         -- Home church
  is_host_church INTEGER DEFAULT 0,  -- 1 = Host church, 0 = Visiting church
  role_office TEXT NOT NULL,         -- e.g. 'Pastor', 'Elder', 'Member', etc.
  location TEXT NOT NULL,            -- City / Branch / Region
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Monthly Events
CREATE TABLE events (
  id TEXT PRIMARY KEY,               -- e.g. '2026-12' or 'equip-dec-2026'
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'open',        -- 'draft', 'open', 'closed', 'completed'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Event Registrations (Instance per participant per event)
CREATE TABLE registrations (
  id TEXT PRIMARY KEY,               -- UUID or prefixed ID
  participant_id TEXT NOT NULL REFERENCES participants(id),
  event_id TEXT NOT NULL REFERENCES events(id),
  registration_type TEXT DEFAULT 'standard',
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'confirmed',   -- 'confirmed', 'cancelled'
  UNIQUE(participant_id, event_id)   -- Prevents duplicate registration for same event
);

-- 4. Session Attendance (5 sessions per event)
CREATE TABLE session_attendance (
  id TEXT PRIMARY KEY,
  registration_id TEXT NOT NULL REFERENCES registrations(id),
  session_key TEXT NOT NULL,         -- 'mon_am', 'mon_pm', 'tue_am', 'tue_pm', 'wed_pm'
  checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  checked_in_by TEXT,                -- Admin identifier
  UNIQUE(registration_id, session_key)
);
```
