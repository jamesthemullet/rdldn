import path from "node:path";
import { pathToFileURL } from "node:url";
import { defineConfig } from "vitest/config";

const astroRoot = path.join(process.cwd(), "node_modules", "astro", "dist");
// Since astro 7.4.10 the .astro compile plugin lives in its own package.
const astroPluginEntry = path.join(
  process.cwd(),
  "node_modules",
  "@astrojs",
  "vite-plugin-astro",
  "dist",
  "index.js"
);

const [{ default: astroPlugin }, config, { AstroLogger }, { toAstroOptions, toAstroCli }] =
  await Promise.all([
    import(pathToFileURL(astroPluginEntry).href),
    import(pathToFileURL(path.join(astroRoot, "core", "config", "index.js")).href),
    import(pathToFileURL(path.join(astroRoot, "core", "logger", "core.js")).href),
    import(pathToFileURL(path.join(astroRoot, "core", "astro-options.js")).href)
  ]);

const root = process.cwd();
// Disable the dev toolbar so the compiler doesn't add data-astro-source-* attributes to rendered HTML.
const { astroConfig } = await config.resolveConfig({ root, devToolbar: { enabled: false } }, "dev");
const settings = await config.createSettings(astroConfig, astroConfig.logLevel, root);
const logger = new AstroLogger({
  level: "info",
  destination: { write: (msg: { message: string }) => process.stderr.write(msg.message + "\n") },
});

const clerkVirtualModules = {
  name: "clerk-virtual-modules",
  enforce: "pre" as const,
  resolveId(id: string) {
    if (id === "virtual:@clerk/astro/config") return "\0virtual:@clerk/astro/config";
  },
  load(id: string) {
    if (id === "\0virtual:@clerk/astro/config") {
      return "export const isStaticOutput = (isStatic) => isStatic;";
    }
  },
};

// In Vitest, local image imports resolve to a plain string URL rather than
// Astro's ImageMetadata object, so logo1.src would be undefined. This plugin
// intercepts image file imports and returns a proper ImageMetadata-shaped stub.
const imageMetadataStub = {
  name: "image-metadata-stub",
  enforce: "pre" as const,
  transform(_code: string, id: string) {
    const ext = id.split("?")[0].split(".").pop();
    if (ext && /^(png|jpg|jpeg|gif|webp|avif|svg)$/.test(ext)) {
      return {
        code: `export default { src: ${JSON.stringify(id)}, width: 100, height: 100, format: ${JSON.stringify(ext)} };`,
        map: null,
      };
    }
  },
};

export default defineConfig({
  plugins: [
    imageMetadataStub,
    clerkVirtualModules,
    ...astroPlugin(toAstroOptions(settings), {
      ...toAstroCli(settings, {
        logger,
        command: "dev",
        routesList: { routes: [] },
        serverIslandsState: undefined
      }),
      // Keep the compiler from adding data-astro-source-* attributes to rendered HTML.
      toolbarEnabled: () => false
    })
  ],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest.suppress-warnings.ts"],
include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "istanbul",
      include: ["src/**/*.{ts,tsx,astro}"],
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage"
    }
  }
});
