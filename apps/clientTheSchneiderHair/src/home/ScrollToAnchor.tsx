/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToAnchor() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    // HashRouter can encode route + anchor as "#/route#anchor".
    // We only treat the anchor part as in-page scroll target.
    const routeEncodedHash = hash.startsWith('#/') ? hash : '';
    const nestedAnchorIndex = routeEncodedHash.indexOf('#', 1);
    const effectiveHash =
      routeEncodedHash && nestedAnchorIndex >= 0 ? routeEncodedHash.slice(nestedAnchorIndex) : hash;

    if (effectiveHash && effectiveHash !== '#') {
      const id = effectiveHash.replace('#', '');
      let retries = 0;
      let timeoutId: ReturnType<typeof setTimeout>;
      const MAX_RETRIES = 30; // Increased retries
      
      const scrollToElement = () => {
        const element = document.getElementById(id);
        if (element) {
          // Add a staggered delay to ensure layout has settled
          setTimeout(() => {
            element.scrollIntoView(); // Rely on CSS scroll-behavior
          }, 150);
        } else if (retries < MAX_RETRIES) {
          retries++;
          timeoutId = setTimeout(scrollToElement, 200); // Slower retries
        }
      };
      
      timeoutId = setTimeout(scrollToElement, 200);
      return () => { if (timeoutId) clearTimeout(timeoutId); };
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, key]);

  return null;
}
