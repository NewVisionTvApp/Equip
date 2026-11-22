# Equip recovery runbook

## What is live

- Worker: `equip` in the Cloudflare account connected to this project.
- Database: D1 `equip-db`, bound as `DB` in `wrangler.jsonc`.
- Source: `https://github.com/NewVisionTvApp/Equip`.
- Participant profiles, registrations, attendance, and authentication live in D1. A Worker code rollback does not restore D1 data.

## Before a release

1. Record the current Git commit, Worker deployment version, and time in UTC.
2. Check the latest D1 Time Travel bookmark with `pnpm exec wrangler d1 time-travel info equip-db --json` while authenticated to the correct account.
3. For a separate offline backup, run `pnpm exec wrangler d1 export equip-db --remote --output <private-path>.sql`. The export contains participant contact details and password hashes. Keep it encrypted, outside the repository, and accessible only to authorized administrators.
4. Apply only the pending migration files from `drizzle/migrations`, then deploy the matching Worker code. Keep the migration and deployment times together in the release note.

## If attendance or registration stops saving

1. Stop check-in at the affected desk and write down the affected programme and session. Do not continue making local-only check-ins; the shared roster must be the source of truth.
2. Check `/api/public/programme` and the Worker deployment status. A 503 from protected APIs usually means a missing D1 binding or auth secret; a 401 means the staff session needs sign-in.
3. Verify the `equip-db` binding and check the latest Worker logs. Do not put participant details, cookies, reset links, or secret values in an issue or chat.
4. If the Worker code is faulty, roll back to the last working Worker version. Check schema compatibility first. Rolling back code does not roll back D1.

## If D1 data is damaged

1. Pause writes and identify the last known good UTC time. Preserve an encrypted current export for investigation.
2. Inspect the corresponding bookmark without changing data: `pnpm exec wrangler d1 time-travel info equip-db --timestamp <RFC3339-UTC> --json`.
3. Compare the expected recovery point with the latest registrations and check-ins. A restore discards later database writes; reconcile any paper check-in records before deciding.
4. Only after explicit approval of the selected point, run `pnpm exec wrangler d1 time-travel restore equip-db --bookmark <bookmark>`.
5. Verify login, participant count, active event, and attendance for one synthetic or administrator-owned record. Replay legitimate check-ins that occurred after the restore.

Do not run a restore as a diagnostic step. Contact a second administrator before a production restore when available.
