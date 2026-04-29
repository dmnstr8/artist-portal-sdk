# artist-portal-sdk

Reusable SDK for artist portal apps: Firebase client bootstrap, shared Firestore content reads, fallback helpers, and shared domain types.

## Install

```bash
pnpm add artist-portal-sdk firebase
```

## What This Package Provides

- `createArtistPortalClients(config)` to create `db`, `auth`, and `storage`
- `registerPortalFirebase(bundle)` / `getPortalFirebase()` global registration for helpers that read from the active portal instance
- Firestore read helpers for common collections/docs (`reviews`, `faq`, `services`, `settings`, `widgets`, `videolinks`, `artistprofiles`, `productcategories`, `gallery`, `sitecopy`)
- Shared domain types used by both public and admin surfaces
- Optional admin UI entrypoint via `artist-portal-sdk/admin`

## Basic Usage

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

Use separate config objects for production/release environments in your host app. This package does not load env files directly.

## Registering the Global Portal Bundle

If you use helper functions that depend on the portal singleton, register once at app startup:

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

## Firestore Read Helpers

You can query Firestore directly using `db`, or use built-in helpers such as:

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

Most reads return `null` when data is missing or unreadable so host apps can apply local fallback content.

## Optional Admin UI Entry

The admin dashboard UI is exposed from `artist-portal-sdk/admin` as a separate entrypoint so consumers can lazy-load it and keep public bundles smaller.

## Publishing

From `packages/artist-portal-sdk`:

```bash
pnpm run build
npm publish
```

Ensure consumers use a compatible `firebase` version.
