# CI/CD & Hosting

Continuous integration and deployment for the TCM monorepo (npm-workspaces):
an Express + Mongoose backend and an Expo SDK 54 / React Native 0.81.5 frontend.

CI runs on **GitHub Actions**. Deploy targets:

- **Backend** → Cloudflare **Containers** (worker `tcm-backend`, image built from
  `backend/Dockerfile`, config `backend/wrangler.toml`, entry `backend/cloudflare/index.js`).
- **Android** → **EAS Build** (cloud) producing an APK (preview) and an AAB
  (production), uploaded to Cloudflare **R2** bucket `tcm-dist` and served by the
  distribution worker `tcm-dist` (config `dist-worker/wrangler.toml`).
- **Build notifications** → emailed to `cuboidsoft@gmail.com` via Gmail SMTP.

## Pipelines

| Workflow | Trigger | What it does |
|---|---|---|
| **CI Checks** (`ci-checks.yml`) | Push to `main`; pull request to `main`; manual | Backend health check: starts the server without a DB and asserts `GET /api/health` returns `"ok":true`. Frontend check: `npx expo export --platform android` (Metro bundle must succeed). |
| **Deploy Backend to Cloudflare** (`deploy-backend.yml`) | Push to `main` touching `backend/**` or the workflow file; manual | `npx wrangler deploy --config backend/wrangler.toml` → builds the container image from `backend/Dockerfile` and deploys worker `tcm-backend`. Then syncs `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY` as Cloudflare secrets. |
| **Build Android & Publish** (`build-android.yml`) | Push to `main` touching `frontend/**` or the workflow file; push of a `v*` tag; manual | Builds the APK (EAS **preview**) and the AAB (EAS **production**) in the cloud, downloads both to `frontend/dist/`, uploads `latest-release.apk`/`latest-release.aab` + versioned copies to R2 bucket `tcm-dist` (best-effort until R2 is enabled), attaches them as a GitHub Actions artifact, creates a GitHub Release, and emails the **install + download links** to `cuboidsoft@gmail.com`. |
| **Deploy Distribution Worker** (`deploy-dist.yml`) | Push to `main` touching `dist-worker/**` or the workflow file; manual | Ensures the `tcm-dist` R2 bucket exists, then deploys the distribution worker that serves APK/AAB downloads. If R2 is not enabled on the account yet, it skips the deploy with a warning instead of failing. |
| **Deploy OTA Updates** (`deploy-updates.yml`) | Push to `main` touching `frontend/**` or the workflow file; manual | Publishes the JavaScript bundle with `eas update` to the **preview** channel (and **production** on `v*` tag pushes). Devices with an installed build that embeds the matching channel receive the fix instantly — no rebuild, no store release. |

## Install & download sources (before app stores)

Devices can get the app without any app store:

| Source | What it is | Best for |
|---|---|---|
| **EAS builds page** | `https://expo.dev/accounts/tcmacademics-team/projects/the-code-munk/builds` | Primary install — internal distribution APK with QR code, hosted by Expo |
| **GitHub Release** | `https://github.com/Cuboidsoft-official/tcm-env/releases/latest` | Always-available APK + AAB download |
| **R2 + dist worker** | `https://tcm-dist.cuboidsoft.workers.dev/` | Content-addressed hosting of `latest-release.{apk,aab}` + versioned copies (active once R2 is enabled) |

Email is a **notification with links** (never attachments) so inboxes and
builds stay small.

## Developer workflow

Just write code, commit, and push to `main`:

1. **CI checks run** automatically (`ci-checks.yml`) — backend health + frontend bundle.
2. **The backend auto-deploys** to Cloudflare Containers on any `main` push that
   touches `backend/`.
3. **Android APK + AAB auto-build** in EAS (cloud), publish to GitHub Release +
   R2, and the **install/download links are emailed** to `cuboidsoft@gmail.com`.
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
| `CLOUDFLARE_API_TOKEN` | Deploying the backend to Cloudflare Containers (`wrangler deploy`). Needs permission to write workers + containers. |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account for the backend deploy. |
| `MONGODB_URI` | MongoDB Atlas connection string; synced to the Cloudflare worker as a secret. |
| `JWT_SECRET` | Auth token signing; synced to the Cloudflare worker as a secret. |
| `GEMINI_API_KEY` | Gemini AI service; synced to the Cloudflare worker as a secret. |
| `EXPO_TOKEN` | Authenticates `eas-cli` for cloud Android builds and artifact downloads. |
| `R2_ACCESS_KEY_ID` | S3-compatible credentials for uploading APK/AAB to R2. |
| `R2_SECRET_ACCESS_KEY` | S3-compatible credentials for uploading APK/AAB to R2. |
| `R2_ENDPOINT` | R2 S3 API endpoint (region `auto`). |
| `R2_BUCKET` | R2 bucket name, `tcm-dist`. |
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
https://tcm-dist.<workers-subdomain>.workers.dev/apk/latest-release.apk
```

The distribution worker's landing page (`/`) links the latest APK, AAB, and
versioned artifacts. To install:

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

- **MongoDB Atlas network access**: the Cloudflare-hosted backend connects to the
  cluster from Cloudflare egress IPs. Whitelist `0.0.0.0/0` (permissive) or the
  current Cloudflare egress IP range, otherwise `/api/health` reports Mongo as
  unreachable.
- **R2 bucket**: R2 must be **enabled once** in the Cloudflare dashboard (free
  tier); after that, uploads via the S3 API just work.
- **In-memory fallback**: when Mongo is unreachable, the backend serves visual
  seed data from memory so the app remains navigable (this is also how CI checks
  pass without a DB).
- **Cold start**: the backend container sleeps after **15 minutes idle**
  (`sleepAfter = "15m"`); the first request after idle adds latency as the
  container wakes.
- **Distribution worker**: `deploy-dist.yml` creates the `tcm-dist` bucket and
  deploys `dist-worker/wrangler.toml`. While R2 is not enabled in the dashboard,
  the workflow logs a warning and skips — GitHub Releases + EAS install links are
  the working download sources.
- **Working directory**: the EAS steps run with `working-directory: frontend`
  because `app.json`/`eas.json` live there; `npm ci` runs at the repo root
  (npm-workspaces installs everything).

## Cloudflare features in use

- **Workers** — both `tcm-backend` and `tcm-dist` run as Workers.
- **Containers** — `tcm-backend` runs the exact Node/Express backend unchanged
  (container image built from `backend/Dockerfile`, `CMD node src/server.js`).
- **R2** — object storage for Android APK/AAB artifacts (bucket `tcm-dist`).
- **Durable Objects** (optional but wired) — the container is backed by a Durable
  Object (`TCM_BACKEND_CONTAINER`) that holds the container instance.

## Expo features in use / available

- **EAS Build (cloud)** — APK (preview profile) and AAB (production profile) built
  on Expo's infrastructure.
- **EAS internal distribution** — the preview APK is installable directly via
  sideload (or the EAS builds page QR); no Play Store account needed for testing.
- **EAS Update** — OTA JavaScript updates for installed builds, published
  automatically on every push (preview channel) and release tag (production).
- **EAS Submit** — one-command submission to Google Play and the App Store.
