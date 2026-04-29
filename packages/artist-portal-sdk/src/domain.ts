/**
 * Shared domain types for Firestore-backed artist content (keep aligned with app `src/types/domain.ts`).
 * @license Apache-2.0
 */

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
  mediaStorageRoot: string;
  autoLogoutLeavingAdmin: boolean;
  showThemeSelector: boolean;
  showArtistsPage: boolean;
  showProductsPage: boolean;
  showReviewsSection: boolean;
  showPricingSection: boolean;
  roundPricesUpToWholeAmount: boolean;
  showVideoSection: boolean;
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

export interface GalleryTileItem {
  src: string;
  label: string;
  order: number;
  enabled?: boolean;
}

export interface GalleryHomeData {
  images: GalleryTileItem[];
}

export interface ProductStorefrontCategory {
  id: string;
  slug: string;
  title: string;
  count: number;
  image: string;
  link: string;
  enabled?: boolean;
  order?: number;
  isLocal?: boolean;
}
