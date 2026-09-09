#!/usr/bin/env bash
set -euo pipefail
umask 077
exec 9>/run/lock/tcm-backup.lock
flock -n 9 || exit 0
backup_root=/var/backups/tcm/daily
install -d -m 700 "$backup_root"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
stage=$(mktemp -d "$backup_root/.working-XXXXXX")
trap 'rm -rf "$stage"' EXIT
cd /opt/tcm/backend
# Pass credentials using a private config file, never command arguments or logs.
node --input-type=module - "$stage/mongo.yml" <<'JS'
import fs from 'node:fs';
import dotenv from 'dotenv';
dotenv.config({path:'/opt/tcm/.env'});
if(!process.env.MONGODB_URI) throw new Error('Missing database configuration');
fs.writeFileSync(process.argv[2], 'uri: '+JSON.stringify(process.env.MONGODB_URI)+'\n',{mode:0o600});
JS
mongodump --config="$stage/mongo.yml" --archive="$stage/database.archive.gz" --gzip --quiet
rm "$stage/mongo.yml"
tar -czf "$stage/uploads.tar.gz" -C /opt/tcm uploads
tar -czf "$stage/config.tar.gz" /opt/tcm/.env /etc/caddy /etc/systemd/system/tcm-backend.service /etc/systemd/system/tcm-backend.service.d
(cd "$stage" && sha256sum *.gz > SHA256SUMS)
mv "$stage" "$backup_root/$stamp"
trap - EXIT
# Rotate only complete daily backups after a successful new snapshot.
find "$backup_root" -mindepth 1 -maxdepth 1 -type d -name '20*T*Z' -mtime +7 -exec rm -rf -- {} +
echo "Backup complete: $stamp"
