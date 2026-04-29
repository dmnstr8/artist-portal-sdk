import React from 'react';

import { useSiteCopy } from '../../context/SiteCopyContext';

export default function RouteLoadingFallback() {
  const { siteCopy } = useSiteCopy();
  return (
    <div className="py-32 text-center text-stone-500 font-sans tracking-[0.2em] text-xs uppercase animate-pulse">
      {siteCopy.shared.loading}
    </div>
  );
}
