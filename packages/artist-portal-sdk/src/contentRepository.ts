import {
  DEFAULT_BOOKING_WIDGET_COMPANY,
  DEFAULT_BOOKING_WIDGET_SCRIPT_SRC,
  readArtistProfilesFromFirestore,
  readFaqFromFirestore,
  readGalleryHomeFromFirestore,
  readProductCategoriesFromFirestore,
  readReviewsFromFirestore,
  readServicesEnFromFirestore,
  readSettingsGeneralFromFirestore,
  readVideoLinksHomeFromFirestore,
  readWidgetsGeneralFromFirestore,
  stripFirestoreServerFields,
} from './firestoreContentReads';
import {
  defaultArtistProfilesData,
  defaultWidgetsData,
  defaultRecommendedProductsData,
  defaultFaqData,
  defaultReviewsData,
  defaultServicesData,
  defaultSettingsData,
  defaultVideoLinksData,
  defaultGalleryData,
} from './defaultData';
import { normalizeGalleryHomeData } from './galleryNormalize';
import { getContentDataSourceMode } from './contentDataSource';
import { normalizeVideoLinkItems, type VideoLinkItem } from './videoLinks';
import {
  normalizeProductStorefrontCategory,
  sortProductStorefrontCategoriesByOrder,
} from './productStorefront';
import type {
  ArtistProfile,
  FaqCategory,
  GalleryHomeData,
  ProductStorefrontCategory,
  Review,
  ServicesData,
  SettingsData,
  WidgetsData,
} from './domain';
import { normalizeMediaStorageRoot } from './mediaStorageRoot';
import { getPortalFirebase } from './portalFirebase';

const portalDb = () => getPortalFirebase().db;

const localId = (prefix: string, index: number) => `${prefix}-${index}`;

export async function getReviewsWithFallback(): Promise<Review[]> {
  const preferredSource = getContentDataSourceMode();
  if (preferredSource === 'local') {
    return (defaultReviewsData as string[]).map((text, index) => ({
      id: localId('local-review', index),
      text,
      isLocal: true,
    }));
  }

  const cloud = await readReviewsFromFirestore(portalDb());
  if (cloud && cloud.length > 0) {
    return cloud;
  }

  return (defaultReviewsData as string[]).map((text, index) => ({
    id: localId('local-review', index),
    text,
    isLocal: true,
  }));
}

export async function getFaqWithFallback(): Promise<FaqCategory[]> {
  const preferredSource = getContentDataSourceMode();
  if (preferredSource === 'local') {
    return (defaultFaqData as FaqCategory[]).map((item, index) => ({
      ...item,
      id: localId('local-faq', index),
      isLocal: true,
    }));
  }

  const cloud = await readFaqFromFirestore(portalDb());
  if (cloud && cloud.length > 0) {
    return cloud;
  }

  return (defaultFaqData as FaqCategory[]).map((item, index) => ({
    ...item,
    id: localId('local-faq', index),
    isLocal: true,
  }));
}

export async function getServicesWithFallback(): Promise<ServicesData> {
  const preferredSource = getContentDataSourceMode();
  if (preferredSource === 'local') {
    return {
      en: {
        categories: (defaultServicesData as any).en ?? [],
        lang: 'en',
      },
    };
  }

  const en = await readServicesEnFromFirestore(portalDb());
  if (en) {
    return { en };
  }

  return {
    en: {
      categories: (defaultServicesData as any).en ?? [],
      lang: 'en',
    },
  };
}

export async function getServicesWithSourceWithFallback(): Promise<{
  services: ServicesData;
  sourceUsed: 'firebase' | 'local';
}> {
  const preferredSource = getContentDataSourceMode();
  if (preferredSource === 'local') {
    return {
      services: {
        en: {
          categories: (defaultServicesData as any).en ?? [],
          lang: 'en',
        },
      },
      sourceUsed: 'local',
    };
  }

  const en = await readServicesEnFromFirestore(portalDb());
  if (en) {
    return {
      services: { en },
      sourceUsed: 'firebase',
    };
  }

  return {
    services: {
      en: {
        categories: (defaultServicesData as any).en ?? [],
        lang: 'en',
      },
    },
    sourceUsed: 'local',
  };
}

export async function getSettingsWithFallback(): Promise<SettingsData> {
  const localSettings: SettingsData = {
    contactEmail: defaultSettingsData.contactEmail,
    themeDefault: defaultSettingsData.themeDefault === 'dark' ? 'dark' : 'light',
    mediaStorageRoot: normalizeMediaStorageRoot(defaultSettingsData.mediaStorageRoot ?? 'media'),
    autoLogoutLeavingAdmin: defaultSettingsData.autoLogoutLeavingAdmin !== false,
    showThemeSelector: defaultSettingsData.showThemeSelector === true,
    showArtistsPage: defaultSettingsData.showArtistsPage === true,
    showProductsPage: defaultSettingsData.showProductsPage !== false,
    showReviewsSection: defaultSettingsData.showReviewsSection !== false,
    showPricingSection: defaultSettingsData.showPricingSection !== false,
    roundPricesUpToWholeAmount: defaultSettingsData.roundPricesUpToWholeAmount !== false,
    showVideoSection: defaultSettingsData.showVideoSection !== false,
    showGallerySection: defaultSettingsData.showGallerySection !== false,
    showFaqPage: defaultSettingsData.showFaqPage !== false,
    showContactForm: defaultSettingsData.showContactForm !== false,
  };

  const preferredSource = getContentDataSourceMode();
  if (preferredSource === 'local') return localSettings;

  const merged = await readSettingsGeneralFromFirestore(portalDb(), localSettings);
  if (merged) return merged;

  return localSettings;
}

export async function getWidgetsWithFallback(): Promise<WidgetsData> {
  const localWidgets: WidgetsData = {
    bookingProvider:
      defaultWidgetsData.bookingProvider === 'fresha' ||
      defaultWidgetsData.bookingProvider === 'booksy' ||
      defaultWidgetsData.bookingProvider === 'other'
        ? defaultWidgetsData.bookingProvider
        : 'salonized',
    bookingWidgetCompany: String(defaultWidgetsData.bookingWidgetCompany ?? DEFAULT_BOOKING_WIDGET_COMPANY),
    bookingWidgetScriptSrc: String(defaultWidgetsData.bookingWidgetScriptSrc ?? DEFAULT_BOOKING_WIDGET_SCRIPT_SRC),
    showBookingWidget: defaultWidgetsData.showBookingWidget !== false,
    paymentWidgetProvider: 'payhip',
    paymentWidgetProductId: String(defaultWidgetsData.paymentWidgetProductId ?? ''),
    showPaymentWidget: defaultWidgetsData.showPaymentWidget !== false,
    taggboxWidgetId: String(defaultWidgetsData.taggboxWidgetId ?? ''),
    showSocialWidget: defaultWidgetsData.showSocialWidget !== false,
  };

  const preferredSource = getContentDataSourceMode();
  if (preferredSource === 'local') return localWidgets;

  const merged = await readWidgetsGeneralFromFirestore(portalDb(), localWidgets);
  if (merged) return merged;

  return localWidgets;
}

export async function getVideoLinksWithFallback(): Promise<VideoLinkItem[]> {
  const preferredSource = getContentDataSourceMode();
  if (preferredSource === 'local') {
    return normalizeVideoLinkItems(defaultVideoLinksData.items ?? []);
  }

  const cloud = await readVideoLinksHomeFromFirestore(portalDb());
  if (cloud !== null) {
    return cloud;
  }

  return normalizeVideoLinkItems(defaultVideoLinksData.items ?? []);
}

export async function getArtistProfilesWithFallback(): Promise<ArtistProfile[]> {
  const preferredSource = getContentDataSourceMode();
  if (preferredSource === 'local') {
    return (defaultArtistProfilesData as Omit<ArtistProfile, 'id'>[]).map((item, index) => ({
      id: localId('local-artist', index),
      firstName: String(item.firstName ?? ''),
      lastName: String(item.lastName ?? ''),
      instagramHandle: String(item.instagramHandle ?? ''),
      email: String(item.email ?? ''),
      bookingWebsiteLink: String(item.bookingWebsiteLink ?? ''),
      personalWebsiteLink: String(item.personalWebsiteLink ?? ''),
      phoneNumber: String(item.phoneNumber ?? ''),
      profilePhotoLink: String(item.profilePhotoLink ?? ''),
      specialty: String((item as any).specialty ?? ''),
      bio: String((item as any).bio ?? ''),
      enabled: (item as any).enabled !== false,
      order: typeof (item as any).order === 'number' ? Number((item as any).order) : index,
      isLocal: true,
    }));
  }

  const cloud = await readArtistProfilesFromFirestore(portalDb());
  if (cloud && cloud.length > 0) {
    return cloud;
  }

  return (defaultArtistProfilesData as Omit<ArtistProfile, 'id'>[]).map((item, index) => ({
    id: localId('local-artist', index),
    firstName: String(item.firstName ?? ''),
    lastName: String(item.lastName ?? ''),
    instagramHandle: String(item.instagramHandle ?? ''),
    email: String(item.email ?? ''),
    bookingWebsiteLink: String(item.bookingWebsiteLink ?? ''),
    personalWebsiteLink: String(item.personalWebsiteLink ?? ''),
    phoneNumber: String(item.phoneNumber ?? ''),
    profilePhotoLink: String(item.profilePhotoLink ?? ''),
    specialty: String((item as any).specialty ?? ''),
    bio: String((item as any).bio ?? ''),
    enabled: (item as any).enabled !== false,
    order: typeof (item as any).order === 'number' ? Number((item as any).order) : index,
    isLocal: true,
  }));
}

export async function getProductStorefrontCategoriesWithFallback(): Promise<ProductStorefrontCategory[]> {
  const preferredSource = getContentDataSourceMode();
  const fromLocalDefaults = (): ProductStorefrontCategory[] =>
    (defaultRecommendedProductsData as any[]).map((item, index) => ({
      ...normalizeProductStorefrontCategory(item, localId('local-product', index)),
      isLocal: true,
      order: typeof item?.order === 'number' ? item.order : index,
    }));

  if (preferredSource === 'local') {
    return sortProductStorefrontCategoriesByOrder(fromLocalDefaults());
  }

  const cloud = await readProductCategoriesFromFirestore(portalDb());
  if (cloud && cloud.length > 0) {
    return cloud;
  }

  return sortProductStorefrontCategoriesByOrder(fromLocalDefaults());
}

export async function getGalleryHomeWithFallback(): Promise<GalleryHomeData> {
  const preferredSource = getContentDataSourceMode();
  if (preferredSource === 'local') {
    return normalizeGalleryHomeData(defaultGalleryData);
  }

  const cloud = await readGalleryHomeFromFirestore(portalDb());
  if (cloud) {
    return cloud;
  }

  return normalizeGalleryHomeData(defaultGalleryData);
}

