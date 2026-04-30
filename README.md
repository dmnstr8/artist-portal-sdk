# artist-portal-sdk Monorepo

![SDK example landing page](assets/readme/sdk-example-landing.png)

This repository contains:

- `packages/artist-portal-sdk`: reusable SDK for Firebase bootstrap, Firestore content reads, shared domain types, and optional admin UI entrypoint.
- `apps/sdk-example`: example Vite app that consumes the SDK.



## Workspace Layout

- `packages/artist-portal-sdk/` publishable SDK package
- `apps/sdk-example/` SDK integration example app
- `packages/artist-portal-sdk/firebase.json`   Firebase CLI hosting/rules config template
- `packages/artist-portal-sdk/.firebaserc`     Firebase build patterns template
- `packages/artist-portal-sdk/firestore.rules` Firestore security rules template
- `packages/artist-portal-sdk/storage.rules`   Firebase storage rules tempalte

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (Corepack recommended: `corepack enable`)

## Install

```bash
pnpm install
```

## Common Commands

### SDK package

- Build SDK only: `pnpm run build:sdk`

### Example app (`apps/sdk-example`)

- Dev (production target mode): `pnpm run dev:sdk:dev`
- Dev (release target mode): `pnpm run dev:sdk:release`
- Build SDK + example app (production mode): `pnpm run build:sdk:dev`
- Build SDK + example app (release mode): `pnpm run build:sdk:release`


## Firebase Targets

The sdk-example app supports two Firebase targets:

- `production`
- `release`

Target selection is controlled by Vite mode and/or `VITE_FIREBASE_TARGET`.

## Deploy Commands

- Firestore rules (production): `pnpm --filter sdk-example run deploy:rules:production`
- Firestore rules (release): `   pnpm --filter sdk-example run deploy:rules:release`
- Hosting (production): `        pnpm --filter sdk-example run deploy:hosting:production`
- Hosting (release): `           pnpm --filter sdk-example run deploy:hosting:release`
