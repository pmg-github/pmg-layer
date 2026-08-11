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
      apiBase: "http://localhost:4000",
    },
  },

  // Extensions in this layer import ProseMirror through @tiptap/pm. Keep
  // those imports in the same Vite module graph as the consuming editor so
  // DecorationSet instanceof checks don't cross module instances.
  vite: {
    optimizeDeps: {
      include: [
        "@tiptap/core",
        "@tiptap/vue-3",
        "@tiptap/pm/state",
        "@tiptap/pm/view",
      ],
    },
    resolve: {
      dedupe: [
        "@tiptap/core",
        "@tiptap/pm",
        "@tiptap/vue-3",
        "prosemirror-model",
        "prosemirror-state",
        "prosemirror-transform",
        "prosemirror-view",
      ],
    },
  },

  compatibilityDate: "2024-11-01",
});
