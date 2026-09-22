# TCM data migration

## Purpose

Move the Hostinger `thecodemunk.in` PHP/MySQL system into the MongoDB model used by `app.thecodemunk.in`, while keeping the public website available and preserving a reversible rollback path.

## Source and target

- Source: Hostinger PHP application and MySQL database `u743529483_tcm`.
- Target: the MongoDB database `tcm_ac` used by the OCI TCM backend.
- Public surfaces: `thecodemunk.in` and `app.thecodemunk.in` will eventually consume the same canonical application API.
- Canonical write owner after cutover: the app backend/admin. The Hostinger database becomes a compatibility/read-only source during the transition.

## Safety rules

1. Never run an importer against production without an explicit `--confirm-production` gate.
2. Every import must have a batch ID and be idempotent.
3. Preserve source identifiers in `legacyIds.mysql`.
4. Never overwrite an existing user, payment, wallet or enrollment silently; create a conflict record.
5. Keep the Hostinger application available until post-cutover reconciliation is complete.
6. Treat payments, wallet transactions, withdrawals and enrollments as audit-sensitive records.

## Rollout stages

1. Inventory schemas, counts, indexes, files and operational dependencies.
2. Restore both verified backups into isolated staging locations.
3. Run a dry-run mapping/import and generate a reconciliation report.
4. Import into a staging Mongo database and run application verification.
5. Introduce the public API read path for published landing-page content.
6. Freeze or serialize legacy writes, import the final delta, and cut over.
7. Keep the MySQL backup and legacy deployment available for rollback.

## Current baseline (2026-09-22)

- Hostinger MySQL has 46 users, 17 courses, 411 lessons, 19 course enrollments, 3 program enrollments and 21 payment submissions.
- Atlas MongoDB has 28 users and currently has no course documents.
- A compressed MySQL dump and MongoDB logical backup were created and checksum-verified on the sentinel VPS. Backup locations and checksums are kept outside the repository.

## Importer

`backend/scripts/migrate-from-mysql.js` is inventory/dry-run by default. It covers users/profiles, catalog and learning, programs, commerce and wallets, leads, events and live sessions, applications and portfolios, engagement, CMS content, settings, credentials, and the legacy collaboration records. Missing source references are quarantined as migration conflicts.

Example environment (use a secret manager or an untracked local file):

```bash
MIGRATION_MODE=dry-run \
MIGRATION_MYSQL_HOST=127.0.0.1 \
MIGRATION_MYSQL_PORT=3306 \
MIGRATION_MYSQL_DATABASE=u743529483_tcm \
MIGRATION_MYSQL_USER=... \
MIGRATION_MYSQL_PASSWORD=... \
MIGRATION_MONGO_URI='mongodb+srv://...' \
node backend/scripts/migrate-from-mysql.js
```

Staging writes require `MIGRATION_MODE=staging`. Production additionally requires `MIGRATION_CONFIRM_PRODUCTION=YES`; this guard must remain in place.

`backend/scripts/validate-migration.js` checks duplicate legacy identities, required references and wallet ledger reconciliation. Staging validation refuses to target `tcm_ac` unless production validation is explicitly confirmed.

`backend/scripts/compare-migration-baseline.js` compares every baseline document by `_id` against a merged target. It permits only explicit migration linkage/missing-profile additions for users and approved orphan-token invalidation metadata; any missing or otherwise changed pre-existing document fails the check.
