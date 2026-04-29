/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

import ImageWithFallback from '../components/ImageWithFallback';
import { useSiteCopy } from '../context/SiteCopyContext';
import { assetUrl } from '../shared/utils/assetUrl';

export function AboutArtist() {
  const { siteCopy } = useSiteCopy();
  const aboutImageRef = useRef<HTMLDivElement | null>(null);
  const aboutImageInView = useInView(aboutImageRef, { amount: 0.35 });
  const aboutBelowImageRef = useRef<HTMLDivElement | null>(null);
  const aboutBelowImageInView = useInView(aboutBelowImageRef, { amount: 0.35 });

  return (
  <section className="pt-16 pb-24 md:py-32 px-4 sm:px-8 overflow-hidden bg-stone-50" id="about">
    <div className="about-artist-tablet-grid max-w-[1720px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        ref={aboutImageRef}
        className="about-artist-tablet-image hidden md:block relative group h-[500px] md:h-[600px] lg:h-[700px] rounded-2xl overflow-hidden shadow-2xl"
      >
        <ImageWithFallback
          src={assetUrl('/media/artist/artist-secondary.png')}
          alt={siteCopy.home.aboutArtist.secondaryAlt}
          className={`hero-photo-tablet w-full h-full object-cover object-top sm:object-center rounded-2xl grayscale transition-all duration-1000 hover:grayscale-0 shadow-2xl ${aboutImageInView ? 'tablet-scroll-color' : ''}`}
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="about-artist-tablet-copy space-y-12"
      >
        <div className="space-y-6">
          <h2 className="text-5xl md:text-7xl tracking-tighter text-stone-800">
            {siteCopy.home.aboutArtist.titleLine1}
            <br className="hidden md:block about-artist-title-break" />{' '}
            <span className="text-gold italic font-normal">{siteCopy.home.aboutArtist.titleAccent}</span>
          </h2>
          <p className="text-xl font-serif text-stone-500 italic">
            {siteCopy.home.aboutArtist.tagline}
            <br />
            <br />
          </p>
        </div>

        <div className="about-artist-tablet-prose space-y-6 text-stone-600 font-light leading-relaxed max-w-xl text-justify">
          <p>
            {siteCopy.home.aboutArtist.bodyParagraph1}
            <br />
            <br /> {siteCopy.home.aboutArtist.bodyParagraph2} <br />
            <br />
          </p>
        </div>

        {/* MOBILE ONLY IMAGE */}
        <div ref={aboutBelowImageRef} className="about-artist-tablet-below-image md:hidden relative group h-[400px] rounded-2xl overflow-hidden shadow-2xl w-full">
          <ImageWithFallback
            src={assetUrl('/media/artist/artist-secondary.png')}
            alt={siteCopy.home.aboutArtist.mobilePortraitAlt}
            className={`hero-photo-tablet w-full h-full object-cover object-top sm:object-center rounded-2xl grayscale transition-all duration-1000 hover:grayscale-0 shadow-2xl ${aboutBelowImageInView ? 'tablet-scroll-color' : ''}`}
          /> 
        </div>

        <div className="about-artist-tablet-card bg-stone-100 p-8 rounded-xl border-l-4 border-gold space-y-4 max-w-xl text-justify">
          <p className="font-medium text-stone-800 leading-snug">{siteCopy.home.aboutArtist.cardLead}</p>
          <ul className="space-y-2 text-stone-600 text-sm font-light list-disc list-inside text-left">
            {siteCopy.home.aboutArtist.cardBullets.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  </section>
  );
}
