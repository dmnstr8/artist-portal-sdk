export { createArtistPortalClients, type ArtistPortalClients } from './createClients';
export {
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
export { normalizeGalleryHomeData } from './galleryNormalize';
export {
  normalizeProductStorefrontCategory,
  reindexProductStorefrontCategories,
  slugifyStorefrontTitle,
  sortProductStorefrontCategoriesByOrder,
} from './productStorefront';
export { resolveFirebaseTarget, type FirebaseBuildTarget, type FirebaseTargetEnv } from './resolveTarget';
export type { ArtistPortalFirebaseConfig } from './types';
export type {
  ArtistProfile,
  FaqCategory,
  GalleryHomeData,
  GalleryTileItem,
  ProductStorefrontCategory,
  Review,
  ServicesData,
  SettingsData,
  WidgetsData,
} from './domain';
export {
  extractYoutubeVideoId,
  isValidYoutubeVideoUrl,
  normalizeVideoLinkItems,
  validateVideoLinkLabel,
  videoLinksToYoutubeIds,
  type VideoLinkItem,
} from './videoLinks';

export { registerPortalFirebase, getPortalFirebase, type PortalFirebaseBundle } from './portalFirebase';
export * from './defaultData';
export { normalizeMediaStorageRoot } from './mediaStorageRoot';
export * from './contentDataSource';
export * from './settingsEvents';
export * from './siteEditorSettings';
export * from './contentRepository';
