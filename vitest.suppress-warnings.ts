import { experimental_AstroContainer as AstroContainer } from "astro/container";

// Renderer that handles vi.fn() mocks used in place of React components.
// Auto-mocked modules (via vi.mock) produce vi.fn() instances which have a
// .mock property; real Astro slot factories and components do not.
// Narrowing the check to vi.fn() prevents Astro's slot factory functions from
// being intercepted here and silently rendered as empty HTML.
const mockReactRenderer = {
  name: "@astrojs/react",
  clientEntrypoint: "@astrojs/react/client.js",
  serverEntrypoint: "@astrojs/react/server.js",
  ssr: {
    check: async (Component: unknown) =>
      typeof Component === "function" &&
      typeof (Component as unknown as Record<string, unknown>).mock === "object",
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
