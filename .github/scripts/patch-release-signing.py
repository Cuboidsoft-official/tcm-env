#!/usr/bin/env python3
"""Inject a release signingConfig into the expo-prebuilt android/app/build.gradle.

Reads credentials from env (set from GitHub secrets in CI):
  ANDROID_KEYSTORE_PATH   path to the release keystore (already written on disk)
  ANDROID_KEYSTORE_PASS   store + key password
  ANDROID_KEY_ALIAS       key alias

Uses line-based edits so brace balance is never disturbed.
"""
import os
import re
import sys

BUILD_GRADLE = "android/app/build.gradle"
KEYSTORE = os.environ.get("ANDROID_KEYSTORE_PATH", "android/app/tcm-release.keystore")
STORE_PASS = os.environ.get("ANDROID_KEYSTORE_PASS", "")
KEY_ALIAS = os.environ.get("ANDROID_KEY_ALIAS", "tcm-release")

if not STORE_PASS:
    print("ANDROID_KEYSTORE_PASS not set", file=sys.stderr)
    sys.exit(1)

with open(BUILD_GRADLE, "r") as f:
    lines = f.readlines()

# 1) Add release signing config right after the `signingConfigs {` line (if not already there).
out = []
release_inserted = False
for line in lines:
    out.append(line)
    if not release_inserted and line.strip() == "signingConfigs {":
        keystore_basename = os.path.basename(KEYSTORE)
        out.append(
            f"        release {{\n"
            f"            storeFile file('{keystore_basename}')\n"
            f"            storePassword '{STORE_PASS}'\n"
            f"            keyAlias '{KEY_ALIAS}'\n"
            f"            keyPassword '{STORE_PASS}'\n"
            f"        }}\n"
        )
        release_inserted = True
lines = out

if not release_inserted:
    print("signingConfigs block not found", file=sys.stderr)
    sys.exit(1)

# 2) Inside the `release` buildType, point signingConfig at signingConfigs.release.
#    Scoped to the buildTypes block only.
out = []
in_build_types = False
in_release = False
depth = 0
for line in lines:
    stripped = line.strip()
    if not in_build_types and stripped == "buildTypes {":
        in_build_types = True
        depth = 1
        out.append(line)
        continue
    if in_build_types:
        depth += line.count("{") - line.count("}")
        if in_release and "signingConfig" in line and "signingConfigs.debug" in line:
            line = line.replace(
                "signingConfig signingConfigs.debug",
                "signingConfig signingConfigs.release",
            )
        if not in_release and stripped == "release {":
            in_release = True
        if in_release and depth == 1 and line.rstrip().endswith("}"):
            in_release = False
        if depth <= 0:
            in_build_types = False
        out.append(line)
        continue
    out.append(line)
lines = out

with open(BUILD_GRADLE, "w") as f:
    f.writelines(lines)

print(f"Patched {BUILD_GRADLE} to sign release with {KEY_ALIAS}")
