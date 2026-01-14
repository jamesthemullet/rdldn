import { describe, expect, it } from "vitest";
import type { Comment, Comments } from "../types";
import { organiseComments } from "./utils";

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
});
