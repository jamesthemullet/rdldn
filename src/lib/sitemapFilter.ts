const NOINDEX_PATHS = ["/my-roasts", "/sign-in", "/flags", "/404"];

export const shouldIncludeInSitemap = (url: string): boolean => {
  const { pathname } = new URL(url);
  return !NOINDEX_PATHS.some((path) => pathname === path || pathname === `${path}/`);
};
