# The Schneider Hair Website

![Hero section preview](public/media/artist/artist-hero.jpeg)

Marketing website and admin-managed content platform for The Schneider Hair.

## For Client Stakeholders

- Public site pages include services, artists, education FAQ, product recommendations, terms, and legal pages.
- Content is managed through the admin dashboard and persisted to the cloud (database and file storage).
- Brand and page content is sourced from JSON files in `public/data` and cloud-backed admin updates.
- The production site is built as a static Vite app and deployed to cloud hosting.

## For Developers

### Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Cloud backend: auth, database, file storage, and hosting (Google Cloud client SDKs)

### Project Structure

- `src/` app source code and routes/pages
- `src/pages/AdminDashboard.tsx` admin content management UI
- `public/data/` editable content seeds (`faq.json`, `services.json`, `reviews.json`, etc.)
- `firestore.rules` security rules for the cloud database
- `firebase.json` hosting and project tooling config (CLI)
- `metadata.json` optional editor/applet metadata (not read by the Vite app at build or runtime)
- `firebase-blueprint.json` informal schema-style notes for Firestore-shaped data (documentation only; not loaded by the app)

### Local Development

Prerequisites: Node.js 20+ and [pnpm](https://pnpm.io/) (Corepack: `corepack enable`)

1. Install dependencies
   `pnpm install`
2. Create local env file
   - Copy `.env.example` to `.env.local`
   - Set values for `APP_API_KEY` (optional) and `APP_URL`
3. Start dev server
   `pnpm run dev`

### Build and Deploy

- Build production bundle: `pnpm run build:production`
- Build release bundle: `pnpm run build:release`
- Deploy hosting (production): `pnpm run deploy:hosting:production`
- Deploy hosting (release): `pnpm run deploy:hosting:release`
- Deploy cloud database rules:
  - production: `pnpm run deploy:rules:production`
  - release: `pnpm run deploy:rules:release`

### Environment Targeting

The app supports `production` and `release` cloud deployment targets.

- Preferred: use Vite mode (`--mode production` or `--mode release`)
- Optional override: set `VITE_FIREBASE_TARGET=production|release`

Target resolution lives in `src/lib/firebase.ts`.
