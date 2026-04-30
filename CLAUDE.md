# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev:sdk:example       # Dev server for sdk-example against production Firebase (port 3000)
pnpm dev:sdk:release   # Dev server for sdk-example against release Firebase (port 4000)

# Build
pnpm build:sdk         # Build the SDK package only
pnpm build:sdk:example     # Build SDK + sdk-example (production mode)
pnpm build:sdk:release # Build SDK + sdk-example (release mode)

# Type-check (no separate lint step)
pnpm lint              # Builds SDK, then runs tsc --noEmit on sdk-example

# Deploy (run from apps/sdk-example)
pnpm --filter sdk-example deploy:rules:production  # Deploy firestore rules to production project
pnpm --filter sdk-example deploy:rules:release     # Deploy firestore rules to release project
pnpm --filter sdk-example deploy:live              # Build release + deploy hosting to release project
```

There is **no test framework** configured in this project.

## Architecture

This is a pnpm monorepo with two workspace packages:

```
artist-portal-sdk/
├── packages/artist-portal-sdk/   # Publishable SDK (@dmnstr8/artist-portal-sdk)
└── apps/sdk-example/             # Demo + admin portal app that consumes the SDK
```

### SDK (`packages/artist-portal-sdk`)

Published to GitHub Packages as `@dmnstr8/artist-portal-sdk`. Two entry points:
- **`.`** — Firebase client factory, Firestore content reads, domain types, default data
- **`./admin`** — Admin dashboard UI (lazy-loadable, kept out of public bundle)

Key files:
- `createClients.ts` — `createArtistPortalClients()` initializes Firebase App, Auth, named Firestore DB, and Storage
- `portalFirebase.ts` — Global singleton `PortalFirebaseBundle` registered once via `registerPortalFirebase()`
- `firestoreContentReads.ts` — All Firestore read helpers for public collections
- `domain.ts` — Shared TypeScript types (Review, FaqCategory, GalleryHomeData, etc.)
- `resolveTarget.ts` — Picks `production` vs `release` Firebase project based on Vite mode or `VITE_FIREBASE_TARGET`
- `contentDataSource.ts` / `contentRepository.ts` — Content data access abstractions
- `marketingBundled.ts` — Bundled `MarketingCopy` defaults
- `siteCopyEvents.ts` / `settingsEvents.ts` / `siteEditorSettings.ts` — Event and settings utilities
- `videoLinks.ts` — YouTube video link helpers
- `productStorefront.ts` — Product/storefront category normalization
- `defaultData.ts` — Fallback/seed data

Admin entry (`src/admin/`):
- `AdminDashboard.tsx` — Main admin CMS shell
- `AdminLoginPage.tsx` — Auth gate
- `AdminPortalRoutes.tsx` — Admin route definitions
- `MarketingSiteCopyJsonEditor.tsx` — JSON-based site copy editor
- `VideolinksEmbedLightbox.tsx` — Video link management UI
- `ProtectedRoute.tsx` — Auth-guarded route wrapper
- `cloudHealthProbe.ts` / `adminValidation.ts` — Admin utilities

SDK build: `tsc -p tsconfig.build.json && node scripts/copy-css.mjs`

### sdk-example App (`apps/sdk-example`)

A Vite + React 19 + React Router DOM 7 app that demonstrates and tests the SDK. Serves as the actual deployed admin portal.

```
apps/sdk-example/src/
├── App.tsx         # Router setup
├── LandingPage.tsx # Entry screen → navigates to /artist-login
└── main.tsx        # App bootstrap
```

Routes: Landing page → `/artist-login` (AdminLoginPage) → admin dashboard (AdminPortalRoutes).

Firebase configs live in `apps/sdk-example/`:
- `firebase-applet-config.production.json` — `Points to Dev Project in Firbase Console` project
- `firebase-applet-config.release.json` — `Points to Release Project in Firbase Console` project
- `firestore.rules` / `storage.rules` / `firebase.json`

### Firebase / Environment

Two Firebase projects:
- **production** → `Firebase Console Dev Project` (default dev/build, port 3000)
- **release** → `Firebse Console Release project` (`--mode release`, port 4000)

Target is resolved by `resolveTarget.ts` from Vite mode or `VITE_FIREBASE_TARGET` env var.

### Path Aliases

Defined in both root `tsconfig.json` and `apps/sdk-example/vite.config.ts`:
- `artist-portal-sdk` → `packages/artist-portal-sdk/src/index.ts`
- `artist-portal-sdk/admin` → `packages/artist-portal-sdk/src/admin/index.ts`

These aliases let the sdk-example import SDK source directly during dev without a build step.

### Firestore Security Model

`apps/sdk-example/firestore.rules` enforces:
- Default deny all
- **Public reads**: reviews, faq, services, settings, videolinks, gallery, artistprofiles, productcategories, bookingproviders, widgets, sitecopy
- **Admin writes**: via custom auth claim `{ admin: true }`, `/admins/{uid}` doc presence, or email allowlist
- **Public create only**: inquiries collection (anonymous contact form submissions)

Schema is documented in `packages/artist-portal-sdk/firebase-blueprint.json`.

### SDK Build Requirement

**The SDK must be built before the root app for production builds.** `pnpm build:sdk:dev` and `pnpm build:sdk:release` both run `build:sdk` first via `prebuild` scripts. During development, the sdk-example imports from the SDK via path alias (resolved directly to source), so a full SDK build is not required for `pnpm dev:sdk:dev`.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
