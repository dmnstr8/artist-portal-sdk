import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

import type { ArtistPortalFirebaseConfig } from './types';

export type PortalFirebaseBundle = {
  db: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  handleFirestoreError: (
    error: unknown,
    operation: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write',
    path?: string | null,
  ) => void;
  firebaseEnvironment: string;
  activeFirebaseConfig: ArtistPortalFirebaseConfig;
};

let bundle: PortalFirebaseBundle | null = null;

export function registerPortalFirebase(next: PortalFirebaseBundle): void {
  bundle = next;
}

export function getPortalFirebase(): PortalFirebaseBundle {
  if (!bundle) {
    throw new Error(
      'Portal Firebase is not registered. Call registerPortalFirebase from your app bootstrap after createArtistPortalClients.',
    );
  }
  return bundle;
}
