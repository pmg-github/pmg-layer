export default defineNuxtPlugin(() => {
  const layerBuildDate = new Date().toISOString();

  return {
    provide: {
      layerBuildDate,
    },
  };
});
