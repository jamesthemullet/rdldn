declare module "*.astro" {
  import type { AstroComponentFactory } from "astro/runtime/server/index.js";

  const Component: AstroComponentFactory;
  export default Component;
  export const getStaticPaths: (...args: unknown[]) => unknown;
  export const prerender: boolean;
}
