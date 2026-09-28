/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GUEST_EMAIL: string
  readonly VITE_GUEST_PASSWORD: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
