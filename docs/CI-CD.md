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
| **Build Android & Publish** (`build-android.yml`) | Push to `main` touching `frontend/**` or the workflow file; push of a `v*` tag; manual | Builds the APK (EAS **preview** profile) and the AAB (EAS **production** profile) in the cloud, downloads both, uploads `latest-release.apk`, `latest-release.aab`, and versioned copies to R2 bucket `tcm-dist`, attaches them as a GitHub Actions artifact, and emails the download links to `cuboidsoft@gmail.com`. |

> The distribution worker workflow (`deploy-dist.yml`) does not exist yet; see
> "Operational notes" below.

## Developer workflow

Just write code, commit, and push to `main`:

1. **CI checks run** automatically (`ci-checks.yml`) — backend health + frontend bundle.
2. **The backend auto-deploys** to Cloudflare Containers on any `main` push that
   touches `backend/`.
3. **Android APK + AAB auto-build** in EAS (cloud), upload to R2, and the download
   links are **emailed to `cuboidsoft@gmail.com`**.

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
- **Optional — OTA JS updates**: enable `expo-updates` and run `eas update` to
  push JavaScript-only fixes to installed builds without a new store release.

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
- **Distribution worker**: the `tcm-dist` worker (`dist-worker/wrangler.toml`)
  does not exist in the repo yet. Until it is deployed, R2 objects are uploaded
  but there is no public URL serving them. The build email currently contains a
  literal `<replace-with-workers-subdomain>` placeholder that must be updated to
  the real workers.dev subdomain.

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
  sideload; no Play Store account needed for testing.
- **EAS Update (available next)** — OTA JavaScript updates for installed builds.
- **EAS Submit (available next)** — one-command submission to Google Play and the
  App Store.
