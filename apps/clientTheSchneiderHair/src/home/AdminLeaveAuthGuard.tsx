/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';

import { auth } from '../lib/firebase';
import { AUTO_LOGOUT_LEAVING_ADMIN_EVENT, getSettingsWithFallback } from 'artist-portal-sdk';
import { useContentSourceRefreshKey } from '../hooks/useContentSourceRefreshKey';

/** Signs out when navigating off admin routes if the General Settings option is enabled. */
export function AdminLeaveAuthGuard() {
  const location = useLocation();
  const prevPathRef = useRef<string | null>(null);
  const [autoLogoutLeavingAdmin, setAutoLogoutLeavingAdmin] = useState(true);
  const contentSourceRefreshKey = useContentSourceRefreshKey();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = await getSettingsWithFallback();
      if (cancelled) return;
      setAutoLogoutLeavingAdmin(settings.autoLogoutLeavingAdmin !== false);
    })();
    return () => {
      cancelled = true;
    };
  }, [contentSourceRefreshKey]);

  useEffect(() => {
    const onSetting = (e: Event) => {
      const ce = e as CustomEvent<{ autoLogoutLeavingAdmin?: boolean }>;
      if (typeof ce.detail?.autoLogoutLeavingAdmin === 'boolean') {
        setAutoLogoutLeavingAdmin(ce.detail.autoLogoutLeavingAdmin);
      }
    };
    window.addEventListener(AUTO_LOGOUT_LEAVING_ADMIN_EVENT, onSetting as EventListener);
    return () => window.removeEventListener(AUTO_LOGOUT_LEAVING_ADMIN_EVENT, onSetting as EventListener);
  }, []);

  useEffect(() => {
    const path = location.pathname;
    const prev = prevPathRef.current;
    prevPathRef.current = path;
    if (!autoLogoutLeavingAdmin || prev === null) return;

    const wasPortal = prev.includes('artist-portal');
    const wasLogin = prev.includes('artist-login');
    const isPortal = path.includes('artist-portal');
    const isLogin = path.includes('artist-login');

    if (wasPortal && !isPortal) {
      void signOut(auth);
      return;
    }
    if (wasLogin && !isLogin && !isPortal) {
      void signOut(auth);
    }
  }, [location.pathname, autoLogoutLeavingAdmin]);

  return null;
}
