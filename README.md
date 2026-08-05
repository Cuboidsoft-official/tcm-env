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
