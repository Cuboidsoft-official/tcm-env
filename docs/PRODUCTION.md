# Production operations

Verified 2026-09-09 against OCI and both running servers.

| Service | Host | Runtime |
| --- | --- | --- |
| API, persistent uploads, legacy download/admin services | `tcm-backend`, `140.245.209.147`, private `10.0.0.203` | Ubuntu, Node 22, systemd, Caddy |
| Website and admin dashboard | `cynik-free-sentinel`, `140.245.249.14`, private `10.0.0.124` | Ubuntu, Caddy, atomic static releases |
| Application database | MongoDB Atlas, database `tcm_ac` | External database, not stored on either VM |

The hosting tenancy has one subscribed region (`ap-hyderabad-1`) and these two running E2.1.Micro instances. Both have about 1 GiB RAM and 2 GiB swap. This is a small single-backend deployment, without automatic failover. Capacity/load testing and a separate-region disaster recovery deployment are not included.

## Runtime and deployment

- API: `https://api.thecodemunk.in/api/health`; healthy production response requires HTTP 200, `ok:true` and `mongo:1`.
- Website: `https://app.thecodemunk.in`; admin: `https://admin.thecodemunk.in`.
- `/opt/tcm/backend` points to a versioned directory under `/opt/tcm/releases`.
- `/opt/tcm/.env` is root-owned, mode 0600, and loaded by systemd. Deployment never overwrites it from a potentially stale GitHub secret.
- `/etc/systemd/system/tcm-backend.service.d/production.conf` sets production mode, loopback binding, `UPLOADS_DIR=/opt/tcm/uploads` and `PUBLIC_ORIGIN=https://api.thecodemunk.in`.
- Uploaded files are independent of application releases. Never rsync-delete `/opt/tcm/uploads` or put it inside a release.
- The service has a read-only filesystem except the upload directory and private temporary storage; capabilities are cleared. Caddy owns public HTTP/HTTPS. SSH is key-only; host and OCI firewalls allow SSH and web ports, not application ports.
- CI tests startup, failed writes, media recovery and the standalone dependency lockfile. Backend deployments stage/install before switching the symlink, then require database health. Failed activation restores the previous symlink.
- Roll back using `sudo bash /opt/tcm/releases/<release>/activate.sh /opt/tcm/releases/<release>` after reviewing that release and its config. Do not use an old release lacking the production fixes.
- Retain known-good releases; inspect `/opt/tcm/releases` periodically for disk usage. Do not remove the active symlink target.

Production refuses database-free startup and rejects requests while disconnected. Failed post writes return an error instead of an invented successful post. Temporary device/blob media URLs are rejected on post creation. Demo admin/partner creation and automatic seed cleanup are disabled in production. Missing/deleted users cannot authenticate via the former mock-user fallback.

## Media and backups

Disk is the primary media store. MongoDB holds optional copies of files up to 15 MiB; larger files rely on the filesystem backups. This stays below MongoDB's [16 MiB document limit](https://www.mongodb.com/docs/manual/core/gridfs/). Media recovery hydrates a real Buffer and can restore a missing disk file from an existing database copy.

- Backend `tcm-backup.timer`: daily at 02:30 UTC, with up to five minutes jitter.
- `/var/backups/tcm/daily/<UTC timestamp>` contains compressed MongoDB archive, uploads, runtime/proxy configuration and SHA256 checksums. Completed backups older than seven days are rotated after a new successful backup.
- Sentinel `tcm-backup-pull.timer`: daily at 03:30 UTC, retains copies for fourteen days under `/var/backups/tcm-backend`. A dedicated, source-restricted SSH key can only export completed backups; private keys are not committed.
- The initial backup was copied to sentinel and all checksums verified. Its MongoDB archive was actually restored to a temporary database; 27 users and two posts were verified, then only the temporary restore database was removed.
- OCI boot-volume recovery baselines were requested for both machines on 2026-09-09. These are manual baselines, not recurring volume backup policies. Application backups above are scheduled.
- Both servers remain in the same region/account. These backups are not protection against losing the entire OCI account/region. MongoDB dumps are logical backups, not a transaction-consistent point-in-time recovery service across all collections.

Check or run backups:

```bash
sudo systemctl start tcm-backup.service              # backend
sudo journalctl -u tcm-backup.service -n 30
sudo systemctl start tcm-backup-pull.service         # sentinel
sudo journalctl -u tcm-backup-pull.service -n 30
```

Restore into a new isolated database first using `mongorestore --gzip --archive=<archive> --nsFrom='tcm_ac.*' --nsTo='<new_database>.*' --config=<root-only-uri-file>`. Compare collection counts and indexes. Never use `--drop` against the live database. For files, verify SHA256SUMS and extract into a staging directory before copying selected missing files into `/opt/tcm/uploads`. Preserve ownership `ubuntu:ubuntu`. Restore runtime secrets only after reviewing the backup's age and any subsequent credential rotations.

## Monitoring

Sentinel `tcm-health.timer` checks API/database health, website/admin HTML and replicated-backup freshness every five minutes. Failures appear in systemd and the journal:

```bash
sudo systemctl --failed
sudo journalctl -u tcm-health.service -n 30
sudo journalctl -u tcm-backend.service -n 50          # backend
```

No email, Slack or other outbound alert recipient has been configured. Health checks are not automatic incident response. Set an approved alert destination before relying on unattended operations.

## Incident findings and verification

- Latest source `db9c564` referenced `governmentRouter` without importing it; production was crash-looping with more than 2,700 restarts.
- The backend-specific lockfile was stale, breaking `npm ci` on the VM even though workspace installs succeeded locally.
- The existing 240 MiB persistent media directory was not configured in runtime; deployment deleted the backend-relative upload directory.
- Missing HTTPS public origin produced HTTP image links. Two stored documents were repaired and one missing JPEG restored from MongoDB. At least one older referenced image had no surviving file or database copy; a fix cannot recreate deleted bytes.
- A private synthetic photo post was uploaded through the live authenticated HTTPS API, checked in MongoDB, fetched byte-for-byte, and rechecked after restarting the service. Removing only that synthetic image from disk also verified database restoration. All synthetic test records/files were cleaned up.
- Default admin and partner passwords were replaced with generated credentials. Recovery values are in the ignored local `secrets/production-credentials-20260909.json`, mode 0600, and root-only incident recovery storage on the backend. They are not in GitHub or this document.
- Website Caddy routing, camera/photo permissions and cache headers were corrected. Service-worker caching excludes API and cross-origin requests, and the cache version was bumped.

This incident work is not a complete application authorization audit. Media URLs are public URLs; marking a post private does not create private object storage. Review the application's privacy and authorization design separately before storing confidential media.
