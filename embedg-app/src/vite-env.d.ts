/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DISCORD_ACTIVITY: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
