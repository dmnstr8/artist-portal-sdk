import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  bundledMarketingDefault,
  defaultBookingProvidersData,
  emitAutoLogoutLeavingAdminChanged,
  emitGalleryHomeUpdated,
  emitMarketingSiteCopyUpdated,
  emitRoundPricesUpToWholeAmountChanged,
  emitShowArtistsPageChanged,
  emitShowFaqPageChanged,
  emitShowGallerySectionChanged,
  emitShowPricingSectionChanged,
  emitShowProductsPageChanged,
  emitShowReviewsSectionChanged,
  emitShowThemeSelectorChanged,
  emitShowVideoSectionChanged,
  extractYoutubeVideoId,
  fetchMarketingSiteCopyMergedFromFirestore,
  getContentDataSourceMode,
  getLocationSiteEditorSettings,
  getMarketingSiteCopyWithFallback,
  getPortalFirebase,
  isValidMarketingSiteCopyPayload,
  isValidYoutubeVideoUrl,
  normalizeProductStorefrontCategory,
  normalizeVideoLinkItems,
  reindexProductStorefrontCategories,
  setContentDataSourceMode,
  setLocationSiteEditorSettings,
  slugifyStorefrontTitle,
  sortProductStorefrontCategoriesByOrder,
  validateVideoLinkLabel,
  DEFAULT_LOCATION_SITE_EDITOR,
  type ContentDataSourceMode,
  type VideoLinkItem,
} from 'artist-portal-sdk';
import {
  galleryTileDisplaySlug,
  normalizeGalleryHomeData,
  normalizeMediaStorageRoot,
  resolveGalleryImageSrc,
  resolveMediaSrc,
} from '../galleryMediaUrls';
import VideolinksEmbedLightbox from './VideolinksEmbedLightbox';
import {
  validateServicePrice,
  validatePercentageInput,
  parsePercentageInput,
  validateEmail,
  validateFaqViewableText,
  validateReviewBody,
  validateFaqItemQuestion,
  validateFaqItemAnswer,
  validateThemeDefault,
  validateBookingProvider,
  parseBookingProvider,
  parseAutoLogoutLeavingAdmin,
  parseShowArtistsPage,
  parseShowProductsPage,
  parseShowFaqPage,
  parseRoundPricesUpToWholeAmount,
  parseShowPricingSection,
  parseShowReviewsSection,
  parseShowThemeSelector,
  parseShowVideoSection,
  parseShowGallerySection,
  parseIncludeSocialSection,
  parseShowBookingWidget,
  parseShowContactForm,
  validateBookingWidgetScriptSrc,
  sanitizeBookingWidgetCompany,
  validateBookingWidgetCompany,
  parsePaymentWidgetProvider,
  validatePaymentWidgetProductId,
  sanitizePaymentWidgetProductId,
  sanitizeTaggboxWidgetId,
  validateTaggboxWidgetId,
  validateServiceTitle,
  validateServiceItemDescription,
  validateServiceDuration,
  validateServiceCategoryName,
  sanitizeServicePriceInput,
  sanitizePercentageInput,
} from './adminValidation';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import { 
  Trash2, 
  Plus, 
  Save, 
  LogOut, 
  Star, 
  HelpCircle, 
  Euro, 
  Percent, 
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Edit3,
  X,
  RefreshCw,
  Upload,
  Code,
  Mail,
  MessageSquare,
  Clock as ClockIcon,
  Settings,
  Sun,
  Moon,
  Youtube,
  Users,
  ShoppingBag,
  ImagePlus,
  Download,
  RotateCcw,
  MapPin,
  Image,
  PanelTopOpen,
  Braces,
} from 'lucide-react';
import type { GalleryHomeData, GalleryTileItem, ProductStorefrontCategory } from 'artist-portal-sdk';
import { MarketingSiteCopyJsonEditor } from './MarketingSiteCopyJsonEditor';
type ArtistProfile = {
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
};

type BookingProviderId = 'salonized' | 'fresha' | 'booksy' | 'other';
type BookingProviderOption = { id: BookingProviderId; label: string; enabled: boolean };
type PaymentWidgetProviderId = 'payhip';

const normalizeBookingProviderOptions = (raw: any): BookingProviderOption[] => {
  const rows = Array.isArray(raw?.providers) ? raw.providers : [];
  const parsed = rows
    .map((item: any) => {
      const id = String(item?.id ?? '').trim().toLowerCase();
      if (!validateBookingProvider(id)) return null;
      return {
        id,
        label: String(item?.label ?? id).trim() || id,
        enabled: item?.enabled !== false,
      } satisfies BookingProviderOption;
    })
    .filter((item: BookingProviderOption | null): item is BookingProviderOption => item !== null);

  if (!parsed.some((item: BookingProviderOption) => item.id === 'salonized')) {
    parsed.unshift({ id: 'salonized', label: 'Salonized', enabled: true });
  }
  return parsed;
};

const emptyArtistProfileDraft = {
  firstName: '',
  lastName: '',
  instagramHandle: '',
  email: '',
  bookingWebsiteLink: '',
  personalWebsiteLink: '',
  phoneNumber: '',
  profilePhotoLink: '',
  specialty: '',
  bio: '',
};

const emptyNewProductCategoryDraft = {
  slug: '',
  title: '',
  count: 0,
  image: '',
  link: '',
};

const normalizeArtistProfile = (raw: any, id: string): ArtistProfile => ({
  id,
  firstName: String(raw?.firstName ?? '').trim(),
  lastName: String(raw?.lastName ?? '').trim(),
  instagramHandle: String(raw?.instagramHandle ?? '').trim(),
  email: String(raw?.email ?? '').trim(),
  bookingWebsiteLink: String(raw?.bookingWebsiteLink ?? '').trim(),
  personalWebsiteLink: String(raw?.personalWebsiteLink ?? '').trim(),
  phoneNumber: String(raw?.phoneNumber ?? '').trim(),
  profilePhotoLink: String(raw?.profilePhotoLink ?? '').trim(),
  specialty: String(raw?.specialty ?? '').trim(),
  bio: String(raw?.bio ?? '').trim(),
  enabled: raw?.enabled !== false,
  order: typeof raw?.order === 'number' && Number.isFinite(raw.order) ? raw.order : undefined,
});

const sortArtistProfilesByOrder = (items: ArtistProfile[]): ArtistProfile[] =>
  [...items].sort((a, b) => {
    const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
    const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return `${a.firstName} ${a.lastName}`.trim().localeCompare(`${b.firstName} ${b.lastName}`.trim());
  });

const reindexArtistProfiles = (items: ArtistProfile[]): ArtistProfile[] =>
  items.map((artist, index) => ({ ...artist, order: index }));

const isValidHttpUrl = (value: string) => {
  const trimmed = value.trim();
  if (trimmed === '') return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidArtistProfile = (_artist: ArtistProfile) => true;
const parseEuroPrice = (raw: unknown): number | null => {
  const n = Number.parseFloat(String(raw ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : null;
};
const formatEuroPrice = (value: number): string => `€${value.toFixed(2)}`;
const applyGlobalPercentageToServicesData = (
  sourceServices: any,
  pct: number,
  roundUp: boolean
) => {
  const updatedServices = JSON.parse(JSON.stringify(sourceServices));
  if (!updatedServices?.en?.categories) return updatedServices;
  updatedServices.en.categories = updatedServices.en.categories.map((cat: any) => ({
    ...cat,
    items: (cat.items || []).map((item: any) => {
      const priceNum = parseEuroPrice(item.price);
      if (priceNum === null) return item;
      const next = Math.max(0, priceNum * (1 + pct / 100));
      const normalized = roundUp ? Math.ceil(next) : next;
      return { ...item, price: formatEuroPrice(normalized) };
    }),
  }));
  return updatedServices;
};

type AdminTabId =
  | 'reviews'
  | 'faq'
  | 'services'
  | 'inquiries'
  | 'settings'
  | 'externalWidgets'
  | 'marketingSiteCopy'
  | 'siteLocation'
  | 'gallery'
  | 'videolinks'
  | 'artistprofiles'
  | 'products';

const SETTINGS_SUBNAV: { id: AdminTabId; label: string; icon: typeof Mail }[] = [
  { id: 'settings', label: 'General', icon: Settings },
  { id: 'externalWidgets', label: 'External Widgets', icon: PanelTopOpen },
  { id: 'marketingSiteCopy', label: 'Display Text On Page', icon: Braces },
  { id: 'siteLocation', label: 'Location Settings', icon: MapPin },
  { id: 'gallery', label: 'Gallery', icon: Image },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'services', label: 'Pricing', icon: Euro },
  { id: 'videolinks', label: 'Videos', icon: Youtube },
  { id: 'artistprofiles', label: 'Artist Profiles', icon: Users },
  { id: 'products', label: 'Products', icon: ShoppingBag },
];

/** Cloud Health LED: all of these must be `firebase` (and cloud reachable) for green. */
const DATA_SOURCE_LED_KEYS = [
  'settings',
  'widgets',
  'reviews',
  'faq',
  'services',
  'videolinks',
  'gallery',
  'artistprofiles',
  'products',
  'sitecopy',
] as const;

const AdminDashboard = () => {
  const { db, auth, storage, handleFirestoreError, firebaseEnvironment, activeFirebaseConfig } = getPortalFirebase();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTabId>('settings');
  const [settingsNavOpen, setSettingsNavOpen] = useState(false);
  const [healthNavOpen, setHealthNavOpen] = useState(false);
  const settingsDropdownRef = useRef<HTMLDivElement | null>(null);
  const healthDropdownRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jsonModalData, setJsonModalData] = useState<any>(null);
  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editingReviewText, setEditingReviewText] = useState('');

  // FAQ State
  const [faq, setFaq] = useState<any[]>([]);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [newFaqViewableText, setNewFaqViewableText] = useState('');
  const [expandedFaqCategoryId, setExpandedFaqCategoryId] = useState<string | null>(null);

  // Services State
  const [services, setServices] = useState<any>(null);
  /** Raw % string; empty means no global percentage adjustment */
  const [percentageRaw, setPercentageRaw] = useState('');
  const [percentageBaseServices, setPercentageBaseServices] = useState<any>(null);
  const [hasManualPriceChanges, setHasManualPriceChanges] = useState(false);
  /** Pricing card: which category has the "add service" form open */
  const [addServiceCategoryIndex, setAddServiceCategoryIndex] = useState<number | null>(null);
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // Inquiries State
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiriesView, setInquiriesView] = useState<'inbox' | 'trash'>('inbox');
  const [inquiriesSort, setInquiriesSort] = useState<'date_desc' | 'name_asc' | 'email_asc'>('date_desc');
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);

  const [videoLinks, setVideoLinks] = useState<VideoLinkItem[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoLabel, setNewVideoLabel] = useState('');
  const [editingVideoLinkId, setEditingVideoLinkId] = useState<string | null>(null);
  const [draftVideoUrl, setDraftVideoUrl] = useState('');
  const [draftVideoLabel, setDraftVideoLabel] = useState('');
  const [videoPreviewLightboxIndex, setVideoPreviewLightboxIndex] = useState<number | null>(null);
  // Artist Profiles State
  const [artistProfiles, setArtistProfiles] = useState<ArtistProfile[]>([]);
  const [newArtistProfile, setNewArtistProfile] = useState({ ...emptyArtistProfileDraft });
  const [uploadingPhotoFor, setUploadingPhotoFor] = useState<string | 'new' | null>(null);
  const [editingArtistProfileId, setEditingArtistProfileId] = useState<string | null>(null);
  const [showAddArtistModal, setShowAddArtistModal] = useState(false);

  const [productCategories, setProductCategories] = useState<ProductStorefrontCategory[]>([]);
  const [newProductCategory, setNewProductCategory] = useState({ ...emptyNewProductCategoryDraft });
  const [uploadingProductPhotoFor, setUploadingProductPhotoFor] = useState<string | 'new' | null>(null);
  const [editingProductCategoryId, setEditingProductCategoryId] = useState<string | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // Settings State
  const [contactEmail, setContactEmail] = useState('theschneiderhair@gmail.com');
  const [themeDefault, setThemeDefault] = useState<'light' | 'dark'>('light');
  const [mediaStorageRoot, setMediaStorageRoot] = useState('');
  const [bookingProvider, setBookingProvider] = useState<BookingProviderId>('salonized');
  const [bookingProviderMenuOpen, setBookingProviderMenuOpen] = useState(false);
  const bookingProviderMenuRef = useRef<HTMLDivElement | null>(null);
  const [bookingProviderOptions, setBookingProviderOptions] = useState<BookingProviderOption[]>(
    normalizeBookingProviderOptions(defaultBookingProvidersData)
  );
  const [bookingWidgetCompany, setBookingWidgetCompany] = useState('m2yzkzSecfyaghBe93MNZGuc');
  const [bookingWidgetScriptSrc, setBookingWidgetScriptSrc] = useState(
    'https://static-widget.salonized.com/loader.js'
  );
  const [paymentWidgetProvider, setPaymentWidgetProvider] = useState<PaymentWidgetProviderId>('payhip');
  const [paymentWidgetProviderMenuOpen, setPaymentWidgetProviderMenuOpen] = useState(false);
  const paymentWidgetProviderMenuRef = useRef<HTMLDivElement | null>(null);
  const [paymentWidgetProductId, setPaymentWidgetProductId] = useState('4GCTc');
  const [showPaymentWidget, setShowPaymentWidget] = useState(true);
  const [autoLogoutLeavingAdmin, setAutoLogoutLeavingAdmin] = useState(true);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [showArtistsPage, setShowArtistsPage] = useState(false);
  const [showProductsPage, setShowProductsPage] = useState(true);
  const [showReviewsSection, setShowReviewsSection] = useState(true);
  const [showPricingSection, setShowPricingSection] = useState(true);
  const [roundPricesUpToWholeAmount, setRoundPricesUpToWholeAmount] = useState(true);
  const [showVideoSection, setShowVideoSection] = useState(true);
  const [showGallerySection, setShowGallerySection] = useState(true);
  const [showFaqPage, setShowFaqPage] = useState(true);
  const [showBookingWidget, setShowBookingWidget] = useState(true);
  const [showContactForm, setShowContactForm] = useState(true);
  const [settingsSavedNotice, setSettingsSavedNotice] = useState('');
  const [taggboxWidgetId, setTaggboxWidgetId] = useState('');
  const [includeSocialSection, setIncludeSocialSection] = useState(true);
  const [savedSettingsSnapshot, setSavedSettingsSnapshot] = useState('');
  const [savedWidgetsSnapshot, setSavedWidgetsSnapshot] = useState('');
  const [contentDataSourceModeState, setContentDataSourceModeState] = useState<ContentDataSourceMode>(() =>
    getContentDataSourceMode()
  );
  const [marketingSiteCopyJson, setMarketingSiteCopyJson] = useState('');
  const [marketingSiteCopyEditorKey, setMarketingSiteCopyEditorKey] = useState(0);
  const [marketingSiteCopyNotice, setMarketingSiteCopyNotice] = useState('');
  const [siteLocationDraft, setSiteLocationDraft] = useState(() => getLocationSiteEditorSettings());
  const [galleryHome, setGalleryHome] = useState<GalleryHomeData>(() => normalizeGalleryHomeData({}));
  const [showGalleryTileModal, setShowGalleryTileModal] = useState(false);
  const [editingGalleryIndex, setEditingGalleryIndex] = useState<number | null>(null);
  const [galleryFormDraft, setGalleryFormDraft] = useState<GalleryTileItem>({
    src: '/portfolio-1.jpeg',
    label: '',
    order: 0,
    enabled: true,
  });
  const locationPersistRef = useRef(siteLocationDraft);
  locationPersistRef.current = siteLocationDraft;
  const [dataSources, setDataSources] = useState<{ [key: string]: 'firebase' | 'local' | 'unknown' }>({
    reviews: 'unknown',
    faq: 'unknown',
    services: 'unknown',
    inquiries: 'unknown',
    settings: 'unknown',
    widgets: 'unknown',
    videolinks: 'unknown',
    gallery: 'unknown',
    artistprofiles: 'unknown',
    products: 'unknown',
    sitecopy: 'unknown',
  });
  const [cloudReadable, setCloudReadable] = useState<{
    reviews: boolean;
    faq: boolean;
    services: boolean;
    videolinks: boolean;
    gallery: boolean;
    artistprofiles: boolean;
    products: boolean;
    sitecopy: boolean;
  }>({
    reviews: true,
    faq: true,
    services: true,
    videolinks: true,
    gallery: true,
    artistprofiles: true,
    products: true,
    sitecopy: true,
  });
  const [firebaseConnected, setFirebaseConnected] = useState(true);

  const invalidFieldClass = 'bg-red-50 border-red-300 ring-1 ring-red-200/80';
  const invalidFieldClassDark = 'bg-red-950/50 border-red-400 ring-1 ring-red-500/40';
  const cloudActionDisabled = saving || !firebaseConnected;
  const sidebarControlButtonBaseClass =
    'flex w-full items-center gap-2.5 rounded-lg border px-4 py-2.5 text-left transition-colors';
  const sidebarControlLabelClass = 'truncate text-sm font-medium';

  const allSubSourcesLive = useMemo(
    () => firebaseConnected && DATA_SOURCE_LED_KEYS.every((k) => dataSources[k] === 'firebase'),
    [firebaseConnected, dataSources]
  );

  const adminActionButtonClass =
    'flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors disabled:opacity-50 bg-stone-900 text-white hover:bg-gold';
  const adminSecondaryActionButtonClass =
    'flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors border border-stone-200 bg-stone-50 text-stone-500 hover:text-stone-900';

  const allServicePricesValid = useMemo(() => {
    if (!services?.en?.categories) return true;
    for (const cat of services.en.categories) {
      for (const item of cat.items || []) {
        if (!validateServicePrice(String(item.price ?? ''))) return false;
      }
    }
    return true;
  }, [services]);

  const percentageInputValid = useMemo(() => validatePercentageInput(percentageRaw), [percentageRaw]);
  const currentSettingsSnapshot = useMemo(
    () =>
      JSON.stringify({
        contactEmail: contactEmail.trim(),
        themeDefault,
        mediaStorageRoot: normalizeMediaStorageRoot(mediaStorageRoot),
        autoLogoutLeavingAdmin,
        showThemeSelector,
        showArtistsPage,
        showProductsPage,
        showReviewsSection,
        showPricingSection,
        roundPricesUpToWholeAmount,
        showVideoSection,
        showGallerySection,
        showFaqPage,
        showContactForm,
      }),
    [
      contactEmail,
      themeDefault,
      mediaStorageRoot,
      autoLogoutLeavingAdmin,
      showThemeSelector,
      showArtistsPage,
      showProductsPage,
      showReviewsSection,
      showPricingSection,
      roundPricesUpToWholeAmount,
      showVideoSection,
      showGallerySection,
      showFaqPage,
      showContactForm,
    ]
  );
  const currentWidgetsSnapshot = useMemo(
    () =>
      JSON.stringify({
        bookingProvider,
        bookingWidgetCompany: bookingWidgetCompany.trim(),
        bookingWidgetScriptSrc: bookingWidgetScriptSrc.trim(),
        showBookingWidget,
        paymentWidgetProvider,
        paymentWidgetProductId: paymentWidgetProductId.trim(),
        showPaymentWidget,
        taggboxWidgetId: taggboxWidgetId.trim(),
        includeSocialSection,
      }),
    [
      bookingProvider,
      bookingWidgetCompany,
      bookingWidgetScriptSrc,
      showBookingWidget,
      paymentWidgetProvider,
      paymentWidgetProductId,
      showPaymentWidget,
      taggboxWidgetId,
      includeSocialSection,
    ]
  );
  const hasPendingSettingsChanges = savedSettingsSnapshot !== '' && currentSettingsSnapshot !== savedSettingsSnapshot;
  const hasPendingWidgetChanges = savedWidgetsSnapshot !== '' && currentWidgetsSnapshot !== savedWidgetsSnapshot;

  const newServiceFormValid = useMemo(() => {
    const price = sanitizeServicePriceInput(newServicePrice);
    return (
      validateServiceTitle(newServiceTitle) &&
      validateServiceItemDescription(newServiceDesc) &&
      validateServiceDuration(newServiceDuration) &&
      validateServicePrice(price)
    );
  }, [newServiceTitle, newServiceDesc, newServiceDuration, newServicePrice]);

  const faqNewCategoryReadyToSubmit = useMemo(
    () =>
      newFaqViewableText.trim() !== '' &&
      validateFaqViewableText(newFaqViewableText),
    [newFaqViewableText]
  );

  const settingsEmailValid = useMemo(() => validateEmail(contactEmail), [contactEmail]);
  const bookingWidgetScriptSrcValid = useMemo(
    () => validateBookingWidgetScriptSrc(bookingWidgetScriptSrc),
    [bookingWidgetScriptSrc]
  );
  const bookingWidgetCompanyValid = useMemo(
    () => validateBookingWidgetCompany(bookingWidgetCompany),
    [bookingWidgetCompany]
  );
  const paymentWidgetProductIdValid = useMemo(
    () => validatePaymentWidgetProductId(paymentWidgetProductId),
    [paymentWidgetProductId]
  );
  const taggboxWidgetIdValid = useMemo(
    () => validateTaggboxWidgetId(taggboxWidgetId),
    [taggboxWidgetId]
  );
  const selectableBookingProviderOptions = useMemo(() => {
    const enabled = bookingProviderOptions.filter((opt) => opt.enabled !== false);
    if (enabled.length === 0) return [{ id: 'salonized', label: 'Salonized', enabled: true } as BookingProviderOption];
    return enabled;
  }, [bookingProviderOptions]);
  useEffect(() => {
    if (!selectableBookingProviderOptions.some((opt) => opt.id === bookingProvider)) {
      setBookingProvider('salonized');
    }
  }, [bookingProvider, selectableBookingProviderOptions]);
  useEffect(() => {
    const onPointerDownOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (bookingProviderMenuRef.current?.contains(target)) return;
      if (paymentWidgetProviderMenuRef.current?.contains(target)) return;
      setBookingProviderMenuOpen(false);
      setPaymentWidgetProviderMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDownOutside);
    document.addEventListener('touchstart', onPointerDownOutside);
    return () => {
      document.removeEventListener('mousedown', onPointerDownOutside);
      document.removeEventListener('touchstart', onPointerDownOutside);
    };
  }, []);
  const canPushAllSettingsToCloud =
    hasPendingSettingsChanges &&
    !cloudActionDisabled &&
    settingsEmailValid &&
    bookingWidgetCompanyValid &&
    bookingWidgetScriptSrcValid &&
    paymentWidgetProductIdValid &&
    (!includeSocialSection || taggboxWidgetIdValid);

  const newReviewValid = useMemo(() => validateReviewBody(newReview), [newReview]);

  const faqModalValid = useMemo(() => {
    if (!editingCategory?.items) return true;
    return (editingCategory.items as any[]).every(
      (item: any) => validateFaqItemQuestion(item.q || '') && validateFaqItemAnswer(item.a || '')
    );
  }, [editingCategory]);

  const newVideoFormValid = useMemo(() => {
    const u = newVideoUrl.trim();
    return u !== '' && isValidYoutubeVideoUrl(u) && validateVideoLinkLabel(newVideoLabel);
  }, [newVideoUrl, newVideoLabel]);

  const galleryTileModalValid = useMemo(() => {
    const src = galleryFormDraft.src.trim();
    return src !== '' && (!src.includes('://') || isValidHttpUrl(src));
  }, [galleryFormDraft.src]);

  const canPushVideoLinksToDatabase = useMemo(
    () =>
      videoLinks.length > 0 &&
      videoLinks.every(
        (v) =>
          isValidYoutubeVideoUrl(String(v.url ?? '')) && validateVideoLinkLabel(String(v.label ?? ''))
      ),
    [videoLinks]
  );

  const videoLightboxResolvedId = useMemo(() => {
    if (videoPreviewLightboxIndex === null) return null;
    const row = videoLinks[videoPreviewLightboxIndex];
    if (!row) return null;
    const raw = editingVideoLinkId === row.id ? draftVideoUrl : row.url;
    return extractYoutubeVideoId(String(raw ?? ''));
  }, [videoPreviewLightboxIndex, videoLinks, editingVideoLinkId, draftVideoUrl]);

  const newArtistProfileValid = useMemo(() => true, []);

  const canPushArtistProfilesToDatabase = useMemo(() => artistProfiles.length > 0, [artistProfiles]);
  const editingArtistProfile = useMemo(
    () => artistProfiles.find((artist) => artist.id === editingArtistProfileId) ?? null,
    [artistProfiles, editingArtistProfileId]
  );

  const newProductCategoryValid = useMemo(
    () => newProductCategory.title.trim().length > 0,
    [newProductCategory.title]
  );
  const canPushProductCategoriesToDatabase = useMemo(
    () => productCategories.length > 0,
    [productCategories]
  );
  const editingProductCategory = useMemo(
    () => productCategories.find((p) => p.id === editingProductCategoryId) ?? null,
    [productCategories, editingProductCategoryId]
  );

  const inboxInquiries = useMemo(
    () => inquiries.filter((inq: any) => inq.deleted !== true),
    [inquiries]
  );
  const trashInquiries = useMemo(
    () => inquiries.filter((inq: any) => inq.deleted === true),
    [inquiries]
  );
  const visibleInquiries = useMemo(
    () => (inquiriesView === 'inbox' ? inboxInquiries : trashInquiries),
    [inquiriesView, inboxInquiries, trashInquiries]
  );
  const sortedVisibleInquiries = useMemo(() => {
    const rows = [...visibleInquiries];
    if (inquiriesSort === 'name_asc') {
      rows.sort((a: any, b: any) =>
        String(a?.name ?? '').toLowerCase().localeCompare(String(b?.name ?? '').toLowerCase())
      );
      return rows;
    }
    if (inquiriesSort === 'email_asc') {
      rows.sort((a: any, b: any) =>
        String(a?.email ?? '').toLowerCase().localeCompare(String(b?.email ?? '').toLowerCase())
      );
      return rows;
    }
    rows.sort((a: any, b: any) => {
      const as = typeof a?.createdAt?.seconds === 'number' ? a.createdAt.seconds : 0;
      const bs = typeof b?.createdAt?.seconds === 'number' ? b.createdAt.seconds : 0;
      return bs - as;
    });
    return rows;
  }, [visibleInquiries, inquiriesSort]);
  const selectedInquiry = useMemo(
    () => sortedVisibleInquiries.find((inq: any) => inq.id === selectedInquiryId) ?? null,
    [sortedVisibleInquiries, selectedInquiryId]
  );

  useEffect(() => {
    if (sortedVisibleInquiries.length === 0) {
      setSelectedInquiryId(null);
      return;
    }
    if (selectedInquiryId && !sortedVisibleInquiries.some((inq: any) => inq.id === selectedInquiryId)) {
      setSelectedInquiryId(null);
    }
  }, [sortedVisibleInquiries, selectedInquiryId]);

  useEffect(() => {
    if (activeTab === 'siteLocation') setSiteLocationDraft(getLocationSiteEditorSettings());
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'marketingSiteCopy') return;
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await getMarketingSiteCopyWithFallback();
        if (cancelled) return;
        setMarketingSiteCopyJson(JSON.stringify(data, null, 2));
        setMarketingSiteCopyEditorKey((k) => k + 1);
        setMarketingSiteCopyNotice('');
      } catch {
        if (!cancelled) setMarketingSiteCopyNotice('Could not load marketing copy.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  useEffect(() => {
    const onPointerDownOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const clickedInsideSettings = settingsDropdownRef.current?.contains(target) ?? false;
      const clickedInsideHealth = healthDropdownRef.current?.contains(target) ?? false;
      if (clickedInsideSettings || clickedInsideHealth) return;

      setSettingsNavOpen(false);
      setHealthNavOpen(false);
    };

    document.addEventListener('mousedown', onPointerDownOutside);
    document.addEventListener('touchstart', onPointerDownOutside);
    return () => {
      document.removeEventListener('mousedown', onPointerDownOutside);
      document.removeEventListener('touchstart', onPointerDownOutside);
    };
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setLocationSiteEditorSettings(locationPersistRef.current);
    }, 200);
    return () => window.clearTimeout(id);
  }, [siteLocationDraft]);

  const reviewsLive = dataSources.reviews === 'firebase';
  const faqLive = dataSources.faq === 'firebase';
  const videoLinksLive = dataSources.videolinks === 'firebase';
  const artistProfilesLive = dataSources.artistprofiles === 'firebase';

  useEffect(() => {
    if (videoPreviewLightboxIndex !== null && !videoLightboxResolvedId) {
      setVideoPreviewLightboxIndex(null);
    }
  }, [videoPreviewLightboxIndex, videoLightboxResolvedId]);

  const applyLoadedSettings = (raw: any) => {
    const next = {
      contactEmail: String(raw?.contactEmail || 'theschneiderhair@gmail.com'),
      themeDefault: validateThemeDefault(raw?.themeDefault) ? raw.themeDefault : 'light',
      mediaStorageRoot: normalizeMediaStorageRoot(raw?.mediaStorageRoot ?? 'media'),
      autoLogoutLeavingAdmin: parseAutoLogoutLeavingAdmin(raw?.autoLogoutLeavingAdmin),
      showThemeSelector: parseShowThemeSelector(raw?.showThemeSelector),
      showArtistsPage: parseShowArtistsPage(raw?.showArtistsPage),
      showProductsPage: parseShowProductsPage(raw?.showProductsPage),
      showReviewsSection: parseShowReviewsSection(raw?.showReviewsSection),
      showPricingSection: parseShowPricingSection(raw?.showPricingSection),
      roundPricesUpToWholeAmount: parseRoundPricesUpToWholeAmount(raw?.roundPricesUpToWholeAmount),
      showVideoSection: parseShowVideoSection(raw?.showVideoSection),
      showGallerySection: parseShowGallerySection(raw?.showGallerySection),
      showFaqPage: parseShowFaqPage(raw?.showFaqPage),
      showContactForm: parseShowContactForm(raw?.showContactForm),
    };

    setContactEmail(next.contactEmail);
    setThemeDefault(next.themeDefault);
    setMediaStorageRoot(next.mediaStorageRoot);
    setAutoLogoutLeavingAdmin(next.autoLogoutLeavingAdmin);
    setShowThemeSelector(next.showThemeSelector);
    setShowArtistsPage(next.showArtistsPage);
    setShowProductsPage(next.showProductsPage);
    setShowReviewsSection(next.showReviewsSection);
    setShowPricingSection(next.showPricingSection);
    setRoundPricesUpToWholeAmount(next.roundPricesUpToWholeAmount);
    setShowVideoSection(next.showVideoSection);
    setShowGallerySection(next.showGallerySection);
    setShowFaqPage(next.showFaqPage);
    setShowContactForm(next.showContactForm);
    setSavedSettingsSnapshot(JSON.stringify(next));
  };

  const applyLoadedWidgets = (raw: any) => {
    const next = {
      bookingProvider: parseBookingProvider(raw?.bookingProvider),
      bookingWidgetCompany: String(raw?.bookingWidgetCompany ?? 'm2yzkzSecfyaghBe93MNZGuc'),
      bookingWidgetScriptSrc: String(raw?.bookingWidgetScriptSrc ?? 'https://static-widget.salonized.com/loader.js'),
      showBookingWidget: parseShowBookingWidget(raw?.showBookingWidget),
      paymentWidgetProvider: parsePaymentWidgetProvider(raw?.paymentWidgetProvider),
      paymentWidgetProductId: String(raw?.paymentWidgetProductId ?? '4GCTc'),
      showPaymentWidget: raw?.showPaymentWidget !== false,
      taggboxWidgetId: String(raw?.taggboxWidgetId ?? ''),
      includeSocialSection: parseIncludeSocialSection(raw?.showSocialWidget ?? raw?.includeSocialSection),
    };
    setBookingProvider(next.bookingProvider);
    setBookingWidgetCompany(next.bookingWidgetCompany);
    setBookingWidgetScriptSrc(next.bookingWidgetScriptSrc);
    setShowBookingWidget(next.showBookingWidget);
    setPaymentWidgetProvider(next.paymentWidgetProvider);
    setPaymentWidgetProductId(next.paymentWidgetProductId);
    setShowPaymentWidget(next.showPaymentWidget);
    setTaggboxWidgetId(next.taggboxWidgetId);
    setIncludeSocialSection(next.includeSocialSection);
    setSavedWidgetsSnapshot(JSON.stringify(next));
  };

  useEffect(() => {
    fetchData();
    void refreshCloudReadability();
  }, []);

  // Self-healing: If cloud data is detected as empty, suggest a restore
  useEffect(() => {
    if (!loading && !saving && contentDataSourceModeState === 'firebase') {
      const isReviewsEmpty = reviews.length === 0;
      const isFaqEmpty = faq.length === 0;
      const isServicesEmpty = !services || Object.keys(services).length === 0;

      if (isReviewsEmpty || isFaqEmpty || isServicesEmpty) {
        const autoRestore = async () => {
          const confirmAuto = confirm('Sync Detected: Your live cloud data is currently missing some or all core data (Reviews, FAQ, or Services). Would you like to synchronize and restore the original inventory now?');
          if (confirmAuto) {
            await pushAllLocalJsonToCloud();
          }
        };
        autoRestore();
      }
    }
  }, [loading, saving, contentDataSourceModeState, reviews.length, faq.length, services]);

  const fetchData = async () => {
    setLoading(true);
    const sourcesUpdate: any = { ...dataSources };
    const preferredSource = getContentDataSourceMode();
    setContentDataSourceModeState(preferredSource);

    try {
      // 1. Fetch Reviews
      if (preferredSource === 'local') {
        const res = await fetch(`${import.meta.env.BASE_URL}data/reviews.json`);
        const json = await res.json();
        setReviews(json.map((text: string, i: number) => ({ id: `temp-${i}`, text, isLocal: true })));
        sourcesUpdate.reviews = 'local';
      } else {
        const reviewsSnap = await getDocs(collection(db, 'reviews'));
        if (!reviewsSnap.empty) {
          setReviews(reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          sourcesUpdate.reviews = 'firebase';
        } else {
          const res = await fetch(`${import.meta.env.BASE_URL}data/reviews.json`);
          const json = await res.json();
          setReviews(json.map((text: string, i: number) => ({ id: `temp-${i}`, text, isLocal: true })));
          sourcesUpdate.reviews = 'local';
        }
      }

      // 2. Fetch FAQ (unordered read + client sort keeps legacy docs without `order`)
      if (preferredSource === 'local') {
        const res = await fetch(`${import.meta.env.BASE_URL}data/faq.json`);
        const json = await res.json();
        setFaq(json.map((cat: any, i: number) => ({ id: `temp-${i}`, ...cat, isLocal: true })));
        sourcesUpdate.faq = 'local';
      } else {
        const faqUnorderedSnap = await getDocs(collection(db, 'faq'));
        const faqDocs = faqUnorderedSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => {
            const aOrder = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
            const bOrder = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
            return aOrder - bOrder;
          });

        if (faqDocs.length > 0) {
          setFaq(faqDocs);
          sourcesUpdate.faq = 'firebase';
        } else {
          const res = await fetch(`${import.meta.env.BASE_URL}data/faq.json`);
          const json = await res.json();
          setFaq(json.map((cat: any, i: number) => ({ id: `temp-${i}`, ...cat, isLocal: true })));
          sourcesUpdate.faq = 'local';
        }
      }

      // 3. Fetch Services
      if (preferredSource === 'local') {
        const res = await fetch(`${import.meta.env.BASE_URL}data/services.json`);
        const json = await res.json();
        const unified = {
          en: { categories: json.en || [], lang: 'en' }
        };
        setServices(unified);
        sourcesUpdate.services = 'local';
      } else {
        const servicesSnap = await getDocs(collection(db, 'services'));
        if (!servicesSnap.empty) {
          const servicesData: any = {};
          servicesSnap.forEach(d => {
            if (d.id === 'en') {
              servicesData[d.id] = d.data();
            }
          });
          if (!servicesData.en) {
            const enDoc = servicesSnap.docs.find(d => d.id === 'en');
            if (enDoc) servicesData.en = enDoc.data();
          }
          setServices(servicesData);
          sourcesUpdate.services = 'firebase';
        } else {
          const res = await fetch(`${import.meta.env.BASE_URL}data/services.json`);
          const json = await res.json();
          const unified = {
            en: { categories: json.en || [], lang: 'en' }
          };
          setServices(unified);
          sourcesUpdate.services = 'local';
        }
      }
    } catch (err) {
      // Graceful fallback for the dashboard view
      try {
        const [rRes, fRes, sRes, stRes, wRes, vlRes, gRes, apRes, rpRes, bpRes] = await Promise.all([
          fetch(`${import.meta.env.BASE_URL}data/reviews.json`),
          fetch(`${import.meta.env.BASE_URL}data/faq.json`),
          fetch(`${import.meta.env.BASE_URL}data/services.json`),
          fetch(`${import.meta.env.BASE_URL}data/settings.json`),
          fetch(`${import.meta.env.BASE_URL}data/widgets.json`),
          fetch(`${import.meta.env.BASE_URL}data/videolinks.json`),
          fetch(`${import.meta.env.BASE_URL}data/gallery.json`),
          fetch(`${import.meta.env.BASE_URL}data/artistprofiles.json`),
          fetch(`${import.meta.env.BASE_URL}data/recommendedproducts.json`),
          fetch(`${import.meta.env.BASE_URL}data/bookingproviders.json`),
        ]);
        const [rJson, fJson, sJson, stJson, wJson, vlJson, gJson, apJson, rpJson, bpJson] = await Promise.all([
          rRes.json(),
          fRes.json(),
          sRes.json(),
          stRes.json(),
          wRes.json(),
          vlRes.json(),
          gRes.json(),
          apRes.json(),
          rpRes.json(),
          bpRes.json(),
        ]);
        setReviews(rJson.map((text: string, i: number) => ({ id: `err-${i}`, text, isLocal: true })));
        setFaq(fJson.map((cat: any, i: number) => ({ id: `err-${i}`, ...cat, isLocal: true })));
        
        const unified = {
          en: { categories: sJson.en || [], lang: 'en' }
        };
        setServices(unified);
        applyLoadedSettings(stJson);
        applyLoadedWidgets(wJson);
        setVideoLinks(normalizeVideoLinkItems(vlJson.items ?? []));
        setGalleryHome(normalizeGalleryHomeData(gJson));
        setArtistProfiles(
          (Array.isArray(apJson) ? apJson : []).map((item: any, i: number) =>
            ({ ...normalizeArtistProfile(item, `err-artist-${i}`), isLocal: true })
          )
        );
        setProductCategories(
          reindexProductStorefrontCategories(
            (Array.isArray(rpJson) ? rpJson : []).map((item: any, i: number) => ({
              ...normalizeProductStorefrontCategory(item, `err-product-${i}`),
              isLocal: true,
            }))
          )
        );
        setBookingProviderOptions(normalizeBookingProviderOptions(bpJson));
        sourcesUpdate.reviews = 'local';
        sourcesUpdate.faq = 'local';
        sourcesUpdate.services = 'local';
        sourcesUpdate.settings = 'local';
        sourcesUpdate.widgets = 'local';
        sourcesUpdate.products = 'local';
        sourcesUpdate.videolinks = 'local';
        sourcesUpdate.gallery = 'local';
        sourcesUpdate.artistprofiles = 'local';
        sourcesUpdate.sitecopy = 'local';
      } catch (fallbackErr) {
        console.error("Critical: Local JSON files missing or inaccessible", fallbackErr);
      }
    }

    // 4. Fetch Inquiries
    try {
      const inquiriesSnap = await getDocs(query(collection(db, 'inquiries'), orderBy('createdAt', 'desc')));
      setInquiries(inquiriesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      sourcesUpdate.inquiries = 'firebase';
    } catch (inqErr) {
      console.warn("Could not fetch inquiries:", inqErr);
      sourcesUpdate.inquiries = 'local'; // though inquiries don't really have a local fallback
    }

    // 5. Fetch Settings
    try {
      if (preferredSource === 'local') {
        const sRes = await fetch(`${import.meta.env.BASE_URL}data/settings.json`);
        const sJson = await sRes.json();
        applyLoadedSettings(sJson);
        sourcesUpdate.settings = 'local';
      } else {
        const settingsSnap = await getDoc(doc(db, 'settings', 'general'));
        if (settingsSnap.exists()) {
          const s = settingsSnap.data();
          applyLoadedSettings(s);
          sourcesUpdate.settings = 'firebase';
          sourcesUpdate.products = 'firebase';
        } else {
          const sRes = await fetch(`${import.meta.env.BASE_URL}data/settings.json`);
          const sJson = await sRes.json();
          applyLoadedSettings(sJson);
          sourcesUpdate.settings = 'local';
          sourcesUpdate.widgets = 'local';
          sourcesUpdate.products = 'local';
        }
      }
    } catch (settingsErr) {
      console.warn("Could not fetch settings:", settingsErr);
      try {
        const sRes = await fetch(`${import.meta.env.BASE_URL}data/settings.json`);
        const sJson = await sRes.json();
        applyLoadedSettings(sJson);
      } catch {
        /* keep defaults */
      }
      sourcesUpdate.settings = 'local';
      sourcesUpdate.widgets = 'local';
      sourcesUpdate.products = 'local';
    }

    // 6. Fetch External Widgets
    try {
      if (preferredSource === 'local') {
        const wRes = await fetch(`${import.meta.env.BASE_URL}data/widgets.json`);
        const wJson = await wRes.json();
        applyLoadedWidgets(wJson);
        sourcesUpdate.widgets = 'local';
      } else {
        const widgetsSnap = await getDoc(doc(db, 'widgets', 'general'));
        if (widgetsSnap.exists()) {
          applyLoadedWidgets(widgetsSnap.data());
          sourcesUpdate.widgets = 'firebase';
        } else {
          const wRes = await fetch(`${import.meta.env.BASE_URL}data/widgets.json`);
          const wJson = await wRes.json();
          applyLoadedWidgets(wJson);
          sourcesUpdate.widgets = 'local';
        }
      }
    } catch (widgetsErr) {
      console.warn("Could not fetch widgets:", widgetsErr);
      try {
        const wRes = await fetch(`${import.meta.env.BASE_URL}data/widgets.json`);
        const wJson = await wRes.json();
        applyLoadedWidgets(wJson);
      } catch {
        /* keep defaults */
      }
      sourcesUpdate.widgets = 'local';
    }

    // 7. Fetch Booking Provider Catalog
    try {
      if (preferredSource === 'local') {
        const pRes = await fetch(`${import.meta.env.BASE_URL}data/bookingproviders.json`);
        const pJson = await pRes.json();
        setBookingProviderOptions(normalizeBookingProviderOptions(pJson));
      } else {
        const providersSnap = await getDoc(doc(db, 'bookingproviders', 'catalog'));
        if (providersSnap.exists()) {
          setBookingProviderOptions(normalizeBookingProviderOptions(providersSnap.data()));
        } else {
          const pRes = await fetch(`${import.meta.env.BASE_URL}data/bookingproviders.json`);
          const pJson = await pRes.json();
          setBookingProviderOptions(normalizeBookingProviderOptions(pJson));
        }
      }
    } catch (providersErr) {
      console.warn('Could not fetch booking provider catalog:', providersErr);
      setBookingProviderOptions(normalizeBookingProviderOptions(defaultBookingProvidersData));
    }

    try {
      if (preferredSource === 'local') {
        const vlRes = await fetch(`${import.meta.env.BASE_URL}data/videolinks.json`);
        const vlJson = await vlRes.json();
        setVideoLinks(normalizeVideoLinkItems(vlJson.items ?? []));
        sourcesUpdate.videolinks = 'local';
      } else {
        const vlSnap = await getDoc(doc(db, 'videolinks', 'home'));
        if (vlSnap.exists()) {
          const items = normalizeVideoLinkItems(vlSnap.data().items ?? []);
          setVideoLinks(items);
          sourcesUpdate.videolinks = 'firebase';
        } else {
          const vlRes = await fetch(`${import.meta.env.BASE_URL}data/videolinks.json`);
          const vlJson = await vlRes.json();
          setVideoLinks(normalizeVideoLinkItems(vlJson.items ?? []));
          sourcesUpdate.videolinks = 'local';
        }
      }
    } catch (vlErr) {
      console.warn('Could not fetch videolinks:', vlErr);
      try {
        const vlRes = await fetch(`${import.meta.env.BASE_URL}data/videolinks.json`);
        const vlJson = await vlRes.json();
        setVideoLinks(normalizeVideoLinkItems(vlJson.items ?? []));
      } catch {
        setVideoLinks([]);
      }
      sourcesUpdate.videolinks = 'local';
    }

    try {
      if (preferredSource === 'local') {
        const gRes = await fetch(`${import.meta.env.BASE_URL}data/gallery.json`);
        const gJson = await gRes.json();
        setGalleryHome(normalizeGalleryHomeData(gJson));
        sourcesUpdate.gallery = 'local';
      } else {
        const gSnap = await getDoc(doc(db, 'gallery', 'home'));
        if (gSnap.exists()) {
          setGalleryHome(normalizeGalleryHomeData(gSnap.data()));
          sourcesUpdate.gallery = 'firebase';
        } else {
          const gRes = await fetch(`${import.meta.env.BASE_URL}data/gallery.json`);
          const gJson = await gRes.json();
          setGalleryHome(normalizeGalleryHomeData(gJson));
          sourcesUpdate.gallery = 'local';
        }
      }
    } catch (galleryErr) {
      console.warn('Could not fetch gallery:', galleryErr);
      try {
        const gRes = await fetch(`${import.meta.env.BASE_URL}data/gallery.json`);
        const gJson = await gRes.json();
        setGalleryHome(normalizeGalleryHomeData(gJson));
      } catch {
        setGalleryHome(normalizeGalleryHomeData({}));
      }
      sourcesUpdate.gallery = 'local';
    }

    try {
      if (preferredSource === 'local') {
        const artistsRes = await fetch(`${import.meta.env.BASE_URL}data/artistprofiles.json`);
        const artistsJson = await artistsRes.json();
        setArtistProfiles(
          reindexArtistProfiles(
            (Array.isArray(artistsJson) ? artistsJson : []).map((item: any, i: number) => ({
              ...normalizeArtistProfile(item, `temp-artist-${i}`),
              isLocal: true,
            }))
          )
        );
        sourcesUpdate.artistprofiles = 'local';
      } else {
        const artistsSnap = await getDocs(collection(db, 'artistprofiles'));
        if (!artistsSnap.empty) {
          setArtistProfiles(
            reindexArtistProfiles(
              sortArtistProfilesByOrder(artistsSnap.docs.map((d) => normalizeArtistProfile(d.data(), d.id)))
            )
          );
          sourcesUpdate.artistprofiles = 'firebase';
        } else {
          const artistsRes = await fetch(`${import.meta.env.BASE_URL}data/artistprofiles.json`);
          const artistsJson = await artistsRes.json();
          setArtistProfiles(
            reindexArtistProfiles(
              (Array.isArray(artistsJson) ? artistsJson : []).map((item: any, i: number) => ({
                ...normalizeArtistProfile(item, `temp-artist-${i}`),
                isLocal: true,
              }))
            )
          );
          sourcesUpdate.artistprofiles = 'local';
        }
      }
    } catch (artistErr) {
      console.warn('Could not fetch artist profiles:', artistErr);
      try {
        const artistsRes = await fetch(`${import.meta.env.BASE_URL}data/artistprofiles.json`);
        const artistsJson = await artistsRes.json();
        setArtistProfiles(
          reindexArtistProfiles(
            (Array.isArray(artistsJson) ? artistsJson : []).map((item: any, i: number) => ({
              ...normalizeArtistProfile(item, `temp-artist-${i}`),
              isLocal: true,
            }))
          )
        );
      } catch {
        setArtistProfiles([]);
      }
      sourcesUpdate.artistprofiles = 'local';
    }

    try {
      if (preferredSource === 'local') {
        const rpRes = await fetch(`${import.meta.env.BASE_URL}data/recommendedproducts.json`);
        const rpJson = await rpRes.json();
        setProductCategories(
          reindexProductStorefrontCategories(
            (Array.isArray(rpJson) ? rpJson : []).map((item: any, i: number) => ({
              ...normalizeProductStorefrontCategory(item, `temp-product-${i}`),
              isLocal: true,
            }))
          )
        );
        sourcesUpdate.products = 'local';
      } else {
        const productsSnap = await getDocs(collection(db, 'productcategories'));
        if (!productsSnap.empty) {
          setProductCategories(
            reindexProductStorefrontCategories(
              sortProductStorefrontCategoriesByOrder(
                productsSnap.docs.map((d) => normalizeProductStorefrontCategory(d.data(), d.id))
              )
            )
          );
          sourcesUpdate.products = 'firebase';
        } else {
          const rpRes = await fetch(`${import.meta.env.BASE_URL}data/recommendedproducts.json`);
          const rpJson = await rpRes.json();
          setProductCategories(
            reindexProductStorefrontCategories(
              (Array.isArray(rpJson) ? rpJson : []).map((item: any, i: number) => ({
                ...normalizeProductStorefrontCategory(item, `temp-product-${i}`),
                isLocal: true,
              }))
            )
          );
          sourcesUpdate.products = 'local';
        }
      }
    } catch (productErr) {
      console.warn('Could not fetch product categories:', productErr);
      try {
        const rpRes = await fetch(`${import.meta.env.BASE_URL}data/recommendedproducts.json`);
        const rpJson = await rpRes.json();
        setProductCategories(
          reindexProductStorefrontCategories(
            (Array.isArray(rpJson) ? rpJson : []).map((item: any, i: number) => ({
              ...normalizeProductStorefrontCategory(item, `temp-product-${i}`),
              isLocal: true,
            }))
          )
        );
      } catch {
        setProductCategories([]);
      }
      sourcesUpdate.products = 'local';
    }

    // Marketing display text (sitecopy/en)
    try {
      if (preferredSource === 'local') {
        sourcesUpdate.sitecopy = 'local';
      } else {
        const sitecopySnap = await getDoc(doc(db, 'sitecopy', 'en'));
        if (sitecopySnap.exists()) {
          const raw: Record<string, unknown> = { ...(sitecopySnap.data() as Record<string, unknown>) };
          delete raw.updatedAt;
          delete raw.createdAt;
          sourcesUpdate.sitecopy = isValidMarketingSiteCopyPayload(raw) ? 'firebase' : 'local';
        } else {
          sourcesUpdate.sitecopy = 'local';
        }
      }
    } catch {
      sourcesUpdate.sitecopy = 'local';
    }

    setDataSources(sourcesUpdate);
    setLoading(false);
  };

  const refreshCloudReadability = async () => {
    const [reviewsRes, faqRes, servicesRes, videolinksRes, galleryRes, artistsRes, productsRes, settingsRes, sitecopyRes] =
      await Promise.allSettled([
        getDocs(collection(db, 'reviews')),
        getDocs(collection(db, 'faq')),
        getDocs(collection(db, 'services')),
        getDoc(doc(db, 'videolinks', 'home')),
        getDoc(doc(db, 'gallery', 'home')),
        getDocs(collection(db, 'artistprofiles')),
        getDocs(collection(db, 'productcategories')),
        getDoc(doc(db, 'settings', 'general')),
        getDoc(doc(db, 'sitecopy', 'en')),
      ]);
    // Gallery/home is optional until Firestore rules exist; do not fail whole "cloud connected" UI.
    const connected =
      reviewsRes.status === 'fulfilled' &&
      faqRes.status === 'fulfilled' &&
      servicesRes.status === 'fulfilled' &&
      videolinksRes.status === 'fulfilled' &&
      artistsRes.status === 'fulfilled' &&
      productsRes.status === 'fulfilled' &&
      settingsRes.status === 'fulfilled';
    setFirebaseConnected(connected);
    setCloudReadable({
      reviews: reviewsRes.status === 'fulfilled',
      faq: faqRes.status === 'fulfilled',
      services: servicesRes.status === 'fulfilled',
      videolinks: videolinksRes.status === 'fulfilled',
      gallery: galleryRes.status === 'fulfilled',
      artistprofiles: artistsRes.status === 'fulfilled',
      products: productsRes.status === 'fulfilled',
      sitecopy: sitecopyRes.status === 'fulfilled',
    });
  };

  const handleContentDataSourceToggle = async (mode: ContentDataSourceMode) => {
    if (mode === 'firebase' && !firebaseConnected) {
      alert('Cloud is not connected. Source stays on local.');
      return;
    }
    setContentDataSourceMode(mode);
    setContentDataSourceModeState(mode);
    await fetchData();
  };

  useEffect(() => {
    if (!firebaseConnected && contentDataSourceModeState !== 'local') {
      setContentDataSourceMode('local');
      setContentDataSourceModeState('local');
      void fetchData();
    }
  }, [firebaseConnected, contentDataSourceModeState]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // Keep UX deterministic even if sign-out fails transiently.
    }
    navigate('/artist-login', { replace: true });
  };

  // Review Actions
  const addReview = async () => {
    if (!newReview.trim() || !validateReviewBody(newReview)) return;
    setSaving(true);
    try {
      const docRef = await addDoc(collection(db, 'reviews'), {
        text: newReview,
        createdAt: new Date().toISOString()
      });
      setReviews([...reviews, { id: docRef.id, text: newReview }]);
      setNewReview('');
    } catch (err) {
      handleFirestoreError(err, 'create', 'reviews');
    } finally {
      setSaving(false);
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'reviews', id));
      setReviews(reviews.filter(r => r.id !== id));
    } catch (err) {
      handleFirestoreError(err, 'delete', `reviews/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const startEditReview = (review: any) => {
    setEditingReviewId(review.id);
    setEditingReviewText(review.text || '');
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setEditingReviewText('');
  };

  const applyReviewEdit = async (id: string) => {
    if (!editingReviewText.trim() || !validateReviewBody(editingReviewText)) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'reviews', id), {
        text: editingReviewText.trim()
      });
      setReviews(reviews.map(r => (r.id === id ? { ...r, text: editingReviewText.trim() } : r)));
      cancelEditReview();
    } catch (err) {
      handleFirestoreError(err, 'update', `reviews/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const canPushReviewsToDatabase = useMemo(
    () =>
      reviews.length > 0 &&
      reviews.every((r: any) => validateReviewBody(String(r.text ?? ''))) &&
      reviews.some((r: any) => String(r.text ?? '').trim() !== ''),
    [reviews]
  );

  const loadDefaultReviews = async () => {
    if (!confirm('Load reviews from local public/data/reviews.json into this admin view?')) return;
    setSaving(true);
    try {
      const reviewsRes = await fetch(`${import.meta.env.BASE_URL}data/reviews.json`);
      const reviewsJson: string[] = await reviewsRes.json();
      cancelEditReview();
      setReviews(reviewsJson.map((text, i) => ({ id: `temp-${i}`, text, isLocal: true })));
      setDataSources((prev) => ({ ...prev, reviews: 'local' }));
      alert('Reviews loaded from local defaults. Push to Cloud to publish.');
    } catch (err) {
      handleFirestoreError(err, 'get', 'data/reviews.json');
    } finally {
      setSaving(false);
    }
  };

  const loadReviewsFromCloud = async () => {
    if (!firebaseConnected) {
      alert('Cloud is not connected.');
      return;
    }
    setSaving(true);
    try {
      const reviewsSnap = await getDocs(collection(db, 'reviews'));
      setReviews(reviewsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setDataSources((prev) => ({ ...prev, reviews: 'firebase' }));
      alert('Reviews loaded from cloud.');
    } catch (err) {
      setCloudReadable((prev) => ({ ...prev, reviews: false }));
      handleFirestoreError(err, 'get', 'reviews');
    } finally {
      setSaving(false);
    }
  };

  const pushReviewsToDatabase = async () => {
    if (!firebaseConnected) {
      alert('Cloud is not connected.');
      return;
    }
    if (!canPushReviewsToDatabase) {
      alert('Fix invalid review text (each testimonial must be 1–8000 characters) before pushing.');
      return;
    }
    if (
      !confirm(
        `Push ${reviews.length} review${reviews.length === 1 ? '' : 's'} to cloud? Existing documents are updated by id; new entries (from local-only rows) are added. Reviews only in cloud and not in this list are left unchanged.`
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      for (const r of reviews) {
        const text = String(r.text ?? '').trim();
        const id = String(r.id ?? '');
        if (id.startsWith('temp-') || id.startsWith('err-')) {
          await addDoc(collection(db, 'reviews'), {
            text,
            createdAt: r.createdAt || new Date().toISOString(),
          });
        } else {
          await updateDoc(doc(db, 'reviews', r.id), { text });
        }
      }

      cancelEditReview();
      const snap = await getDocs(collection(db, 'reviews'));
      setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setDataSources((prev) => ({ ...prev, reviews: 'firebase' }));

      alert('Reviews pushed to cloud successfully.');
    } catch (err) {
      alert('Push to cloud failed for Reviews.');
      handleFirestoreError(err, 'write', 'reviews/push');
    } finally {
      setSaving(false);
    }
  };

  // FAQ Actions - simplified for the sake of the dashboard
  const updateFaqCategory = async (cat: any) => {
    const itemsOk = (cat.items || []).every(
      (item: any) => validateFaqItemQuestion(item.q || '') && validateFaqItemAnswer(item.a || '')
    );
    if (!itemsOk) {
      alert('Please fix invalid questions or answers (each needs text within length limits).');
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'faq', cat.id), {
        items: cat.items,
        category: cat.category
      });
      setFaq(faq.map(f => f.id === cat.id ? cat : f));
      setEditingCategory(null);
    } catch (err) {
      handleFirestoreError(err, 'update', `faq/${cat.id}`);
    } finally {
      setSaving(false);
    }
  };

  const addFaqCategory = async () => {
    const viewableText = newFaqViewableText.trim();
    if (!viewableText) return;
    if (!validateFaqViewableText(viewableText)) return;
    setSaving(true);
    try {
      const nextOrder = faq.length > 0
        ? Math.max(...faq.map((f: any) => (typeof f.order === 'number' ? f.order : 0))) + 1
        : 0;

      const docRef = await addDoc(collection(db, 'faq'), {
        category: viewableText,
        items: [],
        order: nextOrder
      });

      setFaq([...faq, { id: docRef.id, category: viewableText, items: [], order: nextOrder }]);
      setNewFaqViewableText('');
    } catch (err) {
      handleFirestoreError(err, 'create', 'faq');
    } finally {
      setSaving(false);
    }
  };

  const faqSorted = useMemo(
    () =>
      [...faq].sort((a: any, b: any) => {
        const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
        const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
        return ao - bo;
      }),
    [faq]
  );

  const canPushFaqToDatabase = useMemo(
    () =>
      faq.length > 0 &&
      faq.every(
        (c: any) =>
          String(c.category ?? '').trim() !== '' &&
          Array.isArray(c.items) &&
          c.items.every(
            (item: any) => validateFaqItemQuestion(item?.q ?? '') && validateFaqItemAnswer(item?.a ?? '')
          )
      ),
    [faq]
  );

  const moveFaqCategory = async (index: number, direction: 'up' | 'down') => {
    const j = direction === 'up' ? index - 1 : index + 1;
    if (j < 0 || j >= faqSorted.length) return;
    const a = faqSorted[index];
    const b = faqSorted[j];
    const orderA = typeof a.order === 'number' ? a.order : index;
    const orderB = typeof b.order === 'number' ? b.order : j;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'faq', a.id), { order: orderB });
      await updateDoc(doc(db, 'faq', b.id), { order: orderA });
      setFaq(
        faq.map((f) => {
          if (f.id === a.id) return { ...f, order: orderB };
          if (f.id === b.id) return { ...f, order: orderA };
          return f;
        })
      );
    } catch (err) {
      handleFirestoreError(err, 'update', 'faq/reorder');
    } finally {
      setSaving(false);
    }
  };

  const deleteFaqCategory = async (id: string, categoryName: string) => {
    if (!confirm(`Delete the entire "${categoryName}" category? This will remove all questions in it.`)) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'faq', id));
      setFaq(faq.filter(f => f.id !== id));
      if (editingCategory?.id === id) {
        setEditingCategory(null);
      }
    } catch (err) {
      handleFirestoreError(err, 'delete', `faq/${id}`);
    } finally {
      setSaving(false);
    }
  };

  // Inquiry Actions
  const deleteInquiry = async (id: string) => {
    if (!confirm('Move this inquiry to trash?')) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'inquiries', id),
        { deleted: true, read: true, deletedAt: new Date().toISOString() },
        { merge: true }
      );
      setInquiries(inquiries.map((i: any) => (i.id === id ? { ...i, deleted: true, read: true } : i)));
    } catch (err) {
      handleFirestoreError(err as any, 'update', `inquiries/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const restoreInquiryFromTrash = async (id: string) => {
    if (!confirm('Restore this inquiry to inbox?')) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'inquiries', id), { deleted: false }, { merge: true });
      setInquiries(inquiries.map((i: any) => (i.id === id ? { ...i, deleted: false } : i)));
    } catch (err) {
      handleFirestoreError(err as any, 'update', `inquiries/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const permanentlyDeleteInquiry = async (id: string) => {
    if (!confirm('Permanently delete this inquiry from trash? This cannot be undone.')) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'inquiries', id));
      setInquiries(inquiries.filter((i: any) => i.id !== id));
      if (selectedInquiryId === id) setSelectedInquiryId(null);
    } catch (err) {
      handleFirestoreError(err as any, 'delete', `inquiries/${id}`);
    } finally {
      setSaving(false);
    }
  };

  const markInquiryAsRead = async (id: string) => {
    const target = inquiries.find((i: any) => i.id === id);
    if (!target || target.read === true || target.deleted === true) return;
    try {
      await setDoc(doc(db, 'inquiries', id), { read: true, readAt: new Date().toISOString() }, { merge: true });
      setInquiries(inquiries.map((i: any) => (i.id === id ? { ...i, read: true } : i)));
    } catch (err) {
      handleFirestoreError(err as any, 'update', `inquiries/${id}`);
    }
  };

  const emptyInquiryTrash = async () => {
    const trashIds = trashInquiries.map((inq: any) => inq.id);
    if (trashIds.length === 0) {
      alert('Trash is already empty.');
      return;
    }
    if (!confirm(`Permanently delete all ${trashIds.length} trashed inquiries? This cannot be undone.`)) return;
    setSaving(true);
    try {
      for (const id of trashIds) {
        await deleteDoc(doc(db, 'inquiries', id));
      }
      setInquiries(inquiries.filter((inq: any) => inq.deleted !== true));
      setSelectedInquiryId(null);
    } catch (err) {
      handleFirestoreError(err as any, 'delete', 'inquiries/trash');
    } finally {
      setSaving(false);
    }
  };

  const persistVideoLinks = async (nextVideoLinks: VideoLinkItem[]) => {
    const items: VideoLinkItem[] = nextVideoLinks.map((v) => {
      const url = String(v.url ?? '').trim();
      const label = String(v.label ?? '').trim();
      return { id: v.id, url, ...(label ? { label } : {}) };
    });
    await setDoc(doc(db, 'videolinks', 'home'), {
      items,
      updatedAt: new Date().toISOString(),
    });
    setVideoLinks(items);
    setDataSources((prev) => ({ ...prev, videolinks: 'firebase' }));
  };

  const persistGalleryHome = async (next: GalleryHomeData) => {
    const normalized = normalizeGalleryHomeData(next);
    await setDoc(doc(db, 'gallery', 'home'), {
      ...normalized,
      updatedAt: new Date().toISOString(),
    });
    setGalleryHome(normalized);
    setDataSources((prev) => ({ ...prev, gallery: 'firebase' }));
    emitGalleryHomeUpdated();
  };

  const addVideoLinkRow = async () => {
    const url = newVideoUrl.trim();
    if (!isValidYoutubeVideoUrl(url)) {
      alert('Enter a valid YouTube watch URL (or an 11-character video ID).');
      return;
    }
    if (!validateVideoLinkLabel(newVideoLabel)) {
      alert('Label must be at most 200 characters.');
      return;
    }
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `temp-vl-${Date.now()}`;
    const label = newVideoLabel.trim();
    const nextVideoLinks = [...videoLinks, { id, url, ...(label ? { label } : {}) }];
    setSaving(true);
    try {
      await persistVideoLinks(nextVideoLinks);
      setNewVideoUrl('');
      setNewVideoLabel('');
    } catch (err) {
      alert('Push to cloud failed for Video Links.');
      handleFirestoreError(err as any, 'write', 'videolinks/home');
    } finally {
      setSaving(false);
    }
  };

  const deleteVideoLinkRow = async (id: string) => {
    if (!confirm('Remove this video link from the list?')) return;
    const delIdx = videoLinks.findIndex((v) => v.id === id);
    const nextVideoLinks = videoLinks.filter((v) => v.id !== id);
    setSaving(true);
    try {
      await persistVideoLinks(nextVideoLinks);
      setVideoPreviewLightboxIndex((cur) => {
        if (cur === null || delIdx < 0) return null;
        if (cur === delIdx) return null;
        if (cur > delIdx) return cur - 1;
        return cur;
      });
      if (editingVideoLinkId === id) {
        setEditingVideoLinkId(null);
        setDraftVideoUrl('');
        setDraftVideoLabel('');
      }
    } catch (err) {
      handleFirestoreError(err as any, 'write', 'videolinks/home');
    } finally {
      setSaving(false);
    }
  };

  const startEditVideoLink = (v: VideoLinkItem) => {
    setEditingVideoLinkId(v.id);
    setDraftVideoUrl(v.url);
    setDraftVideoLabel(v.label ?? '');
  };

  const cancelEditVideoLink = () => {
    setEditingVideoLinkId(null);
    setDraftVideoUrl('');
    setDraftVideoLabel('');
  };

  const saveEditVideoLink = async () => {
    if (!editingVideoLinkId) return;
    const url = draftVideoUrl.trim();
    if (!isValidYoutubeVideoUrl(url)) {
      alert('Enter a valid YouTube URL.');
      return;
    }
    if (!validateVideoLinkLabel(draftVideoLabel)) {
      alert('Label must be at most 200 characters.');
      return;
    }
    const label = draftVideoLabel.trim();
    const nextVideoLinks = videoLinks.map((v) =>
      v.id === editingVideoLinkId ? { id: v.id, url, ...(label ? { label } : {}) } : v
    );
    setSaving(true);
    try {
      await persistVideoLinks(nextVideoLinks);
      cancelEditVideoLink();
    } catch (err) {
      handleFirestoreError(err as any, 'write', 'videolinks/home');
    } finally {
      setSaving(false);
    }
  };

  const loadDefaultVideoLinks = async () => {
    if (!confirm('Load video links from public/data/videolinks.json into this admin view?')) return;
    setSaving(true);
    try {
      const vlRes = await fetch(`${import.meta.env.BASE_URL}data/videolinks.json`);
      const vlJson = await vlRes.json();
      const items = normalizeVideoLinkItems(vlJson.items ?? []);
      setVideoLinks(items);
      setDataSources((prev) => ({ ...prev, videolinks: 'local' }));
      cancelEditVideoLink();
      setVideoPreviewLightboxIndex(null);
      setNewVideoUrl('');
      setNewVideoLabel('');
      alert('Video links loaded from local defaults. Push to Cloud to publish.');
    } catch (err) {
      handleFirestoreError(err as any, 'get', 'data/videolinks.json');
    } finally {
      setSaving(false);
    }
  };

  const loadVideoLinksFromCloud = async () => {
    if (!firebaseConnected) {
      alert('Cloud is not connected.');
      return;
    }
    setSaving(true);
    try {
      const vlSnap = await getDoc(doc(db, 'videolinks', 'home'));
      const items = vlSnap.exists() ? normalizeVideoLinkItems(vlSnap.data().items ?? []) : [];
      setVideoLinks(items);
      setDataSources((prev) => ({ ...prev, videolinks: 'firebase' }));
      cancelEditVideoLink();
      setVideoPreviewLightboxIndex(null);
      setNewVideoUrl('');
      setNewVideoLabel('');
      alert('Video links loaded from cloud.');
    } catch (err) {
      setCloudReadable((prev) => ({ ...prev, videolinks: false }));
      handleFirestoreError(err as any, 'get', 'videolinks/home');
    } finally {
      setSaving(false);
    }
  };

  const pushVideoLinksToDatabase = async () => {
    if (!firebaseConnected) {
      alert('Cloud is not connected.');
      return;
    }
    if (!canPushVideoLinksToDatabase) {
      alert('Add at least one valid YouTube URL and fix any invalid rows before pushing.');
      return;
    }
    if (
      !confirm(
        `Save ${videoLinks.length} video link(s) to cloud document videolinks/home? This overwrites the stored list.`
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const items: VideoLinkItem[] = videoLinks.map((v) => {
        const url = String(v.url ?? '').trim();
        const label = String(v.label ?? '').trim();
        return { id: v.id, url, ...(label ? { label } : {}) };
      });
      await persistVideoLinks(items);
      cancelEditVideoLink();
      setVideoPreviewLightboxIndex(null);
      alert('Video links pushed to cloud successfully.');
    } catch (err) {
      handleFirestoreError(err as any, 'write', 'videolinks/home');
    } finally {
      setSaving(false);
    }
  };

  const moveGalleryTile = (index: number, dir: 'up' | 'down') => {
    setGalleryHome((prev) => {
      const arr = [...prev.images];
      const j = dir === 'up' ? index - 1 : index + 1;
      if (j < 0 || j >= arr.length) return prev;
      const next = [...arr];
      const tmp = next[index];
      next[index] = next[j];
      next[j] = tmp;
      return { ...prev, images: next.map((img, i) => ({ ...img, order: i })) };
    });
  };

  const toggleGalleryTileEnabled = (index: number) => {
    setGalleryHome((prev) => ({
      ...prev,
      images: prev.images.map((img, i) =>
        i === index ? { ...img, enabled: img.enabled === false ? true : false } : img
      ),
    }));
  };

  const deleteGalleryTileAt = (index: number) => {
    if (!confirm('Remove this portfolio image?')) return;
    if (galleryHome.images.length <= 1) {
      alert('Keep at least one portfolio image.');
      return;
    }
    setGalleryHome((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index).map((img, i) => ({ ...img, order: i })),
    }));
  };

  const closeGalleryTileModal = () => {
    setShowGalleryTileModal(false);
    setEditingGalleryIndex(null);
  };

  const openGalleryAddModal = () => {
    setEditingGalleryIndex(null);
    setGalleryFormDraft({ src: '/portfolio-1.jpeg', label: '', order: 0, enabled: true });
    setShowGalleryTileModal(true);
  };

  const openGalleryEditModal = (index: number) => {
    const row = galleryHome.images[index];
    if (!row) return;
    setEditingGalleryIndex(index);
    setGalleryFormDraft({
      src: row.src,
      label: row.label ?? '',
      order: row.order,
      enabled: row.enabled !== false,
    });
    setShowGalleryTileModal(true);
  };

  const saveGalleryTileModal = () => {
    const src = galleryFormDraft.src.trim();
    if (!src) {
      alert('Each portfolio tile needs an image URL or path.');
      return;
    }
    if (src.includes('://') && !isValidHttpUrl(src)) {
      alert('Invalid image URL in gallery.');
      return;
    }
    const idx = editingGalleryIndex;
    const preservedEnabled =
      idx !== null && galleryHome.images[idx] ? galleryHome.images[idx].enabled !== false : true;
    const preservedOrder =
      idx !== null && galleryHome.images[idx] != null
        ? galleryHome.images[idx].order
        : galleryHome.images.length;
    const item: GalleryTileItem = {
      src,
      label: galleryFormDraft.label.trim(),
      order: preservedOrder,
      enabled: preservedEnabled,
    };
    setGalleryHome((prev) => {
      if (idx === null) {
        const appended = [...prev.images, item];
        return { images: appended.map((img, i) => ({ ...img, order: i })) };
      }
      const next = [...prev.images];
      if (idx < 0 || idx >= next.length) return prev;
      next[idx] = item;
      return { images: next.map((img, i) => ({ ...img, order: i })) };
    });
    closeGalleryTileModal();
  };

  const loadDefaultGalleryHome = async () => {
    if (!confirm('Load gallery from public/data/gallery.json into this admin view?')) return;
    setSaving(true);
    try {
      const gRes = await fetch(`${import.meta.env.BASE_URL}data/gallery.json`);
      const gJson = await gRes.json();
      setGalleryHome(normalizeGalleryHomeData(gJson));
      setDataSources((prev) => ({ ...prev, gallery: 'local' }));
      alert('Gallery loaded from local defaults. Push to Cloud to publish.');
    } catch (err) {
      handleFirestoreError(err as any, 'get', 'data/gallery.json');
    } finally {
      setSaving(false);
    }
  };

  const loadGalleryFromCloud = async () => {
    if (!firebaseConnected) {
      alert('Cloud is not connected.');
      return;
    }
    setSaving(true);
    try {
      const gSnap = await getDoc(doc(db, 'gallery', 'home'));
      setGalleryHome(normalizeGalleryHomeData(gSnap.exists() ? gSnap.data() : {}));
      setDataSources((prev) => ({ ...prev, gallery: 'firebase' }));
      alert('Gallery loaded from cloud.');
    } catch (err) {
      setCloudReadable((prev) => ({ ...prev, gallery: false }));
      handleFirestoreError(err as any, 'get', 'gallery/home');
    } finally {
      setSaving(false);
    }
  };

  const pushGalleryHomeToDatabase = async () => {
    if (!firebaseConnected) {
      alert('Cloud is not connected.');
      return;
    }
    for (const row of galleryHome.images) {
      const t = row.src.trim();
      if (!t) {
        alert('Each portfolio tile needs an image URL or path.');
        return;
      }
      if (t.includes('://') && !isValidHttpUrl(t)) {
        alert('Invalid image URL in gallery.');
        return;
      }
    }
    if (!confirm('Save homepage gallery to cloud document gallery/home? This overwrites the stored config.')) return;
    setSaving(true);
    try {
      await persistGalleryHome(galleryHome);
      alert('Gallery pushed to cloud successfully.');
    } catch (err) {
      handleFirestoreError(err as any, 'write', 'gallery/home');
    } finally {
      setSaving(false);
    }
  };

  const updateArtistProfileField = (
    id: string,
    field: keyof Omit<ArtistProfile, 'id' | 'isLocal' | 'order'>,
    value: string
  ) => {
    setArtistProfiles((prev) =>
      prev.map((artist) => (artist.id === id ? { ...artist, [field]: value } : artist))
    );
  };

  const updateNewArtistProfileField = (
    field: keyof typeof emptyArtistProfileDraft,
    value: string
  ) => {
    setNewArtistProfile((prev) => ({ ...prev, [field]: value }));
  };

  const uploadArtistPhoto = async (file: File, target: string) => {
    const safeName = file.name.replace(/[^\w.-]/g, '_');
    const storageRef = ref(storage, `artistprofiles/${target}/${Date.now()}-${safeName}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const uploadPhotoForExistingArtist = async (artistId: string, file: File) => {
    setUploadingPhotoFor(artistId);
    setSaving(true);
    try {
      const photoUrl = await uploadArtistPhoto(file, artistId);
      setArtistProfiles((prev) =>
        prev.map((artist) =>
          artist.id === artistId ? { ...artist, profilePhotoLink: photoUrl } : artist
        )
      );
    } catch (err) {
      handleFirestoreError(err as any, 'write', `storage/artistprofiles/${artistId}`);
    } finally {
      setSaving(false);
      setUploadingPhotoFor(null);
    }
  };

  const uploadPhotoForNewArtist = async (file: File) => {
    setUploadingPhotoFor('new');
    setSaving(true);
    try {
      const targetId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `new-artist-${Date.now()}`;
      const photoUrl = await uploadArtistPhoto(file, targetId);
      setNewArtistProfile((prev) => ({ ...prev, profilePhotoLink: photoUrl }));
    } catch (err) {
      handleFirestoreError(err as any, 'write', 'storage/artistprofiles/new');
    } finally {
      setSaving(false);
      setUploadingPhotoFor(null);
    }
  };

  const addArtistProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        firstName: newArtistProfile.firstName.trim(),
        lastName: newArtistProfile.lastName.trim(),
        instagramHandle: newArtistProfile.instagramHandle.trim(),
        email: newArtistProfile.email.trim(),
        bookingWebsiteLink: newArtistProfile.bookingWebsiteLink.trim(),
        personalWebsiteLink: newArtistProfile.personalWebsiteLink.trim(),
        phoneNumber: newArtistProfile.phoneNumber.trim(),
        profilePhotoLink: newArtistProfile.profilePhotoLink.trim(),
        specialty: newArtistProfile.specialty.trim(),
        bio: newArtistProfile.bio.trim(),
        enabled: true,
        order: artistProfiles.length,
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'artistprofiles'), payload);
      setArtistProfiles((prev) => reindexArtistProfiles([...prev, normalizeArtistProfile(payload, docRef.id)]));
      setNewArtistProfile({ ...emptyArtistProfileDraft });
      setShowAddArtistModal(false);
      setDataSources((prev) => ({ ...prev, artistprofiles: 'firebase' }));
    } catch (err) {
      handleFirestoreError(err as any, 'create', 'artistprofiles');
    } finally {
      setSaving(false);
    }
  };

  const deleteArtistProfile = async (artistId: string) => {
    if (!confirm('Delete this artist profile?')) return;
    setSaving(true);
    try {
      if (!artistId.startsWith('temp-') && !artistId.startsWith('err-')) {
        await deleteDoc(doc(db, 'artistprofiles', artistId));
      }
      setArtistProfiles((prev) => reindexArtistProfiles(prev.filter((artist) => artist.id !== artistId)));
      if (editingArtistProfileId === artistId) setEditingArtistProfileId(null);
    } catch (err) {
      handleFirestoreError(err as any, 'delete', `artistprofiles/${artistId}`);
    } finally {
      setSaving(false);
    }
  };

  const moveArtistProfile = (artistId: string, direction: 'up' | 'down') => {
    setArtistProfiles((prev) => {
      const currentIndex = prev.findIndex((artist) => artist.id === artistId);
      if (currentIndex < 0) return prev;
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, moved);
      return reindexArtistProfiles(next);
    });
  };

  const toggleArtistProfileEnabled = (artistId: string) => {
    setArtistProfiles((prev) =>
      prev.map((artist) =>
        artist.id === artistId ? { ...artist, enabled: artist.enabled === false ? true : false } : artist
      )
    );
  };

  const loadDefaultArtistProfiles = async () => {
    if (!confirm('Load artist profiles from local public/data/artistprofiles.json into this admin view?')) return;
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/artistprofiles.json`);
      const json = await res.json();
      setArtistProfiles(
        reindexArtistProfiles(
          (Array.isArray(json) ? json : []).map((item: any, i: number) => ({
            ...normalizeArtistProfile(item, `temp-artist-${i}`),
            isLocal: true,
          }))
        )
      );
      setDataSources((prev) => ({ ...prev, artistprofiles: 'local' }));
      alert('Artist profiles loaded from local defaults. Push to Cloud to publish.');
    } catch (err) {
      handleFirestoreError(err as any, 'get', 'data/artistprofiles.json');
    } finally {
      setSaving(false);
    }
  };

  const loadArtistProfilesFromCloud = async () => {
    if (!firebaseConnected) {
      alert('Cloud is not connected.');
      return;
    }
    setSaving(true);
    try {
      const refreshed = await getDocs(collection(db, 'artistprofiles'));
      setArtistProfiles(
        reindexArtistProfiles(
          sortArtistProfilesByOrder(refreshed.docs.map((d) => normalizeArtistProfile(d.data(), d.id)))
        )
      );
      setDataSources((prev) => ({ ...prev, artistprofiles: 'firebase' }));
      alert('Artist profiles loaded from cloud.');
    } catch (err) {
      setCloudReadable((prev) => ({ ...prev, artistprofiles: false }));
      handleFirestoreError(err as any, 'get', 'artistprofiles');
    } finally {
      setSaving(false);
    }
  };

  const pushArtistProfilesToDatabase = async () => {
    if (!firebaseConnected) {
      alert('Cloud is not connected.');
      return;
    }
    if (!canPushArtistProfilesToDatabase) {
      alert('Add at least one artist profile before pushing.');
      return;
    }
    if (
      !confirm(
        `Push ${artistProfiles.length} artist profile(s) to cloud? Existing docs are updated by id; local-only rows are added as new docs.`
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      for (const [index, artist] of artistProfiles.entries()) {
        const payload = {
          firstName: artist.firstName.trim(),
          lastName: artist.lastName.trim(),
          instagramHandle: artist.instagramHandle.trim(),
          email: artist.email.trim(),
          bookingWebsiteLink: artist.bookingWebsiteLink.trim(),
          personalWebsiteLink: artist.personalWebsiteLink.trim(),
          phoneNumber: artist.phoneNumber.trim(),
          profilePhotoLink: artist.profilePhotoLink.trim(),
          specialty: artist.specialty.trim(),
          bio: artist.bio.trim(),
          enabled: artist.enabled !== false,
          order: index,
        };
        if (artist.id.startsWith('temp-') || artist.id.startsWith('err-')) {
          await addDoc(collection(db, 'artistprofiles'), payload);
        } else {
          await setDoc(doc(db, 'artistprofiles', artist.id), payload, { merge: true });
        }
      }
      const refreshed = await getDocs(collection(db, 'artistprofiles'));
      setArtistProfiles(
        reindexArtistProfiles(
          sortArtistProfilesByOrder(refreshed.docs.map((d) => normalizeArtistProfile(d.data(), d.id)))
        )
      );
      setDataSources((prev) => ({ ...prev, artistprofiles: 'firebase' }));
      alert('Artist profiles pushed to cloud successfully.');
    } catch (err) {
      alert('Push to cloud failed for Artist Profiles.');
      handleFirestoreError(err as any, 'write', 'artistprofiles/push');
    } finally {
      setSaving(false);
    }
  };

  const updateProductCategoryField = (
    id: string,
    field: keyof Omit<ProductStorefrontCategory, 'id' | 'isLocal' | 'order'>,
    value: string | number
  ) => {
    setProductCategories((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const updateNewProductCategoryField = (
    field: keyof typeof emptyNewProductCategoryDraft,
    value: string | number
  ) => {
    setNewProductCategory((prev) => ({ ...prev, [field]: value }));
  };

  const uploadProductCategoryPhoto = async (file: File, target: string) => {
    const safeName = file.name.replace(/[^\w.-]/g, '_');
    const storageRef = ref(storage, `productcategories/${target}/${Date.now()}-${safeName}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const uploadPhotoForExistingProductCategory = async (categoryId: string, file: File) => {
    setUploadingProductPhotoFor(categoryId);
    setSaving(true);
    try {
      const photoUrl = await uploadProductCategoryPhoto(file, categoryId);
      setProductCategories((prev) =>
        prev.map((row) => (row.id === categoryId ? { ...row, image: photoUrl } : row))
      );
    } catch (err) {
      handleFirestoreError(err as any, 'write', `storage/productcategories/${categoryId}`);
    } finally {
      setSaving(false);
      setUploadingProductPhotoFor(null);
    }
  };

  const uploadPhotoForNewProductCategory = async (file: File) => {
    setUploadingProductPhotoFor('new');
    setSaving(true);
    try {
      const targetId =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `new-product-${Date.now()}`;
      const photoUrl = await uploadProductCategoryPhoto(file, targetId);
      setNewProductCategory((prev) => ({ ...prev, image: photoUrl }));
    } catch (err) {
      handleFirestoreError(err as any, 'write', 'storage/productcategories/new');
    } finally {
      setSaving(false);
      setUploadingProductPhotoFor(null);
    }
  };

  const addProductCategory = async () => {
    const title = newProductCategory.title.trim();
    const slug =
      newProductCategory.slug.trim() || slugifyStorefrontTitle(title || `item-${Date.now()}`);
    setSaving(true);
    try {
      const payload = {
        slug,
        title,
        count: Number.isFinite(newProductCategory.count) ? newProductCategory.count : 0,
        image: newProductCategory.image.trim(),
        link: newProductCategory.link.trim(),
        enabled: true,
        order: productCategories.length,
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, 'productcategories'), payload);
      setProductCategories((prev) =>
        reindexProductStorefrontCategories([
          ...prev,
          normalizeProductStorefrontCategory(payload, docRef.id),
        ])
      );
      setNewProductCategory({ ...emptyNewProductCategoryDraft });
      setShowAddProductModal(false);
      setDataSources((prev) => ({ ...prev, products: 'firebase' }));
    } catch (err) {
      handleFirestoreError(err as any, 'create', 'productcategories');
    } finally {
      setSaving(false);
    }
  };

  const deleteProductCategory = async (categoryId: string) => {
    if (!confirm('Delete this storefront list?')) return;
    setSaving(true);
    try {
      if (!categoryId.startsWith('temp-') && !categoryId.startsWith('err-')) {
        await deleteDoc(doc(db, 'productcategories', categoryId));
      }
      setProductCategories((prev) => reindexProductStorefrontCategories(prev.filter((p) => p.id !== categoryId)));
      if (editingProductCategoryId === categoryId) setEditingProductCategoryId(null);
    } catch (err) {
      handleFirestoreError(err as any, 'delete', `productcategories/${categoryId}`);
    } finally {
      setSaving(false);
    }
  };

  const moveProductCategory = (categoryId: string, direction: 'up' | 'down') => {
    setProductCategories((prev) => {
      const currentIndex = prev.findIndex((p) => p.id === categoryId);
      if (currentIndex < 0) return prev;
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, moved);
      return reindexProductStorefrontCategories(next);
    });
  };

  const toggleProductCategoryEnabled = (categoryId: string) => {
    setProductCategories((prev) =>
      prev.map((row) =>
        row.id === categoryId ? { ...row, enabled: row.enabled === false ? true : false } : row
      )
    );
  };

  const loadDefaultProducts = async () => {
    if (!confirm('Load storefront lists from local public/data/recommendedproducts.json into this admin view?'))
      return;
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/recommendedproducts.json`);
      const json = await res.json();
      setProductCategories(
        reindexProductStorefrontCategories(
          (Array.isArray(json) ? json : []).map((item: any, i: number) => ({
            ...normalizeProductStorefrontCategory(item, `temp-product-${i}`),
            isLocal: true,
          }))
        )
      );
      setDataSources((prev) => ({ ...prev, products: 'local' }));
      alert('Product lists loaded from local defaults. Push to Cloud to publish.');
    } catch (err) {
      handleFirestoreError(err as any, 'get', 'data/recommendedproducts.json');
    } finally {
      setSaving(false);
    }
  };

  const loadProductsFromCloud = async () => {
    if (!firebaseConnected) {
      alert('Cloud is not connected.');
      return;
    }
    setSaving(true);
    try {
      const refreshed = await getDocs(collection(db, 'productcategories'));
      setProductCategories(
        reindexProductStorefrontCategories(
          sortProductStorefrontCategoriesByOrder(
            refreshed.docs.map((d) => normalizeProductStorefrontCategory(d.data(), d.id))
          )
        )
      );
      setDataSources((prev) => ({ ...prev, products: 'firebase' }));
      alert('Storefront lists loaded from cloud.');
    } catch (err) {
      setCloudReadable((prev) => ({ ...prev, products: false }));
      handleFirestoreError(err as any, 'get', 'productcategories');
    } finally {
      setSaving(false);
    }
  };

  const pushProductsToCloud = async () => {
    if (!firebaseConnected) {
      alert('Cloud is not connected.');
      return;
    }
    if (!canPushProductCategoriesToDatabase) {
      alert('Add at least one storefront list before pushing.');
      return;
    }
    if (
      !confirm(
        `Push ${productCategories.length} storefront list(s) to cloud? Existing docs are updated by id; local-only rows are added as new docs.`
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      for (const [index, row] of productCategories.entries()) {
        const payload = {
          slug: row.slug.trim() || slugifyStorefrontTitle(row.title),
          title: row.title.trim(),
          count: typeof row.count === 'number' && Number.isFinite(row.count) ? row.count : 0,
          image: row.image.trim(),
          link: row.link.trim(),
          enabled: row.enabled !== false,
          order: index,
        };
        if (row.id.startsWith('temp-') || row.id.startsWith('err-')) {
          await addDoc(collection(db, 'productcategories'), payload);
        } else {
          await setDoc(doc(db, 'productcategories', row.id), payload, { merge: true });
        }
      }
      const refreshed = await getDocs(collection(db, 'productcategories'));
      setProductCategories(
        reindexProductStorefrontCategories(
          sortProductStorefrontCategoriesByOrder(
            refreshed.docs.map((d) => normalizeProductStorefrontCategory(d.data(), d.id))
          )
        )
      );
      setDataSources((prev) => ({ ...prev, products: 'firebase' }));
      alert('Storefront lists pushed to cloud successfully.');
    } catch (err) {
      alert('Push to cloud failed for storefront lists.');
      handleFirestoreError(err as any, 'write', 'productcategories/push');
    } finally {
      setSaving(false);
    }
  };

  // Settings Actions
  const saveSettings = async () => {
    if (!firebaseConnected) {
      alert('Cloud is not connected.');
      return;
    }
    if (!validateEmail(contactEmail)) {
      alert('Please enter a valid email address.');
      return;
    }
    if (!confirm('Push current General Settings to cloud?')) return;
    setSaving(true);
    setSettingsSavedNotice('');
    try {
      await setDoc(
        doc(db, 'settings', 'general'),
        {
          contactEmail,
          themeDefault,
          mediaStorageRoot: normalizeMediaStorageRoot(mediaStorageRoot),
          autoLogoutLeavingAdmin,
          showThemeSelector,
          showArtistsPage,
          showProductsPage,
          showReviewsSection,
          showPricingSection,
          roundPricesUpToWholeAmount,
          showVideoSection,
          showGallerySection,
          showFaqPage,
          showContactForm,
        },
        { merge: true }
      );
      emitAutoLogoutLeavingAdminChanged(autoLogoutLeavingAdmin);
      emitShowThemeSelectorChanged(showThemeSelector);
      emitShowArtistsPageChanged(showArtistsPage);
      emitShowProductsPageChanged(showProductsPage);
      emitShowReviewsSectionChanged(showReviewsSection);
      emitShowPricingSectionChanged(showPricingSection);
      emitRoundPricesUpToWholeAmountChanged(roundPricesUpToWholeAmount);
      emitShowVideoSectionChanged(showVideoSection);
      emitShowGallerySectionChanged(showGallerySection);
      emitShowFaqPageChanged(showFaqPage);
      setSavedSettingsSnapshot(currentSettingsSnapshot);
      setSettingsSavedNotice(`Saved to cloud at ${new Date().toLocaleTimeString()}`);
      alert('General settings pushed to cloud successfully.');
    } catch (err) {
      alert('Push to cloud failed for General Settings.');
      handleFirestoreError(err as any, 'update', 'settings/general');
    } finally {
      setSaving(false);
    }
  };

  const saveWidgets = async () => {
    if (!firebaseConnected) {
      alert('Cloud is not connected.');
      return;
    }
    if (!validateBookingWidgetCompany(bookingWidgetCompany)) {
      alert('Booking company ID must be 3-120 characters and use letters, numbers, underscore, or hyphen.');
      return;
    }
    if (!validatePaymentWidgetProductId(paymentWidgetProductId)) {
      alert('Payment product ID must be 2-120 characters and use letters, numbers, underscore, or hyphen.');
      return;
    }
    if (!validateBookingWidgetScriptSrc(bookingWidgetScriptSrc)) {
      alert('Booking widget script URL must be a valid .js URL.');
      return;
    }
    if (includeSocialSection && !validateTaggboxWidgetId(taggboxWidgetId)) {
      alert('Taggbox ID must be alphanumeric only.');
      return;
    }
    if (!confirm('Push current External Widget settings to cloud?')) return;

    setSaving(true);
    setSettingsSavedNotice('');
    try {
      await setDoc(
        doc(db, 'widgets', 'general'),
        {
          bookingProvider,
          bookingWidgetCompany: bookingWidgetCompany.trim(),
          bookingWidgetScriptSrc: bookingWidgetScriptSrc.trim(),
          showBookingWidget,
          paymentWidgetProvider,
          paymentWidgetProductId: paymentWidgetProductId.trim(),
          showPaymentWidget,
          taggboxWidgetId: taggboxWidgetId.trim(),
          showSocialWidget: includeSocialSection,
        },
        { merge: true }
      );
      setSavedWidgetsSnapshot(currentWidgetsSnapshot);
      setDataSources((prev) => ({ ...prev, widgets: 'firebase' }));
      setSettingsSavedNotice(`External widgets saved to cloud at ${new Date().toLocaleTimeString()}`);
      alert('External widgets pushed to cloud successfully.');
    } catch (err) {
      alert('Push to cloud failed for External Widgets.');
      handleFirestoreError(err as any, 'update', 'widgets/general');
    } finally {
      setSaving(false);
    }
  };

  // Services Actions
  const applyPriceIncrease = (rawInput: string) => {
    if (!services?.en) {
      setPercentageRaw(rawInput);
      return;
    }
    const trimmed = rawInput.trim();
    setPercentageRaw(rawInput);

    // Empty (or only minus) input means no pending global change.
    if (trimmed === '' || trimmed === '-') {
      setPercentageBaseServices(null);
      return;
    }

    if (!validatePercentageInput(rawInput) || !allServicePricesValid) return;
    const pct = parsePercentageInput(rawInput);
    if (pct === 0) {
      setPercentageBaseServices(null);
      return;
    }

    const base = percentageBaseServices ?? JSON.parse(JSON.stringify(services));
    if (!percentageBaseServices) {
      setPercentageBaseServices(base);
    }
    const updatedServices = applyGlobalPercentageToServicesData(base, pct, roundPricesUpToWholeAmount);
    setServices(updatedServices);
    setHasManualPriceChanges(true);
  };

  const pushPricingToCloud = async () => {
    if (!firebaseConnected) {
      alert('Cloud is not connected.');
      return;
    }
    if (!services?.en || !allServicePricesValid) {
      alert('Fix invalid prices before pushing.');
      return;
    }
    if (!confirm('Push current pricing values in this editor to cloud?')) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'services', 'en'), services.en);
      setHasManualPriceChanges(false);
      alert('Pricing pushed to cloud successfully.');
    } catch (err) {
      alert('Push to cloud failed for Pricing.');
      handleFirestoreError(err, 'update', 'services');
    } finally {
      setSaving(false);
    }
  };

  const loadDefaultPricing = async () => {
    if (!confirm('Load default pricing from local services.json into this admin view?')) return;
    setSaving(true);
    try {
      const servicesRes = await fetch(`${import.meta.env.BASE_URL}data/services.json`);
      const servicesJson = await servicesRes.json();
      const defaultServices = {
        en: { categories: servicesJson.en || [], lang: 'en' }
      };
      setServices(defaultServices);
      setPercentageBaseServices(null);
      setPercentageRaw('');
      setHasManualPriceChanges(false);
      setDataSources((prev) => ({ ...prev, services: 'local' }));
      alert('Default pricing loaded locally. Push to Cloud to publish.');
    } catch (err) {
      handleFirestoreError(err, 'get', 'data/services.json');
    } finally {
      setSaving(false);
    }
  };

  const loadPricingFromCloud = async () => {
    if (!firebaseConnected) {
      alert('Cloud is not connected.');
      return;
    }
    setSaving(true);
    try {
      const servicesSnap = await getDocs(collection(db, 'services'));
      const servicesData: any = {};
      servicesSnap.forEach((d) => {
        if (d.id === 'en') servicesData[d.id] = d.data();
      });
      if (!servicesData.en) {
        const enDoc = servicesSnap.docs.find((d) => d.id === 'en');
        if (enDoc) servicesData.en = enDoc.data();
      }
      setServices(servicesData.en ? servicesData : { en: { categories: [], lang: 'en' } });
      setPercentageBaseServices(null);
      setPercentageRaw('');
      setDataSources((prev) => ({ ...prev, services: 'firebase' }));
      setHasManualPriceChanges(false);
      alert('Pricing loaded from cloud.');
    } catch (err) {
      setCloudReadable((prev) => ({ ...prev, services: false }));
      handleFirestoreError(err, 'get', 'services');
    } finally {
      setSaving(false);
    }
  };

  const loadDefaultFaq = async () => {
    if (!confirm('Load FAQ from local public/data/faq.json into this admin view?')) return;
    setSaving(true);
    try {
      const faqRes = await fetch(`${import.meta.env.BASE_URL}data/faq.json`);
      const faqJson = await faqRes.json();
      setEditingCategory(null);
      setExpandedFaqCategoryId(null);
      const faqDocs = (Array.isArray(faqJson) ? faqJson : [])
        .map((d: any, i: number) => ({ id: `temp-${i}`, ...d, isLocal: true, order: i }))
        .sort((a: any, b: any) => {
          const aOrder = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
          const bOrder = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
          return aOrder - bOrder;
        });
      setFaq(faqDocs);
      setDataSources((prev) => ({ ...prev, faq: 'local' }));
      alert('FAQ loaded from local defaults. Push to Cloud to publish.');
    } catch (err) {
      handleFirestoreError(err, 'get', 'data/faq.json');
    } finally {
      setSaving(false);
    }
  };

  const loadFaqFromCloud = async () => {
    if (!firebaseConnected) {
      alert('Cloud is not connected.');
      return;
    }
    setSaving(true);
    try {
      const faqUnorderedSnap = await getDocs(collection(db, 'faq'));
      const faqDocs = faqUnorderedSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => {
          const aOrder = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
          const bOrder = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
          return aOrder - bOrder;
        });
      setFaq(faqDocs);
      setDataSources((prev) => ({ ...prev, faq: 'firebase' }));
      setEditingCategory(null);
      setExpandedFaqCategoryId(null);
      alert('FAQ loaded from cloud.');
    } catch (err) {
      setCloudReadable((prev) => ({ ...prev, faq: false }));
      handleFirestoreError(err, 'get', 'faq');
    } finally {
      setSaving(false);
    }
  };

  const pushFaqToDatabase = async () => {
    if (!firebaseConnected) {
      alert('Cloud is not connected.');
      return;
    }
    if (!canPushFaqToDatabase) {
      alert('Fix invalid FAQ rows before pushing.');
      return;
    }
    const sorted = [...faq].sort((a: any, b: any) => {
      const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
      const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
      return ao - bo;
    });
    const pushable = sorted.filter((c: any) => String(c.category ?? '').trim() !== '');
    if (pushable.length === 0) {
      alert('No FAQ categories to push.');
      return;
    }
    if (
      !confirm(
        `Push ${pushable.length} FAQ categor${pushable.length === 1 ? 'y' : 'ies'} to cloud using the data shown below? This updates each document; it does not remove categories that are only in cloud.`
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      let idx = 0;
      for (const cat of pushable) {
        const order = typeof cat.order === 'number' ? cat.order : idx;
        const payload: Record<string, unknown> = {
          category: cat.category,
          items: Array.isArray(cat.items) ? cat.items : [],
          order,
        };
        if (cat.databaseName) payload.databaseName = cat.databaseName;
        const id = String(cat.id ?? '');
        if (id.startsWith('temp-') || id.startsWith('err-') || id === '') {
          await addDoc(collection(db, 'faq'), payload);
        } else {
          await setDoc(doc(db, 'faq', id), payload);
        }
        idx++;
      }

      const faqUnorderedSnap = await getDocs(collection(db, 'faq'));
      const faqDocs = faqUnorderedSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => {
          const aOrder = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
          const bOrder = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
          return aOrder - bOrder;
        });
      setFaq(faqDocs);
      setDataSources((prev) => ({ ...prev, faq: 'firebase' }));

      alert('FAQ pushed to cloud successfully.');
    } catch (err) {
      alert('Push to cloud failed for FAQ.');
      handleFirestoreError(err, 'write', 'faq/push');
    } finally {
      setSaving(false);
    }
  };

  const updateServicePrice = (categoryIndex: number, itemIndex: number, price: string) => {
    if (!services?.en?.categories) return;
    // Hand edits become the new baseline after any global adjustment.
    setPercentageBaseServices(null);
    setPercentageRaw('');
    const updatedServices = JSON.parse(JSON.stringify(services));
    updatedServices.en.categories[categoryIndex].items[itemIndex].price = sanitizeServicePriceInput(price);
    setServices(updatedServices);
    setHasManualPriceChanges(true);
  };

  const closeAddServiceForm = () => {
    setAddServiceCategoryIndex(null);
    setNewServiceTitle('');
    setNewServiceDesc('');
    setNewServiceDuration('');
    setNewServicePrice('');
  };

  const toggleAddServicePanel = (categoryIndex: number) => {
    if (addServiceCategoryIndex === categoryIndex) {
      closeAddServiceForm();
    } else {
      setAddServiceCategoryIndex(categoryIndex);
      setNewServiceTitle('');
      setNewServiceDesc('');
      setNewServiceDuration('');
      setNewServicePrice('');
    }
  };

  const addServiceToCategory = (categoryIndex: number) => {
    if (!services?.en?.categories?.[categoryIndex]) return;
    const price = sanitizeServicePriceInput(newServicePrice);
    if (!newServiceFormValid) {
      alert('Please complete all fields: title, description, duration, and a valid price (e.g. €95 or €95.00).');
      return;
    }
    const updatedServices = JSON.parse(JSON.stringify(services));
    if (!updatedServices.en.categories[categoryIndex].items) {
      updatedServices.en.categories[categoryIndex].items = [];
    }
    updatedServices.en.categories[categoryIndex].items.push({
      title: newServiceTitle.trim(),
      desc: newServiceDesc.trim(),
      duration: newServiceDuration.trim(),
      price,
    });
    setServices(updatedServices);
    setHasManualPriceChanges(true);
    closeAddServiceForm();
  };

  const deleteServiceCategory = (categoryIndex: number) => {
    const cat = services?.en?.categories?.[categoryIndex];
    if (!cat) return;
    const n = cat.items?.length ?? 0;
    if (
      !confirm(
        `Delete the entire "${String(cat.category)}" category and all ${n} service${n === 1 ? '' : 's'} in it? This cannot be undone from this dialog.`
      )
    ) {
      return;
    }
    if (addServiceCategoryIndex === categoryIndex) {
      closeAddServiceForm();
    } else if (addServiceCategoryIndex !== null && addServiceCategoryIndex > categoryIndex) {
      setAddServiceCategoryIndex(addServiceCategoryIndex - 1);
    }
    const updatedServices = JSON.parse(JSON.stringify(services));
    updatedServices.en.categories.splice(categoryIndex, 1);
    setServices(updatedServices);
    setHasManualPriceChanges(true);
  };

  const deleteServiceItem = (categoryIndex: number, itemIndex: number) => {
    if (!services?.en?.categories?.[categoryIndex]?.items?.[itemIndex]) return;
    const item = services.en.categories[categoryIndex].items[itemIndex];
    const label = String(item?.title || 'this service').slice(0, 80);
    if (!confirm(`Remove "${label}" from this category?`)) return;
    const updatedServices = JSON.parse(JSON.stringify(services));
    updatedServices.en.categories[categoryIndex].items.splice(itemIndex, 1);
    setServices(updatedServices);
    setHasManualPriceChanges(true);
  };

  const addNewServiceCategory = () => {
    if (!services?.en?.categories) return;
    const name = newCategoryName.trim();
    if (!validateServiceCategoryName(name)) {
      alert('Enter a category name (1–120 characters).');
      return;
    }
    const lower = name.toLowerCase();
    const dup = services.en.categories.some(
      (c: any) => String(c.category || '').trim().toLowerCase() === lower
    );
    if (dup) {
      alert('A category with that name already exists.');
      return;
    }
    const updatedServices = JSON.parse(JSON.stringify(services));
    updatedServices.en.categories.push({ category: name, items: [] });
    setServices(updatedServices);
    setNewCategoryName('');
    setHasManualPriceChanges(true);
  };

  const downloadLiveDatabaseJsonZip = async () => {
    if (!confirm('Download a ZIP of all live cloud JSON data for local defaults?')) return;
    setSaving(true);
    try {
      const [reviewsSnap, faqSnap, servicesSnap, settingsSnap, videolinksSnap, gallerySnap, artistsSnap, productsSnap, bookingProvidersSnap, widgetsSnap] =
        await Promise.all([
          getDocs(collection(db, 'reviews')),
          getDocs(collection(db, 'faq')),
          getDoc(doc(db, 'services', 'en')),
          getDoc(doc(db, 'settings', 'general')),
          getDoc(doc(db, 'videolinks', 'home')),
          getDoc(doc(db, 'gallery', 'home')),
          getDocs(collection(db, 'artistprofiles')),
          getDocs(collection(db, 'productcategories')),
          getDoc(doc(db, 'bookingproviders', 'catalog')),
        getDoc(doc(db, 'widgets', 'general')),
        ]);

      const reviewsJson = reviewsSnap.docs
        .map((d) => String(d.data().text ?? '').trim())
        .filter((t) => t !== '');

      const faqJson = faqSnap.docs
        .map((d) => d.data() as any)
        .sort((a: any, b: any) => {
          const ao = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
          const bo = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
          return ao - bo;
        })
        .map((cat: any) => ({
          category: String(cat.category ?? ''),
          items: Array.isArray(cat.items) ? cat.items : [],
        }));

      const servicesJson = {
        en: ((servicesSnap.exists() ? servicesSnap.data().categories : services?.en?.categories) ?? []) as any[],
      };

      const settingsRaw = settingsSnap.exists() ? settingsSnap.data() : {};
      const settingsJson = {
        contactEmail: String(settingsRaw.contactEmail ?? contactEmail ?? 'theschneiderhair@gmail.com'),
        themeDefault: validateThemeDefault(settingsRaw.themeDefault) ? settingsRaw.themeDefault : themeDefault,
        mediaStorageRoot: normalizeMediaStorageRoot(settingsRaw.mediaStorageRoot ?? mediaStorageRoot),
        autoLogoutLeavingAdmin: parseAutoLogoutLeavingAdmin(settingsRaw.autoLogoutLeavingAdmin),
        showThemeSelector: parseShowThemeSelector(settingsRaw.showThemeSelector),
        showArtistsPage: parseShowArtistsPage(settingsRaw.showArtistsPage),
        showProductsPage: parseShowProductsPage(settingsRaw.showProductsPage),
        showReviewsSection: parseShowReviewsSection(settingsRaw.showReviewsSection),
        showPricingSection: parseShowPricingSection(settingsRaw.showPricingSection),
        showVideoSection: parseShowVideoSection(settingsRaw.showVideoSection),
        showGallerySection: parseShowGallerySection(settingsRaw.showGallerySection),
        showFaqPage: parseShowFaqPage(settingsRaw.showFaqPage),
        showContactForm: parseShowContactForm(settingsRaw.showContactForm),
      };
      const widgetsJson = {
        bookingProvider: parseBookingProvider((widgetsSnap.exists() ? widgetsSnap.data() : {}).bookingProvider),
        bookingWidgetCompany: String((widgetsSnap.exists() ? widgetsSnap.data() : {}).bookingWidgetCompany ?? bookingWidgetCompany ?? 'm2yzkzSecfyaghBe93MNZGuc'),
        bookingWidgetScriptSrc: String((widgetsSnap.exists() ? widgetsSnap.data() : {}).bookingWidgetScriptSrc ?? bookingWidgetScriptSrc ?? 'https://static-widget.salonized.com/loader.js'),
        showBookingWidget: parseShowBookingWidget((widgetsSnap.exists() ? widgetsSnap.data() : {}).showBookingWidget),
        paymentWidgetProvider: parsePaymentWidgetProvider((widgetsSnap.exists() ? widgetsSnap.data() : {}).paymentWidgetProvider),
        paymentWidgetProductId: String((widgetsSnap.exists() ? widgetsSnap.data() : {}).paymentWidgetProductId ?? paymentWidgetProductId ?? '4GCTc'),
        showPaymentWidget: (widgetsSnap.exists() ? widgetsSnap.data() : {}).showPaymentWidget !== false,
        taggboxWidgetId: String((widgetsSnap.exists() ? widgetsSnap.data() : {}).taggboxWidgetId ?? taggboxWidgetId ?? ''),
        showSocialWidget: parseIncludeSocialSection((widgetsSnap.exists() ? widgetsSnap.data() : {}).showSocialWidget),
      };

      const videolinksJson = {
        items: normalizeVideoLinkItems(videolinksSnap.exists() ? videolinksSnap.data().items ?? [] : videoLinks),
      };

      const galleryJson = normalizeGalleryHomeData(
        gallerySnap.exists() ? gallerySnap.data() : galleryHome
      );

      const artistProfilesJson = artistsSnap.docs
        .map((d, index) => {
          const a = d.data() as any;
          const rawOrder = typeof a.order === 'number' && Number.isFinite(a.order) ? a.order : index;
          return {
            firstName: String(a.firstName ?? ''),
            lastName: String(a.lastName ?? ''),
            instagramHandle: String(a.instagramHandle ?? ''),
            email: String(a.email ?? ''),
            bookingWebsiteLink: String(a.bookingWebsiteLink ?? ''),
            personalWebsiteLink: String(a.personalWebsiteLink ?? ''),
            phoneNumber: String(a.phoneNumber ?? ''),
            profilePhotoLink: String(a.profilePhotoLink ?? ''),
            bio: String(a.bio ?? ''),
            order: rawOrder,
          };
        })
        .sort((a, b) => a.order - b.order);

      const productsJson = productsSnap.docs
        .map((d, index) => {
          const p = normalizeProductStorefrontCategory(d.data(), d.id);
          const rawOrder =
            typeof d.data().order === 'number' && Number.isFinite(d.data().order) ? d.data().order : index;
          return {
            slug: p.slug,
            title: p.title,
            count: p.count,
            image: p.image,
            link: p.link,
            enabled: p.enabled !== false,
            order: rawOrder,
          };
        })
        .sort((a, b) => a.order - b.order);

      const bookingProvidersJson = normalizeBookingProviderOptions(
        bookingProvidersSnap.exists() ? bookingProvidersSnap.data() : defaultBookingProvidersData
      );

      const zip = new JSZip();
      zip.file('reviews.json', JSON.stringify(reviewsJson, null, 2));
      zip.file('faq.json', JSON.stringify(faqJson, null, 2));
      zip.file('services.json', JSON.stringify(servicesJson, null, 2));
      zip.file('settings.json', JSON.stringify(settingsJson, null, 2));
      zip.file('widgets.json', JSON.stringify(widgetsJson, null, 2));
      zip.file('videolinks.json', JSON.stringify(videolinksJson, null, 2));
      zip.file('gallery.json', JSON.stringify(galleryJson, null, 2));
      zip.file('artistprofiles.json', JSON.stringify(artistProfilesJson, null, 2));
      zip.file('recommendedproducts.json', JSON.stringify(productsJson, null, 2));
      zip.file('bookingproviders.json', JSON.stringify({ providers: bookingProvidersJson }, null, 2));

      const blob = await zip.generateAsync({ type: 'blob' });
      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cloud-data-defaults-${stamp}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert('Downloaded live JSON defaults ZIP.');
    } catch (err) {
      handleFirestoreError(err as any, 'get', 'export/live-json-zip');
    } finally {
      setSaving(false);
    }
  };

  // Bulk push action: write every local JSON default to cloud in one run.
  const pushAllLocalJsonToCloud = async () => {
    if (!firebaseConnected) {
      alert('Cloud is not connected.');
      return;
    }
    if (
      !confirm(
        'Push ALL local public/data/*.json defaults to cloud now? WARNING: This will overwrite cloud Reviews, FAQ, Services, Settings, Widgets, Video Links, Gallery, Artist Profiles, Product storefront lists, and Booking Provider catalog. Any cloud changes made since your last committed local defaults will be lost.'
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      // 1. Clear and Migrate Reviews
      const reviewsSnap = await getDocs(collection(db, 'reviews'));
      for (const d of reviewsSnap.docs) {
        await deleteDoc(doc(db, 'reviews', d.id));
      }
      
      const reviewsRes = await fetch(`${import.meta.env.BASE_URL}data/reviews.json`);
      const reviewsJson = await reviewsRes.json();
      for (const text of reviewsJson) {
        await addDoc(collection(db, 'reviews'), { text, createdAt: new Date().toISOString() });
      }

      // 2. Clear and Migrate FAQ
      const faqSnap = await getDocs(collection(db, 'faq'));
      for (const d of faqSnap.docs) {
        await deleteDoc(doc(db, 'faq', d.id));
      }
      
      const faqRes = await fetch(`${import.meta.env.BASE_URL}data/faq.json`);
      const faqJson = await faqRes.json();
      let order = 0;
      for (const cat of faqJson) {
        await addDoc(collection(db, 'faq'), { ...cat, order });
        order++;
      }

      // 3. Migrate Services (Overwrite)
      const servicesRes = await fetch(`${import.meta.env.BASE_URL}data/services.json`);
      const servicesJson = await servicesRes.json();
      await setDoc(doc(db, 'services', 'en'), { categories: servicesJson.en, lang: 'en' });
      await deleteDoc(doc(db, 'services', 'de'));

      const settingsRes = await fetch(`${import.meta.env.BASE_URL}data/settings.json`);
      const settingsJson = await settingsRes.json();
      await setDoc(
        doc(db, 'settings', 'general'),
        {
          contactEmail: settingsJson.contactEmail || 'theschneiderhair@gmail.com',
          themeDefault: validateThemeDefault(settingsJson.themeDefault) ? settingsJson.themeDefault : 'light',
          mediaStorageRoot: normalizeMediaStorageRoot(settingsJson.mediaStorageRoot),
          autoLogoutLeavingAdmin: parseAutoLogoutLeavingAdmin(settingsJson.autoLogoutLeavingAdmin),
          showThemeSelector: parseShowThemeSelector(settingsJson.showThemeSelector),
          showArtistsPage: parseShowArtistsPage(settingsJson.showArtistsPage),
          showProductsPage: parseShowProductsPage(settingsJson.showProductsPage),
          showReviewsSection: parseShowReviewsSection(settingsJson.showReviewsSection),
          showPricingSection: parseShowPricingSection(settingsJson.showPricingSection),
          roundPricesUpToWholeAmount: parseRoundPricesUpToWholeAmount(settingsJson.roundPricesUpToWholeAmount),
          showVideoSection: parseShowVideoSection(settingsJson.showVideoSection),
          showGallerySection: parseShowGallerySection(settingsJson.showGallerySection),
          showFaqPage: parseShowFaqPage(settingsJson.showFaqPage),
          showContactForm: parseShowContactForm(settingsJson.showContactForm),
        },
        { merge: true }
      );

      const widgetsRes = await fetch(`${import.meta.env.BASE_URL}data/widgets.json`);
      const widgetsJson = await widgetsRes.json();
      await setDoc(
        doc(db, 'widgets', 'general'),
        {
          bookingProvider: parseBookingProvider(widgetsJson.bookingProvider),
          bookingWidgetCompany: String(widgetsJson.bookingWidgetCompany ?? 'm2yzkzSecfyaghBe93MNZGuc'),
          bookingWidgetScriptSrc: String(widgetsJson.bookingWidgetScriptSrc ?? 'https://static-widget.salonized.com/loader.js'),
          showBookingWidget: parseShowBookingWidget(widgetsJson.showBookingWidget),
          paymentWidgetProvider: parsePaymentWidgetProvider(widgetsJson.paymentWidgetProvider),
          paymentWidgetProductId: String(widgetsJson.paymentWidgetProductId ?? '4GCTc'),
          showPaymentWidget: widgetsJson.showPaymentWidget !== false,
          taggboxWidgetId: String(widgetsJson.taggboxWidgetId ?? ''),
          showSocialWidget: parseIncludeSocialSection(widgetsJson.showSocialWidget),
        },
        { merge: true }
      );

      const bookingProvidersRes = await fetch(`${import.meta.env.BASE_URL}data/bookingproviders.json`);
      const bookingProvidersJson = await bookingProvidersRes.json();
      await setDoc(
        doc(db, 'bookingproviders', 'catalog'),
        { providers: normalizeBookingProviderOptions(bookingProvidersJson) },
        { merge: true }
      );

      emitAutoLogoutLeavingAdminChanged(parseAutoLogoutLeavingAdmin(settingsJson.autoLogoutLeavingAdmin));
      emitShowThemeSelectorChanged(parseShowThemeSelector(settingsJson.showThemeSelector));
      emitShowArtistsPageChanged(parseShowArtistsPage(settingsJson.showArtistsPage));
      emitShowProductsPageChanged(parseShowProductsPage(settingsJson.showProductsPage));
      emitShowReviewsSectionChanged(parseShowReviewsSection(settingsJson.showReviewsSection));
      emitShowPricingSectionChanged(parseShowPricingSection(settingsJson.showPricingSection));
      emitRoundPricesUpToWholeAmountChanged(parseRoundPricesUpToWholeAmount(settingsJson.roundPricesUpToWholeAmount));
      emitShowVideoSectionChanged(parseShowVideoSection(settingsJson.showVideoSection));
      emitShowGallerySectionChanged(parseShowGallerySection(settingsJson.showGallerySection));
      emitShowFaqPageChanged(parseShowFaqPage(settingsJson.showFaqPage));

      const videolinksRes = await fetch(`${import.meta.env.BASE_URL}data/videolinks.json`);
      const videolinksJson = await videolinksRes.json();
      const videoItems = normalizeVideoLinkItems(videolinksJson.items ?? []);
      await persistVideoLinks(videoItems);

      const galleryRes = await fetch(`${import.meta.env.BASE_URL}data/gallery.json`);
      const galleryJson = await galleryRes.json();
      const galleryNorm = normalizeGalleryHomeData(galleryJson);
      await setDoc(doc(db, 'gallery', 'home'), {
        ...galleryNorm,
        updatedAt: new Date().toISOString(),
      });
      emitGalleryHomeUpdated();

      const artistProfilesSnap = await getDocs(collection(db, 'artistprofiles'));
      for (const d of artistProfilesSnap.docs) {
        await deleteDoc(doc(db, 'artistprofiles', d.id));
      }
      const artistProfilesRes = await fetch(`${import.meta.env.BASE_URL}data/artistprofiles.json`);
      const artistProfilesJson = await artistProfilesRes.json();
      for (const [index, raw] of (Array.isArray(artistProfilesJson) ? artistProfilesJson : []).entries()) {
        const profile = normalizeArtistProfile(raw, 'new');
        await addDoc(collection(db, 'artistprofiles'), {
          firstName: profile.firstName,
          lastName: profile.lastName,
          instagramHandle: profile.instagramHandle,
          email: profile.email,
          bookingWebsiteLink: profile.bookingWebsiteLink,
          personalWebsiteLink: profile.personalWebsiteLink,
          phoneNumber: profile.phoneNumber,
          profilePhotoLink: profile.profilePhotoLink,
          specialty: profile.specialty,
          bio: profile.bio,
          enabled: profile.enabled !== false,
          order: index,
          createdAt: new Date().toISOString(),
        });
      }

      const productCategoriesSnap = await getDocs(collection(db, 'productcategories'));
      for (const d of productCategoriesSnap.docs) {
        await deleteDoc(doc(db, 'productcategories', d.id));
      }
      const recommendedProductsRes = await fetch(`${import.meta.env.BASE_URL}data/recommendedproducts.json`);
      const recommendedProductsJson = await recommendedProductsRes.json();
      for (const [index, raw] of (Array.isArray(recommendedProductsJson) ? recommendedProductsJson : []).entries()) {
        const p = normalizeProductStorefrontCategory(raw, 'new');
        await addDoc(collection(db, 'productcategories'), {
          slug: p.slug || slugifyStorefrontTitle(p.title || `item-${index}`),
          title: p.title,
          count: p.count,
          image: p.image,
          link: p.link,
          enabled: p.enabled !== false,
          order: index,
          createdAt: new Date().toISOString(),
        });
      }

      alert('Push complete. All local JSON defaults were written to cloud successfully.');
      fetchData();
    } catch (err) {
      console.error('Bulk local JSON push failed:', err);
      alert('Push failed. Check internet connection, cloud permissions, and JSON file format.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-24">
      <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-stone-100 px-8 py-6 flex justify-between items-center bg-white">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center text-white font-serif">S</div>
          <div>
            <h1 className="text-xl font-serif tracking-tight text-stone-900">Artist Portal</h1>
            <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">
              {String(activeFirebaseConfig.projectId ?? 'unknown-project')}
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-stone-400 hover:text-stone-900 transition-colors uppercase"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </nav>

      <div className="max-w-[1400px] mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar */}
        <aside className="admin-sidebar-controls relative lg:col-span-3 space-y-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('inquiries');
              setSettingsNavOpen(false);
              setHealthNavOpen(false);
            }}
            className={`admin-inquiries-button ${sidebarControlButtonBaseClass} ${
              activeTab === 'inquiries'
                ? 'admin-inquiries-button-active border-stone-700 bg-stone-700 text-stone-100 shadow-sm dark:border-stone-600 dark:bg-stone-900'
                : 'border-stone-800 bg-stone-800 text-stone-200 hover:bg-stone-700 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Mail className={`h-4 w-4 shrink-0 ${activeTab === 'inquiries' ? 'text-gold' : 'text-stone-400'}`} />
            <span className={sidebarControlLabelClass}>Inquiries</span>
          </button>

          <div ref={settingsDropdownRef} className="admin-sidebar-control-group relative">
            <button
              type="button"
              onClick={() => {
                setSettingsNavOpen((o) => !o);
                setHealthNavOpen(false);
              }}
              className={`${sidebarControlButtonBaseClass} justify-between border-stone-800 bg-stone-800 text-stone-200 hover:bg-stone-700 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100 dark:hover:bg-stone-800`}
              aria-expanded={settingsNavOpen}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <Settings className="h-4 w-4 shrink-0 text-stone-400" />
                <span className={sidebarControlLabelClass}>Settings</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-stone-400 transition-transform duration-300 ${settingsNavOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {settingsNavOpen && (
              <div className="absolute left-0 right-0 top-full z-20 mt-0 max-h-[min(70vh,28rem)] overflow-y-auto overscroll-contain rounded-b-lg border border-stone-200 bg-stone-50 py-1 shadow-xl backdrop-blur-none dark:border-stone-600 dark:bg-stone-950 dark:shadow-black/40">
                {SETTINGS_SUBNAV.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setSettingsNavOpen(false);
                        setHealthNavOpen(false);
                      }}
                      className={`group flex w-full items-center gap-2.5 rounded-md px-4 py-2 text-left text-sm transition-colors ${
                        active
                          ? 'bg-gold/10 text-stone-900 dark:bg-gold/15 dark:text-stone-100'
                          : 'text-stone-600 hover:bg-stone-200 hover:text-stone-900 active:bg-gold/15 active:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-700 dark:hover:text-stone-100 dark:active:bg-gold/20 dark:active:text-stone-100'
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          active
                            ? 'text-gold'
                            : 'text-stone-600 group-hover:text-stone-900 dark:text-stone-400 dark:group-hover:text-stone-100'
                        }`}
                      />
                      <span className="font-medium leading-snug">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div ref={healthDropdownRef} className="admin-sidebar-control-group relative">
            <button
              type="button"
              onClick={() => {
                setHealthNavOpen((o) => !o);
                setSettingsNavOpen(false);
              }}
              className={`${sidebarControlButtonBaseClass} border-stone-800 bg-stone-800 text-stone-200 hover:bg-stone-700 dark:border-stone-600 dark:bg-stone-950 dark:text-stone-100 dark:hover:bg-stone-800`}
              aria-expanded={healthNavOpen}
              title={
                allSubSourcesLive
                  ? 'Cloud connected and all content sources are live on Firebase'
                  : 'Expand for connection details and per-source status'
              }
            >
              <span className="flex min-w-0 flex-1 items-center gap-2.5">
                <span
                  className={`admin-cloud-led h-2.5 w-2.5 shrink-0 rounded-full ${
                    allSubSourcesLive
                      ? 'admin-cloud-led-live bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.75)]'
                      : 'admin-cloud-led-local bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.55)]'
                  }`}
                  aria-hidden
                />
                <span className={sidebarControlLabelClass}>
                  Cloud Health
                </span>
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-stone-400 transition-transform duration-300 ${healthNavOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {healthNavOpen && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-3 shadow-xl backdrop-blur-none dark:border-stone-600 dark:bg-stone-950 dark:shadow-black/40">
                  <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 space-y-1.5 dark:border-stone-700 dark:bg-stone-800/60">
                    <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">Cloud connection</p>
                    <div className="space-y-1">
                      <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                        <span className="text-[9px] text-stone-600 uppercase tracking-widest dark:text-stone-400">Environment</span>
                        <span className="text-[9px] text-stone-800 uppercase tracking-wider font-semibold text-right dark:text-stone-200">
                          {firebaseEnvironment}
                        </span>
                      </div>
                      <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                        <span className="text-[9px] text-stone-600 uppercase tracking-widest dark:text-stone-400">Project ID</span>
                        <span className="text-[9px] text-stone-800 font-semibold text-right break-all dark:text-stone-200">
                          {String(activeFirebaseConfig.projectId ?? '')}
                        </span>
                      </div>
                      <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                        <span className="text-[9px] text-stone-600 uppercase tracking-widest dark:text-stone-400">Connection</span>
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={`text-[9px] font-semibold text-right ${firebaseConnected ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}
                          >
                            {firebaseConnected ? 'Connected' : 'Offline'}
                          </span>
                          <div
                            className={`admin-cloud-led h-2 w-2 rounded-full ${
                              firebaseConnected
                                ? 'admin-cloud-led-live bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                                : 'admin-cloud-led-local bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                            }`}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                        <span className="text-[9px] text-stone-600 uppercase tracking-widest dark:text-stone-400">Database</span>
                        <span className="text-[9px] text-stone-800 font-semibold text-right break-all dark:text-stone-200">
                          {String(activeFirebaseConfig.firestoreDatabaseId ?? '')}
                        </span>
                      </div>
                      <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                        <span className="text-[9px] text-stone-600 uppercase tracking-widest dark:text-stone-400">Auth Domain</span>
                        <span className="text-[9px] text-stone-800 font-semibold text-right break-all dark:text-stone-200">
                          {String(activeFirebaseConfig.authDomain ?? '')}
                        </span>
                      </div>
                      <div className="grid grid-cols-[90px_1fr] items-center gap-2">
                        <span className="text-[9px] text-stone-600 uppercase tracking-widest dark:text-stone-400">Storage Bucket</span>
                        <span className="text-[9px] text-stone-800 font-semibold text-right break-all dark:text-stone-200">
                          {String(activeFirebaseConfig.storageBucket ?? '')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { id: 'settings', label: 'General' },
                      { id: 'widgets', label: 'Widgets' },
                      { id: 'reviews', label: 'Reviews' },
                      { id: 'faq', label: 'FAQ' },
                      { id: 'services', label: 'Services' },
                      { id: 'videolinks', label: 'Videos' },
                      { id: 'gallery', label: 'Gallery' },
                      { id: 'artistprofiles', label: 'Artists' },
                      { id: 'products', label: 'Products' },
                      { id: 'sitecopy', label: 'Marketing copy' },
                    ].map((source) => (
                      <div key={source.id} className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-stone-800 dark:text-stone-200">
                          {source.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[8px] font-bold uppercase tracking-tighter ${
                              dataSources[source.id] === 'firebase' ? 'text-green-700 dark:text-green-400' : 'text-amber-800 dark:text-amber-400'
                            }`}
                          >
                            {dataSources[source.id] === 'firebase' ? 'Live' : 'Local'}
                          </span>
                          <div
                            className={`admin-cloud-led-mini h-1.5 w-1.5 rounded-full ${
                              dataSources[source.id] === 'firebase'
                                ? 'admin-cloud-led-live bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                                : 'admin-cloud-led-local bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            )}
          </div>

          <button
            type="button"
            onClick={saveSettings}
            disabled={!canPushAllSettingsToCloud}
            className={`${sidebarControlButtonBaseClass} font-medium disabled:opacity-50 ${
              canPushAllSettingsToCloud
                ? 'bg-stone-900 text-white hover:bg-gold'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span className={sidebarControlLabelClass}>{hasPendingSettingsChanges ? 'Push All Changes to Cloud' : 'All Changes Synced'}</span>
          </button>
        </aside>

        {/* Content Area */}
        <main className="relative z-0 lg:col-span-9">
          <AnimatePresence mode="wait">
            {activeTab === 'reviews' && (
              <motion.div 
                key="reviews"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="mb-8 space-y-4">
                  <h2 className="text-xl font-serif text-stone-800">Client Testimonials</h2>
                  <p className="text-sm text-stone-500 font-light max-w-2xl">
                    Manage the review quotes shown on the public homepage carousel.
                  </p>
                  <label className="flex items-start gap-3 cursor-pointer group max-w-xl">
                    <input
                      type="checkbox"
                      checked={showReviewsSection}
                      onChange={(e) => setShowReviewsSection(e.target.checked)}
                      className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                    />
                    <span>
                      <span className="text-sm font-medium text-stone-800 block">
                        Show Reviews section on public site
                      </span>
                      <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">
                        Synced with General Settings.
                      </span>
                    </span>
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={loadDefaultReviews}
                      disabled={saving}
                      className={adminActionButtonClass}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} /> Load values from defaults
                    </button>
                    <button
                      type="button"
                      onClick={loadReviewsFromCloud}
                      disabled={cloudActionDisabled || !cloudReadable.reviews}
                      className={adminActionButtonClass}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Load from cloud
                    </button>
                    <button
                      type="button"
                      onClick={pushReviewsToDatabase}
                      disabled={cloudActionDisabled}
                      className={adminActionButtonClass}
                    >
                      <Upload className="w-3.5 h-3.5" /> Push to Cloud
                    </button>
                    <button
                      type="button"
                      onClick={() => setJsonModalData(reviews.map((r) => r.text))}
                      className={adminSecondaryActionButtonClass}
                    >
                      <Code className="w-3.5 h-3.5" /> Source Code
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500 font-light">
                    Use the arrow buttons on each card to control the public display order.
                  </p>
                </div>

                <div className="bg-stone-50 p-8 rounded-2xl border border-stone-100 flex gap-4">
                  <textarea 
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    placeholder="Add a new client testimonial..."
                    className={`flex-grow rounded-xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-gold resize-none border ${
                      !newReviewValid && newReview.trim() !== '' ? invalidFieldClass : 'bg-white border-stone-200'
                    }`}
                    rows={2}
                  />
                  <button 
                    onClick={addReview}
                    disabled={saving || !newReviewValid}
                    className="aspect-square bg-stone-900 text-white rounded-xl flex items-center justify-center hover:bg-gold transition-colors disabled:opacity-50 h-auto px-6"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="group p-6 bg-white border border-stone-100 rounded-2xl hover:shadow-lg transition-all duration-500 flex justify-between items-start">
                      <div className="w-full pr-4">
                        {editingReviewId === review.id ? (
                          <textarea
                            value={editingReviewText}
                            onChange={(e) => setEditingReviewText(e.target.value)}
                            className={`w-full rounded-xl p-3 text-sm text-stone-700 font-light leading-relaxed focus:outline-none focus:ring-1 focus:ring-gold resize-none border ${
                              !validateReviewBody(editingReviewText) ? invalidFieldClass : 'bg-stone-50 border-stone-200'
                            }`}
                            rows={3}
                          />
                        ) : (
                          <p className="text-stone-600 font-light text-sm italic leading-relaxed">"{review.text}"</p>
                        )}
                      </div>
                      <div className="opacity-100 flex items-center gap-2 transition-all">
                        {editingReviewId === review.id ? (
                          <>
                            <button
                              onClick={() => applyReviewEdit(review.id)}
                              disabled={saving || !validateReviewBody(editingReviewText)}
                              className="p-2 text-stone-300 hover:text-green-600 transition-all rounded-lg hover:bg-green-50 disabled:opacity-50"
                              title="Apply edit"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEditReview}
                              disabled={saving}
                              className="p-2 text-stone-300 hover:text-stone-700 transition-all rounded-lg hover:bg-stone-100 disabled:opacity-50"
                              title="Cancel edit"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEditReview(review)}
                            className="p-2 text-stone-300 hover:text-gold transition-all rounded-lg hover:bg-amber-50"
                            title="Edit review"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteReview(review.id)}
                          disabled={saving}
                          className="p-2 text-stone-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 disabled:opacity-50"
                          title="Delete review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'faq' && (
              <motion.div 
                key="faq"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="mb-8 space-y-4">
                  <h2 className="text-xl font-serif text-stone-800">Knowledge Base</h2>
                  <p className="text-sm text-stone-500 font-light max-w-2xl">
                    Manage FAQ categories and answers for the Education & FAQ page.
                  </p>
                  <label className="flex items-start gap-3 cursor-pointer group max-w-xl">
                    <input
                      type="checkbox"
                      checked={showFaqPage}
                      onChange={(e) => setShowFaqPage(e.target.checked)}
                      className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                    />
                    <span>
                      <span className="text-sm font-medium text-stone-800 block">
                        Show Education & FAQ in public navigation
                      </span>
                      <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">
                        Synced with General Settings.
                      </span>
                    </span>
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={loadDefaultFaq}
                      disabled={saving}
                      className={adminActionButtonClass}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} /> Load values from defaults
                    </button>
                    <button
                      type="button"
                      onClick={loadFaqFromCloud}
                      disabled={cloudActionDisabled || !cloudReadable.faq}
                      className={adminActionButtonClass}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Load from cloud
                    </button>
                    <button
                      type="button"
                      onClick={pushFaqToDatabase}
                      disabled={cloudActionDisabled}
                      className={adminActionButtonClass}
                    >
                      <Upload className="w-3.5 h-3.5" /> Push to Cloud
                    </button>
                    <button
                      onClick={() => setJsonModalData(faq.map(({ id, ...rest }) => rest))}
                      className={adminSecondaryActionButtonClass}
                    >
                      <Code className="w-3.5 h-3.5" /> Source Code
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      value={newFaqViewableText}
                      onChange={(e) => setNewFaqViewableText(e.target.value)}
                      placeholder="Viewable Text (e.g. Extensions)"
                      className={`w-56 min-w-[12rem] rounded-lg px-3 py-2 text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-gold border ${
                        newFaqViewableText.trim() !== '' && !validateFaqViewableText(newFaqViewableText)
                          ? invalidFieldClass
                          : 'bg-white border-stone-200'
                      }`}
                    />
                    <button
                      onClick={addFaqCategory}
                      disabled={saving || !faqNewCategoryReadyToSubmit}
                      className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-[10px] font-bold tracking-widest hover:bg-gold transition-colors uppercase disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Category
                    </button>
                  </div>
                </div>

                {faqSorted.map((cat, index) => {
                  const isOpen = expandedFaqCategoryId === cat.id;
                  return (
                  <div key={cat.id} className="bg-white border border-stone-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-500">
                    <div
                      onClick={() => setExpandedFaqCategoryId(isOpen ? null : cat.id)}
                      className="p-6 bg-stone-50 border-b border-stone-100 flex justify-between items-center cursor-pointer"
                    >
                      <h3 className="font-serif text-lg">{cat.category}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveFaqCategory(index, 'up');
                          }}
                          disabled={saving || index === 0}
                          className="p-2 text-stone-400 hover:text-stone-800 transition-colors rounded-lg bg-white shadow-sm border border-stone-200 disabled:opacity-30 disabled:pointer-events-none"
                          title="Move up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveFaqCategory(index, 'down');
                          }}
                          disabled={saving || index === faqSorted.length - 1}
                          className="p-2 text-stone-400 hover:text-stone-800 transition-colors rounded-lg bg-white shadow-sm border border-stone-200 disabled:opacity-30 disabled:pointer-events-none"
                          title="Move down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(cat);
                          }}
                          className="p-2 text-stone-400 hover:text-gold transition-colors rounded-lg bg-white shadow-sm border border-stone-200"
                          title="Edit category"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFaqCategory(cat.id, cat.category);
                          }}
                          disabled={saving}
                          className="p-2 text-stone-400 hover:text-red-500 transition-colors rounded-lg bg-white shadow-sm border border-stone-200 disabled:opacity-50"
                          title="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {isOpen && (
                    <div className="p-6 space-y-6">
                      {cat.items.map((item: any, idx: number) => (
                        <div key={idx} className="space-y-2 pb-6 border-b border-stone-50 last:border-0 last:pb-0">
                          <p className="text-xs font-bold uppercase tracking-widest text-gold">Q: {item.q}</p>
                          <p className="text-sm text-stone-500 font-light leading-relaxed">{item.a}</p>
                        </div>
                      ))}
                    </div>
                    )}
                  </div>
                )})}

                {/* FAQ Edit Modal */}
                {editingCategory && (
                  <div className="admin-global-modal-backdrop fixed inset-0 z-[1200] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-8">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                      <div className="p-8 border-b border-stone-100 flex justify-between items-center">
                        <h3 className="text-xl font-serif">Edit {editingCategory.category}</h3>
                        <button onClick={() => setEditingCategory(null)} className="text-stone-400 hover:text-stone-900">
                           <X className="w-6 h-6" />
                        </button>
                      </div>
                      <div className="p-8 overflow-y-auto space-y-12">
                        {editingCategory.items.map((item: any, idx: number) => (
                          <div key={idx} className="space-y-4 relative group">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold tracking-widest text-stone-300 uppercase">Question {idx + 1}</span>
                              <button 
                                onClick={() => {
                                  const newItems = [...editingCategory.items];
                                  newItems.splice(idx, 1);
                                  setEditingCategory({...editingCategory, items: newItems});
                                }}
                                className="text-stone-300 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <input 
                              className={`w-full rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border ${
                                !validateFaqItemQuestion(item.q || '') ? invalidFieldClass : 'bg-stone-50 border-stone-200'
                              }`}
                              value={item.q}
                              onChange={(e) => {
                                const newItems = [...editingCategory.items];
                                newItems[idx].q = e.target.value;
                                setEditingCategory({...editingCategory, items: newItems});
                              }}
                            />
                            <textarea 
                              className={`w-full rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold h-24 border ${
                                !validateFaqItemAnswer(item.a || '') ? invalidFieldClass : 'bg-stone-50 border-stone-200'
                              }`}
                              value={item.a}
                              onChange={(e) => {
                                const newItems = [...editingCategory.items];
                                newItems[idx].a = e.target.value;
                                setEditingCategory({...editingCategory, items: newItems});
                              }}
                            />
                          </div>
                        ))}
                        <button 
                          onClick={() => setEditingCategory({...editingCategory, items: [...editingCategory.items, { q: 'New Question', a: 'Answer...' }]})}
                          className="w-full py-4 border-2 border-dashed border-stone-100 rounded-xl text-stone-400 text-xs font-bold tracking-widest uppercase hover:text-gold hover:border-gold/50 transition-all"
                        >
                          + Add Interaction
                        </button>
                      </div>
                      <div className="p-8 bg-stone-50 border-t border-stone-100">
                         <button 
                          onClick={() => updateFaqCategory(editingCategory)}
                          disabled={saving || !faqModalValid}
                          className="w-full py-4 bg-stone-900 text-white rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-gold transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
                         >
                           {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Category</>}
                         </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'services' && (
              <motion.div 
                key="services"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                <div className="mb-8 space-y-4">
                  <h2 className="text-xl font-serif text-stone-800">Service Architecture</h2>
                  <p className="text-sm text-stone-500 font-light max-w-2xl">
                    Control pricing categories and service cards shown on the homepage.
                  </p>
                  <label className="flex items-start gap-3 cursor-pointer group max-w-xl">
                    <input
                      type="checkbox"
                      checked={showPricingSection}
                      onChange={(e) => setShowPricingSection(e.target.checked)}
                      className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                    />
                    <span>
                      <span className="text-sm font-medium text-stone-800 block">
                        Show Pricing/Services section on public site
                      </span>
                      <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">
                        Synced with General Settings.
                      </span>
                    </span>
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={loadDefaultPricing}
                      disabled={saving}
                      className={adminActionButtonClass}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} /> Load values from defaults
                    </button>
                    <button
                      type="button"
                      onClick={loadPricingFromCloud}
                      disabled={cloudActionDisabled || !cloudReadable.services}
                      className={adminActionButtonClass}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Load from cloud
                    </button>
                    <button
                      type="button"
                      onClick={pushPricingToCloud}
                      disabled={
                        cloudActionDisabled ||
                        !allServicePricesValid
                      }
                      className={adminActionButtonClass}
                    >
                      <Upload className="w-3.5 h-3.5" /> Push to Cloud
                    </button>
                    <button
                      type="button"
                      onClick={() => setJsonModalData(services)}
                      className={adminSecondaryActionButtonClass}
                    >
                      <Code className="w-3.5 h-3.5" /> Source Code
                    </button>
                  </div>
                  {settingsSavedNotice ? (
                    <p className="text-xs font-medium text-green-700">{settingsSavedNotice}</p>
                  ) : null}
                </div>

                {/* Global Pricing Tool */}
                <div className="bg-stone-900 text-white p-12 rounded-3xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gold/20 rounded-lg"><Percent className="w-5 h-5 text-gold" /></div>
                        <h3 className="text-2xl font-serif">Global Price Revision</h3>
                      </div>
                      <p className="text-stone-400 font-light text-sm max-w-md leading-relaxed">
                        Adjust all base prices across your live English service list. Useful for annual inflations or seasonal premium adjustments.
                      </p>
                    </div>
                    <div className="w-full md:w-auto space-y-4">
                      <div
                        className={`rounded-2xl p-2 pr-8 relative w-fit border ${
                          percentageRaw.trim() !== '' && !percentageInputValid
                            ? invalidFieldClassDark
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <input 
                          type="text"
                          inputMode="decimal"
                          value={percentageRaw} 
                          onChange={(e) => applyPriceIncrease(sanitizePercentageInput(e.target.value))}
                          className="bg-transparent text-center w-24 text-4xl font-serif focus:outline-none text-white placeholder:text-stone-500"
                          placeholder="0"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl text-stone-500 font-serif">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* New category */}
                <div className="p-6 border border-stone-200 rounded-2xl bg-stone-50/50 flex flex-col sm:flex-row sm:items-end gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-stone-400 block">
                      New category
                    </label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Category name (e.g. Treatments)"
                      className={`w-full max-w-md rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border ${
                        newCategoryName.trim() !== '' && !validateServiceCategoryName(newCategoryName)
                          ? invalidFieldClass
                          : 'bg-white border-stone-200'
                      }`}
                    />
                    <p className="text-[10px] text-stone-400 font-light pt-1">
                      Creates an empty group; add services with the pencil control on each card.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addNewServiceCategory}
                    disabled={saving || !validateServiceCategoryName(newCategoryName)}
                    className="shrink-0 flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-gold transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" /> Add category
                  </button>
                </div>

                {/* Categorized Previews */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {services?.en?.categories?.map((cat: any, categoryIndex: number) => (
                    <div key={`pricing-cat-${categoryIndex}`} className="p-6 border border-stone-100 rounded-2xl hover:bg-stone-50/50 hover:shadow-lg transition-all duration-500">
                      <div className="flex justify-between items-start gap-3 mb-4">
                        <h5 className="font-serif text-stone-800 flex-1 min-w-0 pr-2">{cat.category}</h5>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => deleteServiceCategory(categoryIndex)}
                            disabled={saving}
                            className="p-2 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-40"
                            title="Delete entire category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleAddServicePanel(categoryIndex)}
                            className={`p-2 rounded-lg border transition-colors ${
                              addServiceCategoryIndex === categoryIndex
                                ? 'border-gold bg-amber-50 text-gold'
                                : 'border-stone-200 bg-white text-stone-400 hover:text-stone-800 hover:border-stone-300'
                            }`}
                            title={addServiceCategoryIndex === categoryIndex ? 'Close add service' : 'Add a service to this category'}
                            aria-expanded={addServiceCategoryIndex === categoryIndex}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {cat.items?.length ? (
                          cat.items.map((item: any, itemIndex: number) => (
                            <div
                              key={`${categoryIndex}-${itemIndex}`}
                              className="flex items-center gap-2 group/row"
                            >
                              <span className="text-xs text-stone-500 font-light line-clamp-2 flex-1 min-w-0">
                                {item.title}
                              </span>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={item.price}
                                onChange={(e) => updateServicePrice(categoryIndex, itemIndex, e.target.value)}
                                className={`w-28 shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold text-stone-800 text-right focus:outline-none focus:ring-1 focus:ring-gold border ${
                                  !validateServicePrice(String(item.price ?? '')) ? invalidFieldClass : 'bg-white border-stone-200'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => deleteServiceItem(categoryIndex, itemIndex)}
                                disabled={saving}
                                className="shrink-0 p-2 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors disabled:opacity-40"
                                title="Remove service"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-stone-400 font-light italic py-2">No services yet — use the pencil above to add one.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-8 bg-stone-100 rounded-2xl border border-stone-200 text-center">
                  <p className="text-stone-400 text-xs italic">New services are stored in this session until you use Push to Cloud at the top to write the English price list to live cloud data.</p>
                </div>

                <AnimatePresence>
                  {addServiceCategoryIndex !== null && services?.en?.categories?.[addServiceCategoryIndex] && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="admin-global-modal-backdrop fixed inset-0 z-[1200] bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-6 md:p-10"
                    >
                      <motion.div
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-stone-200 shadow-2xl flex flex-col"
                      >
                        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                          <h3 className="text-xl font-serif text-stone-900">
                            Edit Services - {services.en.categories[addServiceCategoryIndex].category}
                          </h3>
                          <button
                            type="button"
                            onClick={closeAddServiceForm}
                            className="p-2 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">New service</p>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Title</label>
                            <input
                              type="text"
                              value={newServiceTitle}
                              onChange={(e) => setNewServiceTitle(e.target.value)}
                              placeholder="Service name"
                              className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold border ${
                                newServiceTitle.trim() !== '' && !validateServiceTitle(newServiceTitle)
                                  ? invalidFieldClass
                                  : 'bg-stone-50 border-stone-200'
                              }`}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Description</label>
                            <textarea
                              value={newServiceDesc}
                              onChange={(e) => setNewServiceDesc(e.target.value)}
                              placeholder="What is included"
                              rows={3}
                              className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold resize-y border ${
                                newServiceDesc.trim() !== '' && !validateServiceItemDescription(newServiceDesc)
                                  ? invalidFieldClass
                                  : 'bg-stone-50 border-stone-200'
                              }`}
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Duration</label>
                              <input
                                type="text"
                                value={newServiceDuration}
                                onChange={(e) => setNewServiceDuration(e.target.value)}
                                placeholder="e.g. 60 min"
                                className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold border ${
                                  newServiceDuration.trim() !== '' && !validateServiceDuration(newServiceDuration)
                                    ? invalidFieldClass
                                    : 'bg-stone-50 border-stone-200'
                                }`}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Price</label>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={newServicePrice}
                                onChange={(e) => setNewServicePrice(sanitizeServicePriceInput(e.target.value))}
                                placeholder="€95.00"
                                className={`w-full rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-gold border ${
                                  newServicePrice.trim() !== '' &&
                                  !validateServicePrice(sanitizeServicePriceInput(newServicePrice))
                                    ? invalidFieldClass
                                    : 'bg-stone-50 border-stone-200'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => addServiceToCategory(addServiceCategoryIndex)}
                            disabled={saving || !newServiceFormValid}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-gold transition-colors disabled:opacity-40"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add service
                          </button>
                          <button
                            type="button"
                            onClick={closeAddServiceForm}
                            className="px-4 py-2 border border-stone-200 rounded-lg text-[10px] font-bold tracking-widest uppercase text-stone-500 hover:bg-white transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'videolinks' && (
              <motion.div
                key="videolinks"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="mb-8 space-y-4">
                  <h2 className="text-xl font-serif text-stone-800">Home — Film strip</h2>
                  <p className="text-sm text-stone-500 font-light max-w-2xl">
                    Manage the homepage film strip section that displays YouTube videos and opens them in a lightbox.
                  </p>
                  <label className="flex items-start gap-3 cursor-pointer group max-w-xl">
                    <input
                      type="checkbox"
                      checked={showVideoSection}
                      onChange={(e) => setShowVideoSection(e.target.checked)}
                      className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                    />
                    <span>
                      <span className="text-sm font-medium text-stone-800 block">
                        Show film strip section on public site
                      </span>
                      <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">
                        Synced with General Settings.
                      </span>
                    </span>
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={loadDefaultVideoLinks}
                      disabled={saving}
                      className={adminActionButtonClass}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} /> Load values from defaults
                    </button>
                    <button
                      type="button"
                      onClick={loadVideoLinksFromCloud}
                      disabled={cloudActionDisabled || !cloudReadable.videolinks}
                      className={adminActionButtonClass}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Load from cloud
                    </button>
                    <button
                      type="button"
                      onClick={pushVideoLinksToDatabase}
                      disabled={cloudActionDisabled}
                      className={adminActionButtonClass}
                    >
                      <Upload className="w-3.5 h-3.5" /> Push to Cloud
                    </button>
                    <button
                      type="button"
                      onClick={() => setJsonModalData(videoLinks.map(({ id: _id, ...rest }) => rest))}
                      className={adminSecondaryActionButtonClass}
                    >
                      <Code className="w-3.5 h-3.5" /> Source Code
                    </button>
                  </div>
                </div>

                <div className="bg-stone-50 p-6 md:p-8 rounded-2xl border border-stone-100 space-y-4">
                  <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">Add link</p>
                  <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
                    <input
                      type="url"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=…"
                      className={`flex-grow rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border ${
                        newVideoUrl.trim() !== '' && !isValidYoutubeVideoUrl(newVideoUrl)
                          ? invalidFieldClass
                          : 'bg-white border-stone-200'
                      }`}
                    />
                    <input
                      value={newVideoLabel}
                      onChange={(e) => setNewVideoLabel(e.target.value)}
                      placeholder="Optional label (for your notes)"
                      className={`lg:w-64 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border ${
                        !validateVideoLinkLabel(newVideoLabel) ? invalidFieldClass : 'bg-white border-stone-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={addVideoLinkRow}
                      disabled={saving || !newVideoFormValid}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-gold transition-colors disabled:opacity-50 shrink-0"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {videoLinks.length === 0 ? (
                    <p className="text-sm text-stone-400 italic py-8 text-center border border-dashed border-stone-200 rounded-2xl">
                      No links yet. Load defaults or add a YouTube URL above.
                    </p>
                  ) : (
                    videoLinks.map((v, rowIndex) => {
                      const editingThis = editingVideoLinkId === v.id;
                      const rowYt =
                        editingThis && draftVideoUrl.trim()
                          ? extractYoutubeVideoId(draftVideoUrl)
                          : extractYoutubeVideoId(v.url);
                      return (
                        <div
                          key={v.id}
                          className="group flex flex-col gap-6 justify-between rounded-2xl border border-stone-100 bg-white p-6 transition-all hover:shadow-lg lg:flex-row lg:items-stretch"
                        >
                          <div className="flex min-w-0 flex-grow flex-col justify-between gap-4">
                            <div className="space-y-3">
                              {editingThis ? (
                                <>
                                  <input
                                    value={draftVideoUrl}
                                    onChange={(e) => setDraftVideoUrl(e.target.value)}
                                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold ${
                                      draftVideoUrl.trim() !== '' && !isValidYoutubeVideoUrl(draftVideoUrl)
                                        ? invalidFieldClass
                                        : 'border-stone-200 bg-stone-50'
                                    }`}
                                  />
                                  <input
                                    value={draftVideoLabel}
                                    onChange={(e) => setDraftVideoLabel(e.target.value)}
                                    placeholder="Optional label"
                                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold ${
                                      !validateVideoLinkLabel(draftVideoLabel)
                                        ? invalidFieldClass
                                        : 'border-stone-200 bg-stone-50'
                                    }`}
                                  />
                                </>
                              ) : (
                                <>
                                  {v.label ? (
                                    <p className="text-xs font-bold uppercase tracking-widest text-gold">{v.label}</p>
                                  ) : null}
                                  <p className="break-all font-mono text-sm text-stone-600">{v.url}</p>
                                </>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4 lg:border-t-0 lg:pt-0">
                              {editingThis ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={saveEditVideoLink}
                                    disabled={
                                      saving ||
                                      !isValidYoutubeVideoUrl(draftVideoUrl) ||
                                      !validateVideoLinkLabel(draftVideoLabel)
                                    }
                                    className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-gold disabled:opacity-50"
                                  >
                                    <Save className="h-4 w-4" /> Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditVideoLink}
                                    disabled={saving}
                                    className="rounded-lg border border-stone-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 transition-colors hover:bg-stone-50 disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEditVideoLink(v)}
                                  disabled={saving}
                                  className="flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-50"
                                >
                                  <Edit3 className="h-4 w-4" /> Edit
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteVideoLinkRow(v.id)}
                                disabled={saving}
                                className="flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </button>
                            </div>
                          </div>

                          <div className="relative mx-auto aspect-video w-full max-w-[140px] shrink-0 overflow-hidden rounded-lg bg-stone-900 shadow-md ring-1 ring-stone-200 lg:mx-0 lg:w-28">
                            {rowYt ? (
                              <>
                                <iframe
                                  title={`Inline preview ${rowYt}`}
                                  src={`https://www.youtube-nocookie.com/embed/${rowYt}?rel=0`}
                                  className="pointer-events-none h-full w-full border-0"
                                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                  referrerPolicy="strict-origin-when-cross-origin"
                                />
                                <button
                                  type="button"
                                  onClick={() => setVideoPreviewLightboxIndex(rowIndex)}
                                  className="absolute inset-0 z-[5] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                                  aria-label="Expand video to watch"
                                  title="Click to expand"
                                />
                              </>
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-stone-100 px-2 text-center text-[10px] leading-snug text-stone-400">
                                {editingThis ? 'Valid YouTube URL needed' : 'Invalid URL'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <AnimatePresence>
                  {videoPreviewLightboxIndex !== null &&
                    videoLightboxResolvedId &&
                    videoLinks.length > 0 && (
                      <VideolinksEmbedLightbox
                        videoId={videoLightboxResolvedId}
                        indexLabel={`Preview — ${videoPreviewLightboxIndex + 1} / ${videoLinks.length}`}
                        onClose={() => setVideoPreviewLightboxIndex(null)}
                        onPrev={() =>
                          setVideoPreviewLightboxIndex((i) =>
                            i !== null && i > 0 ? i - 1 : i
                          )
                        }
                        onNext={() =>
                          setVideoPreviewLightboxIndex((i) =>
                            i !== null && i < videoLinks.length - 1 ? i + 1 : i
                          )
                        }
                        hasPrev={videoPreviewLightboxIndex > 0}
                        hasNext={videoPreviewLightboxIndex < videoLinks.length - 1}
                      />
                    )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'artistprofiles' && (
              <motion.div
                key="artistprofiles"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="mb-8 space-y-4">
                  <h2 className="text-xl font-serif text-stone-800">Artist Profiles</h2>
                  <p className="text-sm text-stone-500 font-light max-w-3xl">
                    Manage artists shown on your site. Each profile supports contact fields, links, and a profile photo URL.
                    Upload a photo to cloud storage and the URL is filled automatically.
                  </p>
                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group max-w-2xl">
                      <input
                        type="checkbox"
                        checked={showArtistsPage}
                        onChange={(e) => setShowArtistsPage(e.target.checked)}
                        className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                      />
                      <span>
                        <span className="text-sm font-medium text-stone-800 block">
                          Show Artists page on public site
                        </span>
                        <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">
                          Synced with General Settings. When enabled, a public Artists page appears in navigation.
                        </span>
                      </span>
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddArtistModal(true)}
                      className={adminActionButtonClass}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add artist profile
                    </button>
                    <button
                      type="button"
                      onClick={loadDefaultArtistProfiles}
                      disabled={saving}
                      className={adminActionButtonClass}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} /> Load values from defaults
                    </button>
                    <button
                      type="button"
                      onClick={loadArtistProfilesFromCloud}
                      disabled={cloudActionDisabled || !cloudReadable.artistprofiles}
                      className={adminActionButtonClass}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Load from cloud
                    </button>
                    <button
                      type="button"
                      onClick={pushArtistProfilesToDatabase}
                      disabled={cloudActionDisabled}
                      className={adminActionButtonClass}
                    >
                      <Upload className="w-3.5 h-3.5" /> Push to Cloud
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setJsonModalData(
                          artistProfiles.map(({ id: _id, isLocal: _isLocal, ...rest }) => rest)
                        )
                      }
                      className={adminSecondaryActionButtonClass}
                    >
                      <Code className="w-3.5 h-3.5" /> Source Code
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {artistProfiles.length === 0 ? (
                    <p className="text-sm text-stone-400 italic py-8 text-center border border-dashed border-stone-200 rounded-2xl">
                      No artist profiles yet. Load defaults or add a profile.
                    </p>
                  ) : (
                    <div className="admin-tablet-card-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {artistProfiles.map((artist, index) => {
                        const displayName = `${artist.firstName} ${artist.lastName}`.trim() || 'Unnamed artist';
                        return (
                          <div
                            key={artist.id}
                            className={`admin-tablet-card rounded-2xl border p-4 space-y-4 transition-all duration-500 hover:shadow-lg ${
                              artist.enabled === false
                                ? 'bg-stone-100 border-stone-200 opacity-50 saturate-0'
                                : 'bg-white border-stone-100'
                            }`}
                          >
                            <div className="aspect-[4/5] rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                              {artist.profilePhotoLink ? (
                                <img
                                  src={resolveMediaSrc(artist.profilePhotoLink, 'artist', mediaStorageRoot)}
                                  alt={displayName}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-stone-400 uppercase tracking-widest font-bold">
                                  No photo
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-lg font-serif text-stone-900 leading-tight">{displayName}</h3>
                              <p className="text-xs text-stone-500">{artist.instagramHandle || 'No Instagram handle'}</p>
                              {artist.specialty ? <p className="text-xs text-gold font-semibold">{artist.specialty}</p> : null}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => moveArtistProfile(artist.id, 'up')}
                                disabled={index === 0}
                                className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-bold tracking-widest text-stone-500 hover:text-stone-900 transition-colors uppercase disabled:opacity-40"
                                title="Move profile earlier"
                              >
                                <span className="hidden sm:inline"><ArrowLeft className="h-4 w-4" /></span>
                                <span className="sm:hidden"><ArrowUp className="h-4 w-4" /></span>
                              </button>
                              <button
                                type="button"
                                onClick={() => moveArtistProfile(artist.id, 'down')}
                                disabled={index === artistProfiles.length - 1}
                                className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-bold tracking-widest text-stone-500 hover:text-stone-900 transition-colors uppercase disabled:opacity-40"
                                title="Move profile later"
                              >
                                <span className="hidden sm:inline"><ArrowRight className="h-4 w-4" /></span>
                                <span className="sm:hidden"><ArrowDown className="h-4 w-4" /></span>
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleArtistProfileEnabled(artist.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors border ${
                                  artist.enabled === false
                                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                    : 'bg-stone-50 text-stone-500 border-stone-200 hover:text-stone-900'
                                }`}
                              >
                                {artist.enabled === false ? 'Enable Profile' : 'Disable Profile'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingArtistProfileId(artist.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-bold tracking-widest text-stone-400 hover:text-stone-900 transition-colors uppercase"
                              >
                                <Edit3 className="h-4 w-4" /> Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteArtistProfile(artist.id)}
                                disabled={saving}
                                className="flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {showAddArtistModal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="admin-global-modal-backdrop fixed inset-0 z-[1200] bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-6 md:p-10"
                    >
                      <motion.div
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-stone-200 shadow-2xl flex flex-col"
                      >
                        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                          <h3 className="text-xl font-serif text-stone-900">Add Artist Profile</h3>
                          <button
                            type="button"
                            onClick={() => setShowAddArtistModal(false)}
                            className="p-2 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                                First name
                              </span>
                              <input value={newArtistProfile.firstName} onChange={(e) => updateNewArtistProfileField('firstName', e.target.value)} placeholder="First name" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                                Last name
                              </span>
                              <input value={newArtistProfile.lastName} onChange={(e) => updateNewArtistProfileField('lastName', e.target.value)} placeholder="Last name" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                                Instagram handle
                              </span>
                              <input value={newArtistProfile.instagramHandle} onChange={(e) => updateNewArtistProfileField('instagramHandle', e.target.value)} placeholder="@handle" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                                Email
                              </span>
                              <input value={newArtistProfile.email} onChange={(e) => updateNewArtistProfileField('email', e.target.value)} placeholder="Email" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                                Booking website link
                              </span>
                              <input value={newArtistProfile.bookingWebsiteLink} onChange={(e) => updateNewArtistProfileField('bookingWebsiteLink', e.target.value)} placeholder="https://…" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                                Personal website link
                              </span>
                              <input value={newArtistProfile.personalWebsiteLink} onChange={(e) => updateNewArtistProfileField('personalWebsiteLink', e.target.value)} placeholder="https://…" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                                Phone number
                              </span>
                              <input value={newArtistProfile.phoneNumber} onChange={(e) => updateNewArtistProfileField('phoneNumber', e.target.value)} placeholder="Phone number" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                                Profile photo file name or URL
                              </span>
                              <input value={newArtistProfile.profilePhotoLink} onChange={(e) => updateNewArtistProfileField('profilePhotoLink', e.target.value)} placeholder="e.g. dennis.jpg (or https://...)" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                                Specialty
                              </span>
                              <input value={newArtistProfile.specialty} onChange={(e) => updateNewArtistProfileField('specialty', e.target.value)} placeholder="Short line shown on the card" className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                                Bio
                              </span>
                              <textarea value={newArtistProfile.bio} onChange={(e) => updateNewArtistProfileField('bio', e.target.value)} placeholder="Longer bio; HTML allowed where supported" rows={4} className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200 resize-y" />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                              Profile photo file
                            </span>
                          <label className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 transition-colors hover:border-gold/40 hover:text-gold cursor-pointer">
                            <ImagePlus className="h-4 w-4" />
                            {uploadingPhotoFor === 'new' ? 'Uploading...' : 'Upload profile photo'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void uploadPhotoForNewArtist(file);
                                e.currentTarget.value = '';
                              }}
                            />
                          </label>
                          </div>
                        </div>

                        <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setShowAddArtistModal(false)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-200 text-[10px] font-bold tracking-widest uppercase text-stone-500 hover:bg-stone-100 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={addArtistProfile}
                            disabled={saving || !newArtistProfileValid}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-gold transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" /> Add artist
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {editingArtistProfile && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="admin-inquiry-modal-backdrop fixed inset-0 z-[1200] flex items-center justify-center p-6 md:p-10"
                    >
                      <motion.div
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-stone-200 shadow-2xl flex flex-col"
                      >
                        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                          <h3 className="text-xl font-serif text-stone-900">Edit Artist Profile</h3>
                          <button
                            type="button"
                            onClick={() => setEditingArtistProfileId(null)}
                            className="p-2 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input value={editingArtistProfile.firstName} onChange={(e) => updateArtistProfileField(editingArtistProfile.id, 'firstName', e.target.value)} placeholder="First name" className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            <input value={editingArtistProfile.lastName} onChange={(e) => updateArtistProfileField(editingArtistProfile.id, 'lastName', e.target.value)} placeholder="Last name" className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            <input value={editingArtistProfile.instagramHandle} onChange={(e) => updateArtistProfileField(editingArtistProfile.id, 'instagramHandle', e.target.value)} placeholder="Instagram handle" className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            <input value={editingArtistProfile.email} onChange={(e) => updateArtistProfileField(editingArtistProfile.id, 'email', e.target.value)} placeholder="Email" className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            <input value={editingArtistProfile.bookingWebsiteLink} onChange={(e) => updateArtistProfileField(editingArtistProfile.id, 'bookingWebsiteLink', e.target.value)} placeholder="Booking website link" className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            <input value={editingArtistProfile.personalWebsiteLink} onChange={(e) => updateArtistProfileField(editingArtistProfile.id, 'personalWebsiteLink', e.target.value)} placeholder="Personal website link" className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            <input value={editingArtistProfile.phoneNumber} onChange={(e) => updateArtistProfileField(editingArtistProfile.id, 'phoneNumber', e.target.value)} placeholder="Phone number" className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            <input value={editingArtistProfile.profilePhotoLink} onChange={(e) => updateArtistProfileField(editingArtistProfile.id, 'profilePhotoLink', e.target.value)} placeholder="e.g. dennis.jpg (or https://...)" className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            <input value={editingArtistProfile.specialty} onChange={(e) => updateArtistProfileField(editingArtistProfile.id, 'specialty', e.target.value)} placeholder="Specialty" className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200" />
                            <textarea value={editingArtistProfile.bio} onChange={(e) => updateArtistProfileField(editingArtistProfile.id, 'bio', e.target.value)} placeholder="Bio" rows={4} className="md:col-span-2 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200 resize-y" />
                          </div>

                          <label className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 transition-colors hover:border-gold/40 hover:text-gold cursor-pointer">
                            <ImagePlus className="h-4 w-4" />
                            {uploadingPhotoFor === editingArtistProfile.id ? 'Uploading...' : 'Upload/Change photo'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void uploadPhotoForExistingArtist(editingArtistProfile.id, file);
                                e.currentTarget.value = '';
                              }}
                            />
                          </label>
                        </div>

                        <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingArtistProfileId(null)}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-gold transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="mb-8 space-y-4">
                  <h2 className="text-xl font-serif text-stone-800">Recommended Products</h2>
                  <p className="text-sm text-stone-500 font-light max-w-3xl">
                    Manage storefront lists on the public Recommended Products page: title, item count, hero image,
                    and Amazon (or other) shop link. Upload an image to cloud storage and the URL is filled
                    automatically.
                  </p>
                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group max-w-2xl">
                      <input
                        type="checkbox"
                        checked={showProductsPage}
                        onChange={(e) => setShowProductsPage(e.target.checked)}
                        className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                      />
                      <span>
                        <span className="text-sm font-medium text-stone-800 block">
                          Show Products page on public site
                        </span>
                        <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">
                          Synced with General Settings. Turn this on to show Recommended Products in navigation.
                        </span>
                      </span>
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddProductModal(true)}
                      className={adminActionButtonClass}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add storefront list
                    </button>
                    <button
                      type="button"
                      onClick={loadDefaultProducts}
                      disabled={saving}
                      className={adminActionButtonClass}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} /> Load values from defaults
                    </button>
                    <button
                      type="button"
                      onClick={loadProductsFromCloud}
                      disabled={cloudActionDisabled || !cloudReadable.products}
                      className={adminActionButtonClass}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Load from cloud
                    </button>
                    <button
                      type="button"
                      onClick={pushProductsToCloud}
                      disabled={cloudActionDisabled}
                      className={adminActionButtonClass}
                    >
                      <Upload className="w-3.5 h-3.5" /> Push to Cloud
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setJsonModalData(
                          productCategories.map(({ id: _id, isLocal: _isLocal, ...rest }) => rest)
                        )
                      }
                      className={adminSecondaryActionButtonClass}
                    >
                      <Code className="w-3.5 h-3.5" /> Source Code
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {productCategories.length === 0 ? (
                    <p className="text-sm text-stone-400 italic py-8 text-center border border-dashed border-stone-200 rounded-2xl">
                      No storefront lists yet. Load defaults or add a list.
                    </p>
                  ) : (
                    <div className="admin-tablet-card-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {productCategories.map((row, index) => (
                        <div
                          key={row.id}
                          className={`admin-tablet-card rounded-2xl border p-4 space-y-4 transition-all duration-500 hover:shadow-lg ${
                            row.enabled === false
                              ? 'bg-stone-100 border-stone-200 opacity-50 saturate-0'
                              : 'bg-white border-stone-100'
                          }`}
                        >
                          <div className="aspect-[4/5] rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                            {row.image ? (
                              <img
                                src={resolveMediaSrc(row.image, 'products', mediaStorageRoot)}
                                alt={row.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-stone-400 uppercase tracking-widest font-bold">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-lg font-serif text-stone-900 leading-tight">{row.title || 'Untitled'}</h3>
                            <p className="text-xs text-stone-500">
                              {row.count} items · {row.link ? 'Link set' : 'No link'}
                            </p>
                            {row.slug ? (
                              <p className="text-[10px] uppercase tracking-widest text-stone-400">slug: {row.slug}</p>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => moveProductCategory(row.id, 'up')}
                              disabled={index === 0}
                              className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-bold tracking-widest text-stone-500 hover:text-stone-900 transition-colors uppercase disabled:opacity-40"
                              title="Move earlier"
                            >
                              <span className="hidden sm:inline">
                                <ArrowLeft className="h-4 w-4" />
                              </span>
                              <span className="sm:hidden">
                                <ArrowUp className="h-4 w-4" />
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => moveProductCategory(row.id, 'down')}
                              disabled={index === productCategories.length - 1}
                              className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-bold tracking-widest text-stone-500 hover:text-stone-900 transition-colors uppercase disabled:opacity-40"
                              title="Move later"
                            >
                              <span className="hidden sm:inline">
                                <ArrowRight className="h-4 w-4" />
                              </span>
                              <span className="sm:hidden">
                                <ArrowDown className="h-4 w-4" />
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleProductCategoryEnabled(row.id)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors border ${
                                row.enabled === false
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                  : 'bg-stone-50 text-stone-500 border-stone-200 hover:text-stone-900'
                              }`}
                            >
                              {row.enabled === false ? 'Enable' : 'Disable'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProductCategoryId(row.id)}
                              className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-bold tracking-widest text-stone-400 hover:text-stone-900 transition-colors uppercase"
                            >
                              <Edit3 className="h-4 w-4" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProductCategory(row.id)}
                              disabled={saving}
                              className="flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {showAddProductModal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="admin-global-modal-backdrop fixed inset-0 z-[1200] bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-6 md:p-10"
                    >
                      <motion.div
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-stone-200 shadow-2xl flex flex-col"
                      >
                        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                          <h3 className="text-xl font-serif text-stone-900">Add storefront list</h3>
                          <button
                            type="button"
                            onClick={() => setShowAddProductModal(false)}
                            className="p-2 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                                Slug
                              </span>
                              <input
                                value={newProductCategory.slug}
                                onChange={(e) => updateNewProductCategoryField('slug', e.target.value)}
                                placeholder="Optional; auto from title if empty"
                                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                                Title
                              </span>
                              <input
                                value={newProductCategory.title}
                                onChange={(e) => updateNewProductCategoryField('title', e.target.value)}
                                placeholder="List title"
                                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200"
                              />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                                Item count
                              </span>
                              <input
                                type="number"
                                min={0}
                                value={newProductCategory.count}
                                onChange={(e) =>
                                  updateNewProductCategoryField('count', Number.parseInt(e.target.value, 10) || 0)
                                }
                                placeholder="0"
                                className="w-full max-w-xs rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200"
                              />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                                Hero image file name or URL
                              </span>
                              <input
                                value={newProductCategory.image}
                                onChange={(e) => updateNewProductCategoryField('image', e.target.value)}
                                placeholder="e.g. olaplex.jpg (or https://...)"
                                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200"
                              />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                                Shop / list URL
                              </span>
                              <input
                                value={newProductCategory.link}
                                onChange={(e) => updateNewProductCategoryField('link', e.target.value)}
                                placeholder="Amazon list, shop, etc."
                                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                              Hero image file
                            </span>
                          <label className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 transition-colors hover:border-gold/40 hover:text-gold cursor-pointer">
                            <ImagePlus className="h-4 w-4" />
                            {uploadingProductPhotoFor === 'new' ? 'Uploading...' : 'Upload hero image'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void uploadPhotoForNewProductCategory(file);
                                e.currentTarget.value = '';
                              }}
                            />
                          </label>
                          </div>
                        </div>

                        <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setShowAddProductModal(false)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-200 text-[10px] font-bold tracking-widest uppercase text-stone-500 hover:bg-stone-100 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={addProductCategory}
                            disabled={saving || !newProductCategoryValid}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-gold transition-colors disabled:opacity-50"
                          >
                            <Plus className="w-4 h-4" /> Add list
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {editingProductCategory && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="admin-global-modal-backdrop fixed inset-0 z-[1200] bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-6 md:p-10"
                    >
                      <motion.div
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-stone-200 shadow-2xl flex flex-col"
                      >
                        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                          <h3 className="text-xl font-serif text-stone-900">Edit storefront list</h3>
                          <button
                            type="button"
                            onClick={() => setEditingProductCategoryId(null)}
                            className="p-2 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              value={editingProductCategory.slug}
                              onChange={(e) =>
                                updateProductCategoryField(editingProductCategory.id, 'slug', e.target.value)
                              }
                              placeholder="Slug"
                              className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200"
                            />
                            <input
                              value={editingProductCategory.title}
                              onChange={(e) =>
                                updateProductCategoryField(editingProductCategory.id, 'title', e.target.value)
                              }
                              placeholder="Title"
                              className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200"
                            />
                            <input
                              type="number"
                              min={0}
                              value={editingProductCategory.count}
                              onChange={(e) =>
                                updateProductCategoryField(
                                  editingProductCategory.id,
                                  'count',
                                  Number.parseInt(e.target.value, 10) || 0
                                )
                              }
                              placeholder="Item count"
                              className="rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200"
                            />
                            <input
                              value={editingProductCategory.image}
                              onChange={(e) =>
                                updateProductCategoryField(editingProductCategory.id, 'image', e.target.value)
                              }
                              placeholder="e.g. olaplex.jpg (or https://...)"
                              className="md:col-span-2 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200"
                            />
                            <input
                              value={editingProductCategory.link}
                              onChange={(e) =>
                                updateProductCategoryField(editingProductCategory.id, 'link', e.target.value)
                              }
                              placeholder="Shop / list URL"
                              className="md:col-span-2 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200"
                            />
                          </div>

                          <label className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 transition-colors hover:border-gold/40 hover:text-gold cursor-pointer">
                            <ImagePlus className="h-4 w-4" />
                            {uploadingProductPhotoFor === editingProductCategory.id
                              ? 'Uploading...'
                              : 'Upload/Change image'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void uploadPhotoForExistingProductCategory(editingProductCategory.id, file);
                                e.currentTarget.value = '';
                              }}
                            />
                          </label>
                        </div>

                        <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingProductCategoryId(null)}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-gold transition-colors"
                          >
                            Close
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {activeTab === 'inquiries' && (
              <motion.div 
                key="inquiries"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center mb-12">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-serif text-stone-900">Direct Inquiries</h2>
                    <p className="text-stone-400 text-xs tracking-wide uppercase font-bold">Client communication stream</p>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap justify-end">
                    <div className="inline-flex rounded-xl border border-stone-200 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => {
                          setInquiriesView('inbox');
                          setSelectedInquiryId(null);
                        }}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                          inquiriesView === 'inbox'
                            ? 'bg-stone-900 text-white'
                            : 'bg-white text-stone-500 hover:text-stone-900'
                        }`}
                      >
                        Inbox ({inboxInquiries.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInquiriesView('trash');
                          setSelectedInquiryId(null);
                        }}
                        className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                          inquiriesView === 'trash'
                            ? 'bg-stone-900 text-white'
                            : 'bg-white text-stone-500 hover:text-stone-900'
                        }`}
                      >
                        Trash ({trashInquiries.length})
                      </button>
                    </div>
                    <span className="px-4 py-2 bg-stone-100 rounded-full text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                       {inquiriesView === 'inbox' ? inboxInquiries.length : trashInquiries.length} Total Messages
                    </span>
                    <select
                      value={inquiriesSort}
                      onChange={(e) => setInquiriesSort(e.target.value as 'date_desc' | 'name_asc' | 'email_asc')}
                      className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-[10px] font-bold uppercase tracking-widest text-stone-500 focus:outline-none focus:ring-1 focus:ring-gold"
                    >
                      <option value="date_desc">Sort: Date</option>
                      <option value="name_asc">Sort: Name</option>
                      <option value="email_asc">Sort: Email</option>
                    </select>
                    {inquiriesView === 'trash' && (
                      <button
                        type="button"
                        onClick={() => void emptyInquiryTrash()}
                        disabled={saving || trashInquiries.length === 0}
                        className="px-4 py-2 rounded-xl border border-red-200 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        Empty Trash
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  {sortedVisibleInquiries.length === 0 ? (
                    <div className="py-24 text-center space-y-4 bg-stone-50 rounded-3xl border border-dashed border-stone-200">
                      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-300">
                        <MessageSquare className="w-8 h-8" />
                      </div>
                      <p className="text-stone-400 font-serif italic text-lg">
                        {inquiriesView === 'inbox' ? 'Your inbox is pristine.' : 'Trash is empty.'}
                      </p>
                      <p className="text-[10px] text-stone-400 uppercase tracking-widest">
                        {inquiriesView === 'inbox' ? 'No client inquiries found yet.' : 'No deleted inquiries.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white border border-stone-100 rounded-3xl overflow-hidden">
                        <div className="h-[24rem] overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-stone-100 sticky top-0 z-10">
                              <tr className="text-left text-[10px] uppercase tracking-widest text-stone-500">
                                <th className="px-4 py-2 font-bold">Name</th>
                                <th className="px-4 py-2 font-bold">Message</th>
                                <th className="px-4 py-2 font-bold">Date & Time</th>
                                <th className="px-4 py-2 font-bold">Email</th>
                                <th className="px-4 py-2 font-bold text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sortedVisibleInquiries.map((inq: any) => {
                                const isSelected = selectedInquiryId === inq.id;
                                const dateTime = inq.createdAt?.seconds
                                  ? (() => {
                                      const d = new Date(inq.createdAt.seconds * 1000);
                                      const yyyy = String(d.getFullYear());
                                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                                      const dd = String(d.getDate()).padStart(2, '0');
                                      const hh = String(d.getHours()).padStart(2, '0');
                                      const min = String(d.getMinutes()).padStart(2, '0');
                                      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
                                    })()
                                  : 'Syncing...';
                                return (
                                  <tr
                                    key={inq.id}
                                    onClick={() => {
                                      setSelectedInquiryId(inq.id);
                                      if (inquiriesView === 'inbox') void markInquiryAsRead(inq.id);
                                    }}
                                    className={`cursor-pointer border-t border-stone-100 ${
                                      isSelected
                                        ? 'bg-stone-900 text-white'
                                        : inq.read === true
                                          ? 'bg-stone-50 text-stone-500 hover:bg-stone-100'
                                          : 'bg-white text-stone-900 hover:bg-stone-50'
                                    }`}
                                  >
                                    <td className="px-4 py-2 font-serif whitespace-nowrap">
                                      {inquiriesView === 'inbox' && inq.read !== true ? '● ' : ''}{inq.name || 'Unknown sender'}
                                    </td>
                                    <td className={`px-4 py-2 max-w-[34ch] truncate ${isSelected ? 'text-stone-200' : ''}`}>
                                      {String(inq.message || '').replace(/\s+/g, ' ')}
                                    </td>
                                    <td className={`px-4 py-2 whitespace-nowrap font-mono text-xs ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                                      {dateTime}
                                    </td>
                                    <td className={`px-4 py-2 max-w-[28ch] truncate ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                                      {inq.email || 'No email'}
                                    </td>
                                    <td className="px-4 py-2">
                                      <div className="flex justify-end gap-1">
                                        {inquiriesView === 'inbox' ? (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              void deleteInquiry(inq.id);
                                            }}
                                            className={`p-1.5 rounded-md transition-colors ${
                                              isSelected
                                                ? 'text-stone-300 hover:text-red-300 hover:bg-stone-800'
                                                : 'text-stone-300 hover:text-red-500 hover:bg-red-50'
                                            }`}
                                            title="Move to trash"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        ) : (
                                          <>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                void restoreInquiryFromTrash(inq.id);
                                              }}
                                              className={`p-1.5 rounded-md transition-colors ${
                                                isSelected
                                                  ? 'text-stone-300 hover:text-white hover:bg-stone-800'
                                                  : 'text-stone-300 hover:text-stone-700 hover:bg-stone-100'
                                              }`}
                                              title="Restore to inbox"
                                            >
                                              <RotateCcw className="w-4 h-4" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                void permanentlyDeleteInquiry(inq.id);
                                              }}
                                              className={`p-1.5 rounded-md transition-colors ${
                                                isSelected
                                                  ? 'text-stone-300 hover:text-red-300 hover:bg-stone-800'
                                                  : 'text-stone-300 hover:text-red-500 hover:bg-red-50'
                                              }`}
                                              title="Delete permanently"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {typeof document !== 'undefined' && selectedInquiry
                  ? createPortal(
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="admin-inquiry-modal-backdrop fixed inset-0 z-[1200] flex items-center justify-center p-6 md:p-10"
                      >
                        <motion.div
                          initial={{ scale: 0.96, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden border border-stone-200 shadow-2xl flex flex-col"
                        >
                          <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                            <h3 className="text-xl font-serif text-stone-900">Inquiry Details</h3>
                            <button
                              type="button"
                              onClick={() => setSelectedInquiryId(null)}
                              className="p-2 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                              <div className="md:col-span-4 space-y-6 md:border-r md:border-stone-200 md:pr-8">
                                <div className="space-y-1">
                                  <h4 className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">Sender</h4>
                                  <p className="text-stone-900 font-serif text-lg">{selectedInquiry.name || 'Unknown sender'}</p>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">Email</h4>
                                  <p className="text-stone-700 text-sm font-light select-all">{selectedInquiry.email || 'No email'}</p>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">Received</h4>
                                  <div className="flex items-center gap-2 text-stone-500 text-[10px] font-bold">
                                    <ClockIcon className="w-3 h-3" />
                                    {selectedInquiry.createdAt?.seconds
                                      ? new Date(selectedInquiry.createdAt.seconds * 1000).toLocaleString()
                                      : 'Syncing...'}
                                  </div>
                                </div>
                              </div>
                              <div className="md:col-span-8 flex flex-col justify-between gap-6">
                                <div className="space-y-3">
                                  <h4 className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">Message</h4>
                                  <p className="text-sm font-light leading-relaxed whitespace-pre-wrap italic text-stone-800">
                                    "{selectedInquiry.message}"
                                  </p>
                                </div>
                                <div className="pt-6 border-t border-stone-200 flex justify-between items-center gap-4">
                                  <span className="text-[9px] text-stone-300 uppercase tracking-widest">Source: {selectedInquiry.source || 'General'}</span>
                                  <a
                                    href={`mailto:${selectedInquiry.email}?subject=Re: theSchneider.hair Inquiry`}
                                    className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-gold transition-colors"
                                  >
                                    <Mail className="w-3.5 h-3.5" /> Reply Direct
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>,
                      document.body
                    )
                  : null}
              </motion.div>
            )}

            {activeTab === 'marketingSiteCopy' && (
              <motion.div
                key="marketingSiteCopy"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-serif text-stone-900">Display Text On Page</h2>
                  <p className="text-sm text-stone-500 font-light max-w-2xl">
                    Public marketing strings (navigation, home sections, education page, products page, admin login labels).
                    Legal and terms pages stay in repository JSON only. Cloud document:{' '}
                    <code className="text-xs bg-stone-100 px-1 rounded">sitecopy/en</code>. Local fallback file:{' '}
                    <code className="text-xs bg-stone-100 px-1 rounded">public/data/site-copy.en.json</code>.
                  </p>
                </div>
                {marketingSiteCopyNotice ? (
                  <p className="text-sm text-stone-600 font-light">{marketingSiteCopyNotice}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      if (
                        !confirm(
                          'Load shipped marketing defaults from the app bundle into this editor? This replaces any unsaved changes in the JSON editor.'
                        )
                      ) {
                        return;
                      }
                      setMarketingSiteCopyJson(JSON.stringify(bundledMarketingDefault, null, 2));
                      setMarketingSiteCopyEditorKey((k) => k + 1);
                      setMarketingSiteCopyNotice('');
                      alert('Marketing copy loaded from local defaults. Push to Cloud to publish.');
                    }}
                    className={adminActionButtonClass}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} /> Load values from defaults
                  </button>
                  <button
                    type="button"
                    disabled={cloudActionDisabled || !cloudReadable.sitecopy}
                    onClick={async () => {
                      if (!firebaseConnected) {
                        alert('Cloud is not connected.');
                        return;
                      }
                      if (
                        !confirm(
                          'Load marketing copy from Firestore (sitecopy/en) into this editor? This replaces the current editor contents. Missing keys are filled from the app bundle.'
                        )
                      ) {
                        return;
                      }
                      setSaving(true);
                      try {
                        const data = await fetchMarketingSiteCopyMergedFromFirestore();
                        if (!data) {
                          alert(
                            'No valid sitecopy/en in cloud (or unreachable). Try defaults, then edit and push.'
                          );
                          return;
                        }
                        setMarketingSiteCopyJson(JSON.stringify(data, null, 2));
                        setMarketingSiteCopyEditorKey((k) => k + 1);
                        setMarketingSiteCopyNotice('');
                        alert('Marketing copy loaded from cloud.');
                      } catch {
                        setCloudReadable((prev) => ({ ...prev, sitecopy: false }));
                        alert('Could not load from cloud.');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className={adminActionButtonClass}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} /> Load from cloud
                  </button>
                  <button
                    type="button"
                    disabled={cloudActionDisabled}
                    onClick={async () => {
                      if (!firebaseConnected) {
                        alert('Cloud is not connected.');
                        return;
                      }
                      let parsed: unknown;
                      try {
                        parsed = JSON.parse(marketingSiteCopyJson);
                      } catch {
                        alert('Invalid JSON.');
                        return;
                      }
                      if (!isValidMarketingSiteCopyPayload(parsed)) {
                        alert('Payload must look like English marketing copy (locale "en" and brand.siteName).');
                        return;
                      }
                      if (
                        !confirm(
                          'Push current marketing copy to Firestore as sitecopy/en? This overwrites the stored document.'
                        )
                      ) {
                        return;
                      }
                      setSaving(true);
                      try {
                        await setDoc(doc(db, 'sitecopy', 'en'), {
                          ...parsed,
                          updatedAt: serverTimestamp(),
                        });
                        emitMarketingSiteCopyUpdated();
                        setDataSources((prev) => ({ ...prev, sitecopy: 'firebase' }));
                        setMarketingSiteCopyNotice('');
                        alert(
                          'Marketing site copy pushed to cloud successfully. The public site picks up changes on reload (or when content source uses cloud).'
                        );
                      } catch (e) {
                        alert('Push to cloud failed for marketing site copy.');
                        handleFirestoreError(e, 'write', 'sitecopy/en');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className={adminActionButtonClass}
                  >
                    <Upload className="w-3.5 h-3.5" /> Push to Cloud
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        setJsonModalData(JSON.parse(marketingSiteCopyJson));
                      } catch {
                        alert('Invalid JSON — fix the editor before opening source view.');
                      }
                    }}
                    className={adminSecondaryActionButtonClass}
                  >
                    <Code className="w-3.5 h-3.5" /> Source Code
                  </button>
                </div>
                <p className="text-[11px] text-stone-500 font-light">
                  Push requires a signed-in admin and reachable Firestore. Use General → content source if the public site
                  should read local JSON instead of cloud.
                </p>
                <div className="space-y-2 max-w-5xl">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">
                    JSON editor (tree / code / text / preview)
                  </span>
                  <div key={marketingSiteCopyEditorKey}>
                    <MarketingSiteCopyJsonEditor
                      value={marketingSiteCopyJson}
                      onChangeText={setMarketingSiteCopyJson}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'siteLocation' && (
              <motion.div
                key="siteLocation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-serif text-stone-900">Location Settings</h2>
                  <p className="text-sm text-stone-500 font-light max-w-2xl">
                    Homepage location block and footer hours / address. Changes save automatically in this browser after a short pause (not synced to cloud).
                  </p>
                </div>
                <div className="max-w-3xl space-y-6 bg-stone-50 rounded-3xl p-8 border border-stone-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block space-y-2">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">Heading line 1</span>
                      <input
                        type="text"
                        value={siteLocationDraft.headingLine1}
                        onChange={(e) => setSiteLocationDraft((d) => ({ ...d, headingLine1: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 text-sm border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">Heading line 2</span>
                      <input
                        type="text"
                        value={siteLocationDraft.headingLine2}
                        onChange={(e) => setSiteLocationDraft((d) => ({ ...d, headingLine2: e.target.value }))}
                        className="w-full rounded-xl px-4 py-3 text-sm border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-gold"
                      />
                    </label>
                  </div>
                  <label className="block space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">Address (shown in location + footer)</span>
                    <textarea
                      value={siteLocationDraft.address}
                      onChange={(e) => setSiteLocationDraft((d) => ({ ...d, address: e.target.value }))}
                      rows={3}
                      className="w-full rounded-xl px-4 py-3 text-sm border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-gold font-light"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">Operating hours</span>
                    <textarea
                      value={siteLocationDraft.operatingHours}
                      onChange={(e) => setSiteLocationDraft((d) => ({ ...d, operatingHours: e.target.value }))}
                      rows={4}
                      className="w-full rounded-xl px-4 py-3 text-sm border border-stone-200 bg-white focus:outline-none focus:ring-1 focus:ring-gold font-light"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">Google Maps open URL (external link)</span>
                    <input
                      type="url"
                      value={siteLocationDraft.googleMapsOpenUrl}
                      onChange={(e) => setSiteLocationDraft((d) => ({ ...d, googleMapsOpenUrl: e.target.value }))}
                      className={`w-full rounded-xl px-4 py-3 text-sm border bg-white focus:outline-none focus:ring-1 focus:ring-gold ${
                        siteLocationDraft.googleMapsOpenUrl.trim() !== '' &&
                        !isValidHttpUrl(siteLocationDraft.googleMapsOpenUrl)
                          ? invalidFieldClass
                          : 'border-stone-200'
                      }`}
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400">Map embed URL (iframe src)</span>
                    <input
                      type="url"
                      value={siteLocationDraft.mapsIframeSrc}
                      onChange={(e) => setSiteLocationDraft((d) => ({ ...d, mapsIframeSrc: e.target.value }))}
                      placeholder="Leave blank to auto-build from address"
                      className={`w-full rounded-xl px-4 py-3 text-sm border bg-white focus:outline-none focus:ring-1 focus:ring-gold ${
                        siteLocationDraft.mapsIframeSrc.trim() !== '' && !isValidHttpUrl(siteLocationDraft.mapsIframeSrc)
                          ? invalidFieldClass
                          : 'border-stone-200'
                      }`}
                    />
                  </label>
                  <p className="text-[10px] text-stone-400 font-light pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...DEFAULT_LOCATION_SITE_EDITOR };
                        setSiteLocationDraft(next);
                        setLocationSiteEditorSettings(next);
                      }}
                      className="underline hover:text-stone-700"
                    >
                      Reset to shipped defaults
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'gallery' && (
              <motion.div
                key="gallery"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="mb-8 space-y-4">
                  <h2 className="text-xl font-serif text-stone-800">Gallery</h2>
                  <p className="text-sm text-stone-500 font-light max-w-3xl">
                    Homepage portfolio tiles only. Section headings on the public site are fixed in code. Data lives in{' '}
                    <code className="text-stone-600">public/data/gallery.json</code> and cloud document{' '}
                    <code className="text-stone-600">gallery/home</code>. Image paths (e.g. /portfolio-1.jpeg) or full https URLs.
                  </p>
                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group max-w-2xl">
                      <input
                        type="checkbox"
                        checked={showGallerySection}
                        onChange={(e) => setShowGallerySection(e.target.checked)}
                        className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                      />
                      <span>
                        <span className="text-sm font-medium text-stone-800 block">
                          Show gallery section on public site
                        </span>
                        <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">
                          Synced with General Settings. When disabled, the homepage portfolio block is hidden.
                        </span>
                      </span>
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={openGalleryAddModal} disabled={saving} className={adminActionButtonClass}>
                      <Plus className="w-3.5 h-3.5" /> Add portfolio image
                    </button>
                    <button
                      type="button"
                      onClick={loadDefaultGalleryHome}
                      disabled={saving}
                      className={adminActionButtonClass}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} /> Load values from defaults
                    </button>
                    <button
                      type="button"
                      onClick={loadGalleryFromCloud}
                      disabled={cloudActionDisabled || !cloudReadable.gallery}
                      className={adminActionButtonClass}
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Load from cloud
                    </button>
                    <button
                      type="button"
                      onClick={pushGalleryHomeToDatabase}
                      disabled={cloudActionDisabled}
                      className={adminActionButtonClass}
                    >
                      <Upload className="w-3.5 h-3.5" /> Push to Cloud
                    </button>
                    <button
                      type="button"
                      onClick={() => setJsonModalData(galleryHome)}
                      className={adminSecondaryActionButtonClass}
                    >
                      <Code className="w-3.5 h-3.5" /> Source Code
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {galleryHome.images.length === 0 ? (
                    <p className="text-sm text-stone-400 italic py-8 text-center border border-dashed border-stone-200 rounded-2xl">
                      No images. Add a tile or load defaults.
                    </p>
                  ) : (
                    <div className="admin-tablet-card-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {galleryHome.images.map((img, index) => (
                        <div
                          key={`${index}-${img.src}`}
                          className={`admin-tablet-card rounded-2xl border p-4 space-y-4 transition-all duration-500 hover:shadow-lg ${
                            img.enabled === false
                              ? 'bg-stone-100 border-stone-200 opacity-50 saturate-0'
                              : 'bg-white border-stone-100'
                          }`}
                        >
                          <div className="aspect-[4/5] rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                            <img
                              src={resolveGalleryImageSrc(img.src, mediaStorageRoot)}
                              alt={img.label || `Tile ${index + 1}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-lg font-serif text-stone-900 leading-tight">
                              {(img.label || 'Untitled').trim() || 'Untitled'}
                            </h3>
                            <p className="text-xs text-stone-500">
                              Order {img.order + 1} of {galleryHome.images.length} ·{' '}
                              {img.src.trim().includes('://') ? 'Remote URL' : 'Path set'} ·{' '}
                              {img.enabled === false ? 'Disabled' : 'Enabled'}
                            </p>
                            <p className="text-[10px] uppercase tracking-widest text-stone-400">
                              slug: {galleryTileDisplaySlug(img.src)}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => moveGalleryTile(index, 'up')}
                              disabled={index === 0}
                              className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-bold tracking-widest text-stone-500 hover:text-stone-900 transition-colors uppercase disabled:opacity-40"
                              title="Move earlier"
                            >
                              <span className="hidden sm:inline">
                                <ArrowLeft className="h-4 w-4" />
                              </span>
                              <span className="sm:hidden">
                                <ArrowUp className="h-4 w-4" />
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => moveGalleryTile(index, 'down')}
                              disabled={index === galleryHome.images.length - 1}
                              className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-bold tracking-widest text-stone-500 hover:text-stone-900 transition-colors uppercase disabled:opacity-40"
                              title="Move later"
                            >
                              <span className="hidden sm:inline">
                                <ArrowRight className="h-4 w-4" />
                              </span>
                              <span className="sm:hidden">
                                <ArrowDown className="h-4 w-4" />
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleGalleryTileEnabled(index)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-colors border ${
                                img.enabled === false
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                  : 'bg-stone-50 text-stone-500 border-stone-200 hover:text-stone-900'
                              }`}
                            >
                              {img.enabled === false ? 'Enable' : 'Disable'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openGalleryEditModal(index)}
                              className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-[10px] font-bold tracking-widest text-stone-400 hover:text-stone-900 transition-colors uppercase"
                            >
                              <Edit3 className="h-4 w-4" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteGalleryTileAt(index)}
                              disabled={saving}
                              className="flex items-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {showGalleryTileModal && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="admin-global-modal-backdrop fixed inset-0 z-[1200] bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-6 md:p-10"
                    >
                      <motion.div
                        initial={{ scale: 0.96, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.96, opacity: 0 }}
                        className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-stone-200 shadow-2xl flex flex-col"
                      >
                        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                          <h3 className="text-xl font-serif text-stone-900">
                            {editingGalleryIndex === null ? 'Add portfolio image' : 'Edit portfolio image'}
                          </h3>
                          <button
                            type="button"
                            onClick={closeGalleryTileModal}
                            className="p-2 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-4">
                          <div className="aspect-[16/10] max-h-48 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                            <img
                              src={resolveGalleryImageSrc(galleryFormDraft.src, mediaStorageRoot)}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                              Gallery image file name or URL
                            </span>
                            <input
                              type="text"
                              value={galleryFormDraft.src}
                              onChange={(e) => setGalleryFormDraft((d) => ({ ...d, src: e.target.value }))}
                              placeholder="e.g. portfolio-1.jpeg (or https://...)"
                              className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 ${
                                galleryFormDraft.src.trim() !== '' &&
                                galleryFormDraft.src.includes('://') &&
                                !isValidHttpUrl(galleryFormDraft.src.trim())
                                  ? invalidFieldClass
                                  : 'border-stone-200'
                              }`}
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                              Label
                            </span>
                            <input
                              type="text"
                              value={galleryFormDraft.label}
                              onChange={(e) => setGalleryFormDraft((d) => ({ ...d, label: e.target.value }))}
                              placeholder="Caption shown on hover"
                              className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold border bg-stone-50 border-stone-200"
                            />
                          </div>
                        </div>

                        <div className="p-6 border-t border-stone-100 bg-stone-50 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={closeGalleryTileModal}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-200 text-[10px] font-bold tracking-widest uppercase text-stone-500 hover:bg-stone-100 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={saveGalleryTileModal}
                            disabled={!galleryTileModalValid}
                            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-gold transition-colors disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            {editingGalleryIndex === null ? 'Add image' : 'Save changes'}
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {(activeTab === 'settings' || activeTab === 'externalWidgets') && (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                <div className="space-y-4">
                  <h2 className="text-3xl font-serif text-stone-900">
                    {activeTab === 'externalWidgets' ? 'External Widgets' : 'General Settings'}
                  </h2>
                  <p className="text-stone-400 text-xs tracking-wide uppercase font-bold">Global Application configuration</p>
                  <p className="text-sm text-stone-500 font-light max-w-2xl">
                    Configure global behavior for public visibility and admin experience.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={activeTab === 'externalWidgets' ? saveWidgets : saveSettings}
                      disabled={
                        activeTab === 'externalWidgets'
                          ? cloudActionDisabled ||
                            !bookingWidgetCompanyValid ||
                            !bookingWidgetScriptSrcValid ||
                            !paymentWidgetProductIdValid ||
                            (includeSocialSection && !taggboxWidgetIdValid)
                          : cloudActionDisabled || !settingsEmailValid
                      }
                      className={adminActionButtonClass}
                    >
                      {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Push to Cloud
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setJsonModalData(
                          activeTab === 'externalWidgets'
                            ? {
                                bookingProvider,
                                bookingWidgetCompany,
                                bookingWidgetScriptSrc,
                                showBookingWidget,
                                paymentWidgetProvider,
                                paymentWidgetProductId,
                                showPaymentWidget,
                                taggboxWidgetId,
                                showSocialWidget: includeSocialSection,
                              }
                            : {
                                contactEmail,
                                themeDefault,
                                mediaStorageRoot: normalizeMediaStorageRoot(mediaStorageRoot),
                                autoLogoutLeavingAdmin,
                                showThemeSelector,
                                showArtistsPage,
                                showProductsPage,
                                showReviewsSection,
                                showPricingSection,
                                roundPricesUpToWholeAmount,
                                showVideoSection,
                                showGallerySection,
                                showFaqPage,
                                showContactForm,
                              }
                        )
                      }
                      className={adminSecondaryActionButtonClass}
                    >
                      <Code className="w-3.5 h-3.5" /> Source Code
                    </button>
                  </div>
                </div>

                <div className="max-w-6xl columns-1 lg:columns-2 gap-6 [column-fill:balance]">
                  {activeTab === 'settings' && (
                  <div className="mb-6 break-inside-avoid bg-stone-50 rounded-3xl p-8 border border-stone-100 shadow-none hover:shadow-[0_22px_40px_-28px_rgba(28,25,23,0.42)] transition-shadow duration-300 space-y-5">
                    <div className="flex items-center gap-4 text-stone-800">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Mail className="w-5 h-5 text-gold" />
                      </div>
                      <h3 className="font-serif text-xl">Contact Form Configuration</h3>
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer group max-w-xl pb-2 border-b border-stone-100">
                        <input
                          type="checkbox"
                          checked={showContactForm}
                          onChange={(e) => setShowContactForm(e.target.checked)}
                          className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                        />
                        <span>
                          <span className="text-sm font-medium text-stone-800 block">Show contact form on webpage</span>
                          <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">
                            Controls whether the Education FAQ support contact call-to-action and modal are visible.
                          </span>
                        </span>
                      </label>
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1">Inquiry Notification Email</label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="primary@example.com"
                        className={`w-full rounded-xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-gold transition-all border ${
                          !settingsEmailValid ? invalidFieldClass : 'bg-white border-stone-200'
                        }`}
                      />
                      <p className="text-[10px] text-stone-400 font-light mt-2 italic">Messages from the FAQ contact form will be forwarded to this address via FormSubmit.</p>
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block pt-2">
                        Media storage root folder (optional)
                      </label>
                      <input
                        type="text"
                        value={mediaStorageRoot}
                        onChange={(e) => setMediaStorageRoot(normalizeMediaStorageRoot(e.target.value))}
                        placeholder='Leave empty for root; use "Images" for /Images/...'
                        className="w-full rounded-xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-gold transition-all border bg-white border-stone-200"
                      />
                      <p className="text-[10px] text-stone-400 font-light mt-2 italic">
                        File-name image inputs are expanded as BASE_URL + [root] + bucket folder (gallery / artist / products) + file name.
                      </p>
                    </div>
                  </div>
                  )}

                  {activeTab === 'externalWidgets' && (
                  <div className="mb-6 break-inside-avoid bg-stone-50 rounded-3xl p-8 border border-stone-100 shadow-none hover:shadow-[0_22px_40px_-28px_rgba(28,25,23,0.42)] transition-shadow duration-300 space-y-5">
                    <div className="flex items-center gap-4 text-stone-800">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Settings className="w-5 h-5 text-gold" />
                      </div>
                      <h3 className="font-serif text-xl">Booking Widget</h3>
                    </div>
                    <p className="text-[10px] text-stone-400 font-light italic">
                      Select the booking provider integration used by the public booking buttons. Default is Salonized.
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer group max-w-xl pb-2 border-b border-stone-100">
                        <input
                          type="checkbox"
                          checked={showBookingWidget}
                          onChange={(e) => setShowBookingWidget(e.target.checked)}
                          className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                        />
                        <span>
                          <span className="text-sm font-medium text-stone-800 block">Show booking widget on webpage</span>
                          <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">
                            When disabled, booking widget containers are hidden and booking buttons won’t open the provider widget.
                          </span>
                        </span>
                      </label>
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                        Booking provider
                      </label>
                      <div ref={bookingProviderMenuRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setBookingProviderMenuOpen((open) => !open)}
                          className="flex w-full items-center justify-between gap-2 rounded-xl border border-stone-800 bg-stone-800 px-6 py-4 text-left text-stone-100 transition-colors hover:bg-stone-700"
                          aria-expanded={bookingProviderMenuOpen}
                        >
                          <span className="truncate text-sm font-medium">
                            {selectableBookingProviderOptions.find((option) => option.id === bookingProvider)?.label ?? 'Salonized'}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-stone-400 transition-transform duration-300 ${bookingProviderMenuOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {bookingProviderMenuOpen && (
                          <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-xl">
                            {selectableBookingProviderOptions.map((option) => (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                  setBookingProvider(option.id);
                                  setBookingProviderMenuOpen(false);
                                }}
                                className={`flex w-full items-center px-4 py-2 text-left text-sm transition-colors ${
                                  bookingProvider === option.id
                                    ? 'bg-gold/10 text-stone-900'
                                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block pt-2">
                        Booking company ID
                      </label>
                      <input
                        type="text"
                        value={bookingWidgetCompany}
                        onChange={(e) => setBookingWidgetCompany(sanitizeBookingWidgetCompany(e.target.value))}
                        placeholder="m2yzkzSecfyaghBe93MNZGuc"
                        className={`w-full rounded-xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-gold transition-all border ${
                          !bookingWidgetCompanyValid ? invalidFieldClass : 'bg-white border-stone-200'
                        }`}
                      />
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block pt-2">
                        Booking script URL
                      </label>
                      <input
                        type="url"
                        value={bookingWidgetScriptSrc}
                        onChange={(e) => setBookingWidgetScriptSrc(e.target.value)}
                        placeholder="https://static-widget.salonized.com/loader.js"
                        className={`w-full rounded-xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-gold transition-all border ${
                          !bookingWidgetScriptSrcValid ? invalidFieldClass : 'bg-white border-stone-200'
                        }`}
                      />
                      <p className="text-[10px] text-stone-400 font-light mt-2 italic">
                        Use the provider dropdown and script URL that your booking service gives you. Example Salonized snippet:
                        <code className="text-stone-600"> {`<script src="https://static-widget.salonized.com/loader.js" async defer></script>`}</code>
                      </p>
                    </div>
                  </div>
                  )}

                  {activeTab === 'externalWidgets' && (
                  <div className="mb-6 break-inside-avoid bg-stone-50 rounded-3xl p-8 border border-stone-100 shadow-none hover:shadow-[0_22px_40px_-28px_rgba(28,25,23,0.42)] transition-shadow duration-300 space-y-5">
                    <div className="flex items-center gap-4 text-stone-800">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Download className="w-5 h-5 text-gold" />
                      </div>
                      <h3 className="font-serif text-xl">Payment Widget</h3>
                    </div>
                    <p className="text-[10px] text-stone-400 font-light italic">
                      Configure embedded payment widget provider and product id for the e-book area.
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-start gap-3 cursor-pointer group max-w-xl pb-2 border-b border-stone-100">
                        <input
                          type="checkbox"
                          checked={showPaymentWidget}
                          onChange={(e) => setShowPaymentWidget(e.target.checked)}
                          className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                        />
                        <span>
                          <span className="text-sm font-medium text-stone-800 block">Show payment widget on webpage</span>
                        </span>
                      </label>
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                        Payment provider
                      </label>
                      <div ref={paymentWidgetProviderMenuRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setPaymentWidgetProviderMenuOpen((open) => !open)}
                          className="flex w-full items-center justify-between gap-2 rounded-xl border border-stone-800 bg-stone-800 px-6 py-4 text-left text-stone-100 transition-colors hover:bg-stone-700"
                          aria-expanded={paymentWidgetProviderMenuOpen}
                        >
                          <span className="truncate text-sm font-medium">
                            {paymentWidgetProvider === 'payhip' ? 'Payhip' : 'Payhip'}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-stone-400 transition-transform duration-300 ${paymentWidgetProviderMenuOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {paymentWidgetProviderMenuOpen && (
                          <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentWidgetProvider('payhip');
                                setPaymentWidgetProviderMenuOpen(false);
                              }}
                              className="flex w-full items-center px-4 py-2 text-left text-sm transition-colors bg-gold/10 text-stone-900"
                            >
                              Payhip
                            </button>
                          </div>
                        )}
                      </div>
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block pt-2">
                        Product ID (data-product)
                      </label>
                      <input
                        type="text"
                        value={paymentWidgetProductId}
                        onChange={(e) => setPaymentWidgetProductId(sanitizePaymentWidgetProductId(e.target.value))}
                        placeholder="4GCTc"
                        className={`w-full rounded-xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-gold transition-all border ${
                          !paymentWidgetProductIdValid ? invalidFieldClass : 'bg-white border-stone-200'
                        }`}
                      />
                      <p className="text-[10px] text-stone-400 font-light mt-2 italic">
                        The Product ID is used in both <code className="text-stone-600">data-product</code> and the Payhip href path.
                      </p>
                    </div>
                  </div>
                  )}

                  {activeTab === 'settings' && (
                  <div className="mb-6 break-inside-avoid bg-stone-50 rounded-3xl p-8 border border-stone-100 shadow-none hover:shadow-[0_22px_40px_-28px_rgba(28,25,23,0.42)] transition-shadow duration-300 space-y-5">
                    <div className="flex items-center gap-4 text-stone-800">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Sun className="w-5 h-5 text-gold" />
                      </div>
                      <h3 className="font-serif text-xl">Theme</h3>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer group max-w-xl">
                      <input
                        type="checkbox"
                        checked={showThemeSelector}
                        onChange={(e) => setShowThemeSelector(e.target.checked)}
                        className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                      />
                      <span>
                        <span className="text-sm font-medium text-stone-800 block">
                          Show theme selector in public navbar
                        </span>
                        <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">
                          Controls whether visitors can use the light/dark switch in the top navigation.
                        </span>
                      </span>
                    </label>
                    <div className="space-y-3 pt-2">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                        Public site theme default
                      </label>
                      <p className="text-[10px] text-stone-400 font-light italic">
                        Used for new visitors who have not chosen light or dark with the header control. Shipped default is in{' '}
                        <code className="text-stone-600">public/data/settings.json</code>; Save pushes to cloud.
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setThemeDefault('light')}
                          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-bold tracking-widest uppercase border transition-all ${
                            themeDefault === 'light'
                              ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                              : 'bg-white border-stone-200 text-stone-500 hover:border-stone-400'
                          }`}
                        >
                          <Sun className="w-4 h-4" /> Light
                        </button>
                        <button
                          type="button"
                          onClick={() => setThemeDefault('dark')}
                          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-bold tracking-widest uppercase border transition-all ${
                            themeDefault === 'dark'
                              ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                              : 'bg-white border-stone-200 text-stone-500 hover:border-stone-400'
                          }`}
                        >
                          <Moon className="w-4 h-4" /> Dark
                        </button>
                      </div>
                    </div>
                  </div>
                  )}

                  {activeTab === 'settings' && (
                  <div className="mb-6 break-inside-avoid bg-stone-50 rounded-3xl p-8 border border-stone-100 shadow-none hover:shadow-[0_22px_40px_-28px_rgba(28,25,23,0.42)] transition-shadow duration-300 space-y-5">
                    <div className="flex items-center gap-4 text-stone-800">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <RefreshCw className="w-5 h-5 text-gold" />
                      </div>
                      <h3 className="font-serif text-xl">Content Source</h3>
                    </div>
                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">
                      Content data source
                    </label>
                    <p className="text-[10px] text-stone-400 font-light italic">
                      Choose where public content is read from across the site.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => void handleContentDataSourceToggle('firebase')}
                        className={`px-5 py-3 rounded-xl text-[10px] font-bold tracking-widest uppercase border transition-all ${
                          contentDataSourceModeState === 'firebase'
                            ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                            : 'bg-white border-stone-200 text-stone-500 hover:border-stone-400'
                        }`}
                      >
                        Cloud (live)
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleContentDataSourceToggle('local')}
                        className={`px-5 py-3 rounded-xl text-[10px] font-bold tracking-widest uppercase border transition-all ${
                          contentDataSourceModeState === 'local'
                            ? 'bg-stone-900 text-white border-stone-900 shadow-md'
                            : 'bg-white border-stone-200 text-stone-500 hover:border-stone-400'
                        }`}
                      >
                        Local JSON
                      </button>
                    </div>
                  </div>
                  )}

                  {activeTab === 'settings' && (
                  <div className="mb-6 break-inside-avoid bg-stone-50 rounded-3xl p-8 border border-stone-100 shadow-none hover:shadow-[0_22px_40px_-28px_rgba(28,25,23,0.42)] transition-shadow duration-300 space-y-5">
                    <div className="flex items-center gap-4 text-stone-800">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Star className="w-5 h-5 text-gold" />
                      </div>
                      <h3 className="font-serif text-xl">Public Visibility</h3>
                    </div>
                    <p className="text-[10px] text-stone-400 font-light italic">
                      Enable or disable public pages and sections. These toggles are synced with each matching admin panel.
                    </p>
                    <label className="flex items-start gap-3 cursor-pointer group max-w-xl">
                      <input
                        type="checkbox"
                        checked={showArtistsPage}
                        onChange={(e) => setShowArtistsPage(e.target.checked)}
                        className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                      />
                      <span>
                        <span className="text-sm font-medium text-stone-800 block">Show Artists page on public navbar</span>
                        <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">Synced with the Artists tab. Default is off until enabled and saved.</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group max-w-xl pt-2 border-t border-stone-100">
                      <input
                        type="checkbox"
                        checked={showProductsPage}
                        onChange={(e) => setShowProductsPage(e.target.checked)}
                        className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                      />
                      <span>
                        <span className="text-sm font-medium text-stone-800 block">Show Recommended Products page in public navigation</span>
                        <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">Synced with the Products tab.</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group max-w-xl pt-2 border-t border-stone-100">
                      <input
                        type="checkbox"
                        checked={showReviewsSection}
                        onChange={(e) => setShowReviewsSection(e.target.checked)}
                        className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                      />
                      <span>
                        <span className="text-sm font-medium text-stone-800 block">Show Reviews section on public site</span>
                        <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">Synced with the Reviews tab.</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group max-w-xl pt-2 border-t border-stone-100">
                      <input
                        type="checkbox"
                        checked={showPricingSection}
                        onChange={(e) => setShowPricingSection(e.target.checked)}
                        className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                      />
                      <span>
                        <span className="text-sm font-medium text-stone-800 block">Show Pricing/Services section on public site</span>
                        <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">Synced with the Pricing tab.</span>
                      </span>
                    </label>
                    <label className="ml-7 flex items-start gap-3 cursor-pointer group max-w-xl">
                      <input
                        type="checkbox"
                        checked={roundPricesUpToWholeAmount}
                        onChange={(e) => setRoundPricesUpToWholeAmount(e.target.checked)}
                        className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                      />
                      <span>
                        <span className="text-sm font-medium text-stone-800 block">Round prices up to the nearest whole amount</span>
                        <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">Used when applying global percentage updates.</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group max-w-xl pt-2 border-t border-stone-100">
                      <input
                        type="checkbox"
                        checked={showVideoSection}
                        onChange={(e) => setShowVideoSection(e.target.checked)}
                        className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                      />
                      <span>
                        <span className="text-sm font-medium text-stone-800 block">Show film strip section on public site</span>
                        <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">Synced with the Videos tab.</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group max-w-xl pt-2 border-t border-stone-100">
                      <input
                        type="checkbox"
                        checked={showGallerySection}
                        onChange={(e) => setShowGallerySection(e.target.checked)}
                        className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                      />
                      <span>
                        <span className="text-sm font-medium text-stone-800 block">Show gallery section on public site</span>
                        <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">Synced with the Gallery tab.</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group max-w-xl pt-2 border-t border-stone-100">
                      <input
                        type="checkbox"
                        checked={showFaqPage}
                        onChange={(e) => setShowFaqPage(e.target.checked)}
                        className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                      />
                      <span>
                        <span className="text-sm font-medium text-stone-800 block">Show Education & FAQ in public navigation</span>
                        <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">Synced with the FAQ tab.</span>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group max-w-xl pt-2 border-t border-stone-100">
                      <input type="checkbox" checked={showBookingWidget} onChange={(e) => setShowBookingWidget(e.target.checked)} className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold" />
                      <span><span className="text-sm font-medium text-stone-800 block">Show booking widget on webpage</span></span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group max-w-xl pt-2 border-t border-stone-100">
                      <input type="checkbox" checked={showPaymentWidget} onChange={(e) => setShowPaymentWidget(e.target.checked)} className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold" />
                      <span><span className="text-sm font-medium text-stone-800 block">Show payment widget on webpage</span></span>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer group max-w-xl pt-2 border-t border-stone-100">
                      <input type="checkbox" checked={includeSocialSection} onChange={(e) => setIncludeSocialSection(e.target.checked)} className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold" />
                      <span><span className="text-sm font-medium text-stone-800 block">Show social widget section on webpage</span></span>
                    </label>
                  </div>
                  )}

                  {activeTab === 'externalWidgets' && (
                  <div className="mb-6 break-inside-avoid bg-stone-50 rounded-3xl p-8 border border-stone-100 shadow-none hover:shadow-[0_22px_40px_-28px_rgba(28,25,23,0.42)] transition-shadow duration-300 space-y-5">
                    <div className="flex items-center gap-4 text-stone-800">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <MessageSquare className="w-5 h-5 text-gold" />
                      </div>
                      <h3 className="font-serif text-xl">Social Section</h3>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer group max-w-xl">
                      <input
                        type="checkbox"
                        checked={includeSocialSection}
                        onChange={(e) => setIncludeSocialSection(e.target.checked)}
                        className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                      />
                      <span>
                        <span className="text-sm font-medium text-stone-800 block">Include social section on homepage</span>
                        <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">When disabled, the Taggbox social reel section is hidden from the public homepage.</span>
                      </span>
                    </label>
                    <div className="space-y-2 pt-2 border-t border-stone-100">
                      <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-stone-400 ml-1 block">Taggbox Widget ID</label>
                      <input
                        type="text"
                        value={taggboxWidgetId}
                        onChange={(e) => setTaggboxWidgetId(sanitizeTaggboxWidgetId(e.target.value))}
                        placeholder="Widget ID"
                        disabled={!includeSocialSection}
                        className={`w-full rounded-xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-gold transition-all border disabled:cursor-not-allowed disabled:opacity-60 ${
                          !taggboxWidgetIdValid ? invalidFieldClass : 'bg-white border-stone-200'
                        }`}
                      />
                      <p className="text-[10px] text-stone-400 font-light mt-2 italic">Alphanumeric ID used for the homepage Taggbox social reel widget.</p>
                    </div>
                  </div>
                  )}

                  {activeTab === 'settings' && (
                  <div className="mb-6 break-inside-avoid bg-stone-50 rounded-3xl p-8 border border-stone-100 shadow-none hover:shadow-[0_22px_40px_-28px_rgba(28,25,23,0.42)] transition-shadow duration-300 space-y-5">
                    <div className="flex items-center gap-4 text-stone-800">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <Settings className="w-5 h-5 text-gold" />
                      </div>
                      <h3 className="font-serif text-xl">Admin Behavior</h3>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer group max-w-xl">
                      <input
                        type="checkbox"
                        checked={autoLogoutLeavingAdmin}
                        onChange={(e) => setAutoLogoutLeavingAdmin(e.target.checked)}
                        className="mt-1 size-4 shrink-0 rounded border-stone-300 text-gold focus:ring-gold"
                      />
                      <span>
                        <span className="text-sm font-medium text-stone-800 block">Auto-logout when leaving artist admin</span>
                        <span className="text-[10px] text-stone-400 font-light leading-relaxed block mt-1">
                          When enabled, you are signed out automatically if you leave the artist login or portal routes in this tab. Uncheck to stay signed in while browsing the public site. Push to Cloud applies immediately.
                        </span>
                      </span>
                    </label>
                  </div>
                  )}
                </div>

                <div className="p-10 bg-white border border-stone-100 rounded-3xl space-y-6">
                   <div className="flex items-center gap-4 text-stone-800">
                      <div className="p-2 bg-stone-50 rounded-xl">
                        <RefreshCw className="w-5 h-5 text-stone-400" />
                      </div>
                      <h3 className="font-serif text-xl">System Maintenance</h3>
                   </div>
                   <p className="text-stone-500 text-sm font-light max-w-md leading-relaxed">
                     Push all local JSON defaults in one click. This is useful when you want to republish every content type from `public/data` to cloud.
                   </p>
                   <button
                    onClick={downloadLiveDatabaseJsonZip}
                    disabled={saving}
                    className="flex items-center gap-4 px-8 py-4 rounded-xl text-stone-500 border border-stone-200 hover:border-stone-400 hover:text-stone-700 transition-all disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Backup Cloud Data</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* JSON Inspection Modal */}
      <AnimatePresence>
        {jsonModalData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="admin-global-modal-backdrop fixed inset-0 z-[1200] bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-8 lg:p-24"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-900 text-stone-300 rounded-3xl w-full max-w-4xl h-full flex flex-col shadow-2xl border border-white/5"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3 text-white">
                  <Code className="w-5 h-5 text-gold" />
                  <h3 className="text-lg font-serif">Data Inspector</h3>
                </div>
                <button onClick={() => setJsonModalData(null)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <X className="w-6 h-6 text-stone-500" />
                </button>
              </div>
              
              <div className="flex-grow overflow-auto p-8 font-mono text-sm leading-relaxed custom-scrollbar">
                <pre className="text-stone-400 selection:bg-gold/30">
                  {JSON.stringify(jsonModalData, null, 2)}
                </pre>
              </div>

              <div className="p-8 border-t border-white/5 bg-black/20 flex justify-between items-center">
                <p className="text-[10px] text-stone-500 uppercase tracking-widest">Read-Only Architectural Stream</p>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(jsonModalData, null, 2));
                    alert('Raw JSON captured to clipboard.');
                  }}
                  className="px-6 py-3 bg-white text-stone-900 rounded-xl text-[10px] font-bold tracking-widest uppercase hover:bg-gold transition-colors"
                >
                  Copy to Clipboard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
