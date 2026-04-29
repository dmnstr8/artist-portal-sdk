/**
 * Writes public/data/videolinks.json → cloud database document videolinks/home
 * (project + named database from a root applet config JSON).
 *
 * Default config: firebase-applet-config.production.json
 * Release / second account: set FIREBASE_APPLET_CONFIG=firebase-applet-config.release.json
 *
 *   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"
 *   pnpm run seed:videolinks
 *
 *   $env:FIREBASE_APPLET_CONFIG="firebase-applet-config.release.json"; pnpm run seed:videolinks
 *
 * @license Apache-2.0
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const envConfig = process.env.FIREBASE_APPLET_CONFIG?.trim();
let appletPath;
if (envConfig) {
  appletPath = join(root, envConfig);
  if (!existsSync(appletPath)) {
    console.error('FIREBASE_APPLET_CONFIG file not found:', appletPath);
    process.exit(1);
  }
} else {
  const prodPath = join(root, 'firebase-applet-config.production.json');
  const legacyPath = join(root, 'firebase-applet-config.json');
  if (existsSync(prodPath)) {
    appletPath = prodPath;
  } else if (existsSync(legacyPath)) {
    appletPath = legacyPath;
  } else {
    console.error(
      'Missing cloud applet config. Add firebase-applet-config.production.json, or legacy firebase-applet-config.json, at project root.'
    );
    process.exit(1);
  }
}

const { projectId, firestoreDatabaseId } = JSON.parse(readFileSync(appletPath, 'utf8'));
if (!projectId || !firestoreDatabaseId) {
  console.error('Applet config must include projectId and firestoreDatabaseId.');
  process.exit(1);
}

console.info('Using applet config:', appletPath.replace(root + '/', ''));

const jsonPath = join(root, 'public', 'data', 'videolinks.json');
const { items: rawItems } = JSON.parse(readFileSync(jsonPath, 'utf8'));

const items = (Array.isArray(rawItems) ? rawItems : []).map((row) => {
  const url = typeof row.url === 'string' ? row.url.trim() : '';
  const label = typeof row.label === 'string' ? row.label.trim() : '';
  const id = typeof row.id === 'string' && row.id.trim() ? row.id.trim() : randomUUID();
  return label ? { id, url, label } : { id, url };
});

const payload = {
  items,
  updatedAt: new Date().toISOString(),
};

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
let credential;
if (credPath && existsSync(credPath)) {
  credential = cert(JSON.parse(readFileSync(credPath, 'utf8')));
  console.info('Using service account file:', credPath);
} else {
  credential = applicationDefault();
  console.info('Using Application Default Credentials.');
}

try {
  const app = initializeApp({ credential, projectId });
  const db = getFirestore(app, firestoreDatabaseId);
  await db.collection('videolinks').doc('home').set(payload, { merge: false });
  console.info('Done. Wrote videolinks/home with', items.length, 'item(s).');
  console.info('Database:', firestoreDatabaseId, 'project:', projectId);
} catch (err) {
  console.error('Write failed:', err?.message || err);
  console.error(`
Set a service account JSON path, then:
  $env:GOOGLE_APPLICATION_CREDENTIALS="C:\\key\\gen-lang-client-0459395229-firebase-adminsdk-fbsvc-9948b26c96.json"
  pnpm run seed:videolinks`);
  process.exit(1);
}
