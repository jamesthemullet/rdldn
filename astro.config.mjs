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

const isTesting = process.env.PLAYWRIGHT === "true";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel(),
  site: "https://rdldn.co.uk",
  devToolbar: {
    enabled: !isTesting,
  },
  vite: {
    plugins: [clerkVirtualConfig],
    ...(isTesting && { server: { hmr: { overlay: false } } }),
  },
  integrations: [
    clerk(),
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
    alpinejs({ entrypoint: "./src/entrypoints/alpine.ts" }),
    react(),
  ],
});
