// @vitest-environment happy-dom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type { Post } from "../../types";
import BestValue from "./best-value";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const createPost = ({
  title,
  slug,
  rating,
  price,
  meat,
  area,
  borough,
  tubeLine,
  year,
}: {
  title: string;
  slug: string;
  rating: string;
  price: string;
  meat: string;
  area: string;
  borough: string;
  tubeLine: string;
  year: string;
}): Post => ({
  date: "2026-01-01",
  title,
  slug,
  ratings: { nodes: [{ name: rating }] },
  prices: { nodes: [{ name: price }] },
  meats: { nodes: [{ name: meat }] },
  areas: { nodes: [{ name: area }] },
  boroughs: { nodes: [{ name: borough }] },
  tubeLines: { nodes: [{ name: tubeLine }] },
  yearsOfVisit: { nodes: [{ name: year }] },
});

const posts: Post[] = [
  createPost({
    title: "Cheap And Great",
    slug: "cheap-and-great",
    rating: "9",
    price: "£12",
    meat: "Beef",
    area: "Soho",
    borough: "Westminster",
    tubeLine: "Central",
    year: "2024",
  }),
  createPost({
    title: "Pricey And Mediocre",
    slug: "pricey-and-mediocre",
    rating: "6",
    price: "£30",
    meat: "Pork",
    area: "Camden",
    borough: "Camden",
    tubeLine: "Northern",
    year: "2024",
  }),
];

const createHost = () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  return { host, root };
};

const waitForRender = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const getVenueNames = (host: HTMLDivElement) =>
  Array.from(host.querySelectorAll('[data-test-id="value-link"]')).map((el) => (el.textContent ?? "").trim());

beforeEach(() => {
  document.body.innerHTML = "";
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  document.body.innerHTML = "";
  window.history.replaceState(null, "", "/");
});

describe("best-value component", () => {
  test("ranks venues by value score (rating / price) descending by default", async () => {
    const { host, root } = createHost();

    await act(async () => {
      root.render(<BestValue posts={posts} />);
    });
    await waitForRender();

    expect(getVenueNames(host)).toEqual(["Cheap And Great", "Pricey And Mediocre"]);

    await act(async () => {
      root.unmount();
    });
  });

  test("filters by area and clears filters", async () => {
    const { host, root } = createHost();

    await act(async () => {
      root.render(<BestValue posts={posts} />);
    });
    await waitForRender();

    const areaFilter = host.querySelector('select[name="area"]') as HTMLSelectElement;
    await act(async () => {
      areaFilter.value = "Camden";
      areaFilter.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await waitForRender();

    expect(getVenueNames(host)).toEqual(["Pricey And Mediocre"]);

    const clearButton = Array.from(host.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Clear All Filters")
    ) as HTMLButtonElement;

    await act(async () => {
      clearButton.click();
    });
    await waitForRender();

    expect(getVenueNames(host)).toEqual(["Cheap And Great", "Pricey And Mediocre"]);

    await act(async () => {
      root.unmount();
    });
  });

  test("applies inflation-adjusted prices when computing the displayed value score", async () => {
    const { host, root } = createHost();

    await act(async () => {
      root.render(<BestValue posts={posts} inflationIndex={{ "2024": 2 }} mostRecentYear="2024" />);
    });
    await waitForRender();

    const prices = Array.from(host.querySelectorAll('[data-test-id="value-price"]')).map(
      (el) => el.textContent
    );

    expect(prices).toContain("~£24.00");
    expect(prices).toContain("~£60.00");

    await act(async () => {
      root.unmount();
    });
  });
});
