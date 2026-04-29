/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_TARGET?: string;
  readonly VITE_HOST_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

