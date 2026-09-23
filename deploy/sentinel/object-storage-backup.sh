#!/usr/bin/env bash
set -euo pipefail

umask 077
exec 9>/run/lock/tcm-object-storage-backup.lock
flock -n 9 || exit 0

backup_root=/var/backups/tcm-backend
state_root=/var/lib/tcm-object-storage-backup
env_file=/etc/tcm/object-storage-backup.env
oci_bin=/opt/oci-cli/bin/oci

test -x "$oci_bin"
test -r "$env_file"
# Contains identifiers only; authentication uses the sentinel instance principal.
# shellcheck disable=SC1090
source "$env_file"
: "${TCM_BACKUP_BUCKET:?Missing TCM_BACKUP_BUCKET}"
: "${TCM_BACKUP_NAMESPACE:?Missing TCM_BACKUP_NAMESPACE}"

snapshot=$(find "$backup_root" -mindepth 1 -maxdepth 1 -type d -name '20*T*Z' -printf '%f\n' | sort | tail -n 1)
test -n "$snapshot"
snapshot_dir="$backup_root/$snapshot"
test -s "$snapshot_dir/SHA256SUMS"

(cd "$snapshot_dir" && sha256sum -c SHA256SUMS)

for file in "$snapshot_dir"/SHA256SUMS "$snapshot_dir"/*.gz; do
  test -s "$file"
  name="production/$snapshot/$(basename "$file")"
  "$oci_bin" --auth instance_principal os object put \
    --namespace-name "$TCM_BACKUP_NAMESPACE" \
    --bucket-name "$TCM_BACKUP_BUCKET" \
    --name "$name" \
    --file "$file" \
    --no-overwrite \
    --no-multipart \
    --verify-checksum >/dev/null
  "$oci_bin" --auth instance_principal os object head \
    --namespace-name "$TCM_BACKUP_NAMESPACE" \
    --bucket-name "$TCM_BACKUP_BUCKET" \
    --name "$name" >/dev/null
done

install -d -m 700 "$state_root"
printf '%s\n' "$snapshot" > "$state_root/latest"
echo "Verified Object Storage backup: $snapshot"
