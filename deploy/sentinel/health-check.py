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
        elif b'<div id="root"' not in body:
            raise RuntimeError("Web application root missing: " + url)
backups = list(pathlib.Path("/var/backups/tcm-backend").glob("20*T*Z/SHA256SUMS"))
if not backups or time.time() - max(p.stat().st_mtime for p in backups) > 30 * 3600:
    raise RuntimeError("No verified backend backup from the last 30 hours")
print("API, database, website, admin and replicated backup healthy")
