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
- **Zero Cost & Continuous Uptime:** Built on Cloudflare Pages and D1 (relational SQLite) with zero database sleep or pausing issues between monthly events.

---

## Cloudflare deployment

This application targets **Cloudflare Pages**, including the API routes in `functions/`. Its Wrangler configuration uses `pages_build_output_dir`; do not add the Workers-only `assets` setting, which causes Pages deployment validation to fail.

For an existing Pages project connected to GitHub, use:

- Root directory: repository root
- Build command: `pnpm run build`
- Build output directory: `dist`

Pages Git integration handles deployment after the build. If using an existing CI pipeline with a separate deploy command, use `pnpm exec wrangler pages deploy dist --project-name equip` and ensure `equip` matches the existing Pages project name. Its CI credentials must have permission to deploy to Pages.

A build log showing a separate user deploy command may come from Workers Builds. Check which Cloudflare project is connected to GitHub. Changing the command to `wrangler deploy` would require migrating the Pages Functions; it is not a fix for this configuration error.

Before deploying, reconcile the existing Pages project's runtime settings with `wrangler.jsonc`, including its D1 binding named `DB` for authentication and shared attendance data, and its `BETTER_AUTH_SECRET` secret. No production database identifier is currently recorded in the config. Do not substitute a guessed identifier or create a replacement database.

References: [Pages Wrangler configuration](https://developers.cloudflare.com/pages/functions/wrangler-configuration/) and [Workers Builds settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

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
