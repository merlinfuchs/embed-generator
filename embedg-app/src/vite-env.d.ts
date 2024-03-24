/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DISCORD_ACTIVITY: string;
  readonly VITE_DISCORD_CLIENT_ID: string;
  readonly VITE_PUBLIC_HOST: string;
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
