#!/usr/bin/env python3
"""External HTTPS and backup freshness checks; failures surface in systemd/journal."""
import json
import pathlib
import time
import urllib.request

for url in ["https://api.thecodemunk.in/api/health", "https://app.thecodemunk.in/", "https://admin.thecodemunk.in/"]:
    with urllib.request.urlopen(url, timeout=15) as response:
        body = response.read()
        if url.endswith("/health"):
            health = json.loads(body)
            if not health.get("ok") or health.get("mongo") != 1:
                raise RuntimeError("Backend database is unhealthy")
            metrics = health.get("metrics", {})
            requests = metrics.get("requests", 0)
            server_errors = metrics.get("serverErrors", 0)
            if requests >= 10 and server_errors >= 5 and server_errors / requests >= 0.2:
                raise RuntimeError("Backend five-minute 5xx rate is unhealthy")
            if metrics.get("databaseUnavailable", 0) > 0:
                raise RuntimeError("Backend rejected requests because MongoDB was unavailable")
            outbox = health.get("outbox", {})
            if outbox.get("failed", 0) > 0 or outbox.get("stalePending", 0) > 0:
                raise RuntimeError("Backend outbox has failed or stale events")
        elif b'<div id="root"' not in body:
            raise RuntimeError("Web application root missing: " + url)
backups = list(pathlib.Path("/var/backups/tcm-backend").glob("20*T*Z/SHA256SUMS"))
if not backups or time.time() - max(p.stat().st_mtime for p in backups) > 30 * 3600:
    raise RuntimeError("No verified backend backup from the last 30 hours")
object_storage_marker = pathlib.Path("/var/lib/tcm-object-storage-backup/latest")
if not object_storage_marker.exists() or time.time() - object_storage_marker.stat().st_mtime > 30 * 3600:
    raise RuntimeError("No verified Object Storage backup from the last 30 hours")
print("API, database, website, admin and replicated backups healthy")
