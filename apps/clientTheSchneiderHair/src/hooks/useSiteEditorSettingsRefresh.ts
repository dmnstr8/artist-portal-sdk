import { useEffect, useState } from 'react';
import { SITE_EDITOR_SETTINGS_CHANGED } from 'artist-portal-sdk';

/** Bumps when admin saves location / gallery / page text to localStorage in this browser. */
export function useSiteEditorSettingsRefresh() {
  const [key, setKey] = useState(0);
  useEffect(() => {
    const onChange = () => setKey((k) => k + 1);
    window.addEventListener(SITE_EDITOR_SETTINGS_CHANGED, onChange);
    return () => window.removeEventListener(SITE_EDITOR_SETTINGS_CHANGED, onChange);
  }, []);
  return key;
}
