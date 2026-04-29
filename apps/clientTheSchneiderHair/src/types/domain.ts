/** Keep in sync with `packages/artist-portal-sdk/src/domain.ts` (published SDK). */
export type DataSource = 'firebase' | 'local' | 'unknown';

export interface Review {
  id: string;
  text: string;
  createdAt?: string;
  isLocal?: boolean;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqCategory {
  id?: string;
  category: string;
  items: FaqItem[];
  order?: number;
  isLocal?: boolean;
}

export interface ServiceItem {
  title: string;
  desc: string;
  duration: string;
  price: string;
}

export interface ServiceCategory {
  category: string;
  items: ServiceItem[];
}

export interface ServicesLanguageData {
  categories: ServiceCategory[];
  lang: string;
}

export interface ServicesData {
  en: ServicesLanguageData;
}

export interface SettingsData {
  contactEmail: string;
  themeDefault: 'light' | 'dark';
  /** Optional folder inserted before media buckets (root when empty), e.g. "Images". */
  mediaStorageRoot: string;
  autoLogoutLeavingAdmin: boolean;
  showThemeSelector: boolean;
  showArtistsPage: boolean;
  showProductsPage: boolean;
  showReviewsSection: boolean;
  showPricingSection: boolean;
  roundPricesUpToWholeAmount: boolean;
  showVideoSection: boolean;
  /** Homepage portfolio (#portfolio) */
  showGallerySection: boolean;
  showFaqPage: boolean;
  showContactForm: boolean;
}

export interface WidgetsData {
  bookingProvider: 'salonized' | 'fresha' | 'booksy' | 'other';
  bookingWidgetCompany: string;
  bookingWidgetScriptSrc: string;
  showBookingWidget: boolean;
  paymentWidgetProvider: 'payhip';
  paymentWidgetProductId: string;
  showPaymentWidget: boolean;
  taggboxWidgetId: string;
  showSocialWidget: boolean;
}

export interface ArtistProfile {
  id: string;
  firstName: string;
  lastName: string;
  instagramHandle: string;
  email: string;
  bookingWebsiteLink: string;
  personalWebsiteLink: string;
  phoneNumber: string;
  profilePhotoLink: string;
  specialty: string;
  bio: string;
  enabled?: boolean;
  order?: number;
  isLocal?: boolean;
}

/** Homepage portfolio tile */
export interface GalleryTileItem {
  src: string;
  label: string;
  /** Sort order (0-based); normalized to contiguous indices after load. */
  order: number;
  /** When false, tile is hidden on the public portfolio (admin can re-enable). */
  enabled?: boolean;
}

/** Homepage portfolio tiles (Firestore `gallery/home` + public/data/gallery.json). Headings are static in the app. */
export interface GalleryHomeData {
  images: GalleryTileItem[];
}

/** Storefront / Recommended Products grid item (Amazon lists, brand shops, etc.) */
export interface ProductStorefrontCategory {
  id: string;
  /** Optional stable key for exports; not required when using cloud document ids */
  slug: string;
  title: string;
  count: number;
  image: string;
  link: string;
  enabled?: boolean;
  order?: number;
  isLocal?: boolean;
}
