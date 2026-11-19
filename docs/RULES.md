# Development Rules (RULES.md)

## 1. General Principles
- **Explicit Build Approval:** Never run local builds (`npm run build`, `wrangler build`, etc.) or cloud deployment commands without prior explicit user consent.
- **No Remote Infrastructure:** Do not create cloud resources, accounts, or services without explicit user direction.
- **Small Vertical Slices:** Implement one complete user flow at a time (e.g. public registration form -> ID generation -> database persistence).
- **Preserve Separation:** Keep `Equip` completely decoupled from any other repository or project (such as New Vision TV).
- **Synthetic Data Only:** Never use real personal or church data in tests, seed files, or documentation.

## 2. Code Quality & Architecture
- **TypeScript First:** Strict type checking across the entire project.
- **Relational Integrity:** Keep `participants` (profiles) strictly decoupled from `registrations` (monthly event instances).
- **No Logic in Presentation:** Keep database queries, ID generation, and validation logic in dedicated service/lib layers, separate from UI components.
- **Input Validation:** Validate all inputs server-side using standard schemas (e.g. Zod) before database operations.
- **Idempotency & Duplicate Prevention:** Ensure duplicate registrations for the same event by the same participant are gracefully handled and prevented via database unique constraints (`participant_id`, `event_id`).

## 3. UI & Accessibility (Impeccable Standards)
- **Mobile Responsive:** All pages must look clean and operate flawlessly on mobile viewports (360px–420px) up to desktop (1440px).
- **Accessible Forms:** All inputs must have explicit `<label>` associations, clear focus rings, and proper keyboard navigation.
- **States:** Always provide Loading, Error, and Empty states for every interactive component.

## 4. Documentation & Git
- Maintain `STATUS.md` and `TASKS.md` with accurate progress.
- Record significant technical choices in `docs/DECISIONS.md`.
- Make focused, logical git commits after each working vertical slice.
