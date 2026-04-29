/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

import { useSiteCopy } from '../context/SiteCopyContext';
import { triggerBooking } from '../lib/salonizedBookingWidget';

export function FinalCTA() {
  const { siteCopy } = useSiteCopy();
  return (
    <section className="final-cta-section py-32 md:py-48 px-4 sm:px-8 bg-stone-900 text-stone-50 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="final-cta-bg-glow absolute top-[-50%] left-[-20%] w-[100vw] h-[100vh] bg-gold rounded-full blur-[120px]" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto space-y-12 md:space-y-16 relative z-10 w-full"
      >
        <h2 className="final-cta-heading text-[12vw] sm:text-6xl md:text-8xl tracking-tighter leading-[0.9] italic font-serif break-words max-w-full">
          {siteCopy.home.finalCta.headlineLine1}
          <br />
          {siteCopy.home.finalCta.headlineLine2}
        </h2>
        <p className="font-sans text-[10px] tracking-[0.3em] sm:tracking-[0.5em] uppercase opacity-50 font-medium">
          {siteCopy.home.finalCta.subhead}
        </p>
        <div className="flex justify-center pt-8">
          <button
            onClick={triggerBooking}
            className="cta-pulse on-dark-surface px-12 sm:px-16 py-5 sm:py-6 bg-stone-50 text-stone-900 rounded-md font-bold tracking-[0.4em] text-[10px] hover:bg-gold hover:text-stone-50 transition-all duration-500 hover:scale-[1.02] active:scale-95 shadow-xl shadow-stone-50/5 relative overflow-hidden booking-trigger group"
          >
            <span className="relative z-10">{siteCopy.home.finalCta.cta}</span>
            <div className="absolute inset-0 bg-stone-900/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </button>
        </div>
      </motion.div>
    </section>
  );
}
