import type { FirebaseOptions } from 'firebase/app';

/**
 * Web client config for one Firebase project (same shape as firebase-applet-config.*.json).
 * `firestoreDatabaseId` is required because this codebase uses named databases.
 */
export type ArtistPortalFirebaseConfig = FirebaseOptions & {
  firestoreDatabaseId: string;
};
