/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useInView } from 'motion/react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

import ImageWithFallback from '../components/ImageWithFallback';
import { useSiteCopy } from '../context/SiteCopyContext';
import { shouldUseHashRouting } from '../lib/shouldUseHashRouting';
import { triggerBooking } from '../lib/salonizedBookingWidget';
import { assetUrl } from '../shared/utils/assetUrl';

export function Hero() {
  const { siteCopy } = useSiteCopy();
  const heroPhotoRef = useRef<HTMLDivElement | null>(null);
  const heroPhotoInView = useInView(heroPhotoRef, { amount: 0.35 });

  return (
  <section className="hero-tablet-section relative min-h-[70vh] flex items-center overflow-hidden px-4 sm:px-8 pt-24 pb-8 md:pt-32 md:pb-16">
    <div className="hero-tablet-grid grid grid-cols-12 w-full max-w-[1720px] mx-auto items-center gap-8 md:gap-12">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="hero-tablet-copy col-span-12 md:col-span-6 z-10 space-y-8 md:space-y-12 mt-8 md:mt-0"
      >
        <div className="inline-block px-4 py-1.5 bg-stone-100 rounded-full">
          <span className="text-[10px] font-bold tracking-[0.3em] text-stone-500 uppercase">{siteCopy.home.hero.badge}</span>
        </div>
        <div className="relative">
          <h1 className="relative z-10 text-[13vw] sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter leading-[0.85] text-stone-800 max-w-full pr-[34vw] md:pr-0">
            {siteCopy.home.hero.titleLine1}
            <br />
            {siteCopy.home.hero.titleLine2}
            <br />
            <span className="italic font-normal text-stone-400 whitespace-nowrap">{siteCopy.home.hero.titleAccent}</span>
          </h1>
          <ImageWithFallback
            src={assetUrl('/media/artist/artist-transparent.png')}
            alt={siteCopy.home.hero.leadArtistPhotoAlt}
            className="artist-transparent-tablet md:block lg:hidden pointer-events-none select-none absolute right-0 top-1/2 -translate-y-1/2 -scale-x-100 w-[42vw] max-w-[210px] object-contain z-0"
          />
        </div>
        <p className="text-stone-500 max-w-md leading-relaxed tracking-wide text-sm md:text-base opacity-90 font-light text-justify">
          {siteCopy.home.hero.body}
        </p>
          <div className="hero-tablet-cta-row flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center pt-4 w-full">
            <button 
              onClick={triggerBooking}
              className="cta-pulse px-8 md:px-12 py-4 md:py-5 w-full sm:w-auto bg-stone-800 text-stone-50 text-[10px] font-bold tracking-[0.3em] uppercase rounded-md hover:bg-gold hover:scale-[1.02] active:scale-95 transition-all duration-500 booking-trigger text-center relative overflow-hidden group shadow-lg shadow-stone-900/10"
            >
              <span className="relative z-10">{siteCopy.home.hero.ctaBook}</span>
              <div className="absolute inset-0 bg-gold/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            </button>
            <Link 
              to="/#services" 
              onClick={(e) => {
                const element = document.getElementById('services');
                if (element) {
                  e.preventDefault();
                  element.scrollIntoView(); // Rely on CSS smooth scroll
                  const useHashNavigation = shouldUseHashRouting();
                  if (useHashNavigation) {
                    window.location.hash = '/#services';
                  } else {
                    window.history.pushState(null, '', '/#services');
                  }
                }
              }}
              className="hero-tablet-explore-link text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.3em] text-stone-400 hover:text-stone-800 transition-colors uppercase border-b border-stone-200 hover:border-stone-800 pb-1 whitespace-nowrap text-center"
            >
              {siteCopy.home.hero.exploreServices}
            </Link>
          </div>
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
        ref={heroPhotoRef}
        className="hero-photo-frame-tablet col-span-12 md:col-span-6 h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] relative w-full mt-4 md:mt-0 rounded-2xl overflow-hidden"
      >
        <ImageWithFallback
          src={assetUrl('/media/artist/artist-hero.png')}
          alt={siteCopy.home.hero.heroPortraitAlt}
          className={`hero-photo-tablet w-full h-full object-cover object-top sm:object-center rounded-2xl grayscale transition-all duration-1000 hover:grayscale-0 shadow-2xl ${heroPhotoInView ? 'tablet-scroll-color' : ''}`}
        />
        <div className="absolute -bottom-8 -left-8 bg-stone-50 p-8 rounded-xl shadow-xl hidden md:block z-10 w-64">
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-stone-400 mb-2">{siteCopy.home.hero.leadArtistLabel}</p>
          <h4 className="text-xl font-serif">{siteCopy.home.hero.leadArtistName}</h4>
        </div>
      </motion.div>
    </div>
  </section>
  );
}
