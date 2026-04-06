import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";

describe("comment component", () => {
  test("renders author, content, reply controls and inline reply script", async () => {
    const container = await AstroContainer.create();
    const { default: Comment } = await import("./comment.astro");

    const html = await container.renderToString(Comment, {
      props: {
        comment: {
          id: "comment-1",
          author: {
            node: {
              name: "Test Author",
              avatar: {
                url: "https://example.com/avatar.jpg",
              },
            },
          },
          date: "2024-06-16T12:00:00.000Z",
          content: { rendered: "<p>Top level comment</p>" },
          replies: [],
        },
        postId: "42",
        commentId: "comment-1",
      },
    });

    expect(html).toContain('class="comment"');
    expect(html).toContain('data-comment-id="comment-1"');
    expect(html).toContain("Test Author</strong> on");
    expect(html).toContain("<p>Top level comment</p>");
    expect(html).toContain('class="reply-btn"');
    expect(html).toContain('data-target-id="comment-1"');
    expect(html).toContain('id="reply-form-comment-1"');
    expect(html).toContain('data-post-id="42"');
    expect(html).toContain('data-parent-id="comment-1"');

    expect(html).toContain("DOMContentLoaded");
    expect(html).toContain('querySelectorAll(".reply-btn")');
    expect(html).toContain('querySelectorAll("[data-comment-id]")');
    expect(html).toContain('button.dataset.handled === "true"');
    expect(html).toMatch(/reply-form-\$\{targetId\}/);
  });

  test("renders nested replies recursively", async () => {
    const container = await AstroContainer.create();
    const { default: Comment } = await import("./comment.astro");

    const html = await container.renderToString(Comment, {
      props: {
        comment: {
          id: "parent-comment",
          author: {
            node: {
              name: "Parent Author",
              avatar: {
                url: "https://example.com/parent.jpg",
              },
            },
          },
          date: "2024-06-16T12:00:00.000Z",
          content: { rendered: "<p>Parent comment</p>" },
          replies: [
            {
              id: "child-comment",
              author: {
                node: {
                  name: "Reply Author",
                  avatar: {
                    url: "https://example.com/reply.jpg",
                  },
                },
              },
              date: "2024-06-16T12:30:00.000Z",
              content: { rendered: "<p>Nested reply</p>" },
              replies: [],
            },
          ],
        },
        postId: "42",
        commentId: "parent-comment",
      },
    });

    expect(html).toContain('class="comment-replies"');
    expect(html).toContain('data-comment-id="child-comment"');
    expect(html).toContain("Reply Author");
    expect(html).toContain("<p>Nested reply</p>");
    expect(html).toContain('id="reply-form-child-comment"');
  });

  test.each([
    ["2024-06-21T12:00:00", "June 21st, 2024 at 12:00 PM"],
    ["2024-06-22T12:00:00", "June 22nd, 2024 at 12:00 PM"],
    ["2024-06-23T12:00:00", "June 23rd, 2024 at 12:00 PM"],
    ["2024-06-24T12:00:00", "June 24th, 2024 at 12:00 PM"],
  ])("formats comment dates with the expected ordinal suffix for %s", async (date, expectedDate) => {
    const container = await AstroContainer.create();
    const { default: Comment } = await import("./comment.astro");

    const html = await container.renderToString(Comment, {
      props: {
        comment: {
          id: `comment-${date}`,
          author: {
            node: {
              name: "Suffix Author",
              avatar: {
                url: "https://example.com/suffix.jpg",
              },
            },
          },
          date,
          content: { rendered: "<p>Suffix coverage comment</p>" },
          replies: [],
        },
        postId: "42",
        commentId: `comment-${date}`,
      },
    });

    expect(html).toContain(expectedDate);
  });
});