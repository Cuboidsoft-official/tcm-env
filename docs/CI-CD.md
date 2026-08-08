# CI/CD & Hosting

Continuous integration and deployment for the TCM monorepo (npm-workspaces):
an Express + Mongoose backend and an Expo SDK 54 / React Native 0.81.5 frontend.

CI runs on **GitHub Actions**. Deploy targets:

- **Backend** → Oracle Cloud **Always Free** VM (`tcm-backend`,
  `140.245.209.147`). Deployed by `rsync` over SSH on every `main` push
  touching `backend/**`. Served in production through **Caddy** (HTTPS) at
  `https://api.thecodemunk.in/api` once DNS resolves.
- **Android** → built **on the GitHub Actions runner** (Expo prebuild + local
  Gradle, no EAS cloud builds). Produces `app-preview.apk` (installable,
  debug-keystore signed via the Expo prebuild default) and `app-release.aab`
  (Play Store upload file — not store-submittable without a production
  keystore). Artifacts are published to **GitHub Releases** and hosted
  statically on the OCI VM at `https://api.thecodemunk.in/dl/...` (or
  `http://140.245.209.147/dl/...` until DNS resolves).
- **OTA updates** → **EAS Update** to the `preview` channel on every `main`
  push (JS-only fixes reach installed builds instantly) and to `production` on
  `v*` tag pushes.
- **Build notifications** → emailed to `cuboidsoft@gmail.com` via Gmail SMTP
  (success and failure).

## Pipelines

| Workflow | Trigger | What it does |
|---|---|---|
| **CI Checks** (`ci-checks.yml`) | Push/PR to `main` touching `backend/**`, `frontend/**`, or the workflow file; manual | Backend health: installs deps with `npm ci --workspace=backend`, starts the server **without a DB**, and polls `http://localhost:5000/api/health` asserting `"ok":true` (up to 15 polls × 2 s). Frontend bundle: `npm ci --workspace=frontend`, then `npx expo export --platform android` (Metro bundle must succeed). |
| **Deploy Backend to OCI VM** (`deploy-backend-oci.yml`) | Push to `main` touching `backend/**` or the workflow file; manual | SSH (key `OCI_SSH_KEY`) into `OCI_USER@OCI_HOST`, `rsync --delete --delay-updates` the backend (excluding `node_modules` and `.env`), `npm ci --omit=dev` on the VM, restart the systemd unit `tcm-backend`, then poll `http://127.0.0.1:5000/api/health` on the VM for `"ok":true` (up to 30 polls × 2 s = 60 s). Serialized by the `tcm-backend-deploy` concurrency group. |
| **Build Android & Publish** (`build-android.yml`) | Push to `main` touching `frontend/**` or the workflow file; push of a `v*` tag; manual | Installs deps (`npm ci` at repo root), runs `npx expo prebuild --platform android --no-install` and `./gradlew assembleRelease bundleRelease` **on the GitHub runner**. Copies `app-release.apk` → `dist/app-preview.apk` and `app-release.aab` → `dist/app-release.aab`, with a zero-byte guard (`test -s`). Pushes both to `/opt/tcm/dist/` on the OCI VM via **atomic `scp`** (`.upload-` temp files then `mv`). Creates a GitHub Release (deleting/re-creating the tag with `gh release delete --cleanup-tag`), and emails install + download links; emails a failure notification on failure. Uses the **global** `build-android` concurrency group. |
| **Deploy OTA Updates** (`deploy-updates.yml`) | Push to `main` touching `frontend/**` or the workflow file; manual | Publishes the JavaScript bundle with `npx eas-cli@21 update` to the **preview** channel on every push, and to **production** on `v*` tag pushes (requires `EXPO_TOKEN`). Devices with an installed build embedding the matching channel receive the fix instantly — no rebuild, no store release. Uses the global `eas-update` concurrency group. |

## Backend server (Oracle VM)

- Host `tcm-backend` — Oracle Cloud Always Free, public IP `140.245.209.147`.
- Node service supervised by systemd unit `tcm-backend.service`, binding port
  **5000** (the server listens on all interfaces).
- **Caddy** (ports 80/443) reverse-proxies to `127.0.0.1:5000`, terminates TLS
  via Let's Encrypt once DNS resolves, and serves the `/dl/*` static artifact
  folder behind HTTP basic auth.
- Layout:
  - `/opt/tcm/backend` — `rsync` deploy target for the backend source.
  - `/opt/tcm/dist` — static folder served by Caddy at `/dl/` (APK/AAB downloads).
  - `/opt/tcm/.env` — root-owned (0600) environment file with the live secrets
    (`MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`). Provisioned **manually on
    the VM** — no workflow writes it.
  - `/etc/systemd/system/tcm-backend.service`, `/etc/caddy/Caddyfile`.

## Install & download sources (before app stores)

Devices can get the app without any app store:

| Source | What it is | Best for |
|---|---|---|
| **OCI VM static hosting** | `https://api.thecodemunk.in/dl/` (basic-auth protected; user `TCM_DL_USER` / password from the build email) | Primary install — direct APK download hosted on our own VM, gated by a tester password |
| **GitHub Release** | `https://github.com/Cuboidsoft-official/tcm-env/releases/latest` | Always-available APK + AAB download (private repo — downloads require a collaborator login) |

**Important** — DNS is **not live yet**. The `api` A record →
`140.245.209.147` at Hostinger is REQUIRED for the HTTPS/domain links above,
and as of **2026-08-07** it is not resolving (verified NXDOMAIN against
8.8.8.8 and 1.1.1.1). Until it resolves, use the direct fallback:

```
http://140.245.209.147/dl/app-preview.apk
http://140.245.209.147/dl/app-release.aab
```

- `app-preview.apk` is the **installable** app — download this to sideload.
- `app-release.aab` is the **Play Store upload file only** — it CANNOT be
  installed on a device, and it is NOT Play-Store submittable as-is: it is
  signed with the debug keystore that `expo prebuild` generates by default,
  not a production keystore.
- Email is a **notification with links** (never attachments) so inboxes and
  builds stay small.

## Developer workflow

Just write code, commit, and push to `main`:

1. **CI checks run** automatically (`ci-checks.yml`) — backend health + frontend bundle.
2. **The backend auto-deploys** to the OCI VM on any `main` push that touches
   `backend/`.
3. **Android APK + AAB auto-build** on the GitHub Actions runner, publish to
   GitHub Release + the OCI VM `/dl`, and the **install/download links are
   emailed** to `cuboidsoft@gmail.com`.
4. **OTA updates auto-publish** to the `preview` channel, so installed builds pick
   up JS fixes immediately.

No release process, no tagging required for a test build — a plain push to `main`
produces a fresh APK you can sideload immediately.

To build the Android release from a **specific point**, push a `v*` tag (e.g.
`git tag v1.2.0 && git push origin v1.2.0`). This triggers the same runner build
from that exact commit.

## Required GitHub secrets

Set these in **Settings → Secrets and variables → Actions**. Never put real
values in the repo.

| Secret | Used for |
|---|---|
| `OCI_SSH_KEY` | Private SSH key for the deploy to the Oracle VM. |
| `OCI_HOST` | Backend VM public IP, `140.245.209.147`. |
| `OCI_USER` | SSH user on the VM. |
| `TCM_DL_USER` | Basic-auth user for the VM `/dl/` artifact downloads. |
| `TCM_DL_PASS` | Basic-auth password for the VM `/dl/` artifact downloads. |
| `MAIL_USERNAME` | Gmail address used as the SMTP sender for build emails. |
| `MAIL_APP_PASSWORD` | Gmail app password (2FA app-specific) for SMTP. |
| `MAIL_TO` | Recipient of build emails — defaults to `cuboidsoft@gmail.com` when unset. |
| `EXPO_TOKEN` | **OTA updates only** — authenticates `eas-cli` for EAS Update. Not used for Android builds (those run on the GitHub runner). |

**Not GitHub secrets:** `MONGODB_URI`, `JWT_SECRET`, and `GEMINI_API_KEY` are
**not** read by any workflow. They are used by the backend at runtime and live
in `/opt/tcm/.env` on the VM (root-owned, 0600), provisioned manually — no
workflow writes them. Keep them out of GitHub Secrets.

### Repo variable (not a secret)

`TCM_API_URL` is a GitHub Actions **repository variable**
(Settings → Secrets and variables → Actions → Variables). It is baked into
builds and updates as `EXPO_PUBLIC_API_URL`:

```yaml
EXPO_PUBLIC_API_URL: ${{ vars.TCM_API_URL || 'http://140.245.209.147/api' }}
```

- Default (no variable set): `http://140.245.209.147/api`.
- To flip to HTTPS once DNS is live: set the repo variable to
  `https://api.thecodemunk.in/api` and rebuild.

## Immediate device install

After any Android build, the APK is available at:

```
https://api.thecodemunk.in/dl/app-preview.apk
```

(until DNS is set, use `http://140.245.209.147/dl/app-preview.apk`). The `/dl/`
folder on the VM serves every uploaded artifact and is **password-protected**
(basic auth, user from `TCM_DL_USER` / password from the build email). To install:

1. Open the APK link on the Android device (or download it on desktop and transfer).
2. Allow installs from **unknown sources** when prompted.
3. Install — `app-preview.apk` is signed (Expo prebuild default debug keystore)
   and can be sideloaded directly.

## Next steps for stores

- **Google Play**: the current `app-release.aab` is built with the debug
  keystore generated by `expo prebuild` and is **NOT submittable**. To ship to
  the Play Store you must configure a **production Android keystore** (via EAS
  credentials or a local keystore with the standard signing properties) and
  build/sign with it. `npx eas-cli submit --platform android` works only after
  that production keystore exists.
- **App Store**: the pipeline only builds Android; there is no iOS build
  configured in CI.
- **OTA JS updates**: already wired (`expo-updates`). The `deploy-updates.yml`
  workflow publishes to the **preview** channel on every `main` push and to
  **production** on `v*` tag pushes.

## Operational notes

- **MongoDB Atlas network access**: whitelist the VM IP `140.245.209.147`
  (Atlas → Network Access → Add IP address). Until then the backend serves the
  in-memory seed fallback and there is **no real database**.
- **Health endpoint**: `GET /api/health` returns
  `{"ok":true,"service":"tcm-backend"}` **unconditionally** — it does **not**
  report Mongo/DB state. CI and deploy health checks only assert `"ok":true`;
  they say nothing about the database.
- **VM public IP**: `140.245.209.147` is ephemeral — stopping/recreating the
  instance can change it. If it changes, update `OCI_HOST`, the Atlas whitelist,
  and the `api` A record.
- **In-memory fallback**: when Mongo is unreachable, the backend serves visual
  seed data from memory so the app remains navigable (this is also how CI checks
  pass without a DB).
- **DNS / HTTPS**: the `api` A record → `140.245.209.147` (Hostinger DNS zone
  editor) is REQUIRED for `https://api.thecodemunk.in/...`. As of **2026-08-07**
  it is **not resolving** (NXDOMAIN on 8.8.8.8/1.1.1.1), so HTTPS/domain links
  do not work — use `http://140.245.209.147/...`. Caddy issues a Let's Encrypt
  certificate automatically once DNS resolves.
- **Artifact hosting**: Cloudflare R2 is **not** used. APK/AAB live on the VM
  (`/opt/tcm/dist`, served by Caddy at `/dl/` behind basic auth) and on GitHub
  Releases (private repo — downloads require a collaborator login).
- **Android build runs on the runner** (Expo prebuild + local Gradle) instead
  of EAS Build because the EAS free-plan build quota was exhausted; the free
  plan resets **Sep 1, 2026**. `EXPO_TOKEN` is therefore only needed for OTA
  updates.
- **Working directory**: build steps run with `working-directory: frontend`
  (and `frontend/android` for Gradle) because `app.json`/`eas.json` live there;
  `npm ci` runs at the repo root (npm-workspaces installs everything).
- **Concurrency / races**: the Android build uses the **global** `build-android`
  group (serializes the release-tag delete/create and `scp` to the VM so rapid
  pushes don't race); `tcm-backend-deploy` serializes backend deploys;
  `eas-update` is global for OTA publishes. Artifact uploads are protected by a
  zero-byte guard and atomic `scp`+`mv`, and build failures trigger a failure
  email.

## Expo features in use

- **Expo prebuild** — generates the native Android project on the CI runner.
- **EAS Update** — OTA JavaScript updates for installed builds, published
  automatically on every push (preview channel) and release tag (production).
- **EAS Build** — **not** used; Android builds run on the GitHub Actions
  runner via `expo prebuild` + `./gradlew assembleRelease bundleRelease`.
- **EAS Submit** — not currently usable until a production Android keystore is
  configured.
