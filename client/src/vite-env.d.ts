/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Injected by Vite's `define` at build time; shimmed by client/jest.polyfills.cjs in tests.
declare const __APP_API_BASE_URL__: string;
