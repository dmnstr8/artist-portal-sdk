import type { ArtistPortalFirebaseConfig } from 'artist-portal-sdk';
import { createArtistPortalClients, registerPortalFirebase, resolveFirebaseTarget } from 'artist-portal-sdk';
import productionConfig from '../../firebase-applet-config.production.json';
import releaseConfig from '../../firebase-applet-config.release.json';

type AppletConfig = typeof productionConfig;

const firebaseTarget = resolveFirebaseTarget(() => ({
  VITE_FIREBASE_TARGET: import.meta.env.VITE_FIREBASE_TARGET,
  MODE: import.meta.env.MODE,
}));

const firebaseConfig = (
  firebaseTarget === 'release' ? releaseConfig : productionConfig
) as ArtistPortalFirebaseConfig;

const { db, auth, storage } = createArtistPortalClients(firebaseConfig);

export { db, auth, storage };
export const firebaseEnvironment = firebaseTarget;
export const activeFirebaseConfig: AppletConfig = firebaseConfig as AppletConfig;

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId: string;
    email: string;
    emailVerified: boolean;
    isAnonymous: boolean;
    providerInfo: { providerId: string; displayName: string; email: string }[];
  };
}

export const handleFirestoreError = (
  error: unknown,
  operation: FirestoreErrorInfo['operationType'],
  path: string | null = null,
) => {
  const authState = auth.currentUser;

  const errorInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : 'Unknown error',
    operationType: operation,
    path: path,
    authInfo: {
      userId: authState?.uid || 'anonymous',
      email: authState?.email || 'none',
      emailVerified: authState?.emailVerified || false,
      isAnonymous: authState?.isAnonymous || true,
      providerInfo:
        authState?.providerData.map((p) => ({
          providerId: p.providerId,
          displayName: p.displayName || '',
          email: p.email || '',
        })) || [],
    },
  };

  console.error('Cloud data error:', errorInfo);
  throw new Error(JSON.stringify(errorInfo));
};

registerPortalFirebase({
  db,
  auth,
  storage,
  handleFirestoreError,
  firebaseEnvironment: firebaseTarget,
  activeFirebaseConfig: firebaseConfig,
});
