/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_S3_ENDPOINT?: string
  readonly VITE_S3_BUCKET?: string
  readonly VITE_S3_REGION?: string
  readonly VITE_S3_ACCESS_KEY_ID?: string
  readonly VITE_S3_SECRET_ACCESS_KEY?: string
  readonly VITE_S3_PREFIX?: string
  readonly VITE_STORAGE_PROVIDER?: 'local' | 's3'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
