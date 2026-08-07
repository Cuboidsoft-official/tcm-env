# TCM App

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

For Android emulator, keep the frontend API URL as:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api
```

`10.0.2.2` points from the Android emulator back to your laptop.

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

The frontend uses `EXPO_PUBLIC_API_URL` when present, otherwise it falls back to `http://localhost:5000/api`.

## CI/CD

- **CI Checks** (`.github/workflows/ci-checks.yml`) run on every push to `main` and pull request (path-scoped to `backend/**` and `frontend/**`): backend health check (starts the server without a DB, asserts `/api/health` returns `"ok":true`) and a frontend Android Metro bundle export.
- **Backend** auto-deploys to the OCI Always-Free VM (`140.245.209.147`) via SSH + rsync on push to `main`, served through Caddy (HTTPS at `api.thecodemunk.in` once DNS is set).
- **Frontend** Android APK/AAB auto-builds in EAS, publishes to GitHub Releases + the OCI VM `/dl` static hosting, and emails install/download links to `cuboidsoft@gmail.com`.
- **OTA** JS updates auto-publish to installed builds (`eas update`, preview + production channels).
- Required GitHub secrets: `OCI_SSH_KEY`, `OCI_HOST`, `OCI_USER`, `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `EXPO_TOKEN`, `MAIL_USERNAME`, `MAIL_APP_PASSWORD`, `MAIL_TO`.

## CI/CD & Hosting

Full pipeline docs: [`docs/CI-CD.md`](docs/CI-CD.md). Push to `main` → CI checks, backend auto-deploys to the OCI VM, Android APK + AAB auto-build in EAS, OTA updates publish to the preview channel, and install/download links are emailed to `cuboidsoft@gmail.com`.
