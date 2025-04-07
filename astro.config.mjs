// @ts-check
import mdx from "@astrojs/mdx";
import partytown from "@astrojs/partytown";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

import alpinejs from "@astrojs/alpinejs";

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  integrations: [
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
    mdx(),
    sitemap(),
    alpinejs(),
  ],
});
