function trimSlashes(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, '');
}

function normalizeBaseUrl(baseUrl: string): string {
  const b = baseUrl.trim() || '/';
  if (b === '/') return '/';
  return b.endsWith('/') ? b : `${b}/`;
}

/**
 * Builds static/media URLs from:
 * - BASE_URL (Vite)
 * - optional VITE_HOST_BASE path segment
 * - requested asset path
 *
 * Example with BASE_URL="/" and VITE_HOST_BASE="media":
 * assetUrl("gallery/a.jpg") -> "/media/gallery/a.jpg"
 */
export function assetUrl(path: string): string {
  const base = normalizeBaseUrl(import.meta.env.BASE_URL || '/');
  const hostBase = trimSlashes(import.meta.env.VITE_HOST_BASE || '');
  const relPath = String(path ?? '').replace(/^\/+/, '');
  return `${base}${hostBase ? `${hostBase}/` : ''}${relPath}`;
}
