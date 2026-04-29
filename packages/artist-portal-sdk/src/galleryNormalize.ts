/**
 * @license Apache-2.0
 */

import type { GalleryHomeData, GalleryTileItem } from './domain';

const DEFAULT_TILES: GalleryTileItem[] = [
  { src: 'portfolio-1.jpeg', label: 'Seamless Extensions', order: 0, enabled: true },
  { src: 'portfolio-2.jpeg', label: 'Signature Blonde', order: 1, enabled: true },
  { src: 'portfolio-3.jpeg', label: 'Dimensional Color', order: 2, enabled: true },
  { src: 'portfolio-4.jpeg', label: 'Balayage Mastery', order: 3, enabled: true },
  { src: 'portfolio-5.jpeg', label: 'Flawless Blend', order: 4, enabled: true },
];

function normalizeTile(row: unknown, fallback: GalleryTileItem): GalleryTileItem {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return { ...fallback };
  const o = row as Record<string, unknown>;
  const enabled = typeof o.enabled === 'boolean' ? o.enabled : fallback.enabled !== false;
  const order =
    typeof o.order === 'number' && Number.isFinite(o.order) ? Math.floor(o.order) : fallback.order;
  return {
    src: typeof o.src === 'string' ? o.src : fallback.src,
    label: typeof o.label === 'string' ? o.label : fallback.label,
    order,
    enabled,
  };
}

function sortAndReindexGalleryImages(images: GalleryTileItem[]): GalleryTileItem[] {
  const sorted = [...images].sort((a, b) => a.order - b.order);
  return sorted.map((img, i) => ({ ...img, order: i }));
}

/** Merge Firestore / JSON payload into gallery image list (legacy keys ignored). */
export function normalizeGalleryHomeData(raw: unknown): GalleryHomeData {
  const defaultImages = DEFAULT_TILES.map((t) => ({ ...t }));
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { images: defaultImages };
  }
  const o = raw as Record<string, unknown>;
  const rawImages = o.images;
  let images: GalleryTileItem[];
  if (Array.isArray(rawImages) && rawImages.length > 0) {
    images = defaultImages.map((fallback, i) => normalizeTile(rawImages[i], fallback));
    for (let i = defaultImages.length; i < rawImages.length; i++) {
      images.push(
        normalizeTile(rawImages[i], {
          src: 'portfolio-1.jpeg',
          label: `Image ${i + 1}`,
          order: i,
          enabled: true,
        }),
      );
    }
    images = sortAndReindexGalleryImages(images);
  } else {
    images = defaultImages;
  }
  return { images };
}
