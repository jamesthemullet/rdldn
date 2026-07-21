// @vitest-environment happy-dom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@clerk/astro/react", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@clerk/astro/react";
import WishlistButton from "./wishlist-button";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

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

const setCookie = (value: string) => {
  document.cookie = `flag_authFeatures=${value}; path=/`;
};

const clearCookie = () => {
  document.cookie = "flag_authFeatures=; max-age=0; path=/";
};

beforeEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
  setCookie("true");
  global.fetch = vi.fn().mockResolvedValue({
    json: vi.fn().mockResolvedValue([]),
  });
});

afterEach(() => {
  document.body.innerHTML = "";
  clearCookie();
});

describe("WishlistButton", () => {
  test("renders nothing when the auth features flag is off, even when signed out", async () => {
    setCookie("false");
    mockUseAuth.mockReturnValue({ isSignedIn: false, isLoaded: true });

    const { host, root } = createHost();
    await act(async () => {
      root.render(<WishlistButton postSlug="test-slug" postTitle="Test Post" />);
    });
    await waitForEffects();

    expect(host.innerHTML).toBe("");

    await act(async () => root.unmount());
  });

  test("renders nothing while Clerk has not finished loading", async () => {
    mockUseAuth.mockReturnValue({ isSignedIn: false, isLoaded: false });

    const { host, root } = createHost();
    await act(async () => {
      root.render(<WishlistButton postSlug="test-slug" postTitle="Test Post" />);
    });
    await waitForEffects();

    expect(host.innerHTML).toBe("");

    await act(async () => root.unmount());
  });

  test("renders a sign-in link when the user is signed out and iconOnly is false", async () => {
    mockUseAuth.mockReturnValue({ isSignedIn: false, isLoaded: true });

    const { host, root } = createHost();
    await act(async () => {
      root.render(<WishlistButton postSlug="test-slug" postTitle="Test Post" />);
    });
    await waitForEffects();

    const link = host.querySelector('a[href="/sign-in"]');
    expect(link).not.toBeNull();
    expect(link?.textContent).toContain("Sign in to save this to your list");

    await act(async () => root.unmount());
  });

  test("renders nothing when the user is signed out and iconOnly is true", async () => {
    mockUseAuth.mockReturnValue({ isSignedIn: false, isLoaded: true });

    const { host, root } = createHost();
    await act(async () => {
      root.render(<WishlistButton postSlug="test-slug" postTitle="Test Post" iconOnly />);
    });
    await waitForEffects();

    expect(host.innerHTML).toBe("");

    await act(async () => root.unmount());
  });

  test("renders an unsaved bookmark button when signed in and isSaved is false (controlled)", async () => {
    mockUseAuth.mockReturnValue({ isSignedIn: true, isLoaded: true });

    const { host, root } = createHost();
    await act(async () => {
      root.render(
        <WishlistButton
          postSlug="test-slug"
          postTitle="Test Post"
          isSaved={false}
          onSaveToggle={vi.fn()}
        />
      );
    });
    await waitForEffects();

    const button = host.querySelector("button");
    expect(button).not.toBeNull();
    expect(button?.getAttribute("aria-label")).toBe("Save to your list");
    expect(button?.getAttribute("aria-pressed")).toBe("false");
    expect(button?.textContent).toContain("Save to your list");

    await act(async () => root.unmount());
  });

  test("renders a saved bookmark button when signed in and isSaved is true (controlled)", async () => {
    mockUseAuth.mockReturnValue({ isSignedIn: true, isLoaded: true });

    const { host, root } = createHost();
    await act(async () => {
      root.render(
        <WishlistButton
          postSlug="test-slug"
          postTitle="Test Post"
          isSaved
          onSaveToggle={vi.fn()}
        />
      );
    });
    await waitForEffects();

    const button = host.querySelector("button");
    expect(button).not.toBeNull();
    expect(button?.getAttribute("aria-label")).toBe("Remove from your list");
    expect(button?.getAttribute("aria-pressed")).toBe("true");
    expect(button?.textContent).toContain("Saved to your list");

    await act(async () => root.unmount());
  });

  test("toggles from unsaved to saved when clicked in uncontrolled mode", async () => {
    mockUseAuth.mockReturnValue({ isSignedIn: true, isLoaded: true });

    const { host, root } = createHost();
    await act(async () => {
      root.render(<WishlistButton postSlug="my-slug" postTitle="My Post" />);
    });
    await waitForEffects();

    const button = host.querySelector("button");
    expect(button).not.toBeNull();
    expect(button?.getAttribute("aria-pressed")).toBe("false");
    expect(button?.textContent).toContain("Save to your list");

    await act(async () => {
      button?.click();
    });
    await waitForEffects();

    expect(host.querySelector("button")?.getAttribute("aria-pressed")).toBe("true");
    expect(host.querySelector("button")?.textContent).toContain("Saved to your list");

    await act(async () => root.unmount());
  });
});
