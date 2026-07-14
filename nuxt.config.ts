export default defineNuxtConfig({
  // Modules shared by every project that extends this layer
  modules: [
    "@nuxtjs/i18n",
    "@pinia/nuxt",
    "@vueuse/nuxt",
    "@nuxtjs/tailwindcss",
  ],

  i18n: {
    defaultLocale: "en",
    strategy: "no_prefix",
    detectBrowserLanguage: false,
    vueI18n: "./i18n.config.ts",
  },

  // Shared runtime config defaults — override per-project via .env or nuxt.config
  runtimeConfig: {
    public: {
      appName: "My App",
      apiBase: "",
    },
  },

  compatibilityDate: "2024-11-01",
});
