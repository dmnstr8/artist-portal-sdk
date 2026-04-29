/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useContentSourceRefreshKey } from '../hooks/useContentSourceRefreshKey';
import { syncSalonizedWidgetFromWidgets } from '../lib/salonizedBookingWidget';
import { getWidgetsWithFallback } from 'artist-portal-sdk';

export function WidgetManager() {
  const { pathname } = useLocation();
  const contentSourceRefreshKey = useContentSourceRefreshKey();
  const [showBookingWidget, setShowBookingWidget] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const widgets = await getWidgetsWithFallback();
      if (cancelled) return;
      syncSalonizedWidgetFromWidgets(widgets);
      setShowBookingWidget(widgets.showBookingWidget !== false);
    })();
    return () => {
      cancelled = true;
    };
  }, [contentSourceRefreshKey]);

  useEffect(() => {
    const isAdminRoute = pathname.includes('artist-portal') || pathname.includes('artist-login');
    const isHomepage = pathname === '/';
    const commonSelector =
      '#salonized-widget, .salonized-booking, .sz-booking-button, .salonized-booking-button, iframe[src*="salonized.com"]';

    const ensureStyle = (id: string, css: string, enabled: boolean) => {
      let style = document.getElementById(id) as HTMLStyleElement | null;
      if (enabled) {
        if (!style) {
          style = document.createElement('style');
          style.id = id;
          document.head.appendChild(style);
        }
        style.innerHTML = css;
      } else if (style) {
        style.remove();
      }
    };

    const applyVisibilityRules = () => {
      const isMobile = window.matchMedia('(max-width: 767px)').matches;
      const bookingIntentActive = document.body.classList.contains('booking-intent-active');
      const hideForMobileHomeTop = isMobile && isHomepage && window.scrollY <= 8 && !bookingIntentActive;

      ensureStyle(
        'hide-booking-widget-admin',
        `${commonSelector}{display:none!important;visibility:hidden!important;pointer-events:none!important;opacity:0!important;}`,
        isAdminRoute
      );

      ensureStyle(
        'hide-booking-widget-mobile-home-top',
        `${commonSelector}{display:none!important;visibility:hidden!important;pointer-events:none!important;opacity:0!important;}`,
        !isAdminRoute && hideForMobileHomeTop
      );

      ensureStyle(
        'hide-booking-widget-global-disabled',
        `${commonSelector}{display:none!important;visibility:hidden!important;pointer-events:none!important;opacity:0!important;}`,
        !showBookingWidget
      );
    };

    applyVisibilityRules();

    const onScroll = () => {
      applyVisibilityRules();
    };
    const onResize = () => {
      applyVisibilityRules();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      const mobileStyle = document.getElementById('hide-booking-widget-mobile-home-top');
      if (mobileStyle) mobileStyle.remove();
      const disabledStyle = document.getElementById('hide-booking-widget-global-disabled');
      if (disabledStyle) disabledStyle.remove();
    };
  }, [pathname, showBookingWidget]);

  return null;
}
