# @dmnstr8/artist-portal-sdk

Reusable SDK for artist portal apps: Firebase client bootstrap, shared Firestore content reads, fallback helpers, and shared domain types.

## Install

This package is published to **GitHub Packages** under the `@dmnstr8` scope. You need a GitHub Personal Access Token (PAT) with `read:packages` scope.

**1. Add an `.npmrc` to your project root:**

```
@dmnstr8:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

**2. Set `GITHUB_TOKEN` in your environment:**

```bash
export GITHUB_TOKEN=ghp_yourTokenHere
```

**3. Install:**

```bash
pnpm add @dmnstr8/artist-portal-sdk firebase
```

---

## Releasing a New Version (SDK → client pickup)

### Step 1 — Bump the version

In `packages/artist-portal-sdk/package.json`, increment `"version"` following semver:

| Change type | Example bump | When to use |
|-------------|-------------|-------------|
| Patch | `0.1.0` → `0.1.1` | Bug fixes, no API changes |
| Minor | `0.1.0` → `0.2.0` | New exports / features, backwards-compatible |
| Major | `0.1.0` → `1.0.0` | Breaking changes to existing exports |

### Step 2 — Commit and push

```bash
git add packages/artist-portal-sdk/package.json
git commit -m "chore: bump sdk to v0.1.1"
git push origin main
```

### Step 3 — Tag the release

The GitHub Actions publish workflow triggers on semver tags (`v*`):

```bash
git tag v0.1.1
git push origin v0.1.1
```

This runs `.github/workflows/publish-sdk.yml`, which builds the SDK and publishes `@dmnstr8/artist-portal-sdk@0.1.1` to GitHub Packages automatically.

### Step 4 — Verify the publish succeeded

Go to `https://github.com/dmnstr8/artist-portal-sdk/actions` and confirm the **Publish SDK** workflow run completed with a green checkmark.

Then verify the package appears under **Packages** on your GitHub profile:
`https://github.com/dmnstr8?tab=packages`

Or via npm (with your token set):

```bash
npm view @dmnstr8/artist-portal-sdk --registry=https://npm.pkg.github.com
```

### Step 5 — Update client apps to consume the new version

In each client app's `package.json`, bump the version range if needed:

```json
"@dmnstr8/artist-portal-sdk": "^0.1.1"
```

Then reinstall:

```bash
pnpm install
```

> **Note:** If the client uses `"^0.1.0"`, pnpm will automatically pick up any `0.1.x` patch release on the next `pnpm install`. You only need to manually edit the range for a **minor** (`0.2.0`) or **major** (`1.0.0`) bump.

---

## How to Know the Package is Published

Three ways to confirm:

1. **GitHub Actions** — `https://github.com/dmnstr8/artist-portal-sdk/actions` → the **Publish SDK** run is green.

2. **GitHub Packages registry** — `https://github.com/dmnstr8?tab=packages` — the package `@dmnstr8/artist-portal-sdk` appears with the correct version number.

3. **npm view** (terminal, requires `GITHUB_TOKEN` env var set):
   ```bash
   npm view @dmnstr8/artist-portal-sdk --registry=https://npm.pkg.github.com
   ```
   This prints the package metadata including the published version, exports, and dependencies. If it errors with 404, the package is not yet published.

---

## What This Package Provides

- `createArtistPortalClients(config)` to create `db`, `auth`, and `storage`
- `registerPortalFirebase(bundle)` / `getPortalFirebase()` global registration for helpers that read from the active portal instance
- Firestore read helpers for common collections/docs (`reviews`, `faq`, `services`, `settings`, `widgets`, `videolinks`, `artistprofiles`, `productcategories`, `gallery`, `sitecopy`)
- Shared domain types used by both public and admin surfaces
- Optional admin UI entrypoint via `@dmnstr8/artist-portal-sdk/admin`

## Basic Usage

```ts
import { createArtistPortalClients, type ArtistPortalFirebaseConfig } from '@dmnstr8/artist-portal-sdk';

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
import { createArtistPortalClients, registerPortalFirebase } from '@dmnstr8/artist-portal-sdk';

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

The admin dashboard UI is exposed from `@dmnstr8/artist-portal-sdk/admin` as a separate entrypoint so consumers can lazy-load it and keep public bundles smaller.
