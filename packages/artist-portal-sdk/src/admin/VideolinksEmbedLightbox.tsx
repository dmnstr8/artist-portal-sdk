import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, X } from 'lucide-react';

interface VideolinksEmbedLightboxProps {
  videoId: string;
  indexLabel: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export default function VideolinksEmbedLightbox({
  videoId,
  indexLabel,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: VideolinksEmbedLightboxProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    document.body.classList.add('lightbox-open');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onPrev();
      if (e.key === 'ArrowRight' && hasNext) onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('lightbox-open');
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  const handleTouchEnd = () => {
    if (touchStart == null || touchEnd == null) return;
    const distance = touchStart - touchEnd;
    if (distance > 50 && hasNext) onNext();
    if (distance < -50 && hasPrev) onPrev();
    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-stone-950/98 backdrop-blur-2xl flex items-center justify-center p-4 md:p-10"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-6 right-6 md:top-10 md:right-10 text-stone-400 hover:text-stone-50 transition-colors z-[110] p-2"
        aria-label="Close preview"
      >
        <X className="w-8 h-8" />
      </button>

      <div
        className="relative w-full max-w-5xl flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
        onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
        onTouchEnd={handleTouchEnd}
      >
        {hasPrev && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="absolute -left-2 md:left-0 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-50 transition-colors z-20 p-2 md:p-4 hidden sm:block"
            aria-label="Previous video"
          >
            <ArrowRight className="w-8 h-8 rotate-180" />
          </button>
        )}

        <motion.div
          key={videoId}
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -12 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full aspect-video max-h-[min(80vh,900px)] rounded-xl overflow-hidden shadow-2xl ring-1 ring-stone-800 bg-stone-900"
        >
          <iframe
            title={`YouTube preview ${videoId}`}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            className="h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </motion.div>

        {hasNext && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute -right-2 md:right-0 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-50 transition-colors z-20 p-2 md:p-4 hidden sm:block"
            aria-label="Next video"
          >
            <ArrowRight className="w-8 h-8" />
          </button>
        )}

        <div className="pointer-events-none absolute -bottom-10 left-0 right-0 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-stone-500">{indexLabel}</p>
        </div>
      </div>
    </motion.div>
  );
}
