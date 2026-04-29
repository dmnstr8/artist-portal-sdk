/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const COOKIE_CONSENT_FAB_POSITION_KEY = 'cookie-consent-fab-position-v1';
export const COOKIE_FAB_SIZE_PX = 56;
export const COOKIE_FAB_DRAG_THRESHOLD_PX = 10;

export function clampCookieFabPosition(
  left: number,
  top: number,
  vw: number,
  vh: number,
  size: number
): { left: number; top: number } {
  const maxL = Math.max(0, vw - size);
  const maxT = Math.max(0, vh - size);
  return {
    left: Math.min(Math.max(0, left), maxL),
    top: Math.min(Math.max(0, top), maxT),
  };
}

export function defaultCookieFabPosition(): { left: number; top: number } {
  const w = typeof window !== 'undefined' ? window.innerWidth : 400;
  const h = typeof window !== 'undefined' ? window.innerHeight : 800;
  return clampCookieFabPosition(16, h - COOKIE_FAB_SIZE_PX - 16, w, h, COOKIE_FAB_SIZE_PX);
}

export function readStoredCookieFabPosition(): { left: number; top: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_FAB_POSITION_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as { left?: unknown; top?: unknown };
    if (typeof p.left !== 'number' || typeof p.top !== 'number' || !Number.isFinite(p.left) || !Number.isFinite(p.top)) {
      return null;
    }
    return clampCookieFabPosition(p.left, p.top, window.innerWidth, window.innerHeight, COOKIE_FAB_SIZE_PX);
  } catch {
    return null;
  }
}
