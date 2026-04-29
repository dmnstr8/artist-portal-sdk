import './admin-theme.css';
import React, { Suspense } from 'react';
import { Route } from 'react-router-dom';

import type { ArtistPortalFirebaseConfig } from '../types';
import { createArtistPortalClients } from '../createClients';
import { registerPortalFirebase } from '../portalFirebase';
import { resolveFirebaseTarget } from '../resolveTarget';
import AdminLoginPage from './AdminLoginPage';
import { ProtectedRoute } from './ProtectedRoute';

const AdminDashboard = React.lazy(() => import('./AdminDashboard'));

export type AdminPortalConfig = {
  productionConfig: ArtistPortalFirebaseConfig;
  releaseConfig: ArtistPortalFirebaseConfig;
  /** Route path for the login page. Default: '/artist-login' */
  loginPath?: string;
  /** Route path for the admin dashboard. Default: '/artist-portal' */
  portalPath?: string;
};

let _initialized = false;

function initOnce(
  productionConfig: ArtistPortalFirebaseConfig,
  releaseConfig: ArtistPortalFirebaseConfig,
) {
  if (_initialized) return;
  _initialized = true;

  const target = resolveFirebaseTarget(() => ({
    VITE_FIREBASE_TARGET: import.meta.env?.VITE_FIREBASE_TARGET as string | undefined,
    MODE: import.meta.env?.MODE as string | undefined,
  }));

  const config = target === 'release' ? releaseConfig : productionConfig;
  const { db, auth, storage } = createArtistPortalClients(config);

  registerPortalFirebase({
    db,
    auth,
    storage,
    handleFirestoreError: (error, operation, path = null) => {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[admin-portal] ${operation}${path ? ` at ${path}` : ''}: ${msg}`);
      throw error instanceof Error ? error : new Error(msg);
    },
    firebaseEnvironment: target,
    activeFirebaseConfig: config,
  });
}

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/**
 * Returns a React Fragment containing the admin login and portal Route elements.
 * Spread directly into any React Router <Routes> block.
 *
 * Initializes Firebase on first call using the supplied configs; subsequent
 * calls reuse the existing connection.
 *
 * @example
 * const adminRoutes = getAdminPortalRoutes({ productionConfig, releaseConfig });
 *
 * <Routes>
 *   <Route path="/" element={<Home />} />
 *   {adminRoutes}
 * </Routes>
 */
export function getAdminPortalRoutes({
  productionConfig,
  releaseConfig,
  loginPath = '/artist-login',
  portalPath = '/artist-portal',
}: AdminPortalConfig): React.ReactElement {
  initOnce(productionConfig, releaseConfig);

  return (
    <>
      <Route path={loginPath} element={<AdminLoginPage portalPath={portalPath} />} />
      <Route
        path={portalPath}
        element={
          <ProtectedRoute loginPath={loginPath}>
            <Suspense fallback={<RouteFallback />}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        }
      />
    </>
  );
}
