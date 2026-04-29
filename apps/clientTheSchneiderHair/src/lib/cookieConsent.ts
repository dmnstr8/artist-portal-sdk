export type ConsentCategory = 'necessary' | 'functional' | 'social' | 'analytics' | 'marketing';

export type ConsentPreferences = {
  necessary: true;
  functional: boolean;
  social: boolean;
  analytics: boolean;
  marketing: boolean;
};

export type ConsentRecord = {
  version: number;
  updatedAt: number;
  preferences: ConsentPreferences;
};

export const COOKIE_CONSENT_STORAGE_KEY = 'cookie-consent';
export const COOKIE_CONSENT_VERSION = 1;
export const COOKIE_CONSENT_UPDATED_EVENT = 'cookie-consent-updated';
export const COOKIE_CONSENT_OPEN_PREFERENCES_EVENT = 'cookie-consent-open-preferences';

const DEFAULT_PREFERENCES: ConsentPreferences = {
  necessary: true,
  functional: false,
  social: false,
  analytics: false,
  marketing: false,
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizePreferences(value: unknown): ConsentPreferences {
  if (!isObject(value)) return { ...DEFAULT_PREFERENCES };
  return {
    necessary: true,
    functional: Boolean(value.functional),
    social: Boolean(value.social),
    analytics: Boolean(value.analytics),
    marketing: Boolean(value.marketing),
  };
}

function normalizeRecord(value: unknown): ConsentRecord | null {
  if (!isObject(value)) return null;
  const version = Number(value.version);
  const updatedAt = Number(value.updatedAt);
  const preferences = normalizePreferences(value.preferences);
  if (!Number.isFinite(version) || !Number.isFinite(updatedAt)) return null;
  if (version !== COOKIE_CONSENT_VERSION) return null;
  return { version, updatedAt, preferences };
}

function migrateLegacyConsent(raw: string): ConsentRecord | null {
  // Backwards compatibility with old single-value consent format.
  if (raw !== 'accepted' && raw !== 'declined') return null;
  return {
    version: COOKIE_CONSENT_VERSION,
    updatedAt: Date.now(),
    preferences:
      raw === 'accepted'
        ? { necessary: true, functional: true, social: true, analytics: true, marketing: true }
        : { ...DEFAULT_PREFERENCES },
  };
}

export function readConsentRecord(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const migrated = migrateLegacyConsent(raw);
    if (migrated) return migrated;
    return normalizeRecord(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeConsentRecord(record: ConsentRecord): void {
  localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, { detail: record }));
}

export function buildConsentRecord(preferences: ConsentPreferences): ConsentRecord {
  return {
    version: COOKIE_CONSENT_VERSION,
    updatedAt: Date.now(),
    preferences: {
      necessary: true,
      functional: Boolean(preferences.functional),
      social: Boolean(preferences.social),
      analytics: Boolean(preferences.analytics),
      marketing: Boolean(preferences.marketing),
    },
  };
}

export function buildAcceptAllRecord(): ConsentRecord {
  return buildConsentRecord({
    necessary: true,
    functional: true,
    social: true,
    analytics: true,
    marketing: true,
  });
}

export function buildDeclineAllRecord(): ConsentRecord {
  return buildConsentRecord({ ...DEFAULT_PREFERENCES });
}

export function hasConsentFor(category: Exclude<ConsentCategory, 'necessary'>): boolean {
  const record = readConsentRecord();
  if (!record) return false;
  return Boolean(record.preferences[category]);
}

export function hasAnySavedConsent(): boolean {
  return readConsentRecord() !== null;
}

export function openConsentPreferences(): void {
  window.dispatchEvent(new Event(COOKIE_CONSENT_OPEN_PREFERENCES_EVENT));
}
