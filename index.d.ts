declare module "#app" {
  interface NuxtApp {
    $layerBuildDate: string;
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $layerBuildDate: string;
  }
}

export {};
