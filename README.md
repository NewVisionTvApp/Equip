# Equip - Church Programme Registration System

A lightweight, high-performance, and cost-effective registration and attendance platform designed for a recurring monthly 3-day church programme (5 sessions).

Maintained independently in this repository, decoupled from New Vision TV.

---

## Key Features
- **Public Registration:** Simple, responsive mobile-first form for new attendees (pastors and church members).
- **Persistent Profile & Unique ID:** Generates a stable unique ID (`EQ-XXXXX`) allowing participants to easily re-register for future monthly programmes.
- **Admin Directory & ID Lookup:** Help desk lookup by Name, Phone Number, or Unique ID.
- **Multi-Session Attendance:** Track attendance across all 5 programme sessions:
  - Day 1 (Monday): Morning & Evening
  - Day 2 (Tuesday): Morning & Evening
  - Day 3 (Wednesday): Afternoon
- **Hosting & Persistence:** Built for Cloudflare Workers with static assets and D1 (relational SQLite).

---

## Cloudflare deployment

This application targets the existing **Cloudflare Worker named `equip`**. `src/worker.ts` handles `/api/sync` and `/api/auth/*`, and serves the Vite frontend through the `ASSETS` binding. SPA fallback supports direct links such as `/register`, `/attendance`, and `/directory`. Unknown API paths return JSON 404 responses.

In the Worker's GitHub build settings, use:

- Root directory: repository root
- Build command: `pnpm run build`
- Deploy command: `pnpm run deploy` (runs the project's installed `wrangler deploy`)

The build produces `dist/`, configured as `assets.directory` in `wrangler.jsonc`. The previous `wrangler pages deploy dist` command targets a different product; this account has an `equip` Worker and no Pages project. Use a Workers deployment token for the intended account.

For local frontend development, use `pnpm dev`. After an approved frontend build, `pnpm worker:dev` serves the Worker and its assets locally. Regenerate binding declarations with `pnpm cf:types` after changing Wrangler bindings.

Shared attendance uses the dedicated D1 database `equip-db`, bound as `DB` in `wrangler.jsonc`. Authentication uses the `BETTER_AUTH_SECRET` runtime secret stored in Cloudflare and the configured `BETTER_AUTH_URL`. Schema migrations live in `drizzle/migrations`; apply new migrations with `pnpm db:migrate:prod` only with approval. Missing backend configuration returns HTTP 503. Never put secret values in the repository or share them in chat.

For local Worker login tests, set `BETTER_AUTH_URL=http://localhost:8787` and a local-only `BETTER_AUTH_SECRET` in ignored `.dev.vars`. The D1 binding uses a local database by default; apply migrations with `pnpm db:migrate:local`. Run `pnpm test` for synthetic registration, sync, and authentication checks.

For local password-reset email, add your Resend key to `RESEND_API_KEY` in ignored `.dev.vars` and set `RESEND_FROM_EMAIL=Equip <no-reply@equip.newvisiontv.app>` after the sender domain is verified in Resend. `.dev.vars` affects local Wrangler only. Production needs the same names set as Worker secrets; never put the API key in `wrangler.jsonc`, `.env.example`, or Git. The reset link appears only when both runtime values are set.

Production backup and restore steps are documented in [docs/RECOVERY.md](docs/RECOVERY.md). A D1 restore requires an approved recovery point because it removes later writes.

## Accounts and access

- Administrators manage programmes, participant profiles, backups, and account roles at `/staff`.
- Ushers can read the attendance roster, register walk-ins, and record check-ins. Programme editing and account management require an administrator.
- Attendees use `/account` to create an account, link their Participant ID using the phone number on their profile, and view or edit their own records.
- Public registration at `/register` works without an account. Returning attendees supply both their Participant ID and phone number. The non-ordained Ministerial / Service Role list includes **Member**.

New accounts always receive attendee access. Initial administrator promotion is an operator action after the owner creates their account; subsequent role changes are made by administrators in Account access. Role changes revoke the affected account's sessions. Users cannot demote their own administrator account.

`GET /api/sync` requires an administrator or usher session. Writes use validated, role-checked actions instead of replacing the whole shared snapshot. Concurrent changes use a database revision check; stale backup imports are rejected. Public APIs return programme information and individual registration results, never the participant directory. Staff records stay in browser memory and the legacy shared localStorage cache is removed.

For Vite development, start the local Worker alongside `pnpm dev`; Vite proxies `/api` to port 8787. Set `BETTER_AUTH_URL` to the frontend origin used for login (for example `http://localhost:3000`).

The installed Wrangler 3 version supports Workers Logs, which are enabled. Its schema does not support the newer traces setting; adding traces requires a separate Wrangler upgrade.

References: [Pages to Workers migration](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/), [static asset configuration](https://developers.cloudflare.com/workers/static-assets/binding/), and [Workers Builds settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

## Documentation
- [AGENTS.md](file:///c:/Users/DELL/Equip/AGENTS.md): Agent routing and core rules.
- [STATUS.md](file:///c:/Users/DELL/Equip/STATUS.md): Current sprint state and next actions.
- [TASKS.md](file:///c:/Users/DELL/Equip/TASKS.md): Step-by-step roadmap and checklist.
- [docs/PRD.md](file:///c:/Users/DELL/Equip/docs/PRD.md): Product Requirements Document.
- [docs/ARCHITECTURE.md](file:///c:/Users/DELL/Equip/docs/architecture.md): System architecture and database schema.
- [docs/DESIGN.md](file:///c:/Users/DELL/Equip/docs/DESIGN.md): Design system and visual specifications.
- [docs/RULES.md](file:///c:/Users/DELL/Equip/docs/RULES.md): Coding standards and guardrails.
- [docs/DECISIONS.md](file:///c:/Users/DELL/Equip/docs/DECISIONS.md): Architecture Decision Records (ADRs).
- [docs/TEST_PLAN.md](file:///c:/Users/DELL/Equip/docs/TEST_PLAN.md): Verification test cases.
- [docs/SECURITY.md](file:///c:/Users/DELL/Equip/docs/SECURITY.md): Privacy, input validation, and access control.
