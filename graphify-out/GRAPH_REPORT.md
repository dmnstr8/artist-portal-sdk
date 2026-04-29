# Graph Report - C:\Users\diggs\Desktop\TheSchneider.Hair  (2026-04-28)

## Corpus Check
- 88 files · ~270,631 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 424 nodes · 694 edges · 58 communities detected
- Extraction: 66% EXTRACTED · 34% INFERRED · 0% AMBIGUOUS · INFERRED: 234 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]

## God Nodes (most connected - your core abstractions)
1. `handleFirestoreError()` - 48 edges
2. `pushAllLocalJsonToCloud()` - 38 edges
3. `downloadLiveDatabaseJsonZip()` - 21 edges
4. `getContentDataSourceMode()` - 17 edges
5. `applyLoadedSettings()` - 15 edges
6. `portalDb()` - 14 edges
7. `fetchData()` - 14 edges
8. `saveSettings()` - 14 edges
9. `triggerBooking()` - 11 edges
10. `normalizeVideoLinkItems()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `pushAllLocalJsonToCloud()` --calls--> `normalizeProductStorefrontCategory()`  [INFERRED]
  C:\Users\diggs\Desktop\TheSchneider.Hair\packages\artist-portal-sdk\src\admin\AdminDashboard.tsx → C:\Users\diggs\Desktop\TheSchneider.Hair\packages\artist-portal-sdk\src\productStorefront.ts
- `openPreferences()` --calls--> `readConsentRecord()`  [INFERRED]
  C:\Users\diggs\Desktop\TheSchneider.Hair\apps\clientTheSchneiderHair\src\home\CookieConsent.tsx → C:\Users\diggs\Desktop\TheSchneider.Hair\apps\clientTheSchneiderHair\src\lib\cookieConsent.ts
- `handleCookieFabPointerMove()` --calls--> `clampCookieFabPosition()`  [INFERRED]
  C:\Users\diggs\Desktop\TheSchneider.Hair\apps\clientTheSchneiderHair\src\home\CookieConsent.tsx → C:\Users\diggs\Desktop\TheSchneider.Hair\apps\clientTheSchneiderHair\src\home\cookieConsentFab.ts
- `syncConsent()` --calls--> `hasConsentFor()`  [INFERRED]
  C:\Users\diggs\Desktop\TheSchneider.Hair\apps\clientTheSchneiderHair\src\home\HomeVideoCarousel.tsx → C:\Users\diggs\Desktop\TheSchneider.Hair\apps\clientTheSchneiderHair\src\lib\cookieConsent.ts
- `fetchReviews()` --calls--> `getReviewsWithFallback()`  [INFERRED]
  C:\Users\diggs\Desktop\TheSchneider.Hair\apps\clientTheSchneiderHair\src\home\Reviews.tsx → C:\Users\diggs\Desktop\TheSchneider.Hair\packages\artist-portal-sdk\src\contentRepository.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (64): addArtistProfile(), addFaqCategory(), addProductCategory(), addReview(), addServiceToCategory(), applyReviewEdit(), autoRestore(), cancelEditReview() (+56 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (48): addNewServiceCategory(), applyGlobalPercentageToServicesData(), applyLoadedSettings(), applyLoadedWidgets(), applyPriceIncrease(), downloadLiveDatabaseJsonZip(), fetchData(), normalizeBookingProviderOptions() (+40 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (41): probeAdminCloudHealthAllSourcesLive(), DatabaseStatus(), DatabaseStatus(), handleForgotPassword(), handleLogin(), probeAdminCloudHealthAllSourcesLive(), getContentDataSourceMode(), cloneBundledMarketing() (+33 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (24): buildAcceptAllRecord(), buildConsentRecord(), buildDeclineAllRecord(), handleCookieFabPointerMove(), handleCookieFabPointerUp(), hasAnySavedConsent(), hasConsentFor(), isObject() (+16 more)

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (17): App(), applyBookingWidgetCompany(), clickSalonizedWidgetButton(), closeSalonizedWidget(), ensureSalonizedLoader(), findSalonizedWidgetButton(), getSalonizedContainer(), hasSalonizedApi() (+9 more)

### Community 5 - "Community 5"
Cohesion: 0.2
Nodes (7): resolveGalleryImageSrc(), resolveMediaSrc(), assetUrl(), normalizeBaseUrl(), resolveGalleryImageSrc(), resolveMediaSrc(), trimSlashes()

### Community 6 - "Community 6"
Cohesion: 0.33
Nodes (10): addVideoLinkRow(), saveEditVideoLink(), getVideoLinksWithFallback(), readVideoLinksHomeFromFirestore(), extractYoutubeVideoId(), isValidYoutubeVideoUrl(), newLocalId(), normalizeVideoLinkItems() (+2 more)

### Community 7 - "Community 7"
Cohesion: 0.31
Nodes (10): addressToEmbedQuery(), emitChanged(), getLocationSiteEditorSettings(), getPageTextSiteEditorSettings(), readJsonRecord(), resolveGoogleMapsOpenUrl(), resolveMapsIframeSrc(), setLocationSiteEditorSettings() (+2 more)

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (9): handleContentDataSourceToggle(), loadDefaultGalleryHome(), loadGalleryFromCloud(), persistGalleryHome(), emitGalleryHomeUpdated(), setContentDataSourceMode(), normalizeGalleryHomeData(), normalizeTile() (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (4): initOnce(), createArtistPortalClients(), registerPortalFirebase(), resolveFirebaseTarget()

### Community 10 - "Community 10"
Cohesion: 0.25
Nodes (4): AdminLeaveAuthGuard(), Home(), useContentSourceRefreshKey(), WidgetManager()

### Community 11 - "Community 11"
Cohesion: 0.29
Nodes (0): 

### Community 12 - "Community 12"
Cohesion: 0.48
Nodes (4): handleNext(), handlePrev(), onTouchEnd(), resetTimer()

### Community 13 - "Community 13"
Cohesion: 0.4
Nodes (0): 

### Community 14 - "Community 14"
Cohesion: 0.4
Nodes (0): 

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (2): formatSiteCopy(), formatCopy()

### Community 16 - "Community 16"
Cohesion: 0.5
Nodes (2): LocationSection(), useSiteEditorSettingsRefresh()

### Community 17 - "Community 17"
Cohesion: 0.83
Nodes (3): assetUrl(), normalizeBaseUrl(), trimSlashes()

### Community 18 - "Community 18"
Cohesion: 0.67
Nodes (0): 

### Community 19 - "Community 19"
Cohesion: 0.67
Nodes (0): 

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 0.67
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

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (0): 

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (0): 

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Community 22`** (2 nodes): `LandingPage.tsx`, `LandingPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `AppRoutes()`, `AppRoutes.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `ImageWithFallback.tsx`, `ImageWithFallback()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `FinalCTA.tsx`, `FinalCTA()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `GalleryLightbox.tsx`, `GalleryLightbox()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `ScrollToAnchor.tsx`, `ScrollToAnchor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (2 nodes): `Legal.tsx`, `onChange()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `RecommendedProducts.tsx`, `onChanged()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `RouteLoadingFallback.tsx`, `RouteLoadingFallback()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `defaultData.ts`, `loadPublicJson()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `siteCopyEvents.ts`, `emitMarketingSiteCopyUpdated()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `MarketingSiteCopyJsonEditor.tsx`, `MarketingSiteCopyJsonEditor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `ProtectedRoute.tsx`, `ProtectedRoute()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `VideolinksEmbedLightbox.tsx`, `VideolinksEmbedLightbox()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `GdprSectionBlocks.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `legalSiteCopy.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `AboutArtist.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `Hero.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `navTypes.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `Terms.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `domain.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `domain.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `marketingBundled.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `types.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `clean-docs.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `seed-videolinks-firestore.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `sync-public-assets.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `getContentDataSourceMode()` connect `Community 2` to `Community 8`, `Community 1`, `Community 6`?**
  _High betweenness centrality (0.199) - this node is a cross-community bridge._
- **Why does `fetchData()` connect `Community 1` to `Community 0`, `Community 8`, `Community 2`, `Community 6`?**
  _High betweenness centrality (0.184) - this node is a cross-community bridge._
- **Why does `triggerBooking()` connect `Community 4` to `Community 2`, `Community 3`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **Are the 47 inferred relationships involving `handleFirestoreError()` (e.g. with `addReview()` and `deleteReview()`) actually correct?**
  _`handleFirestoreError()` has 47 INFERRED edges - model-reasoned connections that need verification._
- **Are the 32 inferred relationships involving `pushAllLocalJsonToCloud()` (e.g. with `validateThemeDefault()` and `normalizeMediaStorageRoot()`) actually correct?**
  _`pushAllLocalJsonToCloud()` has 32 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `downloadLiveDatabaseJsonZip()` (e.g. with `validateThemeDefault()` and `normalizeMediaStorageRoot()`) actually correct?**
  _`downloadLiveDatabaseJsonZip()` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `getContentDataSourceMode()` (e.g. with `probeAdminCloudHealthAllSourcesLive()` and `DatabaseStatus()`) actually correct?**
  _`getContentDataSourceMode()` has 16 INFERRED edges - model-reasoned connections that need verification._