/**
 * Browser event so the admin leave guard picks up General Settings changes without a reload.
 * @license Apache-2.0
 */

export const AUTO_LOGOUT_LEAVING_ADMIN_EVENT = 'artistPortal:autoLogoutLeavingAdmin';
export const SHOW_THEME_SELECTOR_EVENT = 'artistPortal:showThemeSelector';
export const SHOW_ARTISTS_PAGE_EVENT = 'artistPortal:showArtistsPage';
export const SHOW_PRODUCTS_PAGE_EVENT = 'artistPortal:showProductsPage';
export const SHOW_REVIEWS_SECTION_EVENT = 'artistPortal:showReviewsSection';
export const SHOW_PRICING_SECTION_EVENT = 'artistPortal:showPricingSection';
export const ROUND_PRICES_UP_TO_WHOLE_AMOUNT_EVENT = 'artistPortal:roundPricesUpToWholeAmount';
export const SHOW_VIDEO_SECTION_EVENT = 'artistPortal:showVideoSection';
export const SHOW_GALLERY_SECTION_EVENT = 'artistPortal:showGallerySection';
export const SHOW_FAQ_PAGE_EVENT = 'artistPortal:showFaqPage';

export function emitAutoLogoutLeavingAdminChanged(value: boolean) {
  window.dispatchEvent(
    new CustomEvent(AUTO_LOGOUT_LEAVING_ADMIN_EVENT, { detail: { autoLogoutLeavingAdmin: value } })
  );
}

export function emitShowThemeSelectorChanged(value: boolean) {
  window.dispatchEvent(
    new CustomEvent(SHOW_THEME_SELECTOR_EVENT, { detail: { showThemeSelector: value } })
  );
}

export function emitShowArtistsPageChanged(value: boolean) {
  window.dispatchEvent(
    new CustomEvent(SHOW_ARTISTS_PAGE_EVENT, { detail: { showArtistsPage: value } })
  );
}

export function emitShowProductsPageChanged(value: boolean) {
  window.dispatchEvent(
    new CustomEvent(SHOW_PRODUCTS_PAGE_EVENT, { detail: { showProductsPage: value } })
  );
}

export function emitShowReviewsSectionChanged(value: boolean) {
  window.dispatchEvent(
    new CustomEvent(SHOW_REVIEWS_SECTION_EVENT, { detail: { showReviewsSection: value } })
  );
}

export function emitShowPricingSectionChanged(value: boolean) {
  window.dispatchEvent(
    new CustomEvent(SHOW_PRICING_SECTION_EVENT, { detail: { showPricingSection: value } })
  );
}

export function emitRoundPricesUpToWholeAmountChanged(value: boolean) {
  window.dispatchEvent(
    new CustomEvent(ROUND_PRICES_UP_TO_WHOLE_AMOUNT_EVENT, { detail: { roundPricesUpToWholeAmount: value } })
  );
}

export function emitShowVideoSectionChanged(value: boolean) {
  window.dispatchEvent(
    new CustomEvent(SHOW_VIDEO_SECTION_EVENT, { detail: { showVideoSection: value } })
  );
}

export function emitShowGallerySectionChanged(value: boolean) {
  window.dispatchEvent(
    new CustomEvent(SHOW_GALLERY_SECTION_EVENT, { detail: { showGallerySection: value } })
  );
}

export function emitShowFaqPageChanged(value: boolean) {
  window.dispatchEvent(
    new CustomEvent(SHOW_FAQ_PAGE_EVENT, { detail: { showFaqPage: value } })
  );
}
