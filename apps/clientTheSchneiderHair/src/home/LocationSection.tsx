/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import { useMemo } from 'react';

import { useSiteCopy } from '../context/SiteCopyContext';
import { useSiteEditorSettingsRefresh } from '../hooks/useSiteEditorSettingsRefresh';
import {
  getLocationSiteEditorSettings,
  resolveGoogleMapsOpenUrl,
  resolveMapsIframeSrc,
} from 'artist-portal-sdk';

export function LocationSection() {
  const { siteCopy } = useSiteCopy();
  const siteEditorKey = useSiteEditorSettingsRefresh();
  const loc = useMemo(() => getLocationSiteEditorSettings(), [siteEditorKey]);
  const iframeSrc = useMemo(() => resolveMapsIframeSrc(loc), [loc]);
  const mapsOpenUrl = useMemo(() => resolveGoogleMapsOpenUrl(loc), [loc]);

  return (
    <section className="py-32 px-8 overflow-hidden">
      <div className="location-tablet-grid max-w-[1720px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="location-tablet-copy space-y-16"
        >
          <h2 className="text-[12vw] sm:text-6xl md:text-7xl tracking-tighter text-stone-800 break-words mb-2">
            <span className="whitespace-nowrap">{loc.headingLine1}</span> <br />
            <span className="text-stone-300 italic font-normal">{loc.headingLine2}</span>
          </h2>
          <div className="space-y-10">
            <div className="flex items-start gap-8 border-b border-stone-100 pb-10">
              <div className="p-3 bg-stone-100 rounded-full">
                <MapPin className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase mb-3 text-stone-400">
                  {siteCopy.home.location.addressHeading}
                </h4>
                <p className="text-stone-600 text-sm font-light whitespace-pre-line">{loc.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-8 border-b border-stone-100 pb-10">
              <div className="p-3 bg-stone-100 rounded-full">
                <Clock className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase mb-3 text-stone-400">
                  {siteCopy.home.location.hoursHeading}
                </h4>
                <p className="text-stone-600 text-sm font-light whitespace-pre-line">{loc.operatingHours}</p>
              </div>
            </div>
          </div>
          <a
            href={mapsOpenUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-4 text-[10px] font-bold tracking-[0.3em] uppercase text-stone-800 hover:gap-6 transition-all group"
          >
            {siteCopy.home.location.viewMapsCta}
            <ArrowRight className="w-4 h-4 text-gold transition-transform" />
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="location-tablet-map relative group"
        >
          <div className="absolute -inset-6 bg-stone-100 rounded-2xl -z-10 transition-transform duration-700 group-hover:scale-[1.02]" />
          <div className="location-tablet-map-frame h-[650px] w-full rounded-xl overflow-hidden shadow-2xl relative bg-stone-900 border border-stone-800">
            <iframe
              src={iframeSrc}
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'grayscale(100%) invert(100%)' }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
