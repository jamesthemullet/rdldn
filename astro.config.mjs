// @ts-check

import clerk from "@clerk/astro";
import alpinejs from "@astrojs/alpinejs";
import mdx from "@astrojs/mdx";
import partytown from "@astrojs/partytown";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";
import { EnumChangefreq } from "sitemap";
import { shouldIncludeInSitemap } from "./src/lib/sitemapFilter";

// Workaround: @clerk/astro 3.x virtual module doesn't propagate to all Vite 8 environments
const clerkVirtualConfig = {
  name: "clerk-virtual-config",
  resolveId(/** @type {string} */ id) {
    if (id === "virtual:@clerk/astro/config") return "\0virtual:@clerk/astro/config";
  },
  load(/** @type {string} */ id) {
    if (id === "\0virtual:@clerk/astro/config") {
      return `export function isStaticOutput(forceStatic) {
        if (forceStatic !== undefined) return forceStatic;
        return false;
      }`;
    }
  },
};

// Workaround: since astro 7.4.10, @astrojs/vite-plugin-astro emits the before-hydration
// script (Clerk's browser-only runner) as an entry chunk in every server environment,
// including the image service build. Astro then loads the first entry chunk of that build
// as the image service, runs Clerk's script in Node and fails with "document is not defined".
const BEFORE_HYDRATION_SCRIPT_ID = "astro:scripts/before-hydration.js";
const dropBeforeHydrationFromImageService = {
  name: "drop-before-hydration-from-image-service",
  applyToEnvironment(/** @type {{ name: string }} */ environment) {
    return environment.name === "astroImageService";
  },
  generateBundle(
    /** @type {unknown} */ _options,
    /** @type {Record<string, { type: string; facadeModuleId?: string | null }>} */ bundle
  ) {
    for (const [fileName, chunk] of Object.entries(bundle)) {
      if (chunk.type === "chunk" && chunk.facadeModuleId === BEFORE_HYDRATION_SCRIPT_ID) {
        delete bundle[fileName];
      }
    }
  },
};

const isTesting = process.env.PLAYWRIGHT === "true";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel(),
  site: "https://rdldn.co.uk",
  build: {
    concurrency: 4,
  },
  image: {
    remotePatterns: [{ protocol: "https", hostname: "blog.rdldn.co.uk" }],
  },
  devToolbar: {
    enabled: !isTesting,
  },
  experimental: {
    incrementalBuild: true,
  },
  vite: {
    plugins: [clerkVirtualConfig, dropBeforeHydrationFromImageService],
    ...(isTesting && { server: { hmr: { overlay: false } } }),
  },
  integrations: [
    // Must come before clerk(): Clerk's injected page script top-level-awaits Clerk loading,
    // so if Alpine's script is bundled after it, its DOMContentLoaded listener is registered
    // too late on cold loads and Alpine never starts.
    alpinejs({ entrypoint: "./src/entrypoints/alpine.ts" }),
    ...(isTesting ? [] : [clerk()]),
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
    mdx(),
    sitemap({
      changefreq: EnumChangefreq.MONTHLY,
      priority: 0.7,
      lastmod: new Date(),
      filter: shouldIncludeInSitemap,
      serialize(item) {
        if (item.url.includes("/about") || item.url.includes("/advertise-with-us")) {
          item.priority = 0.5;
          item.changefreq = EnumChangefreq.YEARLY;
        }
        if (
          item.url === "https://rdldn.co.uk/" ||
          item.url.includes("/best-") ||
          item.url.includes("/10-best-") ||
          item.url.includes("/league-of-roasts") ||
          item.url.includes("/maps") ||
          item.url.includes("/roastatistics")
        ) {
          item.priority = 0.9;
          item.changefreq = EnumChangefreq.WEEKLY;
        }
        if (
          item.url.match(/\/[a-z-]+-[a-z-]+\/$/) &&
          !item.url.includes("/best-") &&
          !item.url.includes("/are-") &&
          !item.url.includes("/which-") &&
          !item.url.includes("/how-")
        ) {
          item.priority = 0.9;
          item.changefreq = EnumChangefreq.YEARLY;
        }
        if (
          item.url.includes("/are-") ||
          item.url.includes("/which-") ||
          item.url.includes("/how-")
        ) {
          item.priority = 0.6;
          item.changefreq = EnumChangefreq.YEARLY;
        }
        return item;
      },
    }),
    react(),
  ],
});
