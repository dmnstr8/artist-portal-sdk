# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
pnpm dev                        # Start dev server (port 3000, all interfaces)
pnpm dev:release                # Dev server targeting the release Firebase project

# Build
pnpm build                      # Build SDK then Vite app (default/production mode)
pnpm build:production           # Vite build in production mode
pnpm build:release              # Vite build in release mode
pnpm build:sdk                  # Compile SDK only (tsc -p tsconfig.build.json)

# Type-check (no separate lint step)
pnpm lint                       # Builds SDK then runs tsc --noEmit on root

# Deploy
pnpm deploy:hosting:production  # Build production + deploy to production Firebase
pnpm deploy:hosting:release     # Build release + deploy to release Firebase
pnpm deploy:rules               # Deploy Firestore rules to production

# Utilities
pnpm seed:videolinks            # Seed Firestore videolinks collection from local data
pnpm sync:public-assets         # Sync public assets
pnpm clean                      # Run clean-docs script
```

There is **no test framework** configured in this project.

## Architecture

This is a pnpm monorepo with one workspace package:

```
TheSchneider.Hair/
├── packages/artist-portal-sdk/   # Reusable Firebase + content SDK
└── src/                          # Root Vite app (The Schneider Hair site)
```

### artist-portal-sdk (`packages/artist-portal-sdk`)

A publishable, reusable SDK with two entry points:
- **`.`** — Firebase client factory, Firestore content reads, domain types
- **`./admin`** — Admin dashboard UI (lazy-loadable, kept out of public bundle)

Key files:
- `createClients.ts` — `createArtistPortalClients()` initializes Firebase App, Auth, named Firestore DB, and Storage
- `portalFirebase.ts` — Global singleton `PortalFirebaseBundle` registered once via `registerPortalFirebase()`
- `firestoreContentReads.ts` — All Firestore read helpers for public collections
- `domain.ts` — Shared TypeScript types (Review, FaqCategory, GalleryHomeData, etc.)
- `resolveTarget.ts` — Picks `production` vs `release` Firebase project based on Vite mode or `VITE_FIREBASE_TARGET`

Path aliases (defined in root `tsconfig.json` and `vite.config.ts`):
- `artist-portal-sdk` → `packages/artist-portal-sdk/src/index.ts`
- `artist-portal-sdk/admin` → `packages/artist-portal-sdk/src/admin/index.ts`

### Root App (`src/`)

React 19 + React Router DOM 7 marketing site with an embedded admin CMS:

```
src/
├── app/          Routes and app-level components
├── pages/        Lazy-loaded pages (FAQ, Artists, Products, Admin, Legal, Terms)
├── home/         Landing page sections (Hero, Gallery, Nav, Footer, etc.)
├── components/   Reusable UI
├── lib/          Firebase bootstrap, Salonized booking widget, hash routing detection
├── context/      SiteCopyContext, ThemeContext
├── repositories/ Firestore data-access layer
├── hooks/        Custom hooks
└── content/      Content formatting & legal page assembly
```

### Content Data Flow

Content comes from two sources with a fallback pattern:
1. **Firestore** — Live content (reviews, FAQ, services, gallery, sitecopy, videolinks, etc.)
2. **Local JSON** (`public/data/`) — Seed/fallback data when Firestore returns `null`

Firestore reads return `null` on missing docs; the app supplies local JSON as fallback.

### Firebase / Environment

Two Firebase projects with separate configs:
- **production** → `theschneiderhair-dev` (used by default dev/build)
- **release** → `theschneiderhair-59173` (used with `--mode release`)

Firebase config files: `firebase-applet-config.production.json` and `firebase-applet-config.release.json`. Target is resolved by `resolveTarget.ts` from Vite mode or `VITE_FIREBASE_TARGET` env var.

Environment variables (see `.env.example`):
- `VITE_FIREBASE_TARGET` — Override Firebase project selection (`production` | `release`)
- `APP_URL` — Self-referential URL for OAuth callbacks and links
- `APP_API_KEY` — Optional external integration key
- `VITE_HOST_BASE` — Optional asset path prefix

### Firestore Security Model

`firestore.rules` enforces:
- Default deny all
- **Public reads**: reviews, faq, services, settings, videolinks, gallery, artistprofiles, productcategories, bookingproviders, widgets, sitecopy
- **Admin writes**: via custom auth claim, `/admins/{uid}` doc presence, or email allowlist
- **Public create only**: inquiries collection (anonymous contact form submissions)

Schema is documented in `firebase-blueprint.json`.

### SDK Build Requirement

**The SDK must be built before the root app.** `pnpm build` and `pnpm lint` both run `build:sdk` first. During development, `src/lib/firebase.ts` imports from the SDK via path alias (resolved directly to source), so a full SDK build is not required for `pnpm dev`.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
