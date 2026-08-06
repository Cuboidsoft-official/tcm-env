'use strict';

const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function readFile(rel) {
  const full = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(full)) {
    throw new Error(`File not found: ${rel}`);
  }
  return fs.readFileSync(full);
}

const R2_ACCESS_KEY_ID = requireEnv('R2_ACCESS_KEY_ID');
const R2_SECRET_ACCESS_KEY = requireEnv('R2_SECRET_ACCESS_KEY');
const R2_ENDPOINT = requireEnv('R2_ENDPOINT');
const R2_BUCKET = requireEnv('R2_BUCKET');

const appJson = JSON.parse(readFile(path.join('frontend', 'app.json')));
const version = appJson.expo && appJson.expo.version;
if (!version) {
  throw new Error('frontend/app.json is missing expo.version');
}

const client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

async function put(key, body, contentType, cacheControl) {
  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    })
  );
  console.log(`Uploaded ${R2_BUCKET}/${key}`);
}

async function main() {
  const apkBuffer = readFile(path.join('frontend', 'dist', 'app-preview.apk'));
  const aabBuffer = readFile(path.join('frontend', 'dist', 'app-release.aab'));

  const apkContentType = 'application/vnd.android.package-archive';
  const aabContentType = 'application/octet-stream';

  await put(`tcm-v${version}-release.apk`, apkBuffer, apkContentType, undefined);
  await put(`latest-release.apk`, apkBuffer, apkContentType, 'no-cache');
  await put(`tcm-v${version}-release.aab`, aabBuffer, aabContentType, undefined);
  await put(`latest-release.aab`, aabBuffer, aabContentType, 'no-cache');

  console.log('R2 upload complete.');
}

main().catch((err) => {
  console.error('R2 upload failed:', err);
  process.exit(1);
});
