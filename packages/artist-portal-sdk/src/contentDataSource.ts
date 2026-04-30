export const CONTENT_DATA_SOURCE_MODE_EVENT = 'artistPortal:contentDataSourceModeChanged';
export const GALLERY_HOME_UPDATED_EVENT = 'artistPortal:galleryHomeUpdated';
const CONTENT_DATA_SOURCE_MODE_KEY = 'artistPortal.contentDataSourceMode';

export function emitGalleryHomeUpdated() {
  window.dispatchEvent(new CustomEvent(GALLERY_HOME_UPDATED_EVENT));
}

export type ContentDataSourceMode = 'firebase' | 'local';

export function getContentDataSourceMode(): ContentDataSourceMode {
  try {
    const value = localStorage.getItem(CONTENT_DATA_SOURCE_MODE_KEY);
    return value === 'local' ? 'local' : 'firebase';
  } catch {
    return 'firebase';
  }
}

export function setContentDataSourceMode(mode: ContentDataSourceMode) {
  try {
    localStorage.setItem(CONTENT_DATA_SOURCE_MODE_KEY, mode);
  } catch {
    // no-op for storage-restricted environments
  }
  window.dispatchEvent(
    new CustomEvent(CONTENT_DATA_SOURCE_MODE_EVENT, { detail: { mode } })
  );
}
