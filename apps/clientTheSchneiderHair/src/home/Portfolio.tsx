/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

import ImageWithFallback from '../components/ImageWithFallback';
import { useSiteCopy } from '../context/SiteCopyContext';
import { formatCopy } from '../content/siteCopy';
import {
  CONTENT_DATA_SOURCE_MODE_EVENT,
  GALLERY_HOME_UPDATED_EVENT,
  getGalleryHomeWithFallback,
  getSettingsWithFallback,
} from 'artist-portal-sdk';
import { normalizeMediaStorageRoot, resolveGalleryImageSrc } from '../lib/galleryHome';
import type { GalleryHomeData } from '../types/domain';

import { GalleryLightbox } from './GalleryLightbox';

export function Portfolio() {
  const { siteCopy } = useSiteCopy();
  const MAX_TWO_ROW_GRID_ITEMS = 8;
  const MOBILE_BREAKPOINT = 768;
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [gallery, setGallery] = useState<GalleryHomeData | null>(null);
  const [mediaStorageRoot, setMediaStorageRoot] = useState('');
  const [galleryRefreshKey, setGalleryRefreshKey] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => (typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false)
  );

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth < MOBILE_BREAKPOINT);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getGalleryHomeWithFallback();
      const settings = await getSettingsWithFallback();
      if (!cancelled) setGallery(data);
      if (!cancelled) setMediaStorageRoot(normalizeMediaStorageRoot(settings.mediaStorageRoot));
    })();
    return () => {
      cancelled = true;
    };
  }, [galleryRefreshKey]);

  useEffect(() => {
    const bump = () => setGalleryRefreshKey((k) => k + 1);
    window.addEventListener(CONTENT_DATA_SOURCE_MODE_EVENT, bump as EventListener);
    window.addEventListener(GALLERY_HOME_UPDATED_EVENT, bump as EventListener);
    return () => {
      window.removeEventListener(CONTENT_DATA_SOURCE_MODE_EVENT, bump as EventListener);
      window.removeEventListener(GALLERY_HOME_UPDATED_EVENT, bump as EventListener);
    };
  }, []);

  const images = useMemo(() => {
    if (!gallery?.images?.length) return [];
    return gallery.images
      .filter((img) => img.enabled !== false)
      .sort((a, b) => a.order - b.order)
      .map((img) => ({
        src: resolveGalleryImageSrc(img.src, mediaStorageRoot),
        label: img.label,
      }));
  }, [gallery, mediaStorageRoot]);

  const carouselRows = useMemo(() => {
    const rows: Array<Array<{ src: string; label: string; index: number }>> = [[], []];
    images.forEach((img, index) => {
      rows[index % 2].push({ ...img, index });
    });
    return rows;
  }, [images]);
  const shouldUseCarousel =
    images.length > MAX_TWO_ROW_GRID_ITEMS || (isMobileViewport && images.length > 2);

  useEffect(() => {
    if (activeIdx !== null && activeIdx >= images.length) {
      setActiveIdx(null);
    }
  }, [activeIdx, images.length]);

  useEffect(() => {
    if (activeIdx !== null) {
      document.body.classList.add('lightbox-open');
    } else {
      document.body.classList.remove('lightbox-open');
    }
    return () => { document.body.classList.remove('lightbox-open'); };
  }, [activeIdx]);

  if (!gallery) {
    return (
      <section className="py-32 px-8 bg-stone-100" id="portfolio">
        <div className="max-w-[1720px] mx-auto h-48 flex items-center justify-center text-stone-400 text-sm font-light">
          {siteCopy.home.portfolio.loading}
        </div>
      </section>
    );
  }

  return (
    <section className="py-32 px-8 bg-stone-100" id="portfolio">
      <div className="max-w-[1720px] mx-auto">
        <div className="mb-24 flex flex-col items-start gap-12">
          <div className="space-y-6">
            <h2 className="text-6xl md:text-7xl tracking-tighter text-stone-800 leading-none">
              {siteCopy.home.portfolio.titleLine1}
              <br />
              <span className="text-gold italic font-normal">{siteCopy.home.portfolio.titleAccent}</span>
            </h2>
            <p className="text-stone-500 max-w-md font-light text-sm italic">{siteCopy.home.portfolio.subhead}</p>
          </div>
          <p className="text-stone-400 font-sans tracking-[0.4em] text-[10px] uppercase border-b border-stone-200 pb-3 text-left">
            {siteCopy.home.portfolio.sectionKicker}
          </p>
        </div>

        {shouldUseCarousel ? (
          <div className="space-y-6">
            {carouselRows.map((row, rowIndex) => {
              if (row.length === 0) return null;
              const loopItems = [...row, ...row];
              const duration = Math.max(22, row.length * 5.5);
              return (
                <div key={`portfolio-row-${rowIndex}`} className="relative overflow-hidden rounded-2xl">
                  <div className="portfolio-carousel-edge-fade portfolio-carousel-edge-fade-left pointer-events-none absolute inset-y-0 left-0 z-10 w-16" />
                  <div className="portfolio-carousel-edge-fade portfolio-carousel-edge-fade-right pointer-events-none absolute inset-y-0 right-0 z-10 w-16" />
                  <motion.div
                    className="flex w-max gap-5 md:gap-8 py-1"
                    animate={{ x: rowIndex === 0 ? ['0%', '-50%'] : ['-50%', '0%'] }}
                    transition={{ duration, ease: 'linear', repeat: Infinity }}
                  >
                    {loopItems.map((img, i) => (
                      <button
                        key={`${rowIndex}-${img.index}-${i}`}
                        type="button"
                        onClick={() => setActiveIdx(img.index)}
                        className="relative group h-[220px] w-[200px] sm:h-[240px] sm:w-[220px] md:h-[320px] md:w-[280px] overflow-hidden rounded-xl shadow-lg bg-stone-200 cursor-pointer"
                        aria-label={formatCopy(siteCopy.home.portfolioLightbox.openImageAriaTemplate, {
                          n: img.index + 1,
                        })}
                      >
                        <ImageWithFallback
                          src={img.src}
                          alt={img.label}
                          className="portfolio-gallery-image w-full h-full object-cover grayscale transition-all duration-700 group-hover:scale-110 group-hover:grayscale-0"
                        />
                        <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-5 md:p-6 text-left">
                          <div>
                            <p className="text-[9px] md:text-[10px] text-stone-50 font-bold tracking-[0.28em] md:tracking-[0.35em] uppercase mb-1">{img.label}</p>
                            <div className="h-px w-8 bg-gold" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
            {images.map((img, i) => (
              <button
                key={`portfolio-grid-${i}`}
                type="button"
                onClick={() => setActiveIdx(i)}
                className="relative group h-[220px] sm:h-[240px] md:h-[320px] overflow-hidden rounded-xl shadow-lg bg-stone-200 cursor-pointer text-left"
                aria-label={formatCopy(siteCopy.home.portfolioLightbox.openImageAriaTemplate, { n: i + 1 })}
              >
                <ImageWithFallback
                  src={img.src}
                  alt={img.label}
                  className="portfolio-gallery-image w-full h-full object-cover grayscale transition-all duration-700 group-hover:scale-110 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-5 md:p-6">
                  <div>
                    <p className="text-[9px] md:text-[10px] text-stone-50 font-bold tracking-[0.28em] md:tracking-[0.35em] uppercase mb-1">{img.label}</p>
                    <div className="h-px w-8 bg-gold" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeIdx !== null && (
          <GalleryLightbox  
            images={images}
            index={activeIdx}
            onClose={() => setActiveIdx(null)}
            onNext={() => setActiveIdx((activeIdx + 1) % images.length)}
            onPrev={() => setActiveIdx((activeIdx - 1 + images.length) % images.length)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
