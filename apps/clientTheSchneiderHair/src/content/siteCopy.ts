import type { MarketingCopy } from 'artist-portal-sdk';
import { bundledMarketingDefault } from 'artist-portal-sdk';
import type { LegalTermsCopy } from './legalSiteCopy';
import { formatSiteCopy } from './formatSiteCopy';

export type { MarketingCopy };
export type SiteCopy = MarketingCopy & LegalTermsCopy;

export { bundledMarketingDefault };

export function formatCopy(template: string, vars: Record<string, string | number>): string {
  return formatSiteCopy(template, vars);
}
