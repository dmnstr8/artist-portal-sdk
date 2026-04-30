# Graph Report - C:\Users\diggs\Desktop\webdev\artist-portal-sdk  (2026-04-29)

## Corpus Check
- 38 files · ~33,887 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 270 nodes · 470 edges · 36 communities detected
- Extraction: 67% EXTRACTED · 33% INFERRED · 0% AMBIGUOUS · INFERRED: 157 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]

## God Nodes (most connected - your core abstractions)
1. `pushAllLocalJsonToCloud()` - 38 edges
2. `downloadLiveDatabaseJsonZip()` - 20 edges
3. `getContentDataSourceMode()` - 15 edges
4. `applyLoadedSettings()` - 15 edges
5. `portalDb()` - 14 edges
6. `fetchData()` - 14 edges
7. `saveSettings()` - 13 edges
8. `normalizeGalleryHomeData()` - 11 edges
9. `normalizeVideoLinkItems()` - 10 edges
10. `getMarketingSiteCopyWithFallback()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `DatabaseStatus()` --calls--> `getContentDataSourceMode()`  [INFERRED]
  C:\Users\diggs\Desktop\webdev\artist-portal-sdk\packages\artist-portal-sdk\src\admin\AdminLoginPage.tsx → C:\Users\diggs\Desktop\webdev\artist-portal-sdk\packages\artist-portal-sdk\src\contentDataSource.ts
- `pushAllLocalJsonToCloud()` --calls--> `normalizeProductStorefrontCategory()`  [INFERRED]
  C:\Users\diggs\Desktop\webdev\artist-portal-sdk\packages\artist-portal-sdk\src\admin\AdminDashboard.tsx → C:\Users\diggs\Desktop\webdev\artist-portal-sdk\packages\artist-portal-sdk\src\productStorefront.ts
- `saveSettings()` --calls--> `validateEmail()`  [INFERRED]
  C:\Users\diggs\Desktop\webdev\artist-portal-sdk\packages\artist-portal-sdk\src\admin\AdminDashboard.tsx → C:\Users\diggs\Desktop\webdev\artist-portal-sdk\packages\artist-portal-sdk\src\admin\adminValidation.ts
- `pushAllLocalJsonToCloud()` --calls--> `emitGalleryHomeUpdated()`  [INFERRED]
  C:\Users\diggs\Desktop\webdev\artist-portal-sdk\packages\artist-portal-sdk\src\admin\AdminDashboard.tsx → C:\Users\diggs\Desktop\webdev\artist-portal-sdk\packages\artist-portal-sdk\src\contentDataSource.ts
- `getProductStorefrontCategoriesWithFallback()` --calls--> `getContentDataSourceMode()`  [INFERRED]
  C:\Users\diggs\Desktop\webdev\artist-portal-sdk\packages\artist-portal-sdk\src\contentRepository.ts → C:\Users\diggs\Desktop\webdev\artist-portal-sdk\packages\artist-portal-sdk\src\contentDataSource.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (32): addFaqCategory(), addNewServiceCategory(), applyLoadedSettings(), applyLoadedWidgets(), downloadLiveDatabaseJsonZip(), saveWidgets(), parseAutoLogoutLeavingAdmin(), parseBookingProvider() (+24 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (0): 

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (28): getContentDataSourceMode(), cloneBundledMarketing(), deepMergePlainRecords(), fetchMarketingSiteCopyMergedFromFirestore(), getArtistProfilesWithFallback(), getFaqWithFallback(), getMarketingSiteCopyWithFallback(), getReviewsWithFallback() (+20 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (18): fetchData(), handleContentDataSourceToggle(), loadArtistProfilesFromCloud(), loadDefaultArtistProfiles(), loadDefaultGalleryHome(), loadGalleryFromCloud(), normalizeBookingProviderOptions(), persistGalleryHome() (+10 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (10): DatabaseStatus(), handleForgotPassword(), handleLogin(), getAdminPortalRoutes(), initOnce(), probeAdminCloudHealthAllSourcesLive(), createArtistPortalClients(), getPortalFirebase() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.22
Nodes (13): addVideoLinkRow(), cancelEditVideoLink(), deleteVideoLinkRow(), loadDefaultVideoLinks(), loadVideoLinksFromCloud(), persistVideoLinks(), pushVideoLinksToDatabase(), saveEditVideoLink() (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.3
Nodes (14): autoRestore(), normalizeArtistProfile(), pushAllLocalJsonToCloud(), saveSettings(), emitAutoLogoutLeavingAdminChanged(), emitRoundPricesUpToWholeAmountChanged(), emitShowArtistsPageChanged(), emitShowFaqPageChanged() (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (10): addProductCategory(), loadDefaultProducts(), loadProductsFromCloud(), pushProductsToCloud(), getProductStorefrontCategoriesWithFallback(), readProductCategoriesFromFirestore(), normalizeProductStorefrontCategory(), reindexProductStorefrontCategories() (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.31
Nodes (10): addressToEmbedQuery(), emitChanged(), getLocationSiteEditorSettings(), getPageTextSiteEditorSettings(), readJsonRecord(), resolveGoogleMapsOpenUrl(), resolveMapsIframeSrc(), setLocationSiteEditorSettings() (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.39
Nodes (5): assetUrl(), normalizeBaseUrl(), resolveGalleryImageSrc(), resolveMediaSrc(), trimSlashes()

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (6): addServiceToCategory(), closeAddServiceForm(), deleteServiceCategory(), toggleAddServicePanel(), updateServicePrice(), sanitizeServicePriceInput()

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (6): addReview(), applyReviewEdit(), cancelEditReview(), loadDefaultReviews(), pushReviewsToDatabase(), validateReviewBody()

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (4): closeGalleryTileModal(), isValidHttpUrl(), pushGalleryHomeToDatabase(), saveGalleryTileModal()

### Community 13 - "Community 13"
Cohesion: 0.5
Nodes (4): applyGlobalPercentageToServicesData(), applyPriceIncrease(), parsePercentageInput(), validatePercentageInput()

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (3): uploadPhotoForExistingProductCategory(), uploadPhotoForNewProductCategory(), uploadProductCategoryPhoto()

### Community 15 - "Community 15"
Cohesion: 0.67
Nodes (3): uploadArtistPhoto(), uploadPhotoForExistingArtist(), uploadPhotoForNewArtist()

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 16`** (2 nodes): `App()`, `App.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (2 nodes): `LandingPage.tsx`, `LandingPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (2 nodes): `copy-css.mjs`, `copyCssFiles()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (2 nodes): `defaultData.ts`, `loadPublicJson()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (2 nodes): `siteCopyEvents.ts`, `emitMarketingSiteCopyUpdated()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (2 nodes): `MarketingSiteCopyJsonEditor.tsx`, `MarketingSiteCopyJsonEditor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (2 nodes): `ProtectedRoute.tsx`, `ProtectedRoute()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `VideolinksEmbedLightbox.tsx`, `VideolinksEmbedLightbox()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `domain.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `marketingBundled.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `clean-docs.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `seed-videolinks-firestore.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `sync-public-assets.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fetchData()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 5`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.166) - this node is a cross-community bridge._
- **Why does `pushAllLocalJsonToCloud()` connect `Community 6` to `Community 0`, `Community 1`, `Community 3`, `Community 5`, `Community 7`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Why does `getContentDataSourceMode()` connect `Community 2` to `Community 3`, `Community 4`, `Community 7`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Are the 32 inferred relationships involving `pushAllLocalJsonToCloud()` (e.g. with `validateThemeDefault()` and `normalizeMediaStorageRoot()`) actually correct?**
  _`pushAllLocalJsonToCloud()` has 32 INFERRED edges - model-reasoned connections that need verification._
- **Are the 18 inferred relationships involving `downloadLiveDatabaseJsonZip()` (e.g. with `validateThemeDefault()` and `normalizeMediaStorageRoot()`) actually correct?**
  _`downloadLiveDatabaseJsonZip()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `getContentDataSourceMode()` (e.g. with `getReviewsWithFallback()` and `getFaqWithFallback()`) actually correct?**
  _`getContentDataSourceMode()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `applyLoadedSettings()` (e.g. with `validateThemeDefault()` and `normalizeMediaStorageRoot()`) actually correct?**
  _`applyLoadedSettings()` has 13 INFERRED edges - model-reasoned connections that need verification._