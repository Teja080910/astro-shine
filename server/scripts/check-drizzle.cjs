#!/usr/bin/env node
/**
 * Preflight for drizzle-kit.
 *
 * drizzle-kit resolves `drizzle-orm` from ITS OWN file location, not from the
 * directory you run it in. In an npm-workspaces repo npm can hoist the kit to
 * the repo root while leaving `drizzle-orm` nested under `server/`, and the kit
 * then fails with a misleading "Please install latest version of drizzle-orm".
 *
 * This script reproduces that exact resolution before the CLI runs, so the real
 * problem is reported instead of the generic message.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const MIN_DRIZZLE_ORM = '0.45.0';
const MIN_DRIZZLE_KIT = '0.31.0';

function findPackageDir(fromFile, pkg) {
  let dir = path.dirname(fromFile);
  for (;;) {
    const candidate = path.join(dir, 'node_modules', pkg);
    if (fs.existsSync(path.join(candidate, 'package.json'))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function cmp(a, b) {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  }
  return 0;
}

function fail(lines) {
  console.error('\n  drizzle preflight failed\n');
  for (const line of lines) console.error('  ' + line);
  console.error('');
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, '..', '..');
const serverDir = path.resolve(__dirname, '..');

// 1. Find the kit the same way `drizzle-kit` on PATH would be found.
const binCandidates = [
  path.join(repoRoot, 'node_modules', 'drizzle-kit', 'bin.cjs'),
  path.join(serverDir, 'node_modules', 'drizzle-kit', 'bin.cjs'),
];
const kitBin = binCandidates.find((p) => fs.existsSync(p));

if (!kitBin) {
  fail([
    'drizzle-kit is not installed.',
    '',
    'Fix:',
    '  cd ' + repoRoot,
    '  npm install',
  ]);
}

// 2. Resolve drizzle-orm from the kit's directory — exactly what it does.
const kitDir = path.dirname(kitBin);
const ormDir = findPackageDir(kitBin, 'drizzle-orm');

if (!ormDir) {
  const nested = findPackageDir(path.join(serverDir, 'x'), 'drizzle-orm');
  fail([
    'drizzle-orm cannot be resolved from ' + kitDir,
    '',
    'drizzle-kit imports "drizzle-orm" relative to its own file, so the package',
    'must sit beside the kit — not only inside server/node_modules.',
    nested
      ? '\n  Found it at: ' + nested + '\n  but that path is invisible to the kit.'
      : '',
    '',
    'Fix:',
    '  cd ' + repoRoot,
    '  npm install drizzle-orm --save-dev',
    '  npm ls drizzle-orm',
  ].filter(Boolean));
}

// 3. Version compatibility (the kit rejects older ORM releases).
const ormPkg = readJson(path.join(ormDir, 'package.json')) || {};
const kitPkg = readJson(path.join(kitDir, 'package.json')) || {};

if (ormPkg.version && cmp(ormPkg.version, MIN_DRIZZLE_ORM) < 0) {
  fail([
    `drizzle-orm ${ormPkg.version} is too old; drizzle-kit needs >= ${MIN_DRIZZLE_ORM}.`,
    '',
    'Fix:',
    '  cd ' + repoRoot,
    '  npm install drizzle-orm@latest --save-dev',
  ]);
}

if (kitPkg.version && cmp(kitPkg.version, MIN_DRIZZLE_KIT) < 0) {
  fail([
    `drizzle-kit ${kitPkg.version} is too old; expected >= ${MIN_DRIZZLE_KIT}.`,
    '',
    'Fix:',
    '  cd ' + repoRoot,
    '  npm install drizzle-kit@latest --save-dev',
  ]);
}

// 4. The postgres driver, also resolved from the kit's location.
const pgDir = findPackageDir(kitBin, 'pg');
if (!pgDir) {
  fail([
    'The "pg" driver cannot be resolved from ' + kitDir,
    '',
    'Fix:',
    '  cd ' + repoRoot,
    '  npm install pg --save-dev',
  ]);
}

// 5. DATABASE_URL must be readable by the config file.
const envPath = path.join(serverDir, '.env');
if (!fs.existsSync(envPath)) {
  fail([
    'server/.env not found — drizzle.config.ts reads DATABASE_URL from it.',
    '',
    'Fix:',
    '  cp ' + path.join(serverDir, '.env.example') + ' ' + envPath,
  ]);
}

const envText = fs.readFileSync(envPath, 'utf8');
if (!/^\s*DATABASE_URL\s*=/m.test(envText)) {
  fail(['DATABASE_URL is not set in server/.env']);
}

console.log(
  `  drizzle preflight OK — kit ${kitPkg.version || '?'}, orm ${ormPkg.version || '?'}, pg resolved`,
);
