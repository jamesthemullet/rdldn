// @vitest-environment happy-dom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type { Post } from "../../types";
import SortPosts from "./sort-posts";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const createPost = ({
  title,
  slug,
  rating,
  price,
  meat,
  area,
  borough,
  owner,
  tube,
  year,
  closedDown,
  newSlug
}: {
  title: string;
  slug: string;
  rating: string;
  price: string;
  meat: string;
  area: string;
  borough: string;
  owner: string;
  tube: string;
  year: string;
  closedDown?: string;
  newSlug?: string;
}): Post => ({
  date: "2026-01-01",
  title,
  slug,
  ratings: { nodes: [{ name: rating }] },
  prices: { nodes: [{ name: price }] },
  meats: { nodes: [{ name: meat }] },
  areas: { nodes: [{ name: area }] },
  boroughs: { nodes: [{ name: borough }] },
  owners: { nodes: [{ name: owner }] },
  tubeStations: { nodes: [{ name: tube }] },
  yearsOfVisit: { nodes: [{ name: year }] },
  ...(closedDown ? { closedDowns: { nodes: [{ name: closedDown }] } } : {}),
  ...(newSlug ? { newSlugs: { nodes: [{ name: newSlug }] } } : {})
});

const posts: Post[] = [
  createPost({
    title: "Alpha Arms",
    slug: "alpha-arms",
    rating: "7.1",
    price: "£18",
    meat: "Beef",
    area: "Soho",
    borough: "Westminster",
    owner: "Indie",
    tube: "Oxford Circus",
    year: "2023"
  }),
  createPost({
    title: "Charlie Tavern",
    slug: "charlie-tavern",
    rating: "9.4",
    price: "£25",
    meat: "Pork",
    area: "Camden",
    borough: "Camden",
    owner: "Group",
    tube: "Camden Town",
    year: "2024",
    closedDown: "closeddown"
  }),
  createPost({
    title: "Bravo House",
    slug: "bravo-house",
    rating: "8.0",
    price: "£21",
    meat: "Chicken",
    area: "Hackney",
    borough: "Hackney",
    owner: "Family",
    tube: "Hackney Central",
    year: "2025",
    closedDown: "re-reviewed-2025",
    newSlug: "bravo-house-rereview"
  })
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

const getRoastTitles = (host: HTMLDivElement) =>
  Array.from(host.querySelectorAll('[data-test-id="roast-link"]')).map((el) =>
    (el.textContent ?? "").trim()
  );

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("sort-posts component", () => {
  test("shows posts sorted by rating desc with closed status text", async () => {
    const { host, root } = createHost();

    await act(async () => {
      root.render(<SortPosts posts={posts} />);
    });
    await waitForRender();

    expect(getRoastTitles(host)).toEqual(["Charlie Tavern", "Bravo House", "Alpha Arms"]);

    const statuses = Array.from(host.querySelectorAll('[data-test-id="roast-status"]')).map((el) =>
      (el.textContent ?? "").trim()
    );

    expect(statuses).toContain("Closed Down");
    expect(statuses).toContain("Re-reviewed in 2025");

    await act(async () => {
      root.unmount();
    });
  });

  test("toggles columns and filters by meat, then clears filters", async () => {
    const { host, root } = createHost();

    await act(async () => {
      root.render(<SortPosts posts={posts} />);
    });
    await waitForRender();

    const showOptionsButton = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Show all options / filters")
    ) as HTMLButtonElement;

    await act(async () => {
      showOptionsButton.click();
    });
    await waitForRender();

    const priceCheckbox = host.querySelector('input[id="price"]') as HTMLInputElement;
    await act(async () => {
      priceCheckbox.click();
    });
    await waitForRender();

    expect(host.querySelectorAll('[data-test-id="roast-price"]').length).toBe(3);

    const meatFilter = host.querySelector('select[name="meat"]') as HTMLSelectElement;
    await act(async () => {
      meatFilter.value = "Beef";
      meatFilter.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await waitForRender();

    expect(getRoastTitles(host)).toEqual(["Alpha Arms"]);

    const clearButton = Array.from(host.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Clear All Filters")
    ) as HTMLButtonElement;

    await act(async () => {
      clearButton.click();
    });
    await waitForRender();

    expect(getRoastTitles(host)).toEqual(["Charlie Tavern", "Bravo House", "Alpha Arms"]);

    await act(async () => {
      root.unmount();
    });
  });

  test("covers score, price, area, borough, owner, year and open filters", async () => {
    const { host, root } = createHost();

    await act(async () => {
      root.render(<SortPosts posts={posts} />);
    });
    await waitForRender();

    const showOptionsButton = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Show all options / filters")
    ) as HTMLButtonElement;

    await act(async () => {
      showOptionsButton.click();
    });
    await waitForRender();

    const scoreFilter = host.querySelector('input[name="score"]') as HTMLInputElement;
    const priceFilter = host.querySelector('input[name="price"]') as HTMLInputElement;
    const areaFilter = host.querySelector('select[name="area"]') as HTMLSelectElement;
    const boroughFilter = host.querySelector('select[name="borough"]') as HTMLSelectElement;
    const ownerFilter = host.querySelector('select[name="owner"]') as HTMLSelectElement;
    const closedDownFilter = host.querySelector('select[name="closedDown"]') as HTMLSelectElement;
    const yearFilter = host.querySelector('select[name="year"]') as HTMLSelectElement;

    const inputValueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set;

    await act(async () => {
      inputValueSetter?.call(scoreFilter, "7");
      scoreFilter.dispatchEvent(new Event("input", { bubbles: true }));
      scoreFilter.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await waitForRender();
    expect(getRoastTitles(host)).toEqual(["Charlie Tavern", "Bravo House", "Alpha Arms"]);

    await act(async () => {
      inputValueSetter?.call(priceFilter, "20");
      priceFilter.dispatchEvent(new Event("input", { bubbles: true }));
      priceFilter.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await waitForRender();
    expect(getRoastTitles(host)).toEqual(["Alpha Arms"]);

    await act(async () => {
      areaFilter.value = "Soho";
      areaFilter.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await waitForRender();
    expect(getRoastTitles(host)).toEqual(["Alpha Arms"]);

    await act(async () => {
      boroughFilter.value = "Westminster";
      boroughFilter.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await waitForRender();
    expect(getRoastTitles(host)).toEqual(["Alpha Arms"]);

    await act(async () => {
      ownerFilter.value = "Indie";
      ownerFilter.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await waitForRender();
    expect(getRoastTitles(host)).toEqual(["Alpha Arms"]);

    await act(async () => {
      yearFilter.value = "2023";
      yearFilter.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await waitForRender();
    expect(getRoastTitles(host)).toEqual(["Alpha Arms"]);

    await act(async () => {
      closedDownFilter.value = "open";
      closedDownFilter.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await waitForRender();
    expect(getRoastTitles(host)).toEqual(["Alpha Arms"]);

    await act(async () => {
      root.unmount();
    });
  });

  test("covers closedDown exact match filter branch", async () => {
    const { host, root } = createHost();

    await act(async () => {
      root.render(<SortPosts posts={posts} />);
    });
    await waitForRender();

    const showOptionsButton = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Show all options / filters")
    ) as HTMLButtonElement;

    await act(async () => {
      showOptionsButton.click();
    });
    await waitForRender();

    const closedDownFilter = host.querySelector('select[name="closedDown"]') as HTMLSelectElement;
    await act(async () => {
      closedDownFilter.value = "closeddown";
      closedDownFilter.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await waitForRender();

    expect(getRoastTitles(host)).toEqual(["Charlie Tavern"]);

    await act(async () => {
      root.unmount();
    });
  });

  test("renders optional columns when their toggles are enabled", async () => {
    const { host, root } = createHost();

    await act(async () => {
      root.render(<SortPosts posts={posts} />);
    });
    await waitForRender();

    const showOptionsButton = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Show all options / filters")
    ) as HTMLButtonElement;

    await act(async () => {
      showOptionsButton.click();
    });
    await waitForRender();

    const toggleIds = ["meat", "yearVisited", "tubeStation", "area", "borough", "owner"];

    for (const id of toggleIds) {
      const checkbox = host.querySelector(`input[id="${id}"]`) as HTMLInputElement;
      await act(async () => {
        checkbox.click();
      });
      await waitForRender();
    }

    expect(host.querySelectorAll('[data-test-id="roast-meat"]').length).toBe(3);
    expect(host.querySelectorAll('[data-test-id="roast-year"]').length).toBe(3);
    expect(host.querySelectorAll('[data-test-id="roast-tube"]').length).toBe(3);
    expect(host.querySelectorAll('[data-test-id="roast-area"]').length).toBe(3);
    expect(host.querySelectorAll('[data-test-id="roast-borough"]').length).toBe(3);
    expect(host.querySelectorAll('[data-test-id="roast-owner"]').length).toBe(3);

    await act(async () => {
      root.unmount();
    });
  });

  test("sorts by title and toggles between desc and asc", async () => {
    const { host, root } = createHost();

    await act(async () => {
      root.render(<SortPosts posts={posts} />);
    });
    await waitForRender();

    const showOptionsButton = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Show all options / filters")
    ) as HTMLButtonElement;

    await act(async () => {
      showOptionsButton.click();
    });
    await waitForRender();

    const sortColumn = host.querySelector('select[id="sort-column"]') as HTMLSelectElement;
    await act(async () => {
      sortColumn.value = "title";
      sortColumn.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await waitForRender();

    expect(getRoastTitles(host)).toEqual(["Charlie Tavern", "Bravo House", "Alpha Arms"]);

    const sortOrderButton = Array.from(host.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Sort Ascending")
    ) as HTMLButtonElement;

    await act(async () => {
      sortOrderButton.click();
    });
    await waitForRender();

    expect(getRoastTitles(host)).toEqual(["Alpha Arms", "Bravo House", "Charlie Tavern"]);

    const sortDescendingButton = Array.from(host.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Sort Descending")
    ) as HTMLButtonElement;

    await act(async () => {
      sortDescendingButton.click();
    });
    await waitForRender();

    expect(getRoastTitles(host)).toEqual(["Charlie Tavern", "Bravo House", "Alpha Arms"]);

    await act(async () => {
      root.unmount();
    });
  });

  test("handles posts with missing rating fields via nullish fallback", async () => {
    const sparsePosts: Post[] = [
      {
        date: "2026-01-01",
        title: "No Rating One",
        slug: "no-rating-one"
      },
      {
        date: "2026-01-01",
        title: "Has Rating",
        slug: "has-rating",
        ratings: { nodes: [{ name: "8.8" }] }
      },
      {
        date: "2026-01-01",
        title: "No Rating Two",
        slug: "no-rating-two",
        ratings: { nodes: [] }
      }
    ];

    const { host, root } = createHost();

    await act(async () => {
      root.render(<SortPosts posts={sparsePosts} />);
    });
    await waitForRender();

    // Missing rating values should safely fall back to an empty string and still render.
    expect(getRoastTitles(host)).toEqual(["Has Rating", "No Rating One", "No Rating Two"]);

    const ratings = Array.from(host.querySelectorAll('[data-test-id="roast-rating"]')).map((el) =>
      (el.textContent ?? "").trim()
    );

    expect(ratings).toContain("8.8");
    expect(ratings.filter((value) => value === "")).toHaveLength(2);

    await act(async () => {
      root.unmount();
    });
  });

  test("renders blank prices when the price column is enabled for sparse posts", async () => {
    const sparsePricePosts: Post[] = [
      {
        date: "2026-01-01",
        title: "No Price",
        slug: "no-price",
        ratings: { nodes: [{ name: "8.1" }] }
      },
      {
        date: "2026-01-01",
        title: "Empty Price",
        slug: "empty-price",
        ratings: { nodes: [{ name: "7.4" }] },
        prices: { nodes: [{ name: "" }] }
      }
    ];

    const { host, root } = createHost();

    await act(async () => {
      root.render(<SortPosts posts={sparsePricePosts} />);
    });
    await waitForRender();

    const showOptionsButton = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Show all options / filters")
    ) as HTMLButtonElement;

    await act(async () => {
      showOptionsButton.click();
    });
    await waitForRender();

    const priceCheckbox = host.querySelector('input[id="price"]') as HTMLInputElement;
    await act(async () => {
      priceCheckbox.click();
    });
    await waitForRender();

    const prices = Array.from(host.querySelectorAll('[data-test-id="roast-price"]')).map((el) =>
      (el.textContent ?? "").trim()
    );

    expect(prices).toEqual(["", ""]);

    await act(async () => {
      root.unmount();
    });
  });

  test("covers title nullish fallback and unknown sort default branch", async () => {
    const titleSparsePosts: Post[] = [
      {
        date: "2026-01-01",
        slug: "untitled-one"
      },
      {
        date: "2026-01-01",
        title: "Zed Title",
        slug: "zed-title"
      },
      {
        date: "2026-01-01",
        slug: "untitled-two"
      }
    ];

    const { host, root } = createHost();

    await act(async () => {
      root.render(<SortPosts posts={titleSparsePosts} />);
    });
    await waitForRender();

    const showOptionsButton = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Show all options / filters")
    ) as HTMLButtonElement;

    await act(async () => {
      showOptionsButton.click();
    });
    await waitForRender();

    const sortColumn = host.querySelector('select[id="sort-column"]') as HTMLSelectElement;

    await act(async () => {
      sortColumn.value = "title";
      sortColumn.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await waitForRender();

    const linksAfterTitleSort = Array.from(host.querySelectorAll('[data-test-id="roast-link"]'));
    const visibleTitlesAfterTitleSort = linksAfterTitleSort.map((el) => (el.textContent ?? "").trim());

    expect(visibleTitlesAfterTitleSort).toContain("Zed Title");
    expect(visibleTitlesAfterTitleSort.filter((value) => value === "")).toHaveLength(2);

    const unknownOption = document.createElement("option");
    unknownOption.value = "unknown-column";
    unknownOption.textContent = "Unknown";
    sortColumn.appendChild(unknownOption);

    await act(async () => {
      sortColumn.value = "unknown-column";
      sortColumn.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await waitForRender();

    expect(host.querySelectorAll('[data-test-id="roast-link"]').length).toBe(3);
    expect(host.querySelectorAll('[data-test-id="roast-rating"]').length).toBe(3);

    await act(async () => {
      root.unmount();
    });
  });

  test("covers all sort column branches with sparse post data", async () => {
    const branchPosts: Post[] = [
      {
        date: "2026-01-01",
        title: "Has Everything",
        slug: "has-everything",
        ratings: { nodes: [{ name: "9.1" }] },
        prices: { nodes: [{ name: "£30" }] },
        yearsOfVisit: { nodes: [{ name: "2025" }] },
        meats: { nodes: [{ name: "Turkey" }] },
        tubeStations: { nodes: [{ name: "Waterloo" }] },
        areas: { nodes: [{ name: "Southbank" }] },
        boroughs: { nodes: [{ name: "Lambeth" }] },
        owners: { nodes: [{ name: "Zeta Group" }] },
        closedDowns: { nodes: [{ name: "closeddown" }] }
      },
      {
        date: "2026-01-01",
        title: "Mostly Missing",
        slug: "mostly-missing"
      },
      {
        date: "2026-01-01",
        title: "Empty Nodes",
        slug: "empty-nodes",
        prices: { nodes: [] },
        yearsOfVisit: { nodes: [] },
        meats: { nodes: [] },
        tubeStations: { nodes: [] },
        areas: { nodes: [] },
        boroughs: { nodes: [] },
        owners: { nodes: [] },
        closedDowns: { nodes: [] }
      }
    ];

    const { host, root } = createHost();

    await act(async () => {
      root.render(<SortPosts posts={branchPosts} />);
    });
    await waitForRender();

    const showOptionsButton = Array.from(host.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Show all options / filters")
    ) as HTMLButtonElement;

    await act(async () => {
      showOptionsButton.click();
    });
    await waitForRender();

    const sortColumn = host.querySelector('select[id="sort-column"]') as HTMLSelectElement;

    const forceSort = async (value: string) => {
      await act(async () => {
        sortColumn.value = value;
        sortColumn.dispatchEvent(new Event("change", { bubbles: true }));
      });
      await waitForRender();
    };

    await forceSort("price");
    expect(getRoastTitles(host)[0]).toBe("Has Everything");

    await forceSort("yearVisited");
    expect(getRoastTitles(host)[0]).toBe("Has Everything");

    await forceSort("meat");
    expect(getRoastTitles(host)[0]).toBe("Has Everything");

    await forceSort("tubeStation");
    expect(getRoastTitles(host)[0]).toBe("Has Everything");

    await forceSort("area");
    expect(getRoastTitles(host)[0]).toBe("Has Everything");

    await forceSort("borough");
    expect(getRoastTitles(host)[0]).toBe("Has Everything");

    await forceSort("owner");
    expect(getRoastTitles(host)[0]).toBe("Has Everything");

    const closedDownOption = document.createElement("option");
    closedDownOption.value = "closedDown";
    closedDownOption.textContent = "Closed Down";
    sortColumn.appendChild(closedDownOption);

    await forceSort("closedDown");
    expect(getRoastTitles(host)[0]).toBe("Has Everything");

    await act(async () => {
      root.unmount();
    });
  });

  test("covers closed-down status translation cases", async () => {
    const closedDownPosts: Post[] = [
      {
        date: "2026-01-01",
        title: "Stopped",
        slug: "stopped",
        ratings: { nodes: [{ name: "8.1" }] },
        closedDowns: { nodes: [{ name: "stopped" }] }
      },
      {
        date: "2026-01-01",
        title: "Popup Moved",
        slug: "popup-moved",
        ratings: { nodes: [{ name: "8.0" }] },
        closedDowns: { nodes: [{ name: "popupmoved" }] }
      },
      {
        date: "2026-01-01",
        title: "Temp Closed",
        slug: "temp-closed",
        ratings: { nodes: [{ name: "7.9" }] },
        closedDowns: { nodes: [{ name: "tempclosed" }] }
      },
      {
        date: "2026-01-01",
        title: "New Owners",
        slug: "new-owners",
        ratings: { nodes: [{ name: "7.8" }] },
        closedDowns: { nodes: [{ name: "newowners" }] }
      },
      {
        date: "2026-01-01",
        title: "Popup Stopped",
        slug: "popup-stopped",
        ratings: { nodes: [{ name: "7.7" }] },
        closedDowns: { nodes: [{ name: "popupstopped" }] }
      },
      {
        date: "2026-01-01",
        title: "Unknown Status",
        slug: "unknown-status",
        ratings: { nodes: [{ name: "7.6" }] },
        closedDowns: { nodes: [{ name: "otherstatus" }] }
      },
      {
        date: "2026-01-01",
        title: "Re-reviewed Plain Text",
        slug: "re-reviewed-plain-text",
        ratings: { nodes: [{ name: "7.5" }] },
        closedDowns: { nodes: [{ name: "re-reviewed-2022" }] }
      }
    ];

    const { host, root } = createHost();

    await act(async () => {
      root.render(<SortPosts posts={closedDownPosts} />);
    });
    await waitForRender();

    const statuses = Array.from(host.querySelectorAll('[data-test-id="roast-status"]')).map((el) =>
      (el.textContent ?? "").trim()
    );

    expect(statuses).toContain("Stopped Doing Roasts");
    expect(statuses).toContain("Popup Moved");
    expect(statuses).toContain("Temporarily Closed");
    expect(statuses).toContain("New Owners");
    expect(statuses).toContain("Popup Stopped");
    expect(statuses).toContain("otherstatus");
    expect(statuses).toContain("Re-reviewed in 2022");

    await act(async () => {
      root.unmount();
    });
  });
});
