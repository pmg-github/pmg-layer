export const stripProtocol = (url: string) =>
  url.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");

export const withProtocol = (url: string) =>
  /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
