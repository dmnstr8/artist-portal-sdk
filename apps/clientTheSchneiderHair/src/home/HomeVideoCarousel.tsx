/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';

import { useSiteCopy } from '../context/SiteCopyContext';
import { useContentSourceRefreshKey } from '../hooks/useContentSourceRefreshKey';
import {
  COOKIE_CONSENT_UPDATED_EVENT,
  hasConsentFor,
  openConsentPreferences,
} from '../lib/cookieConsent';
import { getWidgetsWithFallback } from 'artist-portal-sdk';

export function HomeVideoCarousel() {
  const { siteCopy } = useSiteCopy();
  const [taggboxWidgetId, setTaggboxWidgetId] = useState('');
  const [showSocialWidget, setShowSocialWidget] = useState(true);
  const [allowSocialWidget, setAllowSocialWidget] = useState(() => hasConsentFor('social'));
  const contentSourceRefreshKey = useContentSourceRefreshKey();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const widgets = await getWidgetsWithFallback();
      if (cancelled) return;
      setTaggboxWidgetId(widgets.taggboxWidgetId?.trim() || '');
      setShowSocialWidget(widgets.showSocialWidget !== false);
    })();
    return () => {
      cancelled = true;
    };
  }, [contentSourceRefreshKey]);

  useEffect(() => {
    const syncConsent = () => setAllowSocialWidget(hasConsentFor('social'));
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, syncConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, syncConsent);
  }, []);

  useEffect(() => {
    if (!showSocialWidget || !taggboxWidgetId || !allowSocialWidget) return;
    const src = 'https://widget.taggbox.com/embed.min.js';
    const existingScripts = Array.from(
      document.querySelectorAll(`script[src="${src}"]`)
    ) as HTMLScriptElement[];
    existingScripts.forEach((s) => s.remove());
    const script = document.createElement('script');
    script.src = src;
    script.type = 'text/javascript';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [showSocialWidget, taggboxWidgetId, allowSocialWidget]);

  if (!showSocialWidget) return null;

  return (
    <section className="py-24 md:py-32 px-4 sm:px-8 bg-stone-100 border-t border-stone-200/60" aria-labelledby="home-videos-heading">
      <div className="max-w-[1720px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12 md:mb-16">
          <div className="space-y-4">
            <h2 id="home-videos-heading" className="text-4xl md:text-6xl tracking-tighter text-stone-800 leading-none">
              {siteCopy.home.videoCarouselInstagram.headingLine1}
              <br />
              <span className="text-gold italic font-normal">{siteCopy.home.videoCarouselInstagram.headingAccent}</span>
            </h2>
            <p className="text-stone-500 max-w-md font-light text-sm">{siteCopy.home.videoCarouselInstagram.subhead}</p>
          </div>
        </div>
        {!allowSocialWidget ? (
          <div className="rounded-xl border border-stone-300/70 bg-white/80 p-6 md:p-8 text-center text-sm text-stone-600">
            {siteCopy.home.videoCarouselInstagram.socialDisabled}{' '}
            <button
              type="button"
              onClick={openConsentPreferences}
              className="ml-2 underline underline-offset-4 text-stone-800 hover:text-gold transition-colors"
            >
              {siteCopy.home.videoCarouselInstagram.manageCookies}
            </button>
          </div>
        ) : taggboxWidgetId ? (
          <div
            key={taggboxWidgetId}
            className="taggbox"
            style={{ width: '100%', height: '100%', overflow: 'auto' }}
            data-widget-id={taggboxWidgetId}
            data-website="1"
          />
        ) : null}
      </div>
    </section>
  );
}
