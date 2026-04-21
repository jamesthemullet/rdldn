import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test, vi } from "vitest";
import type { Page, Post } from "../types";

vi.mock("astro:assets", () => ({
	Image: Object.assign(
		(_result: unknown, props: { src: string; alt?: string }) =>
			`<img src="${props.src}" alt="${props.alt ?? ""}" />`,
		{ isAstroComponentFactory: true }
	),
}));

const makePage = (overrides: Partial<Page> = {}): Page => ({
	id: "page-1",
	pageId: "1",
	title: "Central Line",
	slug: "central-line",
	content: "<p>Central line content</p>",
	featuredImage: { node: { sourceUrl: "https://example.com/image.jpg" } },
	featuredImageUrl: "https://example.com/image.jpg",
	comments: { nodes: [] },
	...overrides,
});

const makePost = (title: string, slug: string, tubeStation: string, rating = "7.5"): Post => ({
	date: "2024-01-01",
	title,
	slug,
	ratings: { nodes: [{ name: rating }] },
	tubeStations: { nodes: [{ name: tubeStation }] },
});

describe("TubeLinePageLayout", () => {
	test("renders line name in the section heading", async () => {
		const container = await AstroContainer.create();
		const { default: Layout } = await import("./TubeLinePageLayout.astro");

		const html = await container.renderToString(Layout, {
			props: {
				singlePage: makePage({ title: "Central Line" }),
				lineName: "Central",
				headingClass: "central-heading",
				stations: ["Bank"],
				roastPosts: [],
				threadedComments: [],
			},
		});

		expect(html).toContain("Roast Dinners On The Central Line");
		expect(html).toContain("Where can you find good roast dinners on the Central Line?");
	});

	test("renders all station names in the list", async () => {
		const container = await AstroContainer.create();
		const { default: Layout } = await import("./TubeLinePageLayout.astro");

		const html = await container.renderToString(Layout, {
			props: {
				singlePage: makePage(),
				lineName: "Central",
				headingClass: "central-heading",
				stations: ["Bank", "Liverpool Street", "Bethnal Green"],
				roastPosts: [],
				threadedComments: [],
			},
		});

		expect(html).toContain("Bank");
		expect(html).toContain("Liverpool Street");
		expect(html).toContain("Bethnal Green");
	});

	test("shows a linked post and its rating for a station with a matching post", async () => {
		const container = await AstroContainer.create();
		const { default: Layout } = await import("./TubeLinePageLayout.astro");

		const posts = [makePost("The Bank Tavern", "the-bank-tavern", "Bank", "8.5")];

		const html = await container.renderToString(Layout, {
			props: {
				singlePage: makePage(),
				lineName: "Central",
				headingClass: "central-heading",
				stations: ["Bank", "Liverpool Street"],
				roastPosts: posts,
				threadedComments: [],
			},
		});

		expect(html).toContain('href="/the-bank-tavern"');
		expect(html).toContain("The Bank Tavern");
		expect(html).toContain("8.5");
	});

	test("shows no post link for a station with no matching post", async () => {
		const container = await AstroContainer.create();
		const { default: Layout } = await import("./TubeLinePageLayout.astro");

		const posts = [makePost("The Bank Tavern", "the-bank-tavern", "Bank")];

		const html = await container.renderToString(Layout, {
			props: {
				singlePage: makePage(),
				lineName: "Central",
				headingClass: "central-heading",
				stations: ["Bank", "Liverpool Street"],
				roastPosts: posts,
				threadedComments: [],
			},
		});

		expect(html).toContain('href="/the-bank-tavern"');
		// Liverpool Street has no matching post, so no link for it
		expect(html).not.toContain("href=\"/liverpool-street");
	});

	test("applies headingClass to the section heading", async () => {
		const container = await AstroContainer.create();
		const { default: Layout } = await import("./TubeLinePageLayout.astro");

		const html = await container.renderToString(Layout, {
			props: {
				singlePage: makePage(),
				lineName: "Victoria",
				headingClass: "victoria-blue",
				stations: ["Brixton"],
				roastPosts: [],
				threadedComments: [],
			},
		});

		expect(html).toContain('class="heading-underline victoria-blue"');
	});

	test("only shows the first matching post per station", async () => {
		const container = await AstroContainer.create();
		const { default: Layout } = await import("./TubeLinePageLayout.astro");

		// roastPosts are already ordered; first in array is the top post
		const posts = [
			makePost("Top Pub at Bank", "top-pub-bank", "Bank", "9.0"),
			makePost("Second Pub at Bank", "second-pub-bank", "Bank", "7.0"),
		];

		const html = await container.renderToString(Layout, {
			props: {
				singlePage: makePage(),
				lineName: "Central",
				headingClass: "central",
				stations: ["Bank"],
				roastPosts: posts,
				threadedComments: [],
			},
		});

		expect(html).toContain("Top Pub at Bank");
		expect(html).not.toContain("Second Pub at Bank");
	});

	test("renders tube connector with invisible class for first and last stations", async () => {
		const container = await AstroContainer.create();
		const { default: Layout } = await import("./TubeLinePageLayout.astro");

		const html = await container.renderToString(Layout, {
			props: {
				singlePage: makePage(),
				lineName: "Central",
				headingClass: "central",
				stations: ["Bank", "Liverpool Street", "Bethnal Green"],
				roastPosts: [],
				threadedComments: [],
			},
		});

		// Both first and last stations have an invisible connector
		expect(html).toContain('class="tube-connector invisible"');
	});

	test("renders page title from singlePage prop", async () => {
		const container = await AstroContainer.create();
		const { default: Layout } = await import("./TubeLinePageLayout.astro");

		const html = await container.renderToString(Layout, {
			props: {
				singlePage: makePage({ title: "Jubilee Line Guide" }),
				lineName: "Jubilee",
				headingClass: "jubilee-grey",
				stations: ["Westminster"],
				roastPosts: [],
				threadedComments: [],
			},
		});

		expect(html).toContain("Jubilee Line Guide");
	});
});
