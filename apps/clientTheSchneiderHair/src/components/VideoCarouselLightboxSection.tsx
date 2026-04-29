import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  CONTENT_DATA_SOURCE_MODE_EVENT,
  getVideoLinksWithFallback,
  videoLinksToYoutubeIds,
} from 'artist-portal-sdk';
import { formatCopy } from '../content/siteCopy';
import { useSiteCopy } from '../context/SiteCopyContext';

type VideoLightboxProps = {
  ids: string[];
  index: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
};

const VideoLightbox = ({ ids, index, onClose, onNext, onPrev }: VideoLightboxProps) => {
  const { siteCopy } = useSiteCopy();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('lightbox-open');
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove('lightbox-open');
    };
  }, []);

  const id = ids[index];

  return (
    <motion.div
      className="gallery-lightbox-overlay fixed inset-0 z-[100] bg-stone-950/98 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12 lg:p-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={siteCopy.home.videoCarouselCamera.lightboxAria}
    >
      <div className="relative h-full w-full max-w-[1720px] flex items-center justify-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute top-6 right-6 md:top-12 md:right-12 text-stone-400 hover:text-stone-50 transition-colors z-[110] p-2"
          aria-label={siteCopy.home.videoCarouselCamera.closeVideoAria}
        >
          <X className="w-8 h-8" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-50 transition-colors p-3 md:p-4 z-[120]"
          aria-label={siteCopy.home.videoCarouselCamera.prevVideoAria}
        >
          <ArrowLeft className="w-7 h-7 md:w-8 md:h-8" />
        </button>

        <motion.div
          key={`${id}-${index}`}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[1400px] max-h-[80vh] md:max-h-[85vh] flex items-center justify-center"
        >
          <div className="w-full aspect-video max-h-[min(80vh,900px)] rounded-xl overflow-hidden shadow-2xl ring-1 ring-stone-800 bg-stone-900">
            <iframe
              title={`YouTube video ${id}`}
              src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </motion.div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-50 transition-colors p-3 md:p-4 z-[120]"
          aria-label={siteCopy.home.videoCarouselCamera.nextVideoAria}
        >
          <ArrowRight className="w-7 h-7 md:w-8 md:h-8" />
        </button>

        <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none">
          <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-stone-500">
            {formatCopy(siteCopy.home.videoCarouselCamera.filmCounterTemplate, {
              current: index + 1,
              total: ids.length,
            })}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default function VideoCarouselLightboxSection() {
  const { siteCopy } = useSiteCopy();
  const tabletLandscapeWideQuery =
    '(min-width: 768px) and (max-width: 1199px), (min-width: 1200px) and (max-width: 1400px) and (orientation: landscape)';
  const [youtubeIds, setYoutubeIds] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const cyclePxRef = useRef(0);
  const [isTabletViewport, setIsTabletViewport] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(tabletLandscapeWideQuery).matches
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const items = await getVideoLinksWithFallback();
      if (cancelled) return;
      setYoutubeIds(videoLinksToYoutubeIds(items));
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

  const loopIds = useMemo(() => [...youtubeIds, ...youtubeIds], [youtubeIds]);
  const n = youtubeIds.length;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [stripHovered, setStripHovered] = useState(false);
  const [stripPointerActive, setStripPointerActive] = useState(false);
  const [activeStripIndex, setActiveStripIndex] = useState(0);
  const [pageVisible, setPageVisible] = useState(
    () => typeof document !== 'undefined' && document.visibilityState === 'visible'
  );

  useEffect(() => {
    const onVis = () => setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(tabletLandscapeWideQuery);
    const onChange = () => setIsTabletViewport(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [tabletLandscapeWideQuery]);

  const measureMarqueeCycle = () => {
    const el = scrollerRef.current;
    const first = el?.firstElementChild as HTMLElement | undefined;
    if (!el || !first) return;
    const gapStr = getComputedStyle(el).gap || '0';
    const gap = parseFloat(gapStr) || 0;
    const itemSpan = first.offsetWidth + gap;
    const calculated = n * itemSpan;
    // Fallback to half of duplicated strip width so marquee never stalls.
    cyclePxRef.current = calculated > 0 ? calculated : el.scrollWidth / 2;
  };

  useLayoutEffect(() => {
    measureMarqueeCycle();
    const ro = new ResizeObserver(() => measureMarqueeCycle());
    const el = scrollerRef.current;
    if (el) ro.observe(el);
    window.addEventListener('resize', measureMarqueeCycle);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measureMarqueeCycle);
    };
  }, [n]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.max(280, Math.floor(el.clientWidth * 0.75));
    el.scrollTo({ left: el.scrollLeft + dir * step, behavior: 'smooth' });
  };

  const idleMarquee = isTabletViewport
    ? lightboxIndex === null
    : lightboxIndex === null && !stripHovered && !stripPointerActive && pageVisible;

  const updateActiveStripIndex = () => {
    const el = scrollerRef.current;
    const first = el?.firstElementChild as HTMLElement | undefined;
    if (!el || !first || n === 0) return;
    const gapStr = getComputedStyle(el).gap || '0';
    const gap = parseFloat(gapStr) || 0;
    const itemSpan = first.offsetWidth + gap;
    if (itemSpan <= 0) return;
    const centerX = el.scrollLeft + el.clientWidth / 2;
    const rawIndex = Math.floor(centerX / itemSpan);
    const normalized = ((rawIndex % loopIds.length) + loopIds.length) % loopIds.length;
    setActiveStripIndex(normalized);
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    const tick = () => {
      if (idleMarquee) {
        const cycle = cyclePxRef.current;
        if (cycle > 80) {
          el.scrollLeft += isTabletViewport ? 0.85 : 0.55;
          if (el.scrollLeft >= cycle - 0.5) el.scrollLeft -= cycle;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [idleMarquee, isTabletViewport]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !isTabletViewport) return;
    // Ensure we start inside the loop range for smooth continuous motion on tablet.
    if (el.scrollLeft <= 1) el.scrollLeft = 2;
  }, [isTabletViewport, loopIds.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => updateActiveStripIndex();
    el.addEventListener('scroll', onScroll, { passive: true });
    updateActiveStripIndex();
    return () => el.removeEventListener('scroll', onScroll);
  }, [loopIds.length, n]);

  const openLightbox = (stripIndex: number) => {
    setLightboxIndex(stripIndex % n);
  };
  const closeLightbox = () => setLightboxIndex(null);
  const nextLightbox = () => setLightboxIndex((i) => (i === null ? null : (i + 1) % n));
  const prevLightbox = () => setLightboxIndex((i) => (i === null ? null : (i - 1 + n) % n));

  if (n === 0) return null;

  return (
    <section
      className="on-camera-section py-24 md:py-32 px-4 sm:px-8 bg-stone-100 border-t border-stone-200/60"
      aria-labelledby="home-videos-heading"
      onMouseEnter={() => setStripHovered(true)}
      onMouseLeave={() => setStripHovered(false)}
    >
      <div className="max-w-[1720px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12 md:mb-16">
          <div className="space-y-4">
            <h2 id="home-videos-heading" className="text-4xl md:text-6xl tracking-tighter text-stone-800 leading-none">
              {siteCopy.home.videoCarouselCamera.headingLine1}
              <span className="text-gold italic font-normal">{siteCopy.home.videoCarouselCamera.headingAccent}</span>
            </h2>
            <p className="text-stone-500 max-w-md font-light text-sm">{siteCopy.home.videoCarouselCamera.subhead}</p>
          </div>
          <p className="text-stone-400 font-sans tracking-[0.4em] text-[10px] uppercase border-b border-stone-200 pb-3 shrink-0">
            {siteCopy.home.videoCarouselCamera.kicker}
          </p>
        </div>

        <div className="relative isolate">
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            className="absolute left-0 top-1/2 z-40 -translate-y-1/2 pointer-events-auto p-3 md:p-4 text-stone-600 hover:text-gold transition-colors bg-stone-100/95 md:bg-stone-100/90 shadow-sm rounded-r-md ring-1 ring-stone-200/80"
            aria-label={siteCopy.home.videoCarouselCamera.scrollLeftAria}
          >
            <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.25} />
          </button>
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            className="absolute right-0 top-1/2 z-40 -translate-y-1/2 pointer-events-auto p-3 md:p-4 text-stone-600 hover:text-gold transition-colors bg-stone-100/95 md:bg-stone-100/90 shadow-sm rounded-l-md ring-1 ring-stone-200/80"
            aria-label={siteCopy.home.videoCarouselCamera.scrollRightAria}
          >
            <ChevronRight className="w-8 h-8 md:w-10 md:h-10" strokeWidth={1.25} />
          </button>

          <div
            ref={scrollerRef}
            onPointerDown={() => setStripPointerActive(true)}
            onPointerUp={() => setStripPointerActive(false)}
            onPointerCancel={() => setStripPointerActive(false)}
            onPointerLeave={() => setStripPointerActive(false)}
            className="relative z-0 flex gap-6 md:gap-8 overflow-x-auto pb-4 pl-12 pr-12 md:pl-16 md:pr-16 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-x"
          >
            {loopIds.map((id, stripIndex) => (
              <div
                key={`${id}-${stripIndex}`}
                className="on-camera-video-card pointer-events-auto shrink-0 w-[min(88vw,720px)] aspect-video rounded-xl overflow-hidden shadow-lg bg-stone-200 ring-1 ring-stone-200/80"
              >
                <button
                  type="button"
                  onClick={() => openLightbox(stripIndex)}
                  className="relative group/vid block h-full w-full text-left"
                  aria-label={siteCopy.home.videoCarouselCamera.openVideoAria}
                >
                  <img
                    src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                    alt=""
                    loading={stripIndex < n ? 'eager' : 'lazy'}
                    decoding="async"
                    className="h-full w-full object-cover object-center transition-all duration-1000 group-hover/vid:scale-105"
                    style={{
                      filter: stripIndex === activeStripIndex ? 'grayscale(0%)' : 'grayscale(100%)',
                    }}
                  />
                  <span className="absolute inset-0 bg-stone-900/25 transition-colors duration-500 group-hover/vid:bg-stone-900/15" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-50/90 text-stone-800 shadow-lg ring-2 ring-stone-200/80 transition-transform duration-500 group-hover/vid:scale-110">
                      <Play className="ml-1 w-7 h-7" fill="currentColor" aria-hidden />
                    </span>
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <VideoLightbox
            ids={youtubeIds}
            index={lightboxIndex}
            onClose={closeLightbox}
            onNext={nextLightbox}
            onPrev={prevLightbox}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
