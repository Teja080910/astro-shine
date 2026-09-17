const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP_PROJECT = path.join(ROOT, 'app');
const RELEASE_DIR = path.join(APP_PROJECT, 'android', 'app', 'build', 'outputs', 'apk', 'release');

const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

function findApk() {
  if (!fs.existsSync(RELEASE_DIR)) return null;
  const apks = fs.readdirSync(RELEASE_DIR).filter((f) => f.endsWith('.apk'));
  if (apks.length === 0) return null;
  return apks.find((f) => f.includes('release')) || apks[0];
}

function buildApk() {
  console.log('Release APK not found, building...');
  execSync('./gradlew assembleRelease --no-daemon', { cwd: path.join(APP_PROJECT, 'android'), stdio: 'inherit' });
}

function getVersion() {
  try {
    const gradle = fs.readFileSync(path.join(APP_PROJECT, 'android', 'app', 'build.gradle'), 'utf8');
    const vm = gradle.match(/versionName\s+"(.+?)"/);
    return vm ? vm[1] : '';
  } catch {}
  return '';
}

async function upload(apkPath) {
  const apiUrl = process.env.TRACKER_API_URL;
  const token = process.env.TRACKER_PAT;
  const projectId = process.env.TRACKER_PROJECT_ID;
  if (!apiUrl || !token || !projectId) {
    throw new Error('Missing TRACKER_API_URL / TRACKER_PAT / TRACKER_PROJECT_ID in .env');
  }

  const version = getVersion();
  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `astro-shine${version ? `-v${version}` : ''}-${stamp}.apk`;

  console.log(`Uploading ${fileName} (${(fs.statSync(apkPath).size / 1024 / 1024).toFixed(1)} MB) to Tracker (${apiUrl})...`);
  const form = new FormData();
  form.append('projectId', projectId);
  form.append('file', new Blob([fs.readFileSync(apkPath)]), fileName);

  const res = await fetch(`${apiUrl}/api/apk/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Upload failed (${res.status})`);
  console.log('\nUploaded to Astro Shine project!');
  console.log('Download link: ' + (json.shareUrl || json.url));
}

async function main() {
  let apk = findApk();
  if (!apk) {
    buildApk();
    apk = findApk();
  }
  if (!apk) throw new Error('No APK found in ' + RELEASE_DIR);
  await upload(path.join(RELEASE_DIR, apk));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
