/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';

import { CONTENT_DATA_SOURCE_MODE_EVENT } from 'artist-portal-sdk';

/** Bumps when the admin toggles local vs cloud content source in this browser. */
export function useContentSourceRefreshKey(): number {
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const onChanged = () => setRefreshKey((k) => k + 1);
    window.addEventListener(CONTENT_DATA_SOURCE_MODE_EVENT, onChanged as EventListener);
    return () => {
      window.removeEventListener(CONTENT_DATA_SOURCE_MODE_EVENT, onChanged as EventListener);
    };
  }, []);
  return refreshKey;
}
