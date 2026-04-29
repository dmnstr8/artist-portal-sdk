import { motion } from 'motion/react';
import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, ArrowUpRight, Instagram, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import ImageWithFallback from '../components/ImageWithFallback';
import {
  CONTENT_DATA_SOURCE_MODE_EVENT,
  getProductStorefrontCategoriesWithFallback,
  getSettingsWithFallback,
} from 'artist-portal-sdk';
import type { ProductStorefrontCategory } from '../types/domain';
import { formatCopy } from '../content/siteCopy';
import { useSiteCopy } from '../context/SiteCopyContext';
import { normalizeMediaStorageRoot, resolveMediaSrc } from '../lib/galleryHome';

const RecommendedProducts = () => {
  const { siteCopy } = useSiteCopy();
  const [categories, setCategories] = useState<ProductStorefrontCategory[]>([]);
  const [mediaStorageRoot, setMediaStorageRoot] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const orderedCategories = useMemo(
    () =>
      [...categories]
        .filter((c) => c.enabled !== false)
        .sort((a, b) => {
          const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
          const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
          if (ao !== bo) return ao - bo;
          return a.title.localeCompare(b.title);
        }),
    [categories]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const items = await getProductStorefrontCategoriesWithFallback();
      const settings = await getSettingsWithFallback();
      if (!cancelled) setCategories(items);
      if (!cancelled) setMediaStorageRoot(normalizeMediaStorageRoot(settings.mediaStorageRoot));
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    const onChanged = () => setRefreshKey((k) => k + 1);
    window.addEventListener(CONTENT_DATA_SOURCE_MODE_EVENT, onChanged as EventListener);
    return () => window.removeEventListener(CONTENT_DATA_SOURCE_MODE_EVENT, onChanged as EventListener);
  }, []);

  const brands = siteCopy.recommendedProductsPage.brands;

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-24">
      <section className="px-8 mb-16">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12"
          >
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-800 transition-colors uppercase tracking-[0.2em] font-bold text-[9px] mb-8"
              >
                <ArrowRight className="w-3 h-3 rotate-180" /> {siteCopy.shared.backToHome}
              </Link>
              <h1 className="text-4xl md:text-5xl font-serif tracking-tight text-stone-900 mb-4">
                {siteCopy.recommendedProductsPage.title}
              </h1>
              <p className="text-stone-500 max-w-xl font-light leading-relaxed">{siteCopy.recommendedProductsPage.intro}</p>
              <div className="mt-4 flex items-center gap-4">
                <span className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">
                  {siteCopy.recommendedProductsPage.earnsCommissions}
                </span>
                <div className="h-[1px] w-8 bg-stone-200" />
                <a
                  href="https://instagram.com/theschneider.hair"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-400 hover:text-stone-900 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-8">
              {orderedCategories.length === 0 ? (
                <div className="py-24 text-center border border-dashed border-stone-200 rounded-2xl text-stone-400 italic">
                  {siteCopy.recommendedProductsPage.emptyCategories}
                </div>
              ) : (
                <div className="recommended-products-grid grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 lg:gap-4">
                  {orderedCategories.map((cat, idx) => {
                    const shopHref = cat.link?.trim() || '';
                    const imgSrc = resolveMediaSrc(cat.image, 'products', mediaStorageRoot);
                    return (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        viewport={{ once: true }}
                        className="recommended-product-card relative bg-white rounded-xl overflow-hidden border border-stone-100 shadow-sm shadow-stone-900/5 group hover:shadow-md hover:shadow-stone-900/10 transition-all duration-500"
                      >
                        {shopHref ? (
                          <a
                            href={shopHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-1.5 top-1.5 z-20 inline-flex items-center gap-1 rounded-full bg-stone-900 px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-white shadow-md ring-1 ring-gold/50 ring-offset-1 ring-offset-white animate-pulse hover:animate-none hover:bg-gold hover:text-stone-900 hover:ring-gold/70"
                            aria-label={`Shop ${cat.title}`}
                          >
                            <ShoppingBag className="size-2.5 shrink-0" aria-hidden />
                            {siteCopy.recommendedProductsPage.shop}
                          </a>
                        ) : null}
                        <div className="relative aspect-[4/5] overflow-hidden">
                          {imgSrc ? (
                            <ImageWithFallback
                              src={imgSrc}
                              alt={cat.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-stone-100 text-[8px] font-bold uppercase tracking-widest text-stone-400">
                              {siteCopy.recommendedProductsPage.noImage}
                            </div>
                          )}
                        </div>
                        <div className="p-3 sm:p-3.5">
                          <div className="mb-2 min-w-0">
                            <h3 className="text-sm font-serif leading-snug text-stone-900 group-hover:text-gold transition-colors duration-300 sm:text-base">
                              {cat.title}
                            </h3>
                            <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.18em] text-stone-400 sm:text-[9px]">
                              {formatCopy(siteCopy.recommendedProductsPage.itemsTemplate, { count: cat.count })}
                            </p>
                          </div>

                          {shopHref ? (
                            <div className="flex items-center justify-between gap-2">
                              <a
                                href={shopHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-w-0 items-center gap-1 text-[8px] font-bold uppercase tracking-[0.25em] text-stone-400 transition-colors duration-300 hover:text-gold sm:text-[9px]"
                              >
                                {siteCopy.recommendedProductsPage.viewItems}{' '}
                                <ArrowUpRight className="size-2.5 shrink-0" />
                              </a>
                              <div
                                className="shrink-0 rounded-full bg-stone-50 p-1.5 group-hover:bg-gold/10 transition-colors"
                                aria-hidden
                              >
                                <ShoppingBag className="size-3 text-stone-400 group-hover:text-gold" />
                              </div>
                            </div>
                          ) : (
                            <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-stone-300 sm:text-[9px]">
                              {siteCopy.recommendedProductsPage.linkComingSoon}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <aside className="lg:col-span-4 space-y-12 lg:sticky lg:top-32">
              <div className="bg-stone-900 rounded-3xl p-10 text-stone-50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-[60px] translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <h2 className="text-2xl font-serif mb-6 leading-tight">{siteCopy.recommendedProductsPage.expertPhilosophyTitle}</h2>
                <div className="space-y-6 text-stone-400 font-light leading-relaxed text-sm text-justify">
                  <p>{siteCopy.recommendedProductsPage.expertPhilosophyP1}</p>
                  <p>{siteCopy.recommendedProductsPage.expertPhilosophyP2}</p>
                  <p>
                    {siteCopy.recommendedProductsPage.expertPhilosophyP3Prefix}
                    {brands.map((brand, i) => (
                      <React.Fragment key={brand.name}>
                        {i > 0 ? (i === brands.length - 1 ? ' and ' : ', ') : null}
                        <a
                          href={brand.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gold font-medium hover:underline"
                        >
                          {brand.name}
                        </a>
                      </React.Fragment>
                    ))}
                    {siteCopy.recommendedProductsPage.expertPhilosophyP3Suffix}
                  </p>
                </div>

                <div className="mt-10 pt-8 border-t border-stone-800">
                  <h4 className="text-[10px] font-bold tracking-[0.3em] text-stone-500 uppercase mb-6 text-center">
                    {siteCopy.recommendedProductsPage.featuredBrandsTitle}
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {brands.map((brand) => (
                      <a
                        key={brand.name}
                        href={brand.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-stone-800 rounded-lg text-center text-[10px] font-medium tracking-[0.1em] hover:border-gold/50 transition-colors grayscale hover:grayscale-0 block text-stone-50 hover:text-gold"
                      >
                        {brand.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RecommendedProducts;
