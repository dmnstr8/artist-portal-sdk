/**
 * Firestore seed script — writes local JSON fixtures to a target Firebase project.
 *
 * Usage:
 *   node scripts/seed-firestore.mjs [--target production|release] [--keyfile path/to/sa.json]
 *
 * Auth (pick one):
 *   --keyfile <path>              path to a service-account JSON file
 *   GOOGLE_APPLICATION_CREDENTIALS  env var pointing to a service-account JSON file
 *   `firebase login` ADC          if already authenticated via Firebase CLI
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { parseArgs } from 'util';

// ── Config ─────────────────────────────────────────────────────────────────

const PROJECTS = {
  production: 'artist-portal-sdk-dev',
  release:    'artist-portal-sdk-release',
};

const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    target:  { type: 'string', default: 'production' },
    keyfile: { type: 'string' },
  },
});

const target = args.target;
if (!PROJECTS[target]) {
  console.error(`Unknown --target "${target}". Valid values: production | release`);
  process.exit(1);
}

const projectId = PROJECTS[target];
const dataDir   = join(dirname(fileURLToPath(import.meta.url)), '../public/data');

// ── Firebase Admin init ────────────────────────────────────────────────────

const credential = args.keyfile
  ? cert(JSON.parse(readFileSync(resolve(args.keyfile), 'utf8')))
  : applicationDefault();

initializeApp({ credential, projectId });
const db = getFirestore();

// ── Helpers ────────────────────────────────────────────────────────────────

function loadJson(filename) {
  return JSON.parse(readFileSync(join(dataDir, filename), 'utf8'));
}

// ── Seeders ────────────────────────────────────────────────────────────────

async function seedSettings() {
  const data = loadJson('settings.json');
  await db.doc('settings/general').set(data);
  console.log('✓  settings/general');
}

async function seedReviews() {
  const data = loadJson('reviews.json');
  await db.doc('reviews/home').set(data);
  console.log('✓  reviews/home');
}

// ── Runner ─────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nSeeding → ${projectId} (--target ${target})\n`);

  await seedSettings();
  await seedReviews();

  console.log('\nDone.\n');
}

main().catch(err => {
  console.error('\nSeed failed:', err.message);
  process.exit(1);
});
