import { env } from 'node:process';

export default defineNuxtConfig({
  compatibilityDate: '2026-04-27',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/tailwindcss.css'],
  runtimeConfig: {
    lastfmApiKey: env.LASTFM_API_KEY,
  },
});
