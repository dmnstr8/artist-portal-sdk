# artist-portal-sdk

Shared **Firebase client bootstrap** for artist sites: each client supplies their own Firebase web config (same JSON fields as `firebase-applet-config.*.json`); you keep one **document layout** across projects.

## Install

```bash
pnpm add artist-portal-sdk firebase
```

## Usage (any bundler / React app)

```ts
import { createArtistPortalClients, type ArtistPortalFirebaseConfig } from 'artist-portal-sdk';

const config: ArtistPortalFirebaseConfig = {
  projectId: '…',
  appId: '…',
  apiKey: '…',
  authDomain: '….firebaseapp.com',
  firestoreDatabaseId: '(default)',
  storageBucket: '….firebasestorage.app',
  messagingSenderId: '…',
  measurementId: '…',
};

const { db, auth, storage } = createArtistPortalClients(config);
// Use `db` with the Firebase modular SDK (collection, doc, getDoc, …).
```

Use **separate config objects** for “production” vs “release” projects at build time or runtime; this package does not load env files.

## Vite (this monorepo)

`resolveFirebaseTarget(() => import.meta.env)` plus your two JSON configs still pick which `ArtistPortalFirebaseConfig` to pass into `createArtistPortalClients`.

## Firestore reads (shared layout)

After `createArtistPortalClients`, use the modular Firestore API with the returned `db`, or call the bundled helpers (same collection names as the public site):

- `readReviewsFromFirestore(db)`
- `readFaqFromFirestore(db)`
- `readServicesEnFromFirestore(db)`
- `readSettingsGeneralFromFirestore(db, localDefaults)`
- `readWidgetsGeneralFromFirestore(db, localDefaults)`
- `readVideoLinksHomeFromFirestore(db)`
- `readArtistProfilesFromFirestore(db)`
- `readProductCategoriesFromFirestore(db)`
- `readGalleryHomeFromFirestore(db)` — returns normalized `GalleryHomeData`
- `readSiteCopyEnDocumentFromFirestore(db)` — raw doc for marketing merge
- `stripFirestoreServerFields`, `normalizeGalleryHomeData`, video / storefront helpers

Each read returns **`null`** when the doc/collection is missing or the read fails; your app supplies local JSON fallbacks the same way this monorepo does.

## Portal registration (marketing site + admin)

`getReviewsWithFallback`, `getSettingsWithFallback`, and the other **merged Firestore/local** helpers in this package read Firestore via `getPortalFirebase().db`. After you call `createArtistPortalClients`, register the same instances once (this repo does it from `src/lib/firebase.ts`):

```ts
import { createArtistPortalClients, registerPortalFirebase } from 'artist-portal-sdk';

const { db, auth, storage } = createArtistPortalClients(config);
registerPortalFirebase({
  db,
  auth,
  storage,
  handleFirestoreError,
  firebaseEnvironment: 'production',
  activeFirebaseConfig: config,
});
```

## Admin UI (optional subpath)

The artist portal **admin dashboard** and related UI live in this package under **`artist-portal-sdk/admin`** (lazy-loadable default export). Peer dependencies include `react`, `react-dom`, `react-router-dom`, `motion`, `lucide-react`, `jsoneditor`, and `jszip` when you use the admin entry.

## Publishing

From `packages/artist-portal-sdk`: `pnpm run build`, then `npm publish` (or your private registry). Consumers must use a compatible `firebase` peer version.
