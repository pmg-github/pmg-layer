import { ofetch } from "ofetch";
import { setApi } from "../composables/useApi";

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig();
  const authCookie = useCookie("authorization");
  const rememberMeCookie = useCookie("rememberme");

  const api = ofetch.create({
    baseURL: runtimeConfig.public.apiBase,
    onRequest({ options }) {
      options.headers = new Headers(options.headers as HeadersInit);

      if (authCookie.value) {
        options.headers.set("Authorization", `Bearer ${authCookie.value}`);
      }

      if (rememberMeCookie.value) {
        options.headers.set("RememberMe", `Bearer ${rememberMeCookie.value}`);
      }
    },
  });

  setApi(api);
});
