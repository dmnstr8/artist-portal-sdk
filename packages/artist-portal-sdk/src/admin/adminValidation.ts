/**
 * Admin form validation helpers.
 * Prices: optional leading €, digits only plus at most one decimal point, 1–2 fractional digits if a point is present.
 */

export function validateServicePrice(value: string): boolean {
  const t = value.trim();
  if (!t) return false;
  const rest = t.startsWith('€') ? t.slice(1).trim() : t;
  if (!rest) return false;
  if (!/^[\d.]+$/.test(rest)) return false;
  const parts = rest.split('.');
  if (parts.length > 2) return false;
  if (parts[0] === '' || !/^\d+$/.test(parts[0])) return false;
  if (parts.length === 2) {
    if (parts[1] === '' || parts[1].length > 2 || !/^\d+$/.test(parts[1])) return false;
  }
  return true;
}

/** Empty = no adjustment (valid). Otherwise signed number with optional decimal and max magnitude cap. */
export function validatePercentageInput(raw: string, max = 500): boolean {
  const t = raw.trim();
  if (t === '') return true;
  if (!/^-?\d+(\.\d{1,2})?$/.test(t)) return false;
  const n = Number.parseFloat(t);
  if (!Number.isFinite(n) || n < -max || n > max) return false;
  return true;
}

export function parsePercentageInput(raw: string): number {
  const t = raw.trim();
  if (t === '') return 0;
  const n = Number.parseFloat(t);
  return Number.isFinite(n) ? n : 0;
}

export function validateEmail(value: string): boolean {
  const t = value.trim();
  if (!t || t.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

/** Raw name before slugify: letters, numbers, spaces, underscore, hyphen; must slugify to non-empty. */
export function validateFaqDatabaseNameInput(raw: string): boolean {
  const t = raw.trim();
  if (t.length < 1 || t.length > 80) return false;
  if (!/^[a-zA-Z0-9_\s-]+$/.test(t)) return false;
  const slug = t.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return slug.length >= 1;
}

export function validateFaqViewableText(raw: string): boolean {
  const t = raw.trim();
  return t.length >= 1 && t.length <= 200;
}

export function validateReviewBody(raw: string): boolean {
  const t = raw.trim();
  return t.length >= 1 && t.length <= 8000;
}

export function validateFaqItemQuestion(q: string): boolean {
  return q.trim().length >= 1 && q.trim().length <= 500;
}

export function validateFaqItemAnswer(a: string): boolean {
  return a.trim().length >= 1 && a.trim().length <= 8000;
}

/**
 * Keeps digits and one optional decimal; preserves explicit € if typed.
 * Digits-only input is prefixed with €.
 */
export function sanitizeServicePriceInput(raw: string): string {
  const hasEuro = /€/.test(raw);
  let v = raw.replace(/,/g, '').replace(/€/g, '').replace(/\$/g, '').replace(/[^\d.]/g, '');
  const firstDot = v.indexOf('.');
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
  }
  v = v.replace(/[^\d.]/g, '');
  if (!v) {
    return hasEuro ? '€' : '';
  }
  return `€${v}`;
}

/** Signed numeric sanitizer (optional leading '-') with at most one decimal point. */
export function sanitizePercentageInput(raw: string): string {
  const trimmed = raw.trimStart();
  const hasLeadingMinus = trimmed.startsWith('-');
  let v = raw.replace(/[^\d.]/g, '');
  const firstDot = v.indexOf('.');
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
  }
  if (!v) return hasLeadingMinus ? '-' : '';
  return `${hasLeadingMinus ? '-' : ''}${v}`;
}

/** Allowed characters for FAQ database name field before slugify. */
export function sanitizeFaqDatabaseNameInput(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_\s-]/g, '');
}

export function validateThemeDefault(value: unknown): value is 'light' | 'dark' {
  return value === 'light' || value === 'dark';
}

export function validateBookingProvider(value: unknown): value is 'salonized' | 'fresha' | 'booksy' | 'other' {
  return value === 'salonized' || value === 'fresha' || value === 'booksy' || value === 'other';
}

/** Controls which booking widget provider integration should be used. Default is salonized. */
export function parseBookingProvider(value: unknown): 'salonized' | 'fresha' | 'booksy' | 'other' {
  return validateBookingProvider(value) ? value : 'salonized';
}

/** General setting: sign out when navigating away from artist admin routes. Default on when unset. */
export function parseAutoLogoutLeavingAdmin(value: unknown): boolean {
  if (value === false) return false;
  return true;
}

/** Controls whether the theme toggle is visible in the public navbar. Default off when unset. */
export function parseShowThemeSelector(value: unknown): boolean {
  return value === true;
}

/** Controls whether public navigation exposes the Artists page. Default off when unset. */
export function parseShowArtistsPage(value: unknown): boolean {
  return value === true;
}

/** Controls whether public navigation exposes the Products page. Default on when unset. */
export function parseShowProductsPage(value: unknown): boolean {
  return value !== false;
}

/** Controls whether Reviews is rendered on the public homepage. Default on when unset. */
export function parseShowReviewsSection(value: unknown): boolean {
  return value !== false;
}

/** Controls whether Pricing/Services is rendered on the public homepage. Default on when unset. */
export function parseShowPricingSection(value: unknown): boolean {
  return value !== false;
}

/** Controls whether global price updates round prices up to a whole amount. Default on when unset. */
export function parseRoundPricesUpToWholeAmount(value: unknown): boolean {
  return value !== false;
}

/** Controls whether the film strip is rendered on the public homepage. Default on when unset. */
export function parseShowVideoSection(value: unknown): boolean {
  return value !== false;
}

/** Controls whether the homepage portfolio section is shown. Default on when unset. */
export function parseShowGallerySection(value: unknown): boolean {
  return value !== false;
}

/** Controls whether FAQ/Education links are shown in public navigation. Default on when unset. */
export function parseShowFaqPage(value: unknown): boolean {
  return value !== false;
}

/** Controls whether booking widget should render on public site. Default on when unset. */
export function parseShowBookingWidget(value: unknown): boolean {
  return value !== false;
}

/** Controls whether the Education FAQ contact form/support CTA is shown. Default on when unset. */
export function parseShowContactForm(value: unknown): boolean {
  return value !== false;
}

export function validatePaymentWidgetProvider(value: unknown): value is 'payhip' {
  return value === 'payhip';
}

/** Controls which payment widget provider integration should be used. Default is payhip. */
export function parsePaymentWidgetProvider(value: unknown): 'payhip' {
  return validatePaymentWidgetProvider(value) ? value : 'payhip';
}

/** Taggbox widget id field; letters and numbers only. */
export function sanitizeTaggboxWidgetId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, '');
}

export function validateTaggboxWidgetId(value: string): boolean {
  const t = value.trim();
  return /^[a-zA-Z0-9]+$/.test(t);
}

export function validateBookingWidgetScriptSrc(value: string): boolean {
  const t = value.trim();
  if (!t) return false;
  try {
    const url = new URL(t);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.pathname.endsWith('.js');
  } catch {
    return false;
  }
}

export function sanitizeBookingWidgetCompany(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function validateBookingWidgetCompany(value: string): boolean {
  const t = value.trim();
  return t.length >= 3 && t.length <= 120 && /^[a-zA-Z0-9_-]+$/.test(t);
}

export function sanitizePaymentWidgetProductId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function validatePaymentWidgetProductId(value: string): boolean {
  const t = value.trim();
  return t.length >= 2 && t.length <= 120 && /^[a-zA-Z0-9_-]+$/.test(t);
}

/** Controls whether the social section is rendered on the homepage. Default on when unset. */
export function parseIncludeSocialSection(value: unknown): boolean {
  return value !== false;
}

export function validateServiceTitle(value: string): boolean {
  const t = value.trim();
  return t.length >= 1 && t.length <= 200;
}

export function validateServiceItemDescription(value: string): boolean {
  const t = value.trim();
  return t.length >= 1 && t.length <= 8000;
}

/** Duration label, e.g. "60 min" or "2 h" */
export function validateServiceDuration(value: string): boolean {
  const t = value.trim();
  return t.length >= 1 && t.length <= 80;
}

/** Pricing category heading shown on the site */
export function validateServiceCategoryName(value: string): boolean {
  const t = value.trim();
  return t.length >= 1 && t.length <= 120;
}
