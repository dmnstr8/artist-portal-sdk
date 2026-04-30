async function loadPublicJson<T>(fileName: string, fallback: T): Promise<T> {
  if (typeof window === 'undefined') return fallback;
  try {
    const base = import.meta.env?.BASE_URL || '/';
    const normalizedBase = base.endsWith('/') ? base : `${base}/`;
    const res = await fetch(`${normalizedBase}data/${fileName}`);
    if (res.ok) return (await res.json()) as T;
  } catch {
    // fall through to fallback
  }
  return fallback;
}

// Exported as `let` so ESM live bindings update importers once the fetch resolves.
// Loading starts immediately when the module is first imported; by the time any
// component mounts and calls contentRepository functions, the local JSON files
// will have loaded. Firestore data takes priority; these are fallbacks only.
export let defaultFaqData: any[] = [];
export let defaultReviewsData: any[] = [];
export let defaultServicesData: any = { en: [] };
export let defaultSettingsData: any = {};
export let defaultWidgetsData: any = {};
export let defaultVideoLinksData: any = { items: [] };
export let defaultArtistProfilesData: any[] = [];
export let defaultRecommendedProductsData: any[] = [];
export let defaultGalleryData: unknown = {};

void Promise.all([
  loadPublicJson<any[]>('faq.json', []).then(d => { defaultFaqData = d; }),
  loadPublicJson<any[]>('reviews.json', []).then(d => { defaultReviewsData = d; }),
  loadPublicJson<any>('services.json', { en: [] }).then(d => { defaultServicesData = d; }),
  loadPublicJson<any>('settings.json', {}).then(d => { defaultSettingsData = d; }),
  loadPublicJson<any>('widgets.json', {}).then(d => { defaultWidgetsData = d; }),
  loadPublicJson<any>('videolinks.json', { items: [] }).then(d => { defaultVideoLinksData = d; }),
  loadPublicJson<any[]>('artistprofiles.json', []).then(d => { defaultArtistProfilesData = d; }),
  loadPublicJson<any[]>('recommendedproducts.json', []).then(d => { defaultRecommendedProductsData = d; }),
  loadPublicJson<unknown>('gallery.json', {}).then(d => { defaultGalleryData = d; }),
]);
