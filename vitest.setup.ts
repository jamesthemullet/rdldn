import path from "node:path";
import { vi } from "vitest";

vi.mock(
  path.resolve(process.cwd(), "src/components/header/HeaderAuth.tsx"),
  () => ({
    HeaderAuthDesktop: Object.assign(() => "", { isAstroComponentFactory: true }),
    HeaderAuthMobile: Object.assign(() => "", { isAstroComponentFactory: true }),
  })
);
