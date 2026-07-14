import { experimental_AstroContainer as AstroContainer } from "astro/container";

// Minimal renderer that accepts any function component (our mocks return null,
// not a React element, so the real renderer's check() rejects them).
// renderToStaticMarkup returns empty HTML — fine for mocked components.
const mockReactRenderer = {
  name: "@astrojs/react",
  clientEntrypoint: "@astrojs/react/client.js",
  serverEntrypoint: "@astrojs/react/server.js",
  ssr: {
    check: async (Component: unknown) => typeof Component === "function",
    renderToStaticMarkup: async () => ({ html: "", attrs: undefined }),
  },
};

const _originalCreate = AstroContainer.create.bind(AstroContainer);
(AstroContainer as typeof AstroContainer & { create: typeof AstroContainer.create }).create =
  async (options: Parameters<typeof AstroContainer.create>[0] = {}) => {
    const existing = options.renderers ?? [];
    const hasReact = existing.some((r) => r.name === "@astrojs/react");
    const renderers = hasReact ? existing : [...existing, mockReactRenderer as never];
    return _originalCreate({ ...options, renderers });
  };
