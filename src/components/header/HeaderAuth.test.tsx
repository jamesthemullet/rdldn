// @vitest-environment happy-dom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@clerk/astro/react", () => ({
  Show: ({ children }: { when: string; children: React.ReactNode }) => children,
  SignInButton: () => <button type="button">Sign in</button>,
  UserButton: () => <div data-testid="user-button" />,
}));

import { HeaderAuthDesktop, HeaderAuthMobile } from "./HeaderAuth";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const waitForEffect = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const createHost = () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return { host, root: createRoot(host) };
};

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("HeaderAuthDesktop", () => {
  test("renders auth UI", async () => {
    const { host, root } = createHost();
    await act(async () => root.render(<HeaderAuthDesktop />));
    await waitForEffect();
    expect(host.innerHTML).not.toBe("");
    expect(host.querySelector('[data-testid="user-button"]')).not.toBeNull();
    await act(async () => root.unmount());
  });
});

describe("HeaderAuthMobile", () => {
  test("renders My Roasts link and sign-in button", async () => {
    const { host, root } = createHost();
    await act(async () => root.render(<HeaderAuthMobile />));
    await waitForEffect();
    expect(host.querySelector('a[href="/my-roasts"]')).not.toBeNull();
    expect(host.querySelector("button")).not.toBeNull();
    await act(async () => root.unmount());
  });
});
