#!/usr/bin/env bash
#
# Builds signed Android APKs + AAB for the TCM Expo app using LOCAL Gradle
# (no EAS build / no Expo account / no EXPO_TOKEN required).
#
# Signing uses Expo's MYAPP_UPLOAD_* gradle.properties mechanism:
#   - ANDROID_KEYSTORE_BASE64   -> decoded into android/app/upload.keystore
#   - ANDROID_KEYSTORE_PASSWORD -> MYAPP_UPLOAD_STORE_PASSWORD
#   - ANDROID_KEY_ALIAS         -> MYAPP_UPLOAD_KEY_ALIAS
#   - ANDROID_KEY_PASSWORD      -> MYAPP_UPLOAD_KEY_PASSWORD
#
# BOOTSTRAP: if ANDROID_KEYSTORE_BASE64 is empty, a throwaway keystore is
# generated with keytool, exported to <repo>/bootstrap-keystore/ (uploaded as a
# workflow artifact), and the exact secret values are echoed so the user can
# store them. The build still signs and succeeds on the first run.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$FRONTEND_DIR/android"

# --- 1. Android SDK env (GitHub ubuntu runner default path) ----------------
if [ -z "${ANDROID_HOME:-}" ]; then
  export ANDROID_HOME="/usr/local/lib/android/sdk"
fi
if [ -z "${ANDROID_SDK_ROOT:-}" ]; then
  export ANDROID_SDK_ROOT="/usr/local/lib/android/sdk"
fi

# --- 2. Non-interactive mode for expo (prebuild has no --non-interactive) ---
if [ "${CI:-}" != "true" ] && [ "${CI:-}" != "1" ]; then
  export CI=1
fi
export EXPO_NO_TELEMETRY="${EXPO_NO_TELEMETRY:-1}"

echo "ANDROID_HOME=$ANDROID_HOME"
echo "ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT"

# --- 3. expo prebuild (managed workflow -> android/) -----------------------
cd "$FRONTEND_DIR"
if [ -d android ]; then
  echo "Removing existing android/ for a clean prebuild..."
  rm -rf android
fi
npx expo prebuild --platform android --no-install

# --- 4. Signing config -------------------------------------------------------
cd "$ANDROID_DIR"

KEYSTORE_FILE="app/upload.keystore"

ANDROID_KEYSTORE_BASE64="${ANDROID_KEYSTORE_BASE64:-}"
ANDROID_KEYSTORE_PASSWORD="${ANDROID_KEYSTORE_PASSWORD:-}"
ANDROID_KEY_ALIAS="${ANDROID_KEY_ALIAS:-}"
ANDROID_KEY_PASSWORD="${ANDROID_KEY_PASSWORD:-}"

mkdir -p "$(dirname "$KEYSTORE_FILE")"

if [ -n "$ANDROID_KEYSTORE_BASE64" ]; then
  if [ -z "$ANDROID_KEYSTORE_PASSWORD" ] || [ -z "$ANDROID_KEY_ALIAS" ] || [ -z "$ANDROID_KEY_PASSWORD" ]; then
    echo "::error::ANDROID_KEYSTORE_BASE64 is set but one of ANDROID_KEYSTORE_PASSWORD / ANDROID_KEY_ALIAS / ANDROID_KEY_PASSWORD is missing."
    exit 1
  fi
  echo "$ANDROID_KEYSTORE_BASE64" | base64 -d > "$KEYSTORE_FILE"
  chmod 600 "$KEYSTORE_FILE" 2>/dev/null || true
  echo "Decoded $KEYSTORE_FILE from ANDROID_KEYSTORE_BASE64 ($(wc -c < "$KEYSTORE_FILE") bytes)."
else
  echo "::warning::ANDROID_KEYSTORE_BASE64 is empty - generating a temporary keystore (bootstrap)."
  command -v keytool >/dev/null 2>&1 || { echo "::error::keytool not found - cannot bootstrap keystore."; exit 1; }
  STORE_PASS="$ANDROID_KEYSTORE_PASSWORD"
  KEY_PASS="$ANDROID_KEY_PASSWORD"
  ALIAS="$ANDROID_KEY_ALIAS"
  if [ -z "$STORE_PASS" ]; then STORE_PASS="$(openssl rand -hex 12)"; fi
  if [ -z "$KEY_PASS" ]; then KEY_PASS="$STORE_PASS"; fi
  if [ -z "$ALIAS" ]; then ALIAS="tcm-upload"; fi
  keytool -genkeypair -v \
    -keystore "$KEYSTORE_FILE" \
    -alias "$ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$STORE_PASS" -keypass "$KEY_PASS" \
    -dname "CN=TCM Android, OU=TCM, O=TCM, L=Unknown, ST=Unknown, C=US"
  ANDROID_KEYSTORE_PASSWORD="$STORE_PASS"
  ANDROID_KEY_PASSWORD="$KEY_PASS"
  ANDROID_KEY_ALIAS="$ALIAS"
  mkdir -p "$FRONTEND_DIR/bootstrap-keystore"
  cp "$KEYSTORE_FILE" "$FRONTEND_DIR/bootstrap-keystore/upload.keystore"
  echo "===================================================================="
  echo "BOOTSTRAP: temporary upload keystore created. To keep a stable key,"
  echo "add these repository secrets (values below), then re-run the workflow:"
  echo "  ANDROID_KEYSTORE_BASE64   = $(base64 -w0 "$KEYSTORE_FILE")"
  echo "  ANDROID_KEYSTORE_PASSWORD = $STORE_PASS"
  echo "  ANDROID_KEY_PASSWORD      = $KEY_PASS"
  echo "  ANDROID_KEY_ALIAS         = $ALIAS"
  echo "The keystore is also attached to the 'tcm-android-upload-keystore' artifact."
  echo "===================================================================="
fi

# Append signing properties to android/gradle.properties (idempotent).
GRADLE_PROPS="gradle.properties"
if [ -f "$GRADLE_PROPS" ]; then
  if grep -qE '^MYAPP_UPLOAD_' "$GRADLE_PROPS"; then
    echo "Removing previous MYAPP_UPLOAD_* lines from $GRADLE_PROPS..."
    grep -vE '^MYAPP_UPLOAD_(STORE_FILE|STORE_PASSWORD|KEY_ALIAS|KEY_PASSWORD)=' "$GRADLE_PROPS" > "$GRADLE_PROPS.tmp"
    mv "$GRADLE_PROPS.tmp" "$GRADLE_PROPS"
  fi
else
  echo "::error::$GRADLE_PROPS missing - did expo prebuild succeed?"; exit 1
fi
cat >> "$GRADLE_PROPS" <<EOF

# Appended by scripts/build-android.sh (Expo MYAPP_UPLOAD_* signing mechanism)
MYAPP_UPLOAD_STORE_FILE=app/upload.keystore
MYAPP_UPLOAD_STORE_PASSWORD=${ANDROID_KEYSTORE_PASSWORD}
MYAPP_UPLOAD_KEY_ALIAS=${ANDROID_KEY_ALIAS}
MYAPP_UPLOAD_KEY_PASSWORD=${ANDROID_KEY_PASSWORD}
EOF
echo "Wrote signing properties to android/gradle.properties."

# --- 5. Release signing gate (Expo SDK 54 caveat) ---------------------------
# The Expo SDK 54 template does NOT gate the release signingConfig on
# MYAPP_UPLOAD_STORE_FILE (it signs release with the debug keystore). If the
# gate is absent, apply the standard React Native release signing config so the
# release APK/AAB are signed with the upload keystore.
if ! grep -q 'MYAPP_UPLOAD_STORE_FILE' app/build.gradle; then
  echo "::warning::app/build.gradle has no MYAPP_UPLOAD_STORE_FILE gate (Expo SDK 54 template signs release with the debug keystore)."
  echo "Patching in the standard React Native MYAPP_UPLOAD_* release signing config..."
  python3 - app/build.gradle <<'PY'
import re
import sys

path = sys.argv[1]
src = open(path, encoding="utf-8").read()

if "MYAPP_UPLOAD_STORE_FILE" in src:
    sys.exit(0)

debug_end = "keyPassword 'android'\n        }\n    }"
release_sc = (
    "        release {\n"
    "            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {\n"
    "                storeFile file(MYAPP_UPLOAD_STORE_FILE)\n"
    "                storePassword MYAPP_UPLOAD_STORE_PASSWORD\n"
    "                keyAlias MYAPP_UPLOAD_KEY_ALIAS\n"
    "                keyPassword MYAPP_UPLOAD_KEY_PASSWORD\n"
    "            }\n"
    "        }\n"
    "    }"
)
if debug_end not in src:
    print("::error::unexpected app/build.gradle layout - could not locate the debug signingConfig block", file=sys.stderr)
    sys.exit(1)
src = src.replace(
    debug_end,
    "keyPassword 'android'\n        }\n" + release_sc,
    1,
)

m = re.search(
    r"(buildTypes \{\n        debug \{\n.*?\n        \}\n        release \{\n)(.*?signingConfig signingConfigs\.debug)",
    src,
    re.S,
)
if not m:
    print("::error::could not locate the release signingConfig assignment in app/build.gradle", file=sys.stderr)
    sys.exit(1)
patched_release = m.group(2).replace("signingConfig signingConfigs.debug", "signingConfig signingConfigs.release", 1)
src = src[: m.start()] + m.group(1) + patched_release + src[m.end() :]

open(path, "w", encoding="utf-8").write(src)
print("Patched app/build.gradle: release buildType now signs with signingConfigs.release (MYAPP_UPLOAD_*).")
PY
fi
grep -n 'signingConfigs\.release\|MYAPP_UPLOAD' app/build.gradle || true

# --- 6. Build: debug APK, release APK, release AAB ---------------------------
cd "$ANDROID_DIR"
chmod +x gradlew
./gradlew :app:assembleDebug :app:assembleRelease :app:bundleRelease

# --- 7. Verify artifacts + export version -------------------------------------
DEBUG_APK="app/build/outputs/apk/debug/app-debug.apk"
RELEASE_APK="app/build/outputs/apk/release/app-release.apk"
RELEASE_AAB="app/build/outputs/bundle/release/app-release.aab"

for f in "$DEBUG_APK" "$RELEASE_APK" "$RELEASE_AAB"; do
  if [ ! -f "$f" ]; then
    echo "::error::Expected artifact not found: $f"
    exit 1
  fi
  echo "Artifact: $ANDROID_DIR/$f ($(du -h "$f" | cut -f1))"
done

TCM_APP_VERSION="$(cd "$FRONTEND_DIR" && node -p "require('./app.json').expo.version" 2>/dev/null || true)"
if [ -n "${GITHUB_ENV:-}" ] && [ -n "$TCM_APP_VERSION" ]; then
  echo "TCM_APP_VERSION=$TCM_APP_VERSION" >> "$GITHUB_ENV"
fi

echo "Build complete. App version: ${TCM_APP_VERSION:-unknown}"
