import { createResolver } from "@nuxt/kit";

const { resolve } = createResolver(import.meta.url);

export default defineNuxtConfig({
  // Modules shared by every project that extends this layer
  modules: [
    "@nuxtjs/i18n",
    "@pinia/nuxt",
    "@vueuse/nuxt",
    "@nuxtjs/tailwindcss",
    "reka-ui/nuxt",
    "@nuxt/icon",
  ],

  // Resolve against this layer's own srcDir so components are found
  // regardless of which project ends up extending this layer.
  components: [
    {
      path: resolve("./app/components"),
      prefix: "PMG",
      pathPrefix: false,
    },
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
