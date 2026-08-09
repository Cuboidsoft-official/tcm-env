# CI/CD & Hosting

Continuous integration and deployment for the TCM monorepo (npm-workspaces):
an Express + Mongoose backend and an Expo SDK 54 / React Native 0.81.5 frontend.

CI runs on **GitHub Actions**. Deploy targets:

- **Backend** → Oracle Cloud **Always Free** VM (`tcm-backend`,
  `140.245.209.147`). Deployed by `rsync` over SSH on every `main` push
  touching `backend/**`. Served in production through **Caddy** (HTTPS) at
  `https://api.thecodemunk.in/api`.
- **Android** → built **on the GitHub Actions runner** (Expo prebuild + local
  Gradle, no EAS cloud builds). Produces `app-preview.apk` (installable, signed
  with the **release keystore** from CI secrets) and `app-release.aab` (Play
  Store upload file — production-signed and ready to submit). Artifacts are
  published to **GitHub Releases** and hosted statically on the OCI VM at
  `https://api.thecodemunk.in/dl/...`.
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
| **Build Android & Publish** (`build-android.yml`) | Push to `main` touching `frontend/**` or the workflow file; push of a `v*` tag; manual | Installs deps (`npm ci` at repo root), runs `npx expo prebuild --platform android --no-install` and `./gradlew assembleRelease bundleRelease` **on the GitHub runner**. Copies `app-release.apk` → `dist/app-preview.apk` and `app-release.aab` → `dist/app-release.aab`, with a zero-byte guard (`test -s`). If the `FIREBASE_SERVICE_ACCOUNT` secret is set, distributes the APK to testers via **Firebase App Distribution** (`firebase-tools appdistribution:distribute`, gated on the secret). Pushes both to `/opt/tcm/dist/` on the OCI VM via **atomic `scp`** (`.upload-` temp files then `mv`). Creates a GitHub Release (deleting/re-creating the tag with `gh release delete --cleanup-tag`), and emails install + download + testers links; emails a failure notification on failure. Uses the **global** `build-android` concurrency group. |
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
| **OCI VM /dl (one-time link)** | `https://api.thecodemunk.in/dl/<file>?t=<token>` — secret, **single-use** link minted per build and emailed to the recipient | Primary install — direct APK download hosted on our own VM; the link works exactly once, then 410 |
| **GitHub Release** | `https://github.com/Cuboidsoft-official/tcm-env/releases/latest` | Always-available APK + AAB download (private repo — downloads require a collaborator login) |
| **Firebase App Distribution** | Testers added in the Firebase console (project `tcmindia`) get every `main` build pushed to them automatically | Pre-release builds for trusted testers (max 500) with in-app "install from email" — NOT a public channel |

The `api` A record → `140.245.209.147` at Hostinger is live (verified resolving
against 8.8.8.8 and 1.1.1.1 on **2026-08-08**); Caddy holds a valid Let's
Encrypt cert for `api.thecodemunk.in`. The `/dl` path is reverse-proxied to the
`tcm-dl` service (`127.0.0.1:5200`), which only serves a file if the request
carries a valid one-time token. There is **no longer any basic-auth password** —
access is gated purely by the per-build single-use token in the emailed link.

- `app-preview.apk` is the **installable** app — download this to sideload.
- `app-release.aab` is the **Play Store upload file** — it CANNOT be
  installed on a device. Since the production-signing update it is **signed with
  the release keystore** (provided via the `ANDROID_KEYSTORE_BASE64` /
  `ANDROID_KEYSTORE_PASS` / `ANDROID_KEY_ALIAS` GitHub secrets), so it is ready to
  upload to Play Console. The workflow fails the build if the keystore's SHA-1
  does not match the `certificate_hash` in `frontend/google-services.json`.
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
| `TCM_DL_USER` | (obsolete) Former basic-auth user for the VM `/dl/`. Kept for history — the one-time link system (`DL_ADMIN_TOKEN`) replaced basic auth on 2026-08-08. |
| `TCM_DL_PASS` | (obsolete) Former basic-auth password for the VM `/dl/`. Kept for history — no longer used. |
| `DL_ADMIN_TOKEN` | Admin secret for the `tcm-dl` service. It is written to `/opt/tcm/dl-server/.env` (root 0600) by the `deploy-dl-server.yml` workflow; the build workflow reads it **on the VM** to mint one-time download links, so it never appears in GitHub Actions logs or on the runner. |
| `MAIL_USERNAME` | Gmail address used as the SMTP sender for build emails. |
| `MAIL_APP_PASSWORD` | Gmail app password (2FA app-specific) for SMTP. |
| `MAIL_TO` | Recipient of build emails — defaults to `cuboidsoft@gmail.com` when unset. |
| `TCM_BACKEND_ENV` | **Multiline** content of the backend `.env` (`PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `GEMINI_API_KEY`, `SMTP_*`). The deploy workflow writes it to `/opt/tcm/backend/.env` on the VM (root-owned, 0600). Optional — skip and provision `.env` manually. |
| `EXPO_TOKEN` | **OTA updates only** — authenticates `eas-cli` for EAS Update. Not used for Android builds (those run on the GitHub runner). |
| `FIREBASE_SERVICE_ACCOUNT` | **Optional** — base64-encoded Firebase service-account JSON (project `tcmindia`) with the **Firebase App Distribution Admin** role. When set, the Android build distributes `app-preview.apk` to testers via Firebase App Distribution. When unset, that step is skipped entirely. To create it: Firebase console → Project settings → Service accounts → Generate new private key, then `base64 -w0 <file>.json`. Add the service-account email as an **Owner or App Distribution Admin** in IAM. |

The backend runtime env (`MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`,
`SMTP_*`, ...) is stored as the single secret `TCM_BACKEND_ENV` and is only
referenced by the deploy workflow's provisioning step — no other workflow reads
it. It lands on the VM as `/opt/tcm/backend/.env` (root 0600), which the
systemd service loads via `dotenv`.

### Repo variable (not a secret)

`TCM_API_URL` is a GitHub Actions **repository variable**
(Settings → Secrets and variables → Actions → Variables). It is baked into
builds and updates as `EXPO_PUBLIC_API_URL`:

```yaml
EXPO_PUBLIC_API_URL: ${{ vars.TCM_API_URL || 'https://api.thecodemunk.in/api' }}
```

- Default (no variable set): `https://api.thecodemunk.in/api`.
- The repo variable is currently set to `https://api.thecodemunk.in/api`.

Optional **repository variables** (Settings → Secrets and variables → Actions → Variables)
control Firebase App Distribution. Their defaults match the live Firebase app,
so you only need to set them if that changes:

- `FIREBASE_APP_ID` — default `1:1018503930810:android:5d51d97b49df10940af383`
  (matches `mobilesdk_app_id` in `google-services.json`).
- `FIREBASE_TESTER_GROUP` — default `testers`. Must match a tester group that
  exists in the Firebase console (App Distribution → Testers), otherwise the
  distribute step fails.

## Immediate device install

After any Android build, the emailed **one-time link** opens the APK directly:

```
https://api.thecodemunk.in/dl/app-preview.apk?t=<single-use-token>
```

The `/dl/` path on the VM is served by the `tcm-dl` service and only responds
when the request carries a valid, **unused** token (minted by the build
workflow). A used/expired token returns `410`; a missing token returns `403`.
To install:

1. Open the APK link from the build email on the Android device (or download it on desktop and transfer).
2. Allow installs from **unknown sources** when prompted.
3. Install — `app-preview.apk` is signed (release keystore from CI) and can be sideloaded directly.

## Next steps for stores

- **Google Play**: the `app-release.aab` is now signed with the **production
  release keystore** (the same `ANDROID_KEYSTORE_*` secrets used for CI signing),
  so it is ready to upload via Play Console or `eas-cli submit`. Note: after
  uploading to Play with this keystore you must not change it — Play's app
  signing key becomes permanent.
- **App Store**: the pipeline only builds Android; there is no iOS build
  configured in CI.
- **OTA JS updates**: already wired (`expo-updates`). The `deploy-updates.yml`
  workflow publishes to the **preview** channel on every `main` push and to
  **production** on `v*` tag pushes.

## Operational notes

- **MongoDB Atlas network access**: whitelist the VM IP `140.245.209.147`
  **and** the dev machine IP (this box: `152.59.29.184`)
  (Atlas → Network Access → Add IP address). Until the VM IP is whitelisted the
  backend serves the in-memory seed fallback (`mongo:0`) and there is **no real
  database**.
- **Health endpoint**: `GET /api/health` returns
  `{"ok":true,"service":"tcm-backend","mongo":<readyState>}`. `ok` is **always
  true** (server up); `mongo` reports Mongoose's `readyState` (`1` = connected
  to Atlas, `0` = running on the in-memory seed fallback). CI and deploy checks
  assert `"ok":true` only — they say nothing about the database; use `mongo`
  to check real DB connectivity.
- **VM public IP**: `140.245.209.147` is ephemeral — stopping/recreating the
  instance can change it. If it changes, update `OCI_HOST`, the Atlas whitelist,
  and the `api` A record.
- **In-memory fallback**: when Mongo is unreachable, the backend serves visual
  seed data from memory so the app remains navigable (this is also how CI checks
  pass without a DB).
- **DNS / HTTPS**: the `api` A record → `140.245.209.147` (Hostinger DNS zone
  editor) is live and `https://api.thecodemunk.in/...` works. Caddy holds a
  valid Let's Encrypt certificate (auto-issued once the record propagated).
- **Artifact hosting**: Cloudflare R2 is **not** used. APK/AAB live on the VM
  (`/opt/tcm/dist`), served by the `tcm-dl` service at `/dl/` behind a
  **single-use token** (no basic auth since 2026-08-08), and on GitHub
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
