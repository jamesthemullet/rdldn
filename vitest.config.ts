import path from "node:path";
import { pathToFileURL } from "node:url";
import { defineConfig } from "vitest/config";

const astroRoot = path.join(process.cwd(), "node_modules", "astro", "dist");

const [{ default: astroPlugin }, config] = await Promise.all([
  import(pathToFileURL(path.join(astroRoot, "vite-plugin-astro", "index.js")).href),
  import(pathToFileURL(path.join(astroRoot, "core", "config", "index.js")).href)
]);

const root = process.cwd();
const { astroConfig } = await config.resolveConfig({ root }, "dev");
const settings = await config.createSettings(astroConfig, root);
const logger = config.createNodeLogger(astroConfig);

export default defineConfig({
  plugins: [astroPlugin({ settings, logger })],
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "istanbul",
      include: ["src/**/*.{ts,tsx,astro}"],
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage"
    }
  }
});
