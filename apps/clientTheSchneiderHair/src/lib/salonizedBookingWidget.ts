/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, type MouseEvent } from 'react';

import {
  hasConsentFor,
  openConsentPreferences,
} from './cookieConsent';
import { getWidgetsWithFallback } from 'artist-portal-sdk';

const DEFAULT_SALONIZED_SCRIPT_SRC = 'https://static-widget.salonized.com/loader.js';
const DEFAULT_SALONIZED_COMPANY = 'm2yzkzSecfyaghBe93MNZGuc';
let runtimeBookingWidgetScriptSrc = DEFAULT_SALONIZED_SCRIPT_SRC;
let runtimeShowBookingWidget = true;
let runtimeBookingWidgetCompany = DEFAULT_SALONIZED_COMPANY;
let isWidgetOpen = false;

function resolveBookingWidgetScriptSrc(raw: unknown): string {
  const value = String(raw ?? '').trim();
  if (!value) return DEFAULT_SALONIZED_SCRIPT_SRC;
  try {
    const url = new URL(value);
    const isHttp = url.protocol === 'https:' || url.protocol === 'http:';
    return isHttp && url.pathname.endsWith('.js') ? value : DEFAULT_SALONIZED_SCRIPT_SRC;
  } catch {
    return DEFAULT_SALONIZED_SCRIPT_SRC;
  }
}

function resolveBookingWidgetCompany(raw: unknown): string {
  const value = String(raw ?? '').trim();
  if (!value) return DEFAULT_SALONIZED_COMPANY;
  return /^[a-zA-Z0-9_-]{3,120}$/.test(value) ? value : DEFAULT_SALONIZED_COMPANY;
}

function applyBookingWidgetCompany(): void {
  const nodes = document.querySelectorAll<HTMLElement>('#salonized-widget, .salonized-booking');
  nodes.forEach((node) => {
    node.setAttribute('data-company', runtimeBookingWidgetCompany);
  });
}

export type SalonizedWidgetsSnapshot = {
  showBookingWidget?: boolean;
  bookingWidgetCompany?: unknown;
  bookingWidgetScriptSrc?: unknown;
};

/** Updates module-level Salonized config from widgets JSON (e.g. on load or content source change). */
export function syncSalonizedWidgetFromWidgets(widgets: SalonizedWidgetsSnapshot): void {
  const enabled = widgets.showBookingWidget !== false;
  runtimeShowBookingWidget = enabled;
  runtimeBookingWidgetCompany = resolveBookingWidgetCompany(widgets.bookingWidgetCompany);
  applyBookingWidgetCompany();
}

function getSalonizedContainer(): Element | null {
  return document.querySelector('#salonized-widget, .salonized-booking');
}

function findSalonizedWidgetButton(): HTMLElement | null {
  const widgetRoot = getSalonizedContainer();
  if (!widgetRoot) return null;

  return (
    widgetRoot.querySelector('button') ||
    widgetRoot.querySelector('[role="button"]') ||
    widgetRoot.querySelector('[data-toggle]') ||
    widgetRoot.querySelector('.sz-booking-button') ||
    widgetRoot.querySelector('.button') ||
    widgetRoot.querySelector('iframe')
  ) as HTMLElement | null;
}

function clickSalonizedWidgetButton(): boolean {
  const button = findSalonizedWidgetButton();
  if (!button) return false;
  button.click();
  return true;
}

function hasSalonizedApi(): boolean {
  const w = window as unknown as { szBooking?: { toggleWidget?: unknown } };
  return !!(w.szBooking && typeof w.szBooking.toggleWidget === 'function');
}

function openSalonizedWidget(): boolean {
  if (isWidgetReallyOpen()) return true;

  if (hasSalonizedApi()) {
    (window as unknown as { szBooking: { toggleWidget: () => void } }).szBooking.toggleWidget();
    isWidgetOpen = true;
    document.body.classList.add('salonized-active');
    document.body.classList.add('booking-intent-active');
    return true;
  }
  if (clickSalonizedWidgetButton()) {
    isWidgetOpen = true;
    document.body.classList.add('salonized-active');
    document.body.classList.add('booking-intent-active');
    return true;
  }
  return false;
}

function isWidgetReallyOpen(): boolean {
  const iframes = document.querySelectorAll(
    'iframe[src*="salonized.com"], .salonized-booking iframe, #salonized-widget iframe'
  );
  for (const iframe of Array.from(iframes)) {
    const style = window.getComputedStyle(iframe);

    const isDisplay = style.display !== 'none';
    const isVisibility = style.visibility !== 'hidden' && style.visibility !== 'collapse';
    const isOpacity = parseFloat(style.opacity || '1') > 0.1;

    if (isDisplay && isVisibility && isOpacity) {
      const rect = iframe.getBoundingClientRect();
      if (rect.width > 250 && rect.height > 250) {
        return true;
      }
    }
  }

  const possibleOverlays = [
    '.salonized-overlay',
    '.sz-overlay',
    '.salonized-booking-overlay',
    '[class*="salonized-"][class*="backdrop"]',
    '[class*="salonized-"][class*="modal"]',
  ];
  if (document.querySelector(possibleOverlays.join(','))) {
    return true;
  }

  const container = getSalonizedContainer();
  if (container) {
    const rect = container.getBoundingClientRect();
    if (rect.width > 250 && rect.height > 250) {
      const style = window.getComputedStyle(container);
      if (style.display !== 'none' && style.visibility !== 'hidden') {
        return true;
      }
    }
  }

  return false;
}

function closeSalonizedWidget(): boolean {
  const wasOpen = isWidgetReallyOpen();

  if (hasSalonizedApi()) {
    if (wasOpen) {
      (window as unknown as { szBooking: { toggleWidget: () => void } }).szBooking.toggleWidget();
    }
    isWidgetOpen = false;
    document.body.classList.remove('salonized-active');
    document.body.classList.remove('booking-intent-active');
    return true;
  }

  if (wasOpen && clickSalonizedWidgetButton()) {
    isWidgetOpen = false;
    document.body.classList.remove('salonized-active');
    document.body.classList.remove('booking-intent-active');
    return true;
  }

  isWidgetOpen = false;
  document.body.classList.remove('salonized-active');
  document.body.classList.remove('booking-intent-active');
  return false;
}

function ensureSalonizedLoader(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!hasConsentFor('functional')) {
      reject(new Error('Cookie consent required for booking widget.'));
      return;
    }

    if (hasSalonizedApi()) {
      resolve();
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${runtimeBookingWidgetScriptSrc}"]`
    ) as HTMLScriptElement;
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', reject, { once: true });

      const waitForWidget = () => {
        if (hasSalonizedApi()) {
          resolve();
          return;
        }
        setTimeout(waitForWidget, 200);
      };
      waitForWidget();
      return;
    }

    const script = document.createElement('script');
    script.src = runtimeBookingWidgetScriptSrc;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', reject, { once: true });
    document.body.appendChild(script);
  });
}

function retryOpenSalonizedWidget(retries = 12, interval = 300): Promise<boolean> {
  let attempt = 0;
  return new Promise((resolve) => {
    const tryOpen = () => {
      if (openSalonizedWidget()) {
        resolve(true);
        return;
      }
      attempt += 1;
      if (attempt >= retries) {
        resolve(false);
        return;
      }
      setTimeout(tryOpen, interval);
    };
    tryOpen();
  });
}

export const triggerBooking = async (e?: MouseEvent): Promise<void> => {
  if (e) e.preventDefault();

  if (!hasConsentFor('functional')) {
    openConsentPreferences();
    return;
  }

  document.body.classList.add('booking-intent-active');

  const topHideStyle = document.getElementById('hide-booking-widget-mobile-home-top');
  if (topHideStyle) topHideStyle.remove();
  const widgetNodes = document.querySelectorAll<HTMLElement>(
    '#salonized-widget, .salonized-booking, .sz-booking-button, .salonized-booking-button'
  );
  widgetNodes.forEach((node) => {
    node.style.display = '';
    node.style.visibility = 'visible';
    node.style.pointerEvents = 'auto';
    node.style.opacity = '';
  });

  if (isWidgetReallyOpen()) {
    closeSalonizedWidget();
    return;
  }

  try {
    const widgets = await getWidgetsWithFallback();
    runtimeShowBookingWidget = widgets.showBookingWidget !== false;
    runtimeBookingWidgetCompany = resolveBookingWidgetCompany(widgets.bookingWidgetCompany);
    applyBookingWidgetCompany();
    if (!runtimeShowBookingWidget) {
      document.body.classList.remove('booking-intent-active');
      return;
    }
    runtimeBookingWidgetScriptSrc = resolveBookingWidgetScriptSrc(widgets.bookingWidgetScriptSrc);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await ensureSalonizedLoader();
    const opened = await retryOpenSalonizedWidget();
    if (!opened) {
      console.warn('Salonized widget found no triggerable button or API.');
      document.body.classList.remove('booking-intent-active');
    }
  } catch (error) {
    console.error('Salonized widget failed to load.', error);
    if (error instanceof Error && /consent/i.test(error.message)) {
      openConsentPreferences();
    }
    document.body.classList.remove('booking-intent-active');
  }
};

export function useSalonizedEvents(): void {
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const actuallyOpen = isWidgetReallyOpen();

      if (actuallyOpen !== isWidgetOpen) {
        isWidgetOpen = actuallyOpen;
        if (actuallyOpen) {
          document.body.classList.add('salonized-active');
        } else {
          document.body.classList.remove('salonized-active');
          document.body.classList.remove('booking-intent-active');
        }
      }

      if (!actuallyOpen) return;

      const target = event.target as Element;
      if (!target) return;

      if (target.closest('.booking-trigger')) return;

      const container = getSalonizedContainer();
      if (container && (container === target || container.contains(target))) {
        return;
      }

      closeSalonizedWidget();
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSalonizedWidget();
      }
    };

    const syncInterval = setInterval(() => {
      const actuallyOpen = isWidgetReallyOpen();
      if (actuallyOpen !== isWidgetOpen) {
        isWidgetOpen = actuallyOpen;
        if (actuallyOpen) {
          document.body.classList.add('salonized-active');
        } else {
          document.body.classList.remove('salonized-active');
          document.body.classList.remove('booking-intent-active');
        }
      }
    }, 250);

    document.addEventListener('click', handleOutsideClick, true);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      clearInterval(syncInterval);
      document.removeEventListener('click', handleOutsideClick, true);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);
}
