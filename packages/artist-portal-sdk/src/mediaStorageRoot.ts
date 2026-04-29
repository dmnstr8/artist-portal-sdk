/**
 * Normalizes configured media storage root segment (shared by gallery + content merge).
 * @license Apache-2.0
 */

export function normalizeMediaStorageRoot(value: string | null | undefined): string {
  return String(value ?? '')
    .trim()
    .replace(/^\/+|\/+$/g, '');
}
