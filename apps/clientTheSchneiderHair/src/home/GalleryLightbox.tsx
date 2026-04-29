/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ArrowRight, X } from 'lucide-react';
import React, { useState } from 'react';

import { formatCopy } from '../content/siteCopy';
import { useSiteCopy } from '../context/SiteCopyContext';

export type GalleryLightboxImage = { src: string; label: string };

type GalleryLightboxProps = {
  images: GalleryLightboxImage[];
  index: number | null;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
};

export function GalleryLightbox({ images, index, onClose, onNext, onPrev }: GalleryLightboxProps) {
  const { siteCopy } = useSiteCopy();
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  if (index === null) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) onNext();
    if (isRightSwipe) onPrev();
    
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="gallery-lightbox-overlay fixed inset-0 z-[100] bg-stone-950/98 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12 lg:p-24"
      onClick={onClose}
    >
      <div className="gallery-lightbox-edge-fade gallery-lightbox-edge-fade-left pointer-events-none absolute inset-y-0 left-0 z-[105] w-16" />
      <div className="gallery-lightbox-edge-fade gallery-lightbox-edge-fade-right pointer-events-none absolute inset-y-0 right-0 z-[105] w-16" />

      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-6 right-6 md:top-12 md:right-12 text-stone-400 hover:text-stone-50 transition-colors z-[110] p-2"
      >
        <X className="w-8 h-8" />
      </button>

      <div 
        className="relative w-full h-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-0 text-stone-400 hover:text-stone-50 transition-colors hidden md:block p-4 z-20"
        >
          <ArrowRight className="w-8 h-8 rotate-180" />
        </button>

        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.95, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.95, x: -20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="gallery-lightbox-media-shell relative max-w-full max-h-[80vh] md:max-h-[85vh] flex flex-col items-center justify-center"
        >
          <img 
            src={images[index].src} 
            alt={images[index].label}
            className="gallery-lightbox-media max-w-full max-h-full object-contain rounded-lg shadow-2xl select-none"
            referrerPolicy="no-referrer"
          />
          <div className="mt-8 text-center px-4">
            <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-stone-500 mb-2">
              {formatCopy(siteCopy.home.portfolioLightbox.captionTemplate, {
                current: index + 1,
                total: images.length,
              })}
            </p>
            <h4 className="text-stone-50 font-serif text-lg md:text-xl tracking-tight">{images[index].label}</h4>
          </div>
        </motion.div>

        <button 
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-0 text-stone-400 hover:text-stone-50 transition-colors hidden md:block p-4 z-20"
        >
          <ArrowRight className="w-8 h-8" />
        </button>
      </div>
    </motion.div>
  );
}
