# Task Breakdown & Implementation Roadmap (TASKS.md)

## Phase 1: Environment & Repository Setup
- [x] TASK-001: Inspect workspace and confirm isolation from TV app.
- [x] TASK-002: Fetch and analyze project workflow guidelines ("Vibe Coding: Beginner-to-Production Guide").
- [x] TASK-003: Download and configure required repository skills (`apple-design`, `caveman`, `icm-architect`, `impeccable`, `ponytail`, `cloudflare`, `wrangler`, `workers-best-practices`).
- [x] TASK-004: Initialize Git repository and `.gitignore`.
- [x] TASK-005: Create complete project documentation suite (`PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, `RULES.md`, `DECISIONS.md`, `TEST_PLAN.md`, `SECURITY.md`, `.env.example`).
- [ ] TASK-006: Scaffold project dependencies (`package.json`, TypeScript, Tailwind CSS, Drizzle ORM, Wrangler config).

## Phase 2: Core Data Layer & Relational Schemas
- [ ] TASK-007: Define Drizzle schema for `participants`, `events`, `registrations`, and `session_attendance`.
- [ ] TASK-008: Implement Unique Participant ID generator (e.g. `EQ-XXXXX` with collision detection).
- [ ] TASK-009: Create synthetic seed data script with 10 realistic sample participants (pastors and members).

## Phase 3: Public Registration Flow (Vertical Slice 1)
- [ ] TASK-010: Create responsive registration form following `DESIGN.md` and `impeccable` guidelines.
- [ ] TASK-011: Implement registration API endpoint with Zod validation and D1 database insertion.
- [ ] TASK-012: Build registration confirmation view displaying copyable Unique ID and event pass.
- [ ] TASK-013: Implement returning attendee flow (lookup by Phone / Unique ID to quickly confirm current event registration).

## Phase 4: Admin Directory & Attendance Tracking (Vertical Slice 2)
- [ ] TASK-014: Build Admin Directory UI with search by Name, Phone, and Unique ID.
- [ ] TASK-015: Build Multi-Session Attendance UI (5 sessions: Mon AM/PM, Tue AM/PM, Wed PM) with single-tap toggle.
- [ ] TASK-016: Add CSV export feature for event rosters and attendance reports.

## Phase 5: Verification & Quality Assurance
- [ ] TASK-017: Run automated test suite against registration and duplicate-prevention logic.
- [ ] TASK-018: Execute manual test matrix ([docs/TEST_PLAN.md](file:///c:/Users/DELL/Equip/docs/TEST_PLAN.md)) across mobile and desktop viewports.
- [ ] TASK-019: Final review and documentation update in `STATUS.md`.
