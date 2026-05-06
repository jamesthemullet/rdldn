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

const setCookie = (value: string) => {
  document.cookie = `flag_authFeatures=${value}; path=/`;
};

const clearCookie = () => {
  document.cookie = "flag_authFeatures=; max-age=0; path=/";
};

const createHost = () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return { host, root: createRoot(host) };
};

beforeEach(() => {
  document.body.innerHTML = "";
  clearCookie();
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("HeaderAuthDesktop", () => {
  test("renders nothing by default when no cookie is set", async () => {
    const { host, root } = createHost();
    await act(async () => root.render(<HeaderAuthDesktop />));
    await waitForEffect();
    expect(host.innerHTML).toBe("");
    await act(async () => root.unmount());
  });

  test("renders nothing when flag cookie is false", async () => {
    setCookie("false");
    const { host, root } = createHost();
    await act(async () => root.render(<HeaderAuthDesktop />));
    await waitForEffect();
    expect(host.innerHTML).toBe("");
    await act(async () => root.unmount());
  });

  test("renders auth UI when flag cookie is true", async () => {
    setCookie("true");
    const { host, root } = createHost();
    await act(async () => root.render(<HeaderAuthDesktop />));
    await waitForEffect();
    expect(host.innerHTML).not.toBe("");
    expect(host.querySelector('[data-testid="user-button"]')).not.toBeNull();
    await act(async () => root.unmount());
  });
});

describe("HeaderAuthMobile", () => {
  test("renders nothing by default when no cookie is set", async () => {
    const { host, root } = createHost();
    await act(async () => root.render(<HeaderAuthMobile />));
    await waitForEffect();
    expect(host.innerHTML).toBe("");
    await act(async () => root.unmount());
  });

  test("renders nothing when flag cookie is false", async () => {
    setCookie("false");
    const { host, root } = createHost();
    await act(async () => root.render(<HeaderAuthMobile />));
    await waitForEffect();
    expect(host.innerHTML).toBe("");
    expect(host.querySelector('a[href="/my-roasts"]')).toBeNull();
    await act(async () => root.unmount());
  });

  test("renders My Roasts link and sign-in button when flag cookie is true", async () => {
    setCookie("true");
    const { host, root } = createHost();
    await act(async () => root.render(<HeaderAuthMobile />));
    await waitForEffect();
    expect(host.querySelector('a[href="/my-roasts"]')).not.toBeNull();
    expect(host.querySelector("button")).not.toBeNull();
    await act(async () => root.unmount());
  });
});
