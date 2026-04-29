/**
 * Location block (admin: Location Settings) and legal/footer page text (localStorage).
 * Page text is no longer editable from admin; Legal/footer read defaults plus any legacy localStorage keys.
 * Not synced to cloud.
 * @license Apache-2.0
 */

export const SITE_EDITOR_SETTINGS_CHANGED = 'theschneider:siteEditorSettingsChanged';

const LS_LOCATION = 'theschneider.siteEditor.location';
const LS_PAGE_TEXT = 'theschneider.siteEditor.pageText';

export type LocationSiteEditorSettings = {
  headingLine1: string;
  headingLine2: string;
  address: string;
  operatingHours: string;
  googleMapsOpenUrl: string;
  /** Full URL for the map iframe `src` (Google embed). If empty, a fallback embed is built from the address. */
  mapsIframeSrc: string;
};

export type PageTextSiteEditorSettings = {
  impressumOwnerName: string;
  impressumTradingName: string;
  impressumAddressLines: string;
  impressumContactEmail: string;
  impressumContactPhone: string;
};

export const DEFAULT_LOCATION_SITE_EDITOR: LocationSiteEditorSettings = {
  headingLine1: 'Friedrichshain',
  headingLine2: 'Hub',
  address: 'Gärtnerstraße 31 (SALON 31),\n10245 Berlin',
  operatingHours: 'Tue–Fri: 10:00–18:00\nSat: 10:00–16:00\nMon/Sun: Closed',
  googleMapsOpenUrl:
    'https://www.google.com/maps/search/?api=1&query=G%C3%A4rtnerstra%C3%9Fe+31,+10245+Berlin',
  mapsIframeSrc:
    'https://maps.google.com/maps?q=G%C3%A4rtnerstra%C3%9Fe%2031,%2010245%20Berlin&t=&z=14&ie=UTF8&iwloc=&output=embed',
};

export const DEFAULT_PAGE_TEXT_SITE_EDITOR: PageTextSiteEditorSettings = {
  impressumOwnerName: 'Dennis Schneider',
  impressumTradingName: 'theSchneider.hair',
  impressumAddressLines: 'Gärtnerstraße 31\n10245 Berlin, Germany',
  impressumContactEmail: 'theschneiderhair@gmail.com',
  impressumContactPhone: '+49 171 7497778',
};

function emitChanged() {
  window.dispatchEvent(new CustomEvent(SITE_EDITOR_SETTINGS_CHANGED));
}

function readJsonRecord(key: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / private mode
  }
  emitChanged();
}

export function getLocationSiteEditorSettings(): LocationSiteEditorSettings {
  const base = { ...DEFAULT_LOCATION_SITE_EDITOR };
  const stored = readJsonRecord(LS_LOCATION);
  if (!stored) return base;
  return {
    ...base,
    ...Object.fromEntries(
      (Object.keys(base) as (keyof LocationSiteEditorSettings)[]).map((k) => [
        k,
        typeof stored[k as string] === 'string' ? (stored[k as string] as string) : base[k],
      ])
    ),
  } as LocationSiteEditorSettings;
}

export function setLocationSiteEditorSettings(next: LocationSiteEditorSettings) {
  writeJson(LS_LOCATION, next);
}

export function getPageTextSiteEditorSettings(): PageTextSiteEditorSettings {
  const base = { ...DEFAULT_PAGE_TEXT_SITE_EDITOR };
  const stored = readJsonRecord(LS_PAGE_TEXT);
  if (!stored) return base;
  return {
    ...base,
    ...Object.fromEntries(
      (Object.keys(base) as (keyof PageTextSiteEditorSettings)[]).map((k) => [
        k,
        typeof stored[k as string] === 'string' ? (stored[k as string] as string) : base[k],
      ])
    ),
  } as PageTextSiteEditorSettings;
}

export function setPageTextSiteEditorSettings(next: PageTextSiteEditorSettings) {
  writeJson(LS_PAGE_TEXT, next);
}

function addressToEmbedQuery(address: string): string {
  return address.replace(/\s+/g, ' ').trim();
}

export function resolveMapsIframeSrc(settings: LocationSiteEditorSettings): string {
  const custom = settings.mapsIframeSrc?.trim();
  if (custom) return custom;
  const q = encodeURIComponent(addressToEmbedQuery(settings.address || 'Berlin'));
  return `https://maps.google.com/maps?q=${q}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
}

export function resolveGoogleMapsOpenUrl(settings: LocationSiteEditorSettings): string {
  const u = settings.googleMapsOpenUrl?.trim();
  if (u) return u;
  const q = encodeURIComponent(addressToEmbedQuery(settings.address || 'Berlin'));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}
