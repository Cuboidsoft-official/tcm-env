#!/usr/bin/env python3
"""Verify the Android signing keystore SHA-1 matches google-services.json."""
import json
import os
import subprocess
import sys

KEYSTORE = "android/app/tcm-release.keystore"


def main():
    storepass = os.environ.get("ANDROID_KEYSTORE_PASS", "")
    alias = os.environ.get("ANDROID_KEY_ALIAS", "")

    if not storepass or not alias:
        print("::error::ANDROID_KEYSTORE_PASS / ANDROID_KEY_ALIAS not set")
        return 1

    proc = subprocess.run(
        [
            "keytool", "-list", "-v", "-keystore", KEYSTORE,
            "-storepass", storepass, "-alias", alias,
        ],
        capture_output=True,
        text=True,
    )

    sha1 = ""
    for line in proc.stdout.splitlines():
        if line.strip().lower().startswith("sha1:"):
            sha1 = line.split(":", 1)[1].strip().replace(":", "")
            break

    if not sha1:
        print(f"::error::Could not read SHA-1 from signing keystore ({KEYSTORE}, alias={alias})")
        print(proc.stderr.strip())
        return 1

    with open("google-services.json", encoding="utf-8") as f:
        data = json.load(f)

    hashes = [
        c["android_info"]["certificate_hash"]
        for c in data["client"][0]["oauth_client"]
        if c.get("android_info", {}).get("certificate_hash")
    ]
    expected = hashes[0] if hashes else ""

    if not expected:
        print("::error::No Android certificate_hash found in google-services.json")
        return 1

    print(f"Signing keystore SHA-1: {sha1}")
    print(f"google-services.json certificate_hash: {expected}")

    if sha1 != expected:
        print(f"::error::Signing keystore SHA-1 ({sha1}) does NOT match google-services.json certificate_hash ({expected}).")
        print(f"::error::Fix by updating the OAuth SHA-1 fingerprint in the Firebase console to {sha1}, then regenerate google-services.json.")
        return 1

    print("certificate_hash matches signing keystore")
    return 0


if __name__ == "__main__":
    sys.exit(main())
