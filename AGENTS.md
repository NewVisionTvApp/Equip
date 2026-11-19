# AGENTS.md - System & Routing Guide

## Project Overview
Dedicated registration and attendance system for a recurring monthly 3-day church programme (5 sessions).
Maintained in this repository (`Equip`), independent from New Vision TV.

## Core Rules & Constraints
1. **Explicit Build Approval:** Never run local builds (`npm run build`, `wrangler build`, etc.) or cloud deployment commands without prior explicit user consent.
2. **No Remote Infrastructure Without Approval:** Do not create cloud resources, accounts, or services without explicit user direction.
3. **Decoupled Architecture:** Registration must operate standalone. Profile data is persistent and separated from event-specific registration instances.
4. **Lightweight Context:** Update `STATUS.md` after meaningful changes. Keep specs and architectural records in `docs/`.
5. **Privacy & Security:** Never commit credentials or secrets. Protect participant and admin data.
6. **Synthetic Data Only:** Use realistic synthetic data during development and testing.

## Documentation Index
- [STATUS.md](file:///c:/Users/DELL/Equip/STATUS.md): Current sprint state, next steps, verified behavior.
- [TASKS.md](file:///c:/Users/DELL/Equip/TASKS.md): Step-by-step task checklist and progress roadmap.
- [docs/PRD.md](file:///c:/Users/DELL/Equip/docs/PRD.md): Product requirements, user personas, session schedule, and feature scope.
- [docs/ARCHITECTURE.md](file:///c:/Users/DELL/Equip/docs/architecture.md): Technology evaluation, proposed stack, and schema design.
- [docs/DESIGN.md](file:///c:/Users/DELL/Equip/docs/DESIGN.md): Design system, typography, colors, and UI specifications.
- [docs/RULES.md](file:///c:/Users/DELL/Equip/docs/RULES.md): Project rules and implementation standards.
- [docs/DECISIONS.md](file:///c:/Users/DELL/Equip/docs/DECISIONS.md): Architecture decision records (ADRs).
- [docs/TEST_PLAN.md](file:///c:/Users/DELL/Equip/docs/TEST_PLAN.md): Testing checklist and test cases.
- [docs/SECURITY.md](file:///c:/Users/DELL/Equip/docs/SECURITY.md): Data protection, validation, and access control.
