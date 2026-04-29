import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { legalSiteCopy } from '../content/legalSiteCopy';
import {
  bundledMarketingDefault,
  formatCopy as formatCopyFn,
  type MarketingCopy,
  type SiteCopy,
} from '../content/siteCopy';
import {
  CONTENT_DATA_SOURCE_MODE_EVENT,
  MARKETING_SITE_COPY_UPDATED_EVENT,
  getMarketingSiteCopyWithFallback,
} from 'artist-portal-sdk';

export type MarketingSiteCopySource = 'firebase' | 'local-file' | 'bundle';

type SiteCopyContextValue = {
  siteCopy: SiteCopy;
  marketingSource: MarketingSiteCopySource;
  reloadMarketingSiteCopy: () => Promise<void>;
  formatCopy: typeof formatCopyFn;
};

const SiteCopyContext = createContext<SiteCopyContextValue | null>(null);

function cloneMarketing(data: MarketingCopy): MarketingCopy {
  return JSON.parse(JSON.stringify(data)) as MarketingCopy;
}

export function SiteCopyProvider({ children }: { children: React.ReactNode }) {
  const [marketing, setMarketing] = useState<MarketingCopy>(() => cloneMarketing(bundledMarketingDefault));
  const [marketingSource, setMarketingSource] = useState<MarketingSiteCopySource>('bundle');

  const reloadMarketingSiteCopy = useCallback(async () => {
    const { data, source } = await getMarketingSiteCopyWithFallback();
    setMarketing(data);
    setMarketingSource(source);
  }, []);

  useEffect(() => {
    void reloadMarketingSiteCopy();
  }, [reloadMarketingSiteCopy]);

  useEffect(() => {
    const onMode = () => void reloadMarketingSiteCopy();
    const onUpdated = () => void reloadMarketingSiteCopy();
    window.addEventListener(CONTENT_DATA_SOURCE_MODE_EVENT, onMode);
    window.addEventListener(MARKETING_SITE_COPY_UPDATED_EVENT, onUpdated);
    return () => {
      window.removeEventListener(CONTENT_DATA_SOURCE_MODE_EVENT, onMode);
      window.removeEventListener(MARKETING_SITE_COPY_UPDATED_EVENT, onUpdated);
    };
  }, [reloadMarketingSiteCopy]);

  const siteCopy = useMemo(
    () => ({ ...marketing, ...legalSiteCopy }) as SiteCopy,
    [marketing]
  );

  const value = useMemo<SiteCopyContextValue>(
    () => ({
      siteCopy,
      marketingSource,
      reloadMarketingSiteCopy,
      formatCopy: formatCopyFn,
    }),
    [siteCopy, marketingSource, reloadMarketingSiteCopy]
  );

  return <SiteCopyContext.Provider value={value}>{children}</SiteCopyContext.Provider>;
}

export function useSiteCopy(): SiteCopyContextValue {
  const ctx = useContext(SiteCopyContext);
  if (!ctx) {
    throw new Error('useSiteCopy must be used within SiteCopyProvider');
  }
  return ctx;
}
