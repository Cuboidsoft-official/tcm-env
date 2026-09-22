# MySQL to MongoDB production readiness

Status: **NO-GO for live cutover; staging implementation is verified.**

## Proven evidence

- The verified Mongo archive was restored into an isolated Atlas database: 155 documents and all archived indexes restored, zero failures.
- A fresh copy of the restored app database was merged with the live Hostinger MySQL source twice.
- The merge resulted in 59 users: 28 existing app users retained, 15 linked to MySQL identities by normalized email, and 31 newly imported.
- The second import inserted no users, courses or tokens and preserved the 15 target-owned user records.
- All 155 pre-existing documents were compared by `_id` against an independent baseline restore. None were missing; target-owned fields were unchanged. Existing users only received migration linkage metadata and missing legacy profile fields.
- Thirteen pre-existing push tokens referenced users already absent from the app backup. They were marked invalid, not deleted or reassigned.
- Expected target counts matched; duplicate migration identities, active orphan references and wallet reconciliation mismatches were all zero.
- Backend migration/model syntax, model imports and the three production behavior tests pass.
- Hostinger media was copied off-host to the sentinel: 50 files, 21,041,341 bytes and 50 SHA-256 manifest entries. The database has 24 valid local references, 34 external avatar URLs and four missing legacy references.

## Launch blockers

1. **Application compatibility:** imported course, program, enrollment, payment, wallet, lead, event, CMS and notification collections need production API/admin read-path smoke tests. The current app does not yet expose every new collection through completed user journeys.
2. **Source write control:** Hostinger MySQL is still receiving writes. A short write freeze or a reviewed change-data-capture/outbox bridge is required for the final delta.
3. **Media serving cutover:** an off-host checksum backup exists, but the application still needs durable target object paths and URL rewrites. Four broken legacy references (two avatars and two payment screenshots) must remain explicitly quarantined.
4. **Backup durability:** Atlas M0 has no native backup policy. Before cutover, either upgrade to a backup-capable tier or activate scheduled encrypted logical backups to OCI Object Storage with retention and restore monitoring.
5. **Operational signals:** add migration/cutover dashboards or at minimum alerts for API health, authentication errors, Mongo connection failures, 5xx rate and failed write/outbox events.
6. **Credential rotation:** rotate the Atlas database credential exposed during migration diagnostics and update the OCI backend secret before cutover.
7. **Authentication smoke test:** validate migrated PHP bcrypt (`$2y$`) users with designated non-privileged test accounts and verify password-reset fallback.
8. **Ownership:** name the cutover commander, Hostinger owner, OCI owner and product acceptance owner for the change window.

## Release recommendation

Do not import directly into the current `tcm_ac`. Create a fresh clone named `tcm_ac_v2`, merge MySQL into it, validate and switch the backend connection only after API/user-journey smoke tests. Keep `tcm_ac` and Hostinger MySQL unchanged through the rollback window.

The production importer requires both `MIGRATION_MODE=production` and `MIGRATION_CONFIRM_PRODUCTION=YES`. That gate must not be bypassed.
