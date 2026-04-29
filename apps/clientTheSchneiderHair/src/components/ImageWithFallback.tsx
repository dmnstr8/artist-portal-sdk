import React, { useState, useRef, useEffect } from 'react';
import { useInView } from 'motion/react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
}

const ImageWithFallback = ({ src, alt, className, ...props }: ImageWithFallbackProps) => {
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [triedDocsFallback, setTriedDocsFallback] = useState(false);
  const transparentPixel = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
  
  const ref = useRef<HTMLImageElement>(null);
  const isInView = useInView(ref, { margin: "-20% 0px -20% 0px" });

  useEffect(() => {
    setError(false);
    setCurrentSrc(src);
    setTriedDocsFallback(false);
  }, [src]);

  const toDocsFallbackSrc = (value: string) => {
    if (!value || value.startsWith('data:') || /^https?:\/\//i.test(value) || value.includes('/docs/')) {
      return null;
    }
    if (/\/(?:gallery|artist|products)\//i.test(value)) return null;

    const baseUrl = import.meta.env.BASE_URL || '/';
    if (value.startsWith(baseUrl)) {
      return value.replace(baseUrl, `${baseUrl}docs/`);
    }
    if (value.startsWith('/')) {
      return `/docs${value}`;
    }
    return `docs/${value.replace(/^\/+/, '')}`;
  };

  const handleError = () => {
    if (!triedDocsFallback) {
      const docsFallback = toDocsFallbackSrc(currentSrc);
      if (docsFallback && docsFallback !== currentSrc) {
        setCurrentSrc(docsFallback);
        setTriedDocsFallback(true);
        return;
      }
    }
    setError(true);
  };

  const dynamicClass = className?.includes('grayscale') 
    ? className.replace('grayscale', `transition-all duration-[1500ms] md:grayscale md:hover:grayscale-0 ${isInView ? 'grayscale-0' : 'grayscale'}`)
    : className;

  return (
    <img
      ref={ref}
      src={error ? transparentPixel : currentSrc}
      alt={alt}
      className={dynamicClass}
      onError={handleError}
      referrerPolicy="no-referrer"
      {...props}
    />
  );
};

export default ImageWithFallback;
