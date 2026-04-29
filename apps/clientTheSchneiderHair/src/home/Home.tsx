/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';

import {
  SHOW_GALLERY_SECTION_EVENT,
  SHOW_PRICING_SECTION_EVENT,
  SHOW_REVIEWS_SECTION_EVENT,
  SHOW_VIDEO_SECTION_EVENT,
  getSettingsWithFallback,
} from 'artist-portal-sdk';
import { useContentSourceRefreshKey } from '../hooks/useContentSourceRefreshKey';

import { AboutArtist } from './AboutArtist';
import { FinalCTA } from './FinalCTA';
import { Hero } from './Hero';
import { HomeVideoCarousel } from './HomeVideoCarousel';
import { LocationSection } from './LocationSection';
import { Portfolio } from './Portfolio';
import { Reviews } from './Reviews';
import { Services } from './Services';

export function Home() {
  const [showReviewsSection, setShowReviewsSection] = useState(true);
  const [showPricingSection, setShowPricingSection] = useState(true);
  const [showVideoSection, setShowVideoSection] = useState(true);
  const [showGallerySection, setShowGallerySection] = useState(true);
  const contentSourceRefreshKey = useContentSourceRefreshKey();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = await getSettingsWithFallback();
      if (cancelled) return;
      setShowReviewsSection(settings.showReviewsSection !== false);
      setShowPricingSection(settings.showPricingSection !== false);
      setShowVideoSection(settings.showVideoSection !== false);
      setShowGallerySection(settings.showGallerySection !== false);
    })();
    return () => {
      cancelled = true;
    };
  }, [contentSourceRefreshKey]);

  useEffect(() => {
    const onSetting = (e: Event) => {
      const ce = e as CustomEvent<{ showReviewsSection?: boolean }>;
      if (typeof ce.detail?.showReviewsSection === 'boolean') {
        setShowReviewsSection(ce.detail.showReviewsSection);
      }
    };
    window.addEventListener(SHOW_REVIEWS_SECTION_EVENT, onSetting as EventListener);
    return () => window.removeEventListener(SHOW_REVIEWS_SECTION_EVENT, onSetting as EventListener);
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
      const ce = e as CustomEvent<{ showVideoSection?: boolean }>;
      if (typeof ce.detail?.showVideoSection === 'boolean') {
        setShowVideoSection(ce.detail.showVideoSection);
      }
    };
    window.addEventListener(SHOW_VIDEO_SECTION_EVENT, onSetting as EventListener);
    return () => window.removeEventListener(SHOW_VIDEO_SECTION_EVENT, onSetting as EventListener);
  }, []);

  useEffect(() => {
    const onSetting = (e: Event) => {
      const ce = e as CustomEvent<{ showGallerySection?: boolean }>;
      if (typeof ce.detail?.showGallerySection === 'boolean') {
        setShowGallerySection(ce.detail.showGallerySection);
      }
    };
    window.addEventListener(SHOW_GALLERY_SECTION_EVENT, onSetting as EventListener);
    return () => window.removeEventListener(SHOW_GALLERY_SECTION_EVENT, onSetting as EventListener);
  }, []);

  return (
    <main>
      <Hero />
      <AboutArtist />
      {showGallerySection && <Portfolio />}
      {showReviewsSection && <Reviews />}
      {showPricingSection && <Services />}
      {showVideoSection && <HomeVideoCarousel />}
      <LocationSection />
      <FinalCTA />
    </main>
  );
}
