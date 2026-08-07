# CI/CD & Hosting

Continuous integration and deployment for the TCM monorepo (npm-workspaces):
an Express + Mongoose backend and an Expo SDK 54 / React Native 0.81.5 frontend.

CI runs on **GitHub Actions**. Deploy targets:

- **Backend** → Oracle Cloud **Always Free** VM (`tcm-backend`,
  `140.245.209.147`, Ubuntu 24.04, Node 24, systemd). Deployed by `rsync` over
  SSH on every `main` push touching `backend/**`. Served in production through
  **Caddy** (HTTPS) at `https://api.thecodemunk.in/api`.
- **Android** → **EAS Build** (cloud) producing an APK (preview) and an AAB
  (production), published to **GitHub Releases** and hosted statically on the
  OCI VM itself (`https://api.thecodemunk.in/dl/...`, or
  `http://140.245.209.147/dl/...` before DNS).
- **OTA updates** → **EAS Update** to the `preview` channel (JS-only fixes reach
  installed builds instantly).
- **Build notifications** → emailed to `cuboidsoft@gmail.com` via Gmail SMTP.

## Pipelines

| Workflow | Trigger | What it does |
|---|---|---|
| **CI Checks** (`ci-checks.yml`) | Push/PR to `main` touching `backend/**`, `frontend/**`, or the workflow file; manual | Backend health check: starts the server without a DB and asserts `GET /api/health` returns `"ok":true`. Frontend check: `npx expo export --platform android` (Metro bundle must succeed). |
| **Deploy Backend to OCI VM** (`deploy-backend-oci.yml`) | Push to `main` touching `backend/**` or the workflow file; manual | SSH (key `OCI_SSH_KEY`) into `OCI_USER@OCI_HOST`, `rsync --delete` the backend (excluding `node_modules`, `.env`, `dist`), `npm install --omit=dev`, restart the systemd unit `tcm-backend`, and poll `GET http://OCI_HOST/api/health` until it's healthy. |
| **Build Android & Publish** (`build-android.yml`) | Push to `main` touching `frontend/**` or the workflow file; push of a `v*` tag; manual | Builds the APK (EAS **preview**) and the AAB (EAS **production**) in the cloud, downloads both to `frontend/dist/`, scp's them to `/opt/tcm/dist/` on the OCI VM (served at `/dl/` by Caddy), creates a GitHub Release, and emails the **install + download links** to `cuboidsoft@gmail.com`. |
| **Deploy OTA Updates** (`deploy-updates.yml`) | Push to `main` touching `frontend/**` or the workflow file; manual | Publishes the JavaScript bundle with `eas update` to the **preview** channel (and **production** on `v*` tag pushes). Devices with an installed build that embeds the matching channel receive the fix instantly — no rebuild, no store release. |

## Backend server (Oracle VM)

- Host `tcm-backend` — Oracle Always Free, `VM.Standard.E2.1.Micro`
  (1 OCPU / 1 GB RAM), region `ap-hyderabad-1`, public IP `140.245.209.147`.
- Ubuntu 24.04, Node 24 (nodesource), runs as user `ubuntu`, port **5000**,
  supervised by systemd unit `tcm-backend.service`.
- **Caddy** (systemd, ports 80/443) reverse-proxies to `127.0.0.1:5000`,
  terminates TLS via Let's Encrypt, serves the `/dl/*` static artifact folder,
  and keeps the raw-IP URL (`http://140.245.209.147/api`) working for CI health
  polls.
- Hardening: password SSH disabled, root login disabled, fail2ban active,
  snapd/fwupd/multipathd disabled, 2 GB swap, iptables open on 22/80/443 only.
- Layout: `/opt/tcm/backend` (deploy target), `/opt/tcm/dist` (APK/AAB static
  hosting), `/opt/tcm/.env` (root-owned secrets),
  `/etc/systemd/system/tcm-backend.service`, `/etc/caddy/Caddyfile`.

## Install & download sources (before app stores)

Devices can get the app without any app store:

| Source | What it is | Best for |
|---|---|---|
| **EAS builds page** | `https://expo.dev/accounts/tcmacademics-team/projects/the-code-munk/builds` | Primary install — internal distribution APK with QR code, hosted by Expo |
| **GitHub Release** | `https://github.com/Cuboidsoft-official/tcm-env/releases/latest` | Always-available APK + AAB download |
| **OCI VM static hosting** | `https://api.thecodemunk.in/dl/` (directory listing) | Direct APK/AAB download hosted on our own VM |

Email is a **notification with links** (never attachments) so inboxes and
builds stay small.

## Developer workflow

Just write code, commit, and push to `main`:

1. **CI checks run** automatically (`ci-checks.yml`) — backend health + frontend bundle.
2. **The backend auto-deploys** to the OCI VM on any `main` push that touches
   `backend/`.
3. **Android APK + AAB auto-build** in EAS (cloud), publish to GitHub Release +
   the OCI VM, and the **install/download links are emailed** to `cuboidsoft@gmail.com`.
4. **OTA updates auto-publish** to the `preview` channel, so installed builds pick
   up JS fixes immediately.

No release process, no tagging required for a test build — a plain push to `main`
produces a fresh APK you can sideload immediately.

To build the Android release from a **specific point**, push a `v*` tag (e.g.
`git tag v1.2.0 && git push origin v1.2.0`). This triggers the same EAS build
from that exact commit.

## Required GitHub secrets

Set these in **Settings → Secrets and variables → Actions**. Never put real
values in the repo.

| Secret | Used for |
|---|---|
| `OCI_SSH_KEY` | Private SSH key for the deploy to the Oracle VM (`ubuntu@140.245.209.147`). |
| `OCI_HOST` | Backend VM public IP, `140.245.209.147`. |
| `OCI_USER` | SSH user on the VM, `ubuntu`. |
| `MONGODB_URI` | MongoDB Atlas connection string; written to `/opt/tcm/.env` on the VM. |
| `JWT_SECRET` | Auth token signing; written to `/opt/tcm/.env` on the VM. |
| `GEMINI_API_KEY` | Gemini AI service; written to `/opt/tcm/.env` on the VM. |
| `EXPO_TOKEN` | Authenticates `eas-cli` for cloud Android builds, OTA updates, and artifact downloads. |
| `EXPO_PUBLIC_API_URL` | Backend base URL baked into builds/updates (`http://140.245.209.147/api`; switch to `https://api.thecodemunk.in/api` once DNS is live). |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded Android keystore — for the **local-gradle fallback** (the current EAS build uses EAS-managed credentials, not these). |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password (local-gradle fallback). |
| `ANDROID_KEY_ALIAS` | Signing key alias (local-gradle fallback). |
| `ANDROID_KEY_PASSWORD` | Signing key password (local-gradle fallback). |
| `MAIL_USERNAME` | Gmail address used as the SMTP sender for build emails. |
| `MAIL_APP_PASSWORD` | Gmail app password (2FA app-specific) for SMTP. |
| `MAIL_TO` | Recipient of build emails — defaults to `cuboidsoft@gmail.com` when unset. |

## Immediate device install

After any Android build, the APK is available at:

```
https://api.thecodemunk.in/dl/app-preview.apk
```

(until DNS is set, use `http://140.245.209.147/dl/app-preview.apk`). The `/dl/`
directory listing on the VM links every uploaded artifact. To install:

1. Open the APK link on the Android device (or download it on desktop and transfer).
2. Allow installs from **unknown sources** when prompted.
3. Install — the APK is signed for direct sideloading.

## Next steps for stores

- **Google Play**: run `npx eas-cli submit --platform android` (or use the EAS
  dashboard). Requires a Google Play developer account and a service account JSON
  set up in EAS credentials.
- **App Store**: run `npx eas-cli submit --platform ios`. Requires an Apple
  Developer account and an iOS bundle identifier.
- **OTA JS updates**: already wired (`expo-updates` + `updates.url`). The
  `deploy-updates.yml` workflow publishes to the **preview** channel on every
  `main` push and to **production** on `v*` tag pushes.

## Operational notes

- **MongoDB Atlas network access**: whitelist the VM IP `140.245.209.147`
  (Atlas → Network Access → Add IP address). Until then the backend serves the
  in-memory seed fallback and `/api/health` reports Mongo as unreachable.
- **VM public IP**: `140.245.209.147` is ephemeral — stopping/recreating the
  instance can change it. If it changes, update `OCI_HOST`, the Atlas whitelist,
  the `api` A record, and the Caddy raw-IP block.
- **In-memory fallback**: when Mongo is unreachable, the backend serves visual
  seed data from memory so the app remains navigable (this is also how CI checks
  pass without a DB).
- **HTTPS / domain**: `api.thecodemunk.in` → `140.245.209.147` (A record at the
  Hostinger DNS zone editor). Caddy issues a Let's Encrypt certificate
  automatically once DNS resolves; until then HTTPS is unavailable but HTTP works.
- **Artifact hosting**: R2 was intentionally not used; APK/AAB live on the VM
  (`/opt/tcm/dist`, served by Caddy at `/dl/`) and on GitHub Releases.
- **Working directory**: the EAS steps run with `working-directory: frontend`
  because `app.json`/`eas.json` live there; `npm ci` runs at the repo root
  (npm-workspaces installs everything).
- **Concurrency**: backend deploys and EAS publishes are serialized with
  `concurrency` groups so rapid pushes don't race.

## Expo features in use / available

- **EAS Build (cloud)** — APK (preview profile) and AAB (production profile) built
  on Expo's infrastructure.
- **EAS internal distribution** — the preview APK is installable directly via
  sideload (or the EAS builds page QR); no Play Store account needed for testing.
- **EAS Update** — OTA JavaScript updates for installed builds, published
  automatically on every push (preview channel) and release tag (production).
- **EAS Submit** — one-command submission to Google Play and the App Store.
