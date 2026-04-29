/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useRef, useState } from 'react';

import { useSiteCopy } from '../context/SiteCopyContext';
import {
  buildAcceptAllRecord,
  buildConsentRecord,
  buildDeclineAllRecord,
  COOKIE_CONSENT_OPEN_PREFERENCES_EVENT,
  COOKIE_CONSENT_UPDATED_EVENT,
  hasAnySavedConsent,
  openConsentPreferences,
  readConsentRecord,
  writeConsentRecord,
  type ConsentPreferences,
} from '../lib/cookieConsent';
import { assetUrl } from '../shared/utils/assetUrl';
import {
  clampCookieFabPosition,
  COOKIE_CONSENT_FAB_POSITION_KEY,
  COOKIE_FAB_DRAG_THRESHOLD_PX,
  COOKIE_FAB_SIZE_PX,
  defaultCookieFabPosition,
  readStoredCookieFabPosition,
} from './cookieConsentFab';

/** Cookie + scissors line art for the draggable consent FAB (`public/media/other/cookie-consent-fab.png`). */
function CookieFabIcon({ className }: { className?: string }) {
  return (
    <img
      src={assetUrl('/media/other/cookie-consent-fab.png')}
      alt=""
      width={36}
      height={36}
      draggable={false}
      className={`h-9 w-9 select-none object-contain opacity-100 ${className ?? ''}`}
      aria-hidden
    />
  );
}

export function CookieConsent() {
  const { siteCopy } = useSiteCopy();
  const [show, setShow] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [hasSavedConsent, setHasSavedConsent] = useState(() => hasAnySavedConsent());
  const [preferences, setPreferences] = useState<ConsentPreferences>(() => {
    const record = readConsentRecord();
    return (
      record?.preferences ?? {
        necessary: true,
        functional: false,
        social: false,
        analytics: false,
        marketing: false,
      }
    );
  });

  const [cookieFabPos, setCookieFabPos] = useState(() => readStoredCookieFabPosition() ?? defaultCookieFabPosition());
  const fabDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origLeft: number;
    origTop: number;
  } | null>(null);

  useEffect(() => {
    const onResize = () => {
      setCookieFabPos((prev) =>
        clampCookieFabPosition(prev.left, prev.top, window.innerWidth, window.innerHeight, COOKIE_FAB_SIZE_PX)
      );
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!hasAnySavedConsent()) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const syncConsent = () => setHasSavedConsent(hasAnySavedConsent());
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, syncConsent);
    return () => window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, syncConsent);
  }, []);

  useEffect(() => {
    const openPreferences = () => {
      const record = readConsentRecord();
      if (record) setPreferences(record.preferences);
      setManageOpen(true);
      setShow(true);
    };
    window.addEventListener(COOKIE_CONSENT_OPEN_PREFERENCES_EVENT, openPreferences);
    return () =>
      window.removeEventListener(COOKIE_CONSENT_OPEN_PREFERENCES_EVENT, openPreferences);
  }, []);

  const persistConsent = (next: ConsentPreferences) => {
    const record = buildConsentRecord(next);
    writeConsentRecord(record);
    setShow(false);
    setManageOpen(false);
  };

  const handleCookieFabPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    fabDragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: cookieFabPos.left,
      origTop: cookieFabPos.top,
    };
  };

  const handleCookieFabPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = fabDragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    setCookieFabPos(
      clampCookieFabPosition(
        d.origLeft + dx,
        d.origTop + dy,
        window.innerWidth,
        window.innerHeight,
        COOKIE_FAB_SIZE_PX
      )
    );
  };

  const handleCookieFabPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = fabDragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    fabDragRef.current = null;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const distSq = dx * dx + dy * dy;
    const th = COOKIE_FAB_DRAG_THRESHOLD_PX;
    if (distSq <= th * th) {
      setCookieFabPos({ left: d.origLeft, top: d.origTop });
      openConsentPreferences();
      return;
    }
    const final = clampCookieFabPosition(
      d.origLeft + dx,
      d.origTop + dy,
      window.innerWidth,
      window.innerHeight,
      COOKIE_FAB_SIZE_PX
    );
    setCookieFabPos(final);
    try {
      localStorage.setItem(COOKIE_CONSENT_FAB_POSITION_KEY, JSON.stringify(final));
    } catch {
      // ignore
    }
  };

  const handleCookieFabPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = fabDragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    fabDragRef.current = null;
    setCookieFabPos({ left: d.origLeft, top: d.origTop });
  };

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div 
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="cookie-banner"
        >
          <div className="max-w-[1200px] mx-auto w-full">
            <div className="flex flex-col md:flex-row items-start justify-between gap-8 md:gap-12 text-left">
              <div className="space-y-4 md:space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <span className="text-[10px] font-bold tracking-[0.3em] text-gold uppercase">
                    {siteCopy.cookieConsent.privacyLabel}
                  </span>
                  <div className="h-px w-8 bg-stone-700 hidden md:block" />
                  <h5 className="text-xs font-bold tracking-[0.15em] uppercase text-stone-50 md:text-stone-300">
                    {siteCopy.cookieConsent.cookieProtocolTitle}
                  </h5>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed font-light max-w-xl">{siteCopy.cookieConsent.intro}</p>
                {manageOpen ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label className="flex items-center justify-between rounded-md border border-stone-700/80 px-3 py-2 text-stone-300">
                      <span>{siteCopy.cookieConsent.necessary}</span>
                      <input type="checkbox" checked disabled />
                    </label>
                    <label className="flex items-center justify-between rounded-md border border-stone-700/80 px-3 py-2 text-stone-200">
                      <span>{siteCopy.cookieConsent.functional}</span>
                      <input
                        type="checkbox"
                        checked={preferences.functional}
                        onChange={(e) =>
                          setPreferences((prev) => ({ ...prev, functional: e.target.checked }))
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between rounded-md border border-stone-700/80 px-3 py-2 text-stone-200">
                      <span>{siteCopy.cookieConsent.socialEmbeds}</span>
                      <input
                        type="checkbox"
                        checked={preferences.social}
                        onChange={(e) => setPreferences((prev) => ({ ...prev, social: e.target.checked }))}
                      />
                    </label>
                    <label className="flex items-center justify-between rounded-md border border-stone-700/80 px-3 py-2 text-stone-200">
                      <span>{siteCopy.cookieConsent.analytics}</span>
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) =>
                          setPreferences((prev) => ({ ...prev, analytics: e.target.checked }))
                        }
                      />
                    </label>
                    <label className="flex items-center justify-between rounded-md border border-stone-700/80 px-3 py-2 text-stone-200 sm:col-span-2">
                      <span>{siteCopy.cookieConsent.marketing}</span>
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) =>
                          setPreferences((prev) => ({ ...prev, marketing: e.target.checked }))
                        }
                      />
                    </label>
                  </div>
                ) : null}
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={() => {
                    const record = buildAcceptAllRecord();
                    writeConsentRecord(record);
                    setPreferences(record.preferences);
                    setShow(false);
                    setManageOpen(false);
                  }}
                  className="w-full md:w-40 py-4 md:py-3 bg-stone-50 text-stone-900 text-[10px] font-bold tracking-[0.3em] uppercase rounded-md hover:bg-gold hover:text-stone-50 transition-all duration-300"
                >
                  {siteCopy.cookieConsent.acceptAll}
                </button>
                <button 
                  onClick={() => {
                    const record = buildDeclineAllRecord();
                    writeConsentRecord(record);
                    setPreferences(record.preferences);
                    setShow(false);
                    setManageOpen(false);
                  }}
                  className="w-full md:w-40 py-4 md:py-3 border border-stone-700 text-stone-400 text-[10px] font-bold tracking-[0.3em] uppercase rounded-md hover:border-stone-50 hover:text-stone-50 transition-all duration-300"
                >
                  {siteCopy.cookieConsent.decline}
                </button>
                <button
                  onClick={() => {
                    if (!manageOpen) {
                      setManageOpen(true);
                      return;
                    }
                    persistConsent(preferences);
                  }}
                  className="w-full md:w-44 py-4 md:py-3 border border-gold/60 text-gold text-[10px] font-bold tracking-[0.2em] uppercase rounded-md hover:bg-gold hover:text-stone-950 transition-all duration-300"
                >
                  {manageOpen ? siteCopy.cookieConsent.savePreferences : siteCopy.cookieConsent.manage}
                </button>
              </div>
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!show && hasSavedConsent ? (
        <button
          type="button"
          title={siteCopy.cookieConsent.manageCookiesFloating}
          aria-label={siteCopy.cookieConsent.manageCookiesFloating}
          className="cookie-consent-fab fixed z-[90] flex h-14 w-14 cursor-grab touch-none items-center justify-center rounded-full border border-stone-400/60 bg-gradient-to-b from-stone-50 to-stone-200 shadow-lg shadow-stone-900/20 outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-stone-100 active:cursor-grabbing dark:border-stone-600/70 dark:from-stone-800 dark:to-stone-950 dark:shadow-black/50 dark:focus-visible:ring-offset-stone-900"
          style={{ left: cookieFabPos.left, top: cookieFabPos.top }}
          onPointerDown={handleCookieFabPointerDown}
          onPointerMove={handleCookieFabPointerMove}
          onPointerUp={handleCookieFabPointerUp}
          onPointerCancel={handleCookieFabPointerCancel}
        >
          <CookieFabIcon className="pointer-events-none select-none" />
        </button>
      ) : null}
    </>
  );
}
