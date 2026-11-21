/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Short commit hash of the build (see vite.config.ts), e.g. "7a70b95". */
declare const __APP_VERSION__: string
