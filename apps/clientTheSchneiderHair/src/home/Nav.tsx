/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from 'motion/react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useSiteCopy } from '../context/SiteCopyContext';
import { useTheme } from '../context/ThemeContext';
import { useContentSourceRefreshKey } from '../hooks/useContentSourceRefreshKey';
import {
  SHOW_ARTISTS_PAGE_EVENT,
  SHOW_FAQ_PAGE_EVENT,
  SHOW_PRICING_SECTION_EVENT,
  SHOW_PRODUCTS_PAGE_EVENT,
  SHOW_THEME_SELECTOR_EVENT,
  getSettingsWithFallback,
} from 'artist-portal-sdk';
import { shouldUseHashRouting } from '../lib/shouldUseHashRouting';

import type { NavLinkItem } from './navTypes';

export function Nav() {
  const { siteCopy } = useSiteCopy();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showArtistsPage, setShowArtistsPage] = useState(false);
  const [showProductsPage, setShowProductsPage] = useState(true);
  const [showPricingSection, setShowPricingSection] = useState(true);
  const [showFaqPage, setShowFaqPage] = useState(true);
  const location = useLocation();
  const isAdminRoute = location.pathname.includes('artist-portal');
  const { mode, toggle } = useTheme();
  const useHashNavigation = shouldUseHashRouting();
  const contentSourceRefreshKey = useContentSourceRefreshKey();

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('menu-open');
      document.body.style.overflow = 'unset';
    }
    return () => { 
      document.body.classList.remove('menu-open');
      document.body.style.overflow = 'unset'; 
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = await getSettingsWithFallback();
      if (cancelled) return;
      setShowThemeSelector(settings.showThemeSelector === true);
      setShowArtistsPage(settings.showArtistsPage === true);
      setShowProductsPage(settings.showProductsPage !== false);
      setShowPricingSection(settings.showPricingSection !== false);
      setShowFaqPage(settings.showFaqPage !== false);
    })();
    return () => {
      cancelled = true;
    };
  }, [contentSourceRefreshKey]);

  useEffect(() => {
    const onSetting = (e: Event) => {
      const ce = e as CustomEvent<{ showThemeSelector?: boolean }>;
      if (typeof ce.detail?.showThemeSelector === 'boolean') {
        setShowThemeSelector(ce.detail.showThemeSelector);
      }
    };
    window.addEventListener(SHOW_THEME_SELECTOR_EVENT, onSetting as EventListener);
    return () => window.removeEventListener(SHOW_THEME_SELECTOR_EVENT, onSetting as EventListener);
  }, []);

  useEffect(() => {
    const onSetting = (e: Event) => {
      const ce = e as CustomEvent<{ showProductsPage?: boolean }>;
      if (typeof ce.detail?.showProductsPage === 'boolean') {
        setShowProductsPage(ce.detail.showProductsPage);
      }
    };
    window.addEventListener(SHOW_PRODUCTS_PAGE_EVENT, onSetting as EventListener);
    return () => window.removeEventListener(SHOW_PRODUCTS_PAGE_EVENT, onSetting as EventListener);
  }, []);

  useEffect(() => {
    const onSetting = (e: Event) => {
      const ce = e as CustomEvent<{ showPricingSection?: boolean }>;
      if (typeof ce.detail?.showPricingSection === 'boolean') {
        setShowPricingSection(ce.detail.showPricingSection);
      }
    };
    window.addEventListener(SHOW_PRICING_SECTION_EVENT, onSetting as EventListener);
    return () => window.removeEventListener(SHOW_PRICING_SECTION_EVENT, onSetting as EventListener);
  }, []);

  useEffect(() => {
    const onSetting = (e: Event) => {
      const ce = e as CustomEvent<{ showFaqPage?: boolean }>;
      if (typeof ce.detail?.showFaqPage === 'boolean') {
        setShowFaqPage(ce.detail.showFaqPage);
      }
    };
    window.addEventListener(SHOW_FAQ_PAGE_EVENT, onSetting as EventListener);
    return () => window.removeEventListener(SHOW_FAQ_PAGE_EVENT, onSetting as EventListener);
  }, []);

  useEffect(() => {
    const onSetting = (e: Event) => {
      const ce = e as CustomEvent<{ showArtistsPage?: boolean }>;
      if (typeof ce.detail?.showArtistsPage === 'boolean') {
        setShowArtistsPage(ce.detail.showArtistsPage);
      }
    };
    window.addEventListener(SHOW_ARTISTS_PAGE_EVENT, onSetting as EventListener);
    return () => window.removeEventListener(SHOW_ARTISTS_PAGE_EVENT, onSetting as EventListener);
  }, []);

  const handleScrollClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Immediate menu close for responsive feel
    setMenuOpen(false);
    
    try {
      const url = new URL(href, window.location.origin);
      const targetPath = url.pathname;
      const targetHash = url.hash.replace('#', '');
      const currentPath = location.pathname;

      // On GitHub Pages/file mode we always drive navigation via hash-router URLs.
      // This avoids fallback to `https://<user>.github.io/#...` when a section isn't mounted yet.
      if (useHashNavigation && targetPath === '/' && targetHash) {
        e.preventDefault();
        window.location.hash = `/#${targetHash}`;
        return;
      }
      
      // Case 1: Same page anchor scroll
      if (currentPath === targetPath && targetHash) {
        const element = document.getElementById(targetHash);
        if (element) {
          e.preventDefault();
          // Increase delay slightly more for mobile menu to finish closing its main layout logic
          setTimeout(() => {
            element.scrollIntoView(); // Rely on CSS scroll-behavior: smooth
            if (useHashNavigation) {
              window.location.hash = `/#${targetHash}`;
            } else {
              window.history.pushState(null, '', href);
            }
          }, 150);
          return;
        }
      }
      
      // Case 2: Scrolling to top of home page
      if (currentPath === '/' && targetPath === '/' && !targetHash) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (useHashNavigation) {
          window.location.hash = '/';
        } else {
          window.history.pushState(null, '', '/');
        }
        return;
      }

      // Otherwise, let the Link component handle the cross-page navigation
      // ScrollToAnchor will take care of it once the new page loads
    } catch (err) {
      console.warn("Scroll navigation error:", err);
    }
  };

  const { links: navLinkCopy } = siteCopy.nav;
  const navLinks: NavLinkItem[] = [
    { label: navLinkCopy.home, href: '/' },
    ...(showPricingSection ? [{ label: navLinkCopy.services, href: '/#services' }] : []),
    { label: navLinkCopy.portfolio, href: '/#portfolio' },
    ...(showArtistsPage ? [{ label: navLinkCopy.artists, href: '/artists' }] : []),
    ...(showProductsPage
      ? [
          {
            label: navLinkCopy.recommendedProducts,
            desktopLabel: (
              <>
                {navLinkCopy.recommendedProductsDesktopLine1}
                <br />
                {navLinkCopy.recommendedProductsDesktopLine2}
              </>
            ),
            href: '/products',
          },
        ]
      : []),
    ...(showFaqPage
      ? [
          { label: navLinkCopy.educationFaq, href: '/education' },
          { label: navLinkCopy.ebook, href: '/education#ebook' },
          {
            label: navLinkCopy.eventTickets,
            desktopLabel: (
              <>
                {navLinkCopy.eventTicketsDesktopLine1}
                <br />
                {navLinkCopy.eventTicketsDesktopLine2}
              </>
            ),
            href: '/education#events',
          },
        ]
      : []),
  ];

  if (isAdminRoute) return null;

  const drawerEase = [0.22, 1, 0.36, 1] as const;
  const drawerTransition = reduceMotion
    ? { duration: 0.01 }
    : { duration: 0.48, ease: drawerEase };
  const drawerLinkTransition = reduceMotion
    ? { duration: 0.01 }
    : { duration: 0.38, ease: drawerEase };

  return (
    <>
      <nav className="site-nav-bar fixed top-0 w-full z-50 glass shadow-sm shadow-stone-900/5 dark:shadow-black/40">
        <div className="site-nav-inner flex justify-between items-center px-5 sm:px-8 py-5 sm:py-6 max-w-[1920px] mx-auto">
          <motion.div
            className="flex items-center gap-5 sm:gap-8"
            initial={reduceMotion ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.55, ease: drawerEase }}
          >
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-controls="site-nav-drawer"
              aria-label={siteCopy.nav.openMenu}
              className="group flex h-10 w-10 items-center justify-center rounded-lg border border-stone-200/80 bg-white/70 text-stone-600 transition-colors hover:border-gold/50 hover:text-stone-900 dark:border-stone-700 dark:bg-stone-900/60 dark:text-stone-300 dark:hover:border-gold/40 dark:hover:text-stone-50 menu-trigger"
            >
              <Menu className="h-5 w-5 transition-transform group-hover:scale-105" strokeWidth={1.5} />
            </button>
            <Link
              to="/"
              className="text-lg sm:text-xl md:text-2xl font-serif tracking-[0.12em] text-stone-800 dark:text-stone-100 lowercase font-medium z-[51] hover:text-gold transition-colors duration-300"
            >
              {siteCopy.brand.siteName}
            </Link>
          </motion.div>
          <div className="flex items-center gap-3 sm:gap-4 xl:gap-8">
            <motion.div
              className="nav-tablet-links hidden md:flex items-center justify-end gap-1 md:gap-1.5 lg:gap-2 max-w-[70vw] flex-wrap"
              initial={reduceMotion ? false : { opacity: 0, x: -28 }}
              animate={{ opacity: 1, x: 0 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.55, ease: drawerEase, delay: 0.06 }}
            >
              {navLinks.map((item, i) => (
                <motion.div
                  key={`${item.href}-${item.label}`}
                  initial={reduceMotion ? false : { opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={
                    reduceMotion ? { duration: 0 } : { duration: 0.42, ease: drawerEase, delay: 0.08 + i * 0.045 }
                  }
                >
                  <Link
                    to={item.href}
                    onClick={(e) => handleScrollClick(e, item.href)}
                    className="nav-tablet-link-item group relative block px-2.5 md:px-3 lg:px-3.5 py-2 text-center"
                  >
                    <span className="relative font-sans text-[9px] md:text-[9.5px] lg:text-[10px] font-semibold uppercase tracking-[0.12em] md:tracking-[0.16em] lg:tracking-[0.22em] text-stone-600 transition-colors group-hover:text-stone-900 dark:text-stone-400 dark:group-hover:text-stone-100 leading-snug">
                      {item.desktopLabel || item.label}
                      <span className="pointer-events-none absolute -bottom-0.5 left-3 right-3 h-px origin-left scale-x-0 bg-stone-400 dark:bg-stone-500 transition-transform duration-300 group-hover:scale-x-100" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
            {showThemeSelector && (
              <button
                type="button"
                onClick={toggle}
                aria-label={mode === 'dark' ? siteCopy.nav.themeLightAria : siteCopy.nav.themeDarkAria}
                className="p-2.5 rounded-lg border border-transparent text-stone-600 hover:bg-stone-200/70 hover:border-stone-200 dark:text-stone-300 dark:hover:bg-stone-800/80 dark:hover:border-stone-700 transition-all shrink-0"
              >
                {mode === 'dark' ? <Sun className="w-5 h-5" strokeWidth={1.5} /> : <Moon className="w-5 h-5" strokeWidth={1.5} />}
              </button>
            )}
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              aria-label={siteCopy.nav.closeMenu}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={reduceMotion ? { duration: 0.01 } : { duration: 0.35 }}
              className="fixed inset-0 z-[100] bg-stone-950/55 backdrop-blur-[2px] dark:bg-black/65"
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              id="site-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={siteCopy.nav.siteNavigationAria}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={drawerTransition}
              className="fixed inset-y-0 left-0 z-[101] flex w-[min(100vw,20.5rem)] sm:w-[22.5rem] flex-col border-r border-stone-200/80 bg-stone-50 shadow-2xl shadow-stone-900/15 dark:border-stone-700/80 dark:bg-stone-950 dark:shadow-black/50"
            >
              <div className="flex items-center justify-between gap-3 border-b border-stone-200/80 px-5 py-5 dark:border-stone-800">
                <div>
                  <p className="font-sans text-[9px] font-bold uppercase tracking-[0.35em] text-stone-500 dark:text-stone-400">
                    {siteCopy.nav.navigateLabel}
                  </p>
                  <p className="mt-1 font-serif text-lg tracking-wide text-stone-800 dark:text-stone-100">{siteCopy.nav.menuTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 text-stone-600 transition-colors hover:border-gold/50 hover:bg-white hover:text-stone-900 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-900 dark:hover:text-stone-50"
                  aria-label={siteCopy.nav.closeMenu}
                >
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-0 overflow-y-auto overscroll-contain px-3 py-4">
                <motion.ul
                  className="flex flex-col gap-1"
                  initial="hidden"
                  animate="show"
                  variants={
                    reduceMotion
                      ? { hidden: {}, show: { transition: { staggerChildren: 0 } } }
                      : {
                          hidden: {},
                          show: { transition: { staggerChildren: 0.065, delayChildren: 0.1 } },
                        }
                  }
                >
                  {navLinks.map((item) => (
                    <motion.li
                      key={`${item.href}-${item.label}`}
                      variants={{
                        hidden: { opacity: 0, x: -36 },
                        show: { opacity: 1, x: 0, transition: drawerLinkTransition },
                      }}
                    >
                      <Link
                        to={item.href}
                        onClick={(e) => handleScrollClick(e, item.href)}
                        className="group flex flex-col rounded-xl px-4 py-4 transition-colors hover:bg-white/90 dark:hover:bg-stone-900/90"
                      >
                        <span className="font-serif text-xl sm:text-2xl leading-tight tracking-tight text-stone-800 transition-colors group-hover:text-stone-900 dark:text-stone-100 dark:group-hover:text-stone-50">
                          {item.label}
                        </span>
                        <span className="mt-3 h-px w-8 bg-stone-300 transition-all group-hover:w-12 group-hover:bg-stone-500 dark:bg-stone-600 dark:group-hover:bg-stone-400" />
                      </Link>
                    </motion.li>
                  ))}
                </motion.ul>
              </nav>
              <div className="shrink-0 border-t border-stone-200/80 px-5 py-4 dark:border-stone-800">
                <p className="font-sans text-[10px] leading-relaxed text-stone-500 dark:text-stone-400">
                  {siteCopy.nav.drawerTagline}
                </p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
