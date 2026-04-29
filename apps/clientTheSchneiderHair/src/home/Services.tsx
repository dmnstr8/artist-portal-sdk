/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useSiteCopy } from '../context/SiteCopyContext';
import { useContentSourceRefreshKey } from '../hooks/useContentSourceRefreshKey';
import { getServicesWithSourceWithFallback } from 'artist-portal-sdk';

export function Services() {
  const { siteCopy } = useSiteCopy();
  const [servicesData, setServicesData] = useState<any>(null);
  const [hidePublicPrices, setHidePublicPrices] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number | null>(0);
  const lang = 'en';
  const contentSourceRefreshKey = useContentSourceRefreshKey();

  useEffect(() => {
    const fetchServices = async () => {
      const { services, sourceUsed } = await getServicesWithSourceWithFallback();
      setServicesData({ en: services.en.categories });
      setHidePublicPrices(sourceUsed === 'local');
    };

    fetchServices();
  }, [contentSourceRefreshKey]);

  if (!servicesData) return null;

  return (
    <section className="py-32 px-8 bg-stone-50" id="services">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-8">
          <div className="space-y-6">
            <h2 className="text-5xl md:text-7xl tracking-tighter text-stone-800">
              {siteCopy.home.services.titleLine1}
              <br />
              <span className="text-gold italic font-normal">{siteCopy.home.services.titleAccent}</span>
            </h2>
            <p className="text-stone-500 max-w-md font-light text-sm">{siteCopy.home.services.intro}</p>
          </div>
        </div>

        <div className="space-y-4 md:space-y-8">
          {servicesData?.[lang]?.map((category: any, idx: number) => {
            const isOpen = activeCategory === idx;
            return (
              <div key={category.category} className="border-b border-stone-200">
                <button
                  onClick={() => setActiveCategory(isOpen ? null : idx)}
                  className={`w-full flex justify-between items-center py-6 px-4 md:px-8 rounded-lg transition-colors duration-300 group ${isOpen ? 'bg-stone-100/50' : 'hover:bg-stone-100'}`}
                >
                  <div className="flex items-center gap-6">
                    <span className="text-[10px] font-sans font-bold tracking-[0.4em] text-gold uppercase opacity-40">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-2xl md:text-3xl tracking-tight text-stone-800 font-serif text-left">
                      {category.category}
                    </h3>
                  </div>
                  <ChevronDown className={`w-6 h-6 shrink-0 text-stone-400 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pb-12 pt-4 px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                        {category.items?.map((item: any, itemIndex: number) => (
                          <div 
                            key={`${idx}-${itemIndex}`}
                            className="flex flex-col gap-4 border-l-2 border-transparent pl-6"
                          >
                            <div className="flex justify-between items-baseline gap-4">
                              <h4 className="text-lg font-medium text-stone-800 leading-tight">
                                {item.title}
                              </h4>
                              <span className="text-gold font-bold text-sm tracking-tight whitespace-nowrap">
                                {hidePublicPrices ? siteCopy.home.services.hidePublicPrices : item.price}
                              </span>
                            </div>
                            <p className="text-stone-500 text-sm font-light leading-relaxed">
                              {item.desc}
                            </p>
                            <div className="flex items-center gap-2 text-stone-300">
                              <Clock className="w-3 h-3" />
                              <span className="text-[10px] uppercase tracking-widest font-bold">
                                {item.duration}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-24 p-12 bg-stone-100 rounded-xl text-center border border-stone-200/50 block md:hidden"
        >
          <p className="text-stone-500 text-xs italic mb-4">{siteCopy.home.services.disclaimer}</p>
        </motion.div>
      </div>
    </section>
  );
}
