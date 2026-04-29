import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

import type { ArtistPortalFirebaseConfig } from './types';

export type ArtistPortalClients = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
};

/**
 * Initializes Firebase app + Auth + Firestore (named DB) + Storage for one client project.
 * Call once per browser app; pass each salon's own `ArtistPortalFirebaseConfig`.
 */
export function createArtistPortalClients(
  config: ArtistPortalFirebaseConfig,
  appName?: string,
): ArtistPortalClients {
  const options = config as FirebaseOptions;
  const app = appName ? initializeApp(options, appName) : initializeApp(options);
  const db = getFirestore(app, config.firestoreDatabaseId);
  return {
    app,
    auth: getAuth(app),
    db,
    storage: getStorage(app),
  };
}
