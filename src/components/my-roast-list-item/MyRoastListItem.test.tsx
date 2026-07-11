// @vitest-environment happy-dom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { MyRoastListItem } from "./MyRoastListItem";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

const waitForEffect = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

beforeEach(() => {
  document.body.innerHTML = "";
  clearCookie();
});

afterEach(() => {
  document.body.innerHTML = "";
  clearCookie();
});

describe("MyRoastListItem", () => {
  test("renders nothing when no auth flag cookie is set", async () => {
    const { host, root } = createHost();
    await act(async () => root.render(<MyRoastListItem imgSrc="/test.jpg" />));
    await waitForEffect();
    expect(host.innerHTML).toBe("");
    await act(async () => root.unmount());
  });

  test("renders nothing when the flag cookie is false", async () => {
    setCookie("false");
    const { host, root } = createHost();
    await act(async () => root.render(<MyRoastListItem imgSrc="/test.jpg" />));
    await waitForEffect();
    expect(host.innerHTML).toBe("");
    await act(async () => root.unmount());
  });

  test("renders a list item linking to /my-roasts when the flag cookie is true", async () => {
    setCookie("true");
    const { host, root } = createHost();
    await act(async () => root.render(<MyRoastListItem imgSrc="/test.jpg" />));
    await waitForEffect();

    const links = host.querySelectorAll('a[href="/my-roasts"]');
    expect(links.length).toBeGreaterThan(0);
    expect(links[0].textContent).toContain("My Roast List");

    await act(async () => root.unmount());
  });

  test("renders the image with the provided imgSrc and correct alt text", async () => {
    setCookie("true");
    const { host, root } = createHost();
    await act(async () => root.render(<MyRoastListItem imgSrc="/my-image.png" />));
    await waitForEffect();

    const img = host.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("/my-image.png");
    expect(img?.getAttribute("alt")).toBe("My roast list");

    await act(async () => root.unmount());
  });
});
