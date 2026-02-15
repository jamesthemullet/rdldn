import { describe, expect, it } from "vitest";
import type { Comment, Comments, Post } from "../types";
import { getTopRoastDinnerPosts, organiseComments } from "./utils";

const createComment = (id: string, overrides: Partial<Comment> = {}): Comment => ({
  id,
  author: {
    node: {
      name: `Author ${id}`,
      avatar: {
        url: "https://example.com/avatar.jpg"
      }
    }
  },
  date: "2024-01-01T00:00:00.000Z",
  content: {
    rendered: `Comment ${id}`
  },
  replies: [],
  ...overrides
});

describe("organiseComments", () => {
  it("nests replies underneath their parent comment", () => {
    const comments: Comments = [
      createComment("1"),
      createComment("2", { parentId: "1" }),
      createComment("3"),
      createComment("4", { parentId: "2" })
    ];

    const result = organiseComments(comments);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[0].replies).toHaveLength(1);
    expect(result[0].replies?.[0].id).toBe("2");
    expect(result[0].replies?.[0].replies).toHaveLength(1);
    expect(result[0].replies?.[0].replies?.[0].id).toBe("4");
  });

  it("returns an empty array when there are no comments", () => {
    expect(organiseComments(null)).toEqual([]);
  });

  it("preserves the original order of top-level comments", () => {
    const comments: Comments = [
      createComment("1"),
      createComment("2"),
      createComment("3"),
      createComment("4", { parentId: "1" })
    ];

    const result = organiseComments(comments);

    expect(result.map((comment) => comment.id)).toEqual(["1", "2", "3"]);
    expect(result[0].replies?.[0].id).toBe("4");
  });

  it("treats replies with missing parents as top-level comments", () => {
    const comments: Comments = [
      createComment("orphan", { parentId: "missing" })
    ];

    const result = organiseComments(comments);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("orphan");
  });
});

const createPost = (
  title: string,
  {
    rating,
    loved,
    isClosed = false,
    isRoastDinner = true,
    features = []
  }: {
    rating: string;
    loved?: string;
    isClosed?: boolean;
    isRoastDinner?: boolean;
    features?: string[];
  }
): Post => ({
  title,
  date: "2024-01-01T00:00:00.000Z",
  ratings: { nodes: [{ name: rating }] },
  highlights: loved ? { loved, loathed: "" } : undefined,
  closedDowns: { nodes: isClosed ? [{ name: "yes" }] : [] },
  typesOfPost: {
    nodes: isRoastDinner ? [{ name: "Roast Dinner" }] : [{ name: "Not Roast" }]
  },
  features: { nodes: features.map((name) => ({ name })) }
});

describe("getTopRoastDinnerPosts", () => {
  it("filters by include terms and sorts by rating descending", () => {
    const posts = [
      createPost("A", { rating: "8.0", loved: "great beef" }),
      createPost("B", { rating: "9.0", loved: "amazing beef" }),
      createPost("C", { rating: "7.0", loved: "great chicken" })
    ];

    const result = getTopRoastDinnerPosts(posts, {
      lovedIncludesAny: ["beef"]
    });

    expect(result.map((post) => post.title)).toEqual(["B", "A"]);
  });

  it("applies exclusion terms and common roast/open/rating constraints", () => {
    const posts = [
      createPost("Keep", { rating: "7.5", loved: "crispy pork" }),
      createPost("Excluded term", { rating: "9.5", loved: "crispy pork belly" }),
      createPost("Closed", { rating: "9.0", loved: "crispy pork", isClosed: true }),
      createPost("Non-roast", {
        rating: "9.0",
        loved: "crispy pork",
        isRoastDinner: false
      }),
      createPost("Bad rating", { rating: "not-a-number", loved: "crispy pork" })
    ];

    const result = getTopRoastDinnerPosts(posts, {
      lovedIncludesAny: ["pork"],
      lovedExcludes: ["belly"]
    });

    expect(result.map((post) => post.title)).toEqual(["Keep"]);
  });

  it("supports extra predicate and custom limit", () => {
    const posts = [
      createPost("Top50-1", {
        rating: "9.0",
        features: ["top-50-gastropub-2025"]
      }),
      createPost("Top50-2", {
        rating: "8.5",
        features: ["top-50-gastropub-2025"]
      }),
      createPost("NotTop50", { rating: "10.0", features: ["other"] })
    ];

    const result = getTopRoastDinnerPosts(posts, {
      extraPredicate: (post) =>
        post.features?.nodes.some(
          (feature) => feature.name === "top-50-gastropub-2025"
        ) ?? false,
      limit: 1
    });

    expect(result.map((post) => post.title)).toEqual(["Top50-1"]);
  });
});
