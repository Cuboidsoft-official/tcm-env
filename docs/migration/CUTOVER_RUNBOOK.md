# TCM database cutover runbook

## Ownership and success criteria

Assign named people before scheduling:

- Cutover commander: coordinates go/no-go and timeline.
- Data operator: runs backups, restore, importer and reconciliation.
- Application operator: deploys the backend/API and switches Mongo configuration.
- Product verifier: validates login, admin, learning and payment histories.

Success means existing app data remains intact; migrated users can authenticate; admin can find users, courses, programs, enrollments and payments; wallets reconcile; public Hostinger pages remain available; and no writes are lost between the final MySQL snapshot and Mongo activation.

## Preparation (at least one day before)

1. Resolve every launch blocker in `PRODUCTION_READINESS.md`.
2. Confirm the backend, sentinel and Object Storage backup timers are healthy; perform an isolated restore drill. Record acceptance of the residual single-account/region risk or add an independent backup provider.
3. Rotate database and SSH credentials that were shared during setup.
4. Deploy the target schema/API code without activating new read paths.
5. Run the importer against a fresh production-data clone and complete critical user journey tests.
6. Inventory and checksum all referenced media; copy it to durable target storage.
7. Announce the write-freeze window and rollback deadline.

## Change-window sequence

1. Record UTC/IST start time, operators and current Git SHAs.
2. Enable maintenance/write freeze for Hostinger mutations while keeping public reads available.
3. Confirm no unexpected MySQL writes for five minutes.
4. Create fresh MySQL and Mongo logical backups; checksum and copy them off-host.
5. Restore the fresh Mongo backup into a new `tcm_ac_v2` database.
6. Run a production-confirmed MySQL import into `tcm_ac_v2` with a unique batch ID and snapshot label.
7. Run `backend/scripts/validate-migration.js` with exact expected counts.
8. Review all migration conflicts. Only the approved orphan classes may remain unresolved.
9. Run authentication, admin, course/enrollment, payment/wallet, notification and media smoke tests against `tcm_ac_v2`.
10. Switch the OCI backend Mongo connection to `tcm_ac_v2`, restart one backend instance, and verify `/api/health` plus critical journeys.
11. Activate the second instance only after the first passes.
12. Keep Hostinger mutations frozen until post-switch reconciliation is complete.

## Abort thresholds

Abort and roll back for any of the following:

- unexpected user identity collision;
- missing or duplicate financial/enrollment records;
- wallet mismatch;
- broken authentication for designated test users;
- active orphan references not present in the approved conflict list;
- sustained API 5xx or Mongo connection failures;
- missing referenced media;
- unexplained count drift after the write freeze.

## Rollback

1. Point the OCI backend back to the untouched `tcm_ac` connection and restart the affected instance(s).
2. Verify `/api/health`, login and the previous critical user journeys.
3. Re-enable Hostinger writes only after confirming MySQL remained canonical during the failed window.
4. Preserve `tcm_ac_v2`, logs, batch record and conflict records for investigation; do not retry with the same batch ID until the cause is understood.
5. Record the incident, data window and next decision.

## Post-cutover

1. Monitor continuously for at least two hours and review again after 24 hours.
2. Reconcile counts and financial ledgers after new writes begin.
3. Keep the old databases and backups read-only through the agreed rollback retention period.
4. Only then move the PHP site to versioned app APIs and retire MySQL write paths incrementally.
