import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Navigate } from 'react-router-dom';

import { getPortalFirebase } from '../portalFirebase';

export function ProtectedRoute({
  children,
  loginPath = '/artist-login',
}: {
  children: React.ReactNode;
  loginPath?: string;
}) {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const { auth } = getPortalFirebase();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState(user ? 'authenticated' : 'unauthenticated');
    });
    return () => unsubscribe();
  }, []);

  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <Navigate to={loginPath} replace />;
  }

  return <>{children}</>;
}
