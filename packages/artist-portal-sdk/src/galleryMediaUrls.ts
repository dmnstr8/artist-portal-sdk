/**
 * Gallery / media URL resolution for admin (mirrors app `galleryHome` + `assetUrl`).
 * @license Apache-2.0
 */

import { normalizeGalleryHomeData } from './galleryNormalize';
import { normalizeMediaStorageRoot } from './mediaStorageRoot';

export { normalizeGalleryHomeData, normalizeMediaStorageRoot };

function trimSlashes(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, '');
}

function normalizeBaseUrl(baseUrl: string): string {
  const b = baseUrl.trim() || '/';
  if (b === '/') return '/';
  return b.endsWith('/') ? b : `${b}/`;
}

export function assetUrl(path: string): string {
  const base = normalizeBaseUrl(import.meta.env.BASE_URL || '/');
  const hostBase = trimSlashes(import.meta.env.VITE_HOST_BASE || '');
  const relPath = String(path ?? '').replace(/^\/+/, '');
  return `${base}${hostBase ? `${hostBase}/` : ''}${relPath}`;
}

export type MediaBucket = 'gallery' | 'artist' | 'products';

const DEFAULT_BUCKET_FOLDER: Record<MediaBucket, string> = {
  gallery: 'gallery',
  artist: 'artist',
  products: 'products',
};

function joinPath(...parts: string[]): string {
  return parts.map(trimSlashes).filter(Boolean).join('/');
}

export function resolveMediaSrc(
  input: string,
  bucket: MediaBucket,
  storageRoot: string | null | undefined = '',
): string {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  if (/^(?:https?:)?\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  const root = normalizeMediaStorageRoot(storageRoot);
  const folder = DEFAULT_BUCKET_FOLDER[bucket];
  const normalized = raw.replace(/^\/+/, '');
  const fileName = normalized.split('/').pop() || normalized;
  const buildBucketPath = (name: string) => assetUrl(joinPath(root, folder, encodeURIComponent(name)));

  if (normalized.startsWith(`${folder}/`) || (root && normalized.startsWith(`${root}/${folder}/`))) {
    return assetUrl(normalized);
  }

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

export function galleryTileDisplaySlug(src: string): string {
  const t = src.trim().split('?')[0];
  const file = t.split('/').pop() || t;
  const base = file.replace(/\.[^.]+$/i, '');
  return base.replace(/[^a-zA-Z0-9]+/g, '').toUpperCase() || 'TILE';
}

export function resolveGalleryImageSrc(
  src: string,
  storageRoot: string | null | undefined = '',
): string {
  const s = src.trim();
  if (!s) return resolveMediaSrc('portfolio-1.jpeg', 'gallery', storageRoot);
  return resolveMediaSrc(s, 'gallery', storageRoot);
}
