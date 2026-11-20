# Architecture & Technology Evaluation

## 1. Technology Evaluation & Recommendations

### Context & Goals
- Scale: 150 – 200 participants monthly.
- Longevity: Highly stable, low maintenance, zero-cost or near-zero cost indefinitely.
- Authentication: Effortless, modern email sign-up and sign-in (magic links, email/password, and session management) without external vendor lock-in.
- Portability: Independent from TV app, but able to share or interface via API/database relations in the future if desired.
- Constraint: No database sleeping / pausing issues between monthly intervals.

### Selected Stack: Cloudflare Pages/Workers + D1 + Drizzle ORM + Better Auth
1. **Hosting & Edge Compute:** Cloudflare Pages / Workers.
   - Ultra-fast global edge distribution with zero cold starts.
   - Free tier: 100,000 requests/day.
2. **Database:** Cloudflare D1 (Serverless Relational SQLite).
   - Zero-pause architecture: never sleeps or shuts down due to inactivity.
   - Free tier: 5 million reads/day, 100,000 writes/day, 5 GB storage.
3. **ORM:** Drizzle ORM.
   - Type-safe schema definition, automated migrations, and zero-overhead queries.
4. **Authentication:** **Better Auth** (Native Edge & Drizzle ORM Adapter).
   - 100% open source TypeScript authentication framework running directly in Cloudflare Workers.
   - Stores users, sessions, accounts, and email verification tokens directly inside your Cloudflare D1 database.
   - Supports email & password, magic links, session cookies, and role-based permissions (admin vs. attendee).
5. **Transactional Emails:** Resend (via HTTPS API).
   - Sends email verification and magic link/password reset emails.
   - Free tier: 3,000 emails/month (15x above monthly requirements).

---

## 2. System Architecture Diagram

```
+-------------------------------------------------------------+
|                      Client Browser                         |
|   (Mobile-First Responsive UI: Attendee Portal & Admin Hub) |
+------------------------------+------------------------------+
                               |
                               v HTTPS
+-------------------------------------------------------------+
|               Cloudflare Pages / Workers Edge               |
|                                                             |
|   +-----------------------+     +-----------------------+   |
|   |   Public & Admin API  |     |      Better Auth      |   |
|   |     (Zod Validated)   |     |    (Sessions & Auth)  |   |
|   +-----------+-----------+     +-----------+-----------+   |
|               |                             |               |
|               +--------------+--------------+               |
|                              |                              |
|                              v                              |
|                     Drizzle ORM Layer                       |
+------------------------------+------------------------------+
                               |
                               +-----------------------------> Resend API
                               |                               (Transactional Emails)
                               v SQL Queries
+-------------------------------------------------------------+
|                Cloudflare D1 Database (SQLite)              |
|                                                             |
|  [Auth Tables]            [Application Tables]              |
|  - user                   - participants (profiles)         |
|  - session                - events (monthly instances)      |
|  - account                - registrations                   |
|  - verification           - session_attendance (5 sessions) |
+-------------------------------------------------------------+
```

---

## 3. Relational Database Schema

### A. Better Auth Core Tables (Stored in D1)

```sql
-- Core user identity created by Better Auth
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  role TEXT DEFAULT 'attendee',      -- 'attendee' or 'admin'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Active user sessions (managed via secure HTTP-only cookies)
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table for credentials (hashed passwords) or social providers
CREATE TABLE account (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,         -- 'credential', 'google', etc.
  access_token TEXT,
  refresh_token TEXT,
  password TEXT,                     -- securely hashed password
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Email verification tokens and password reset requests
CREATE TABLE verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,          -- email address
  value TEXT NOT NULL,               -- token / OTP code
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### B. Application Domain Tables (Equip Registration & Attendance)

```sql
-- Persistent Participant Profiles (linked to Better Auth user)
CREATE TABLE participants (
  id TEXT PRIMARY KEY,               -- Human-friendly unique ID: 'EQ-82914'
  user_id TEXT UNIQUE REFERENCES user(id) ON DELETE SET NULL, -- Linked auth account
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,        -- Primary contact & lookup key
  email TEXT,                        -- Synced from user account
  church_name TEXT NOT NULL,         -- Home church
  is_host_church INTEGER DEFAULT 0,  -- 1 = Host church, 0 = Visiting church
  role_office TEXT NOT NULL,         -- e.g. 'Pastor', 'Elder', 'Member', etc.
  location TEXT NOT NULL,            -- City / Branch / Region
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Monthly Event Definitions
CREATE TABLE events (
  id TEXT PRIMARY KEY,               -- e.g. '2026-12' or 'equip-dec-2026'
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'open',        -- 'draft', 'open', 'closed', 'completed'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Event Registrations (Instance per participant per monthly event)
CREATE TABLE registrations (
  id TEXT PRIMARY KEY,               -- UUID or prefixed ID
  participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_type TEXT DEFAULT 'standard',
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'confirmed',   -- 'confirmed', 'cancelled'
  UNIQUE(participant_id, event_id)   -- Strictly prevents duplicate registrations
);

-- Multi-Session Attendance (5 sessions per event)
CREATE TABLE session_attendance (
  id TEXT PRIMARY KEY,
  registration_id TEXT NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  session_key TEXT NOT NULL,         -- 'mon_am', 'mon_pm', 'tue_am', 'tue_pm', 'wed_am'
  checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  checked_in_by TEXT,                -- Admin identifier
  UNIQUE(registration_id, session_key)
);
```
