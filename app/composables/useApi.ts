import type { $Fetch, FetchOptions } from "ofetch";

let _api: $Fetch;

export function setApi(instance: $Fetch) {
  _api = instance;
}

export function useApi(options?: FetchOptions): $Fetch {
  if (options) {
    return _api.create(options);
  }

  return _api;
}
