#!/usr/bin/env bash
# Run as root after syncing source and installing dependencies in a new release.
set -euo pipefail
release=${1:?release directory required}
[[ "$release" == /opt/tcm/releases/* && -s "$release/src/server.js" ]]
exec 9>/run/lock/tcm-deploy.lock
flock -w 180 9
previous=$(readlink -f /opt/tcm/backend)
install -d -o ubuntu -g ubuntu /opt/tcm/uploads
install -d /etc/systemd/system/tcm-backend.service.d
install -m 644 "$release/production.conf" /etc/systemd/system/tcm-backend.service.d/production.conf
systemctl daemon-reload
if [[ ! -L /opt/tcm/backend ]]; then
  previous="/opt/tcm/releases/legacy-$(date -u +%Y%m%d%H%M%S)"
  mv /opt/tcm/backend "$previous"
fi
ln -s "$release" /opt/tcm/backend.next
mv -Tf /opt/tcm/backend.next /opt/tcm/backend
systemctl restart tcm-backend
for attempt in $(seq 1 45); do
  if curl -fsS --max-time 3 http://127.0.0.1:5000/api/health | /usr/bin/node -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>{try{const h=JSON.parse(s);process.exit(h.ok&&h.mongo===1?0:1)}catch{process.exit(1)}})' 2>/dev/null; then
    echo "Healthy release: $release"
    exit 0
  fi
  sleep 2
done
echo 'Deployment failed; restoring previous release' >&2
ln -s "$previous" /opt/tcm/backend.next
mv -Tf /opt/tcm/backend.next /opt/tcm/backend
systemctl restart tcm-backend
exit 1
