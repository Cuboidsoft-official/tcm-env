#!/usr/bin/env bash
# Forced SSH command for the management server's read-only backup key.
set -euo pipefail
root=/var/backups/tcm/daily
latest=$(find "$root" -mindepth 1 -maxdepth 1 -type d -name '20*T*Z' -printf '%f\n' | sort | tail -1)
[[ -n "$latest" && -f "$root/$latest/SHA256SUMS" ]]
exec tar -cf - -C "$root" "$latest"
