/**
 * Firestore read helpers for artist marketing data (same collection layout per client).
 * @license Apache-2.0
 */

import { collection, doc, getDoc, getDocs, type Firestore } from 'firebase/firestore';

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
import { normalizeGalleryHomeData } from './galleryNormalize';
import { normalizeProductStorefrontCategory, sortProductStorefrontCategoriesByOrder } from './productStorefront';
import { normalizeVideoLinkItems, type VideoLinkItem } from './videoLinks';

const DEFAULT_BOOKING_WIDGET_SCRIPT_SRC = 'https://static-widget.salonized.com/loader.js';
const DEFAULT_BOOKING_WIDGET_COMPANY = 'm2yzkzSecfyaghBe93MNZGuc';

function normalizeMediaStorageRoot(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
}

/** `null` = missing doc, empty collection, or read error (caller should fall back to local seeds). */
export async function readReviewsFromFirestore(db: Firestore): Promise<Review[] | null> {
  try {
    const snap = await getDocs(collection(db, 'reviews'));
    if (snap.empty) return null;
    return snap.docs.map((d) => ({ id: d.id, text: String(d.data().text ?? '') }));
  } catch {
    return null;
  }
}

export async function readFaqFromFirestore(db: Firestore): Promise<FaqCategory[] | null> {
  try {
    const snap = await getDocs(collection(db, 'faq'));
    const docs = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const aOrder = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
        const bOrder = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder;
      });

    if (docs.length === 0) return null;

    return docs.map((item: Record<string, unknown>) => ({
      id: String(item.id ?? ''),
      category: String(item.category ?? ''),
      items: Array.isArray(item.items) ? (item.items as FaqCategory['items']) : [],
      order: typeof item.order === 'number' ? item.order : undefined,
    }));
  } catch {
    return null;
  }
}

export async function readServicesEnFromFirestore(db: Firestore): Promise<ServicesData['en'] | null> {
  try {
    const enDoc = await getDoc(doc(db, 'services', 'en'));
    if (!enDoc.exists()) return null;
    return {
      categories: (enDoc.data().categories ?? []) as ServicesData['en']['categories'],
      lang: 'en',
    };
  } catch {
    return null;
  }
}

export async function readSettingsGeneralFromFirestore(
  db: Firestore,
  localDefaults: SettingsData,
): Promise<SettingsData | null> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'general'));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      contactEmail: String(data.contactEmail ?? localDefaults.contactEmail),
      themeDefault: data.themeDefault === 'dark' ? 'dark' : 'light',
      mediaStorageRoot: normalizeMediaStorageRoot(data.mediaStorageRoot ?? localDefaults.mediaStorageRoot),
      autoLogoutLeavingAdmin: data.autoLogoutLeavingAdmin !== false,
      showThemeSelector: data.showThemeSelector === true,
      showArtistsPage: data.showArtistsPage === true,
      showProductsPage: data.showProductsPage !== false,
      showReviewsSection: data.showReviewsSection !== false,
      showPricingSection: data.showPricingSection !== false,
      roundPricesUpToWholeAmount: data.roundPricesUpToWholeAmount !== false,
      showVideoSection: data.showVideoSection !== false,
      showGallerySection: data.showGallerySection !== false,
      showFaqPage: data.showFaqPage !== false,
      showContactForm: data.showContactForm !== false,
    };
  } catch {
    return null;
  }
}

export async function readWidgetsGeneralFromFirestore(
  db: Firestore,
  localDefaults: WidgetsData,
): Promise<WidgetsData | null> {
  try {
    const snap = await getDoc(doc(db, 'widgets', 'general'));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      bookingProvider:
        data.bookingProvider === 'fresha' || data.bookingProvider === 'booksy' || data.bookingProvider === 'other'
          ? data.bookingProvider
          : 'salonized',
      bookingWidgetCompany: String(data.bookingWidgetCompany ?? localDefaults.bookingWidgetCompany),
      bookingWidgetScriptSrc: String(data.bookingWidgetScriptSrc ?? localDefaults.bookingWidgetScriptSrc),
      showBookingWidget: data.showBookingWidget !== false,
      paymentWidgetProvider: 'payhip',
      paymentWidgetProductId: String(data.paymentWidgetProductId ?? localDefaults.paymentWidgetProductId),
      showPaymentWidget: data.showPaymentWidget !== false,
      taggboxWidgetId: String(data.taggboxWidgetId ?? localDefaults.taggboxWidgetId),
      showSocialWidget: data.showSocialWidget !== false,
    };
  } catch {
    return null;
  }
}

export async function readVideoLinksHomeFromFirestore(db: Firestore): Promise<VideoLinkItem[] | null> {
  try {
    const snap = await getDoc(doc(db, 'videolinks', 'home'));
    if (!snap.exists()) return null;
    return normalizeVideoLinkItems(snap.data().items ?? []);
  } catch {
    return null;
  }
}

export async function readArtistProfilesFromFirestore(db: Firestore): Promise<ArtistProfile[] | null> {
  try {
    const snap = await getDocs(collection(db, 'artistprofiles'));
    if (snap.empty) return null;
    return snap.docs
      .map((d, index) => ({
        id: d.id,
        firstName: String(d.data().firstName ?? ''),
        lastName: String(d.data().lastName ?? ''),
        instagramHandle: String(d.data().instagramHandle ?? ''),
        email: String(d.data().email ?? ''),
        bookingWebsiteLink: String(d.data().bookingWebsiteLink ?? ''),
        personalWebsiteLink: String(d.data().personalWebsiteLink ?? ''),
        phoneNumber: String(d.data().phoneNumber ?? ''),
        profilePhotoLink: String(d.data().profilePhotoLink ?? ''),
        specialty: String(d.data().specialty ?? ''),
        bio: String(d.data().bio ?? ''),
        enabled: d.data().enabled !== false,
        order:
          typeof d.data().order === 'number' && Number.isFinite(d.data().order) ? d.data().order : index,
      }))
      .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER));
  } catch {
    return null;
  }
}

export async function readProductCategoriesFromFirestore(db: Firestore): Promise<ProductStorefrontCategory[] | null> {
  try {
    const snap = await getDocs(collection(db, 'productcategories'));
    if (snap.empty) return null;
    return sortProductStorefrontCategoriesByOrder(
      snap.docs.map((d, index) => {
        const row = normalizeProductStorefrontCategory(d.data(), d.id);
        const ord =
          typeof d.data().order === 'number' && Number.isFinite(d.data().order) ? d.data().order : index;
        return { ...row, order: ord };
      }),
    );
  } catch {
    return null;
  }
}

export async function readGalleryHomeFromFirestore(db: Firestore): Promise<GalleryHomeData | null> {
  try {
    const snap = await getDoc(doc(db, 'gallery', 'home'));
    if (!snap.exists()) return null;
    return normalizeGalleryHomeData(snap.data());
  } catch {
    return null;
  }
}

export function stripFirestoreServerFields(data: Record<string, unknown>): Record<string, unknown> {
  const next = { ...data };
  for (const key of ['updatedAt', 'createdAt']) {
    if (key in next) delete next[key];
  }
  return next;
}

export { DEFAULT_BOOKING_WIDGET_COMPANY, DEFAULT_BOOKING_WIDGET_SCRIPT_SRC };
