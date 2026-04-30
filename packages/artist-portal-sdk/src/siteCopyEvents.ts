export const MARKETING_SITE_COPY_UPDATED_EVENT = 'artistPortal:marketingSiteCopyUpdated';

export function emitMarketingSiteCopyUpdated() {
  window.dispatchEvent(new CustomEvent(MARKETING_SITE_COPY_UPDATED_EVENT));
}
