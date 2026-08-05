// @vitest-environment happy-dom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import RandomPubPicker from "./random-pub-picker";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const waitForEffects = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const createHost = () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return { host, root: createRoot(host) };
};

const setSearch = (search: string) => {
  window.history.replaceState(null, "", search ? `?${search}` : window.location.pathname);
};

beforeEach(() => {
  document.body.innerHTML = "";
  setSearch("");
});

afterEach(() => {
  document.body.innerHTML = "";
  setSearch("");
});

describe("RandomPubPicker", () => {
  test("renders nothing when the query param is absent", async () => {
    const { host, root } = createHost();
    await act(async () => {
      root.render(<RandomPubPicker pubs={["The Marksman"]} />);
    });
    await waitForEffects();

    expect(host.innerHTML).toBe("");

    await act(async () => root.unmount());
  });

  test("renders nothing when there are no pubs, even with the query param present", async () => {
    setSearch("randomPub");

    const { host, root } = createHost();
    await act(async () => {
      root.render(<RandomPubPicker pubs={[]} />);
    });
    await waitForEffects();

    expect(host.innerHTML).toBe("");

    await act(async () => root.unmount());
  });

  test("renders a button when the query param is present", async () => {
    setSearch("randomPub");

    const { host, root } = createHost();
    await act(async () => {
      root.render(<RandomPubPicker pubs={["The Marksman", "The Approach Tavern"]} />);
    });
    await waitForEffects();

    const button = host.querySelector("button");
    expect(button).not.toBeNull();
    expect(button?.textContent).toContain("Pick a random pub for me");
    expect(host.querySelector(".random-pub-picker__result")).toBeNull();

    await act(async () => root.unmount());
  });

  test("reveals a pub from the list when clicked", async () => {
    setSearch("randomPub=1");
    const pubs = ["The Marksman", "The Approach Tavern"];

    const { host, root } = createHost();
    await act(async () => {
      root.render(<RandomPubPicker pubs={pubs} />);
    });
    await waitForEffects();

    const button = host.querySelector("button");
    await act(async () => {
      button?.click();
    });
    await waitForEffects();

    const result = host.querySelector(".random-pub-picker__result");
    expect(result).not.toBeNull();
    expect(pubs.some((pub) => result?.textContent?.includes(pub))).toBe(true);
    expect(host.querySelector("button")?.textContent).toContain("Pick another");

    await act(async () => root.unmount());
  });
});
