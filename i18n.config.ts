export default defineI18nConfig(() => ({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: {
    en: {
      common: {
        welcome: "Welcome from the shared Nuxt layer",
        cta: "Start building",
      },
    },
    fr: {
      common: {
        welcome: "Bienvenue depuis la couche Nuxt partagee",
        cta: "Commencer",
      },
    },
  },
}));
