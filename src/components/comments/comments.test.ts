import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";

describe("comments component", () => {
  test("renders an empty state and top-level submission form", async () => {
    const container = await AstroContainer.create();
    const { default: Comments } = await import("./comments.astro");

    const html = await container.renderToString(Comments, {
      props: {
        threadedComments: null,
        postId: "77",
      },
    });

    expect(html).toContain('class="comments-block"');
    expect(html).toContain("Any comments?");
    expect(html).toContain("No comments yet. Be the first to comment!");
    expect(html).not.toContain('class="comments-list"');

    expect(html).toContain('id="comment-form"');
    expect(html).toContain('class="comment-form"');
    expect(html).toContain('data-post-id="77"');
    expect(html).toContain('for="authorName"');
    expect(html).toContain('type="email"');
    expect(html).toContain('id="commentText"');
    expect(html).toContain("Post Comment");
    expect(html).toContain('id="message"');
  });

  test("renders threaded comments and inline submission script", async () => {
    const container = await AstroContainer.create();
    const { default: Comments } = await import("./comments.astro");

    const html = await container.renderToString(Comments, {
      props: {
        threadedComments: [
          {
            id: "comment-1",
            author: {
              node: {
                name: "Thread Author",
                avatar: {
                  url: "https://example.com/thread.jpg",
                },
              },
            },
            date: "2024-06-16T12:00:00.000Z",
            content: "<p>Threaded comment</p>",
            replies: [],
          },
        ],
        postId: "77",
      },
    });

    expect(html).toContain('class="comments-list"');
    expect(html).toContain('data-comment-id="comment-1"');
    expect(html).toContain("Thread Author");
    expect(html).toContain("<p>Threaded comment</p>");

    expect(html).toContain('id="comment-form"');
    expect(html).toContain("Comment submitted! Awaiting moderation.");
    expect(html).toContain("https://blog.rdldn.co.uk/graphql");
  });
});