# TCM One App

Separated React Native frontend and MongoDB backend for Talent & Career Mission.

## Structure

- `frontend` - Expo React Native app with splash, login, and home screens.
- `backend` - Express API using MongoDB through Mongoose.

## Setup

1. Copy backend environment values:

```bash
cp backend/.env.example backend/.env
```

2. Install dependencies:

```bash
npm install
```

3. Start MongoDB locally or update `MONGODB_URI` in `backend/.env`.

For local development against the backend on your laptop, use the Android
emulator loopback host:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api
```

`10.0.2.2` points from the Android emulator back to your laptop. Note this is
only for local dev — production builds bake the API URL from the `TCM_API_URL`
repo variable at build time (see [docs/CI-CD.md](docs/CI-CD.md)).

4. Run the backend:

```bash
npm run dev:backend
```

5. Run the React Native app:

```bash
npm run dev:frontend
```

For Android:

```bash
npm run android
```

If `adb` or `emulator` is not available in your terminal, use these Windows paths or add them to PATH:

```powershell
$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe devices
$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe -list-avds
```

## Demo Login

After seeding MongoDB, use:

- Email: `student@tcm.com`
- Password: `password123`

If the backend is not running, the mobile app opens the home screen with demo fallback data.

## Default API

The frontend uses `EXPO_PUBLIC_API_URL` when present, otherwise it falls back to `http://localhost:5000/api`. In CI/CD, `EXPO_PUBLIC_API_URL` is baked into builds at build time from the `TCM_API_URL` repo variable (default `https://api.thecodemunk.in/api`).

## CI/CD

- **CI Checks** (`.github/workflows/ci-checks.yml`) run on every push to `main` and pull request (path-scoped to `backend/**` and `frontend/**`): backend health check (starts the server without a DB, asserts `/api/health` returns `"ok":true`) and a frontend Android Metro bundle export.
- **Backend** auto-deploys to the OCI Always-Free VM (`140.245.209.147`) via SSH + rsync, installs deps with `npm ci`, restarts the systemd service, and polls the health endpoint; served through Caddy with HTTPS at `api.thecodemunk.in` (Let's Encrypt cert auto-issued).
- **Frontend** Android APK/AAB auto-builds on the GitHub Actions runner (Expo prebuild + local Gradle, no EAS cloud builds), publishes to GitHub Releases + the OCI VM `/dl` hosting, and emails **single-use secret download links** to `cuboidsoft@gmail.com`.
- **OTA** JS updates auto-publish to installed builds (`eas update`, preview + production channels).
- Required GitHub secrets: `OCI_SSH_KEY`, `OCI_HOST`, `OCI_USER`, `DL_ADMIN_TOKEN`, `EXPO_TOKEN` (OTA only), `MAIL_USERNAME`, `MAIL_APP_PASSWORD`, `MAIL_TO`. `MONGODB_URI`, `JWT_SECRET`, and `GEMINI_API_KEY` live in `/opt/tcm/.env` on the VM, not in GitHub.

## CI/CD & Hosting

Full pipeline docs: [`docs/CI-CD.md`](docs/CI-CD.md). Push to `main` → CI checks, backend auto-deploys to the OCI VM, Android APK + AAB auto-build on the GitHub Actions runner, OTA updates publish to the preview channel, and install/download links are emailed to `cuboidsoft@gmail.com`.
