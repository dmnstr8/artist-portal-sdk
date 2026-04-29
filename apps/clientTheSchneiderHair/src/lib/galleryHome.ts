/**
 * @license Apache-2.0
 */

import { normalizeGalleryHomeData, normalizeMediaStorageRoot } from 'artist-portal-sdk';
import { assetUrl } from '../shared/utils/assetUrl';

export type MediaBucket = 'gallery' | 'artist' | 'products';

export { normalizeGalleryHomeData, normalizeMediaStorageRoot };

const DEFAULT_BUCKET_FOLDER: Record<MediaBucket, string> = {
  gallery: 'gallery',
  artist: 'artist',
  products: 'products',
};

function trimSlashes(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, '');
}

function joinPath(...parts: string[]): string {
  return parts.map(trimSlashes).filter(Boolean).join('/');
}

/**
 * Resolve a media input to a URL:
 * - full URLs / data URLs are returned untouched
 * - absolute site paths are returned as-is (with BASE_URL applied)
 * - relative paths containing "/" are treated as pre-built relative paths
 * - plain file names are expanded into: BASE_URL + [storageRoot/] + [bucket folder/] + filename
 */
export function resolveMediaSrc(
  input: string,
  bucket: MediaBucket,
  storageRoot: string | null | undefined = ''
): string {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  if (/^(?:https?:)?\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  const root = normalizeMediaStorageRoot(storageRoot);
  const folder = DEFAULT_BUCKET_FOLDER[bucket];
  const normalized = raw.replace(/^\/+/, '');
  const fileName = normalized.split('/').pop() || normalized;
  const buildBucketPath = (name: string) => assetUrl(joinPath(root, folder, encodeURIComponent(name)));

  // Already in current bucket path (with or without configured root).
  if (normalized.startsWith(`${folder}/`) || (root && normalized.startsWith(`${root}/${folder}/`))) {
    return assetUrl(normalized);
  }

  // Backward compatibility for legacy stored paths after media re-org.
  if (bucket === 'gallery') {
    if (normalized.startsWith('portfolio-')) return buildBucketPath(fileName);
  }
  if (bucket === 'products') {
    if (normalized.startsWith('brands/') || normalized.startsWith('products/')) {
      return buildBucketPath(fileName);
    }
  }
  if (bucket === 'artist') {
    if (normalized.startsWith('artist/')) return buildBucketPath(fileName);
  }

  if (raw.startsWith('/')) return assetUrl(raw);
  if (raw.includes('/')) return assetUrl(raw);
  return buildBucketPath(raw);
}

/** Short uppercase slug derived from image path for admin display (not stored). */
export function galleryTileDisplaySlug(src: string): string {
  const t = src.trim().split('?')[0];
  const file = t.split('/').pop() || t;
  const base = file.replace(/\.[^.]+$/i, '');
  return base.replace(/[^a-zA-Z0-9]+/g, '').toUpperCase() || 'TILE';
}

export function resolveGalleryImageSrc(
  src: string,
  storageRoot: string | null | undefined = ''
): string {
  const s = src.trim();
  if (!s) return resolveMediaSrc('portfolio-1.jpeg', 'gallery', storageRoot);
  return resolveMediaSrc(s, 'gallery', storageRoot);
}
