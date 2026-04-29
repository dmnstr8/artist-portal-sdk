/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Star } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { useSiteCopy } from '../context/SiteCopyContext';
import { useContentSourceRefreshKey } from '../hooks/useContentSourceRefreshKey';
import { formatCopy } from '../content/siteCopy';
import { getReviewsWithFallback } from 'artist-portal-sdk';

export function Reviews() {
  const { siteCopy } = useSiteCopy();
  const [reviewsData, setReviewsData] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Swipe logic
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const contentSourceRefreshKey = useContentSourceRefreshKey();
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % reviewsData.length);
    }, 6000);
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % reviewsData.length);
    resetTimer();
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + reviewsData.length) % reviewsData.length);
    resetTimer();
  };

  useEffect(() => {
    const fetchReviews = async () => {
      const reviews = await getReviewsWithFallback();
      setReviewsData(reviews.map((review) => review.text).filter(Boolean));
    };
    
    fetchReviews();
  }, [contentSourceRefreshKey]);

  useEffect(() => {
    if (reviewsData?.length === 0) return;
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [reviewsData]);

  if (!reviewsData || reviewsData.length === 0) return null;

  return (
    <section className="reviews-section py-32 px-8 bg-stone-900 text-stone-50 relative overflow-hidden" id="reviews">
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="reviews-bg-glow absolute top-[-50%] right-[-20%] w-[100vw] h-[100vh] bg-gold rounded-full blur-[120px]" />
      </div>
      <div className="max-w-[1200px] mx-auto flex flex-col items-center text-center relative z-10">
        <h2 className="text-[10px] font-sans font-bold tracking-[0.4em] text-gold uppercase mb-12">
          {siteCopy.home.reviews.sectionTitle}
        </h2>
        <div className="flex gap-2 mb-12 text-gold">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-current" />
          ))}
        </div>
        <div 
          className="reviews-carousel-shell h-[250px] md:h-[200px] w-full relative flex items-center justify-center cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="reviews-quote-text text-xl md:text-3xl lg:text-4xl font-serif leading-tight max-w-4xl absolute px-8 md:px-16 w-full"
            >
              "{reviewsData[index]}"
            </motion.p>
          </AnimatePresence>
          
          {/* Navigation Controls */}
          <button 
            onClick={handlePrev}
            className="reviews-nav-prev absolute left-0 p-4 text-stone-500 hover:text-gold transition-colors z-20"
            aria-label={siteCopy.home.reviews.prevAria}
          >
            <ChevronDown className="reviews-nav-icon w-8 h-8" style={{ transform: 'rotate(90deg)' }} />
          </button>
          
          <button 
            onClick={handleNext}
            className="reviews-nav-next absolute right-0 p-4 text-stone-500 hover:text-gold transition-colors z-20"
            aria-label={siteCopy.home.reviews.nextAria}
          >
            <ChevronDown className="reviews-nav-icon w-8 h-8" style={{ transform: 'rotate(-90deg)' }} />
          </button>
        </div>
        <div className="reviews-indicators flex flex-wrap gap-2 mt-12 justify-center max-w-md px-4">
          {reviewsData.map((_, i) => (
            <button 
              key={i}
              onClick={() => setIndex(i)}
              className={`reviews-indicator-dot h-1.5 rounded-full transition-all duration-500 ${i === index ? 'reviews-indicator-dot-active bg-gold w-8' : 'reviews-indicator-dot-inactive bg-stone-700 w-2 hover:bg-stone-500'}`}
              aria-label={formatCopy(siteCopy.home.reviews.goToReviewAriaTemplate, { n: i + 1 })}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
