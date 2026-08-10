// @vitest-environment happy-dom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Post } from "../../types";

vi.mock("@clerk/astro/react", () => ({
  useAuth: vi.fn(() => ({ isSignedIn: false, isLoaded: true })),
}));

vi.mock("../wishlist-button/wishlist-button", () => ({
  default: () => null,
}));

import SundayRoastPlanner from "./sunday-roast-planner";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const makePlannerPost = (overrides: {
  title: string;
  slug: string;
  rating: string;
  area?: string;
  borough?: string;
  tubeLine?: string;
  price?: string;
  year?: string;
  closed?: boolean;
}): Post => ({
  date: "2026-01-01",
  title: overrides.title,
  slug: overrides.slug,
  ratings: { nodes: [{ name: overrides.rating }] },
  areas: { nodes: overrides.area ? [{ name: overrides.area }] : [] },
  boroughs: { nodes: overrides.borough ? [{ name: overrides.borough }] : [] },
  tubeLines: { nodes: overrides.tubeLine ? [{ name: overrides.tubeLine }] : [] },
  prices: { nodes: overrides.price ? [{ name: overrides.price }] : [] },
  yearsOfVisit: { nodes: overrides.year ? [{ name: overrides.year }] : [] },
  closedDowns: { nodes: overrides.closed ? [{ name: "closeddown" }] : [] },
});

const openPosts: Post[] = [
  makePlannerPost({
    title: "Soho Roast",
    slug: "soho-roast",
    rating: "8.5",
    area: "Soho",
    borough: "Westminster",
    tubeLine: "Bakerloo",
    price: "£20",
    year: "2024",
  }),
  makePlannerPost({
    title: "Camden Roast",
    slug: "camden-roast",
    rating: "7.0",
    area: "Camden",
    borough: "Camden",
    tubeLine: "Northern",
    price: "£25",
    year: "2024",
  }),
  makePlannerPost({
    title: "Closed Roast",
    slug: "closed-roast",
    rating: "9.5",
    area: "Soho",
    closed: true,
  }),
];

const lowRatedPosts: Post[] = [
  makePlannerPost({ title: "Low A", slug: "low-a", rating: "6.0", area: "Islington" }),
  makePlannerPost({ title: "Low B", slug: "low-b", rating: "5.5", area: "Hackney" }),
];

const createHost = () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return { host, root: createRoot(host) };
};

const waitForEffects = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const getButton = (host: HTMLDivElement, label: string): HTMLButtonElement =>
  Array.from(host.querySelectorAll("button")).find((b) =>
    b.textContent?.trim().includes(label)
  ) as HTMLButtonElement;

beforeEach(() => {
  document.body.innerHTML = "";
  window.history.replaceState(null, "", "/");
  global.fetch = vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue([]) });
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  document.body.innerHTML = "";
  window.history.replaceState(null, "", "/");
  vi.clearAllMocks();
});

describe("SundayRoastPlanner", () => {
  test("renders step 1 with location-type tabs and a Next button", async () => {
    const { host, root } = createHost();
    await act(async () => root.render(<SundayRoastPlanner posts={openPosts} />));
    await waitForEffects();

    expect(host.textContent).toContain("Step 1 of 3");
    expect(host.textContent).toContain("Where do you want to eat?");

    const buttonLabels = Array.from(host.querySelectorAll("button")).map((b) =>
      b.textContent?.trim()
    );
    expect(buttonLabels).toContain("By area");
    expect(buttonLabels).toContain("By borough");
    expect(buttonLabels).toContain("By tube line");
    expect(buttonLabels).toContain("Next");

    await act(async () => root.unmount());
  });

  test("navigates through all three steps and shows only open posts in results", async () => {
    const { host, root } = createHost();
    await act(async () => root.render(<SundayRoastPlanner posts={openPosts} />));
    await waitForEffects();

    await act(async () => getButton(host, "Next").click());
    await waitForEffects();
    expect(host.textContent).toContain("Step 2 of 3");

    await act(async () => getButton(host, "Next").click());
    await waitForEffects();
    expect(host.textContent).toContain("Step 3 of 3");

    await act(async () => getButton(host, "Find my roast").click());
    await waitForEffects();

    expect(host.textContent).toContain("Soho Roast");
    expect(host.textContent).toContain("Camden Roast");
    expect(host.textContent).not.toContain("Closed Roast");

    await act(async () => root.unmount());
  });

  test("shows no-results message when min rating filter excludes all open posts", async () => {
    const { host, root } = createHost();
    await act(async () => root.render(<SundayRoastPlanner posts={lowRatedPosts} />));
    await waitForEffects();

    await act(async () => getButton(host, "Next").click());
    await waitForEffects();

    await act(async () => getButton(host, "Next").click());
    await waitForEffects();

    const eightOrAbove = Array.from(host.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "8 or above"
    ) as HTMLButtonElement;
    await act(async () => eightOrAbove.click());
    await waitForEffects();

    await act(async () => getButton(host, "Find my roast").click());
    await waitForEffects();

    expect(host.textContent).toContain("No matching roasts found");
    expect(host.querySelector(".planner__no-results")).not.toBeNull();

    await act(async () => root.unmount());
  });

  test("restores from URL params and jumps directly to results step", async () => {
    window.history.replaceState(null, "", "/?area=Soho");

    const { host, root } = createHost();
    await act(async () => root.render(<SundayRoastPlanner posts={openPosts} />));
    await waitForEffects();

    expect(host.textContent).not.toContain("Step 1 of 3");
    expect(host.textContent).toContain("Soho Roast");
    expect(host.textContent).not.toContain("Camden Roast");
    expect(host.textContent).not.toContain("Closed Roast");

    await act(async () => root.unmount());
  });

  test("filters by borough when the 'By borough' tab is selected", async () => {
    const { host, root } = createHost();
    await act(async () => root.render(<SundayRoastPlanner posts={openPosts} />));
    await waitForEffects();

    await act(async () => getButton(host, "By borough").click());
    await waitForEffects();

    await act(async () => getButton(host, "Westminster").click());
    await waitForEffects();

    await act(async () => getButton(host, "Next").click());
    await waitForEffects();
    await act(async () => getButton(host, "Next").click());
    await waitForEffects();
    await act(async () => getButton(host, "Find my roast").click());
    await waitForEffects();

    expect(host.textContent).toContain("Soho Roast");
    expect(host.textContent).not.toContain("Camden Roast");

    await act(async () => root.unmount());
  });

  test("filters by tube line when the 'By tube line' tab is selected", async () => {
    const { host, root } = createHost();
    await act(async () => root.render(<SundayRoastPlanner posts={openPosts} />));
    await waitForEffects();

    await act(async () => getButton(host, "By tube line").click());
    await waitForEffects();

    await act(async () => getButton(host, "Bakerloo").click());
    await waitForEffects();

    await act(async () => getButton(host, "Next").click());
    await waitForEffects();
    await act(async () => getButton(host, "Next").click());
    await waitForEffects();
    await act(async () => getButton(host, "Find my roast").click());
    await waitForEffects();

    expect(host.textContent).toContain("Soho Roast");
    expect(host.textContent).not.toContain("Camden Roast");

    await act(async () => root.unmount());
  });

  test("back button returns to the previous step", async () => {
    const { host, root } = createHost();
    await act(async () => root.render(<SundayRoastPlanner posts={openPosts} />));
    await waitForEffects();

    expect(host.textContent).toContain("Step 1 of 3");

    await act(async () => getButton(host, "Next").click());
    await waitForEffects();
    expect(host.textContent).toContain("Step 2 of 3");

    await act(async () => getButton(host, "Next").click());
    await waitForEffects();
    expect(host.textContent).toContain("Step 3 of 3");

    await act(async () => getButton(host, "Back").click());
    await waitForEffects();
    expect(host.textContent).toContain("Step 2 of 3");

    await act(async () => getButton(host, "Back").click());
    await waitForEffects();
    expect(host.textContent).toContain("Step 1 of 3");

    await act(async () => root.unmount());
  });

  test("reset button returns to step 1 and clears selection", async () => {
    const { host, root } = createHost();
    await act(async () => root.render(<SundayRoastPlanner posts={openPosts} />));
    await waitForEffects();

    await act(async () => getButton(host, "Soho").click());
    await waitForEffects();

    await act(async () => getButton(host, "Next").click());
    await waitForEffects();
    await act(async () => getButton(host, "Next").click());
    await waitForEffects();
    await act(async () => getButton(host, "Find my roast").click());
    await waitForEffects();

    expect(host.textContent).toContain("Soho Roast");
    expect(host.textContent).not.toContain("Camden Roast");

    await act(async () => getButton(host, "Try again").click());
    await waitForEffects();

    expect(host.textContent).toContain("Step 1 of 3");
    expect(host.textContent).toContain("Where do you want to eat?");

    await act(async () => root.unmount());
  });

  test("budget filter excludes posts priced above the selected maximum", async () => {
    const { host, root } = createHost();
    await act(async () => root.render(<SundayRoastPlanner posts={openPosts} />));
    await waitForEffects();

    await act(async () => getButton(host, "Next").click());
    await waitForEffects();

    await act(async () => getButton(host, "Up to £20").click());
    await waitForEffects();

    await act(async () => getButton(host, "Next").click());
    await waitForEffects();
    await act(async () => getButton(host, "Find my roast").click());
    await waitForEffects();

    expect(host.textContent).toContain("Soho Roast");
    expect(host.textContent).not.toContain("Camden Roast");

    await act(async () => root.unmount());
  });

  test("restores from URL borough param and filters results by borough", async () => {
    window.history.replaceState(null, "", "/?borough=Camden");

    const { host, root } = createHost();
    await act(async () => root.render(<SundayRoastPlanner posts={openPosts} />));
    await waitForEffects();

    expect(host.textContent).not.toContain("Step 1 of 3");
    expect(host.textContent).toContain("Camden Roast");
    expect(host.textContent).not.toContain("Soho Roast");
    expect(host.textContent).not.toContain("Closed Roast");

    await act(async () => root.unmount());
  });
});
