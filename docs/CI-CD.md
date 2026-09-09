# CI/CD and hosting

See [Production operations](PRODUCTION.md) for verified host inventory, persistence, backups, monitoring, recovery and incident findings.

- **CI Checks**: backend startup/persistence regression tests, standalone backend clean install, development health smoke test, Expo Android/web bundle exports, admin build, informational dependency audit.
- **Deploy Backend to OCI VM**: changes to backend/deployment files on `main` stage a new release on `140.245.209.147`. Tests and dependency installation run before activation. The service must report a connected MongoDB; failed activation restores the previous release. Source synchronization excludes secrets, dependencies and uploads. Runtime secrets stay in `/opt/tcm/.env`.
- **Deploy Expo Web to Cyber Sentinel**: builds the Expo web app on the runner and publishes a versioned static release on `140.245.249.14`. Caddy configuration is validated before reload.
- **Deploy Admin to Cyber Sentinel**: builds and publishes the admin dashboard to the same web server.
- **Android releases and OTA updates**: manual workflows or version-tag pushes; ordinary web/backend pushes do not publish native releases.

Repository variables `BACKEND_HOST`, `BACKEND_USER`, `SENTINEL_HOST`, `SENTINEL_USER` select deployment targets. `OCI_SSH_KEY` supplies SSH authentication. `TCM_API_URL` supplies the native API URL. Web builds use `https://api.thecodemunk.in/api`.

The old `TCM_BACKEND_ENV` provisioning flow is intentionally removed: it could overwrite corrected runtime configuration with stale values. Edit the protected VM environment file when an intentional configuration change is needed, validate it, and restart the service. Never print environment files into workflow logs.
