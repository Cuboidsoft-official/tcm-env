#!/usr/bin/env bash
set -euo pipefail
umask 077
root=/var/backups/tcm-backend
install -d -m 700 "$root"
exec 9>/run/lock/tcm-backup-pull.lock
flock -n 9 || exit 0
stage=$(mktemp -d "$root/.working-XXXXXX")
trap 'rm -rf "$stage"' EXIT
ssh -i /root/.ssh/tcm-backup -o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=yes ubuntu@10.0.0.203 > "$stage/snapshot.tar"
tar -xf "$stage/snapshot.tar" -C "$stage"
rm "$stage/snapshot.tar"
for snapshot in "$stage"/20*T*Z; do
  (cd "$snapshot" && sha256sum -c SHA256SUMS)
  name=$(basename "$snapshot")
  if [[ ! -e "$root/$name" ]]; then mv "$snapshot" "$root/$name"; fi
done
find "$root" -mindepth 1 -maxdepth 1 -type d -name '20*T*Z' -mtime +14 -exec rm -rf -- {} +
echo 'Verified backend backup copied to management server'
