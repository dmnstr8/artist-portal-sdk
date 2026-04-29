/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSettingsWithFallback } from 'artist-portal-sdk';

export const THEME_STORAGE_KEY = 'theschneider.theme';

export type ThemeMode = 'light' | 'dark';

function readDocumentTheme(): ThemeMode {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function readStoredUserTheme(): ThemeMode | null {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function applyThemeToDocument(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readDocumentTheme);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
    applyThemeToDocument(next);
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  useEffect(() => {
    applyThemeToDocument(mode);
  }, [mode]);

  /** When the visitor has not chosen a theme, sync from the cloud (then JSON fallback). */
  useEffect(() => {
    const stored = readStoredUserTheme();
    if (stored) {
      applyThemeToDocument(stored);
      setModeState(stored);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const settings = await getSettingsWithFallback();
        if (cancelled) return;
        const fallback = settings.themeDefault === 'dark' ? 'dark' : 'light';
        applyThemeToDocument(fallback);
        setModeState(fallback);
      } catch {
        /* keep inline script / document state */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ mode, setMode, toggle }), [mode, setMode, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
