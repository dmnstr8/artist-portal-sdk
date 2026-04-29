export type FirebaseBuildTarget = 'production' | 'release';

export type FirebaseTargetEnv = {
  VITE_FIREBASE_TARGET?: string;
  MODE?: string;
};

/**
 * Resolves which logical Firebase project to use.
 * - `VITE_FIREBASE_TARGET=production|release` wins when set.
 * - Otherwise Vite `MODE === 'release'` selects release; everything else is production.
 */
export function resolveFirebaseTarget(readEnv: () => FirebaseTargetEnv): FirebaseBuildTarget {
  const env = readEnv();
  const fromEnv = env.VITE_FIREBASE_TARGET?.trim();
  if (fromEnv === 'release' || fromEnv === 'production') {
    return fromEnv;
  }
  return env.MODE === 'release' ? 'release' : 'production';
}
