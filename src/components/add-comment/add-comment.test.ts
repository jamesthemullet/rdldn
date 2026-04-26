import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, test } from "vitest";

describe("add-comment component", () => {
  test("renders comment form fields and attributes from props", async () => {
    const container = await AstroContainer.create();
    const { default: AddComment } = await import("./add-comment.astro");
    const html = await container.renderToString(AddComment, {
      props: {
        postId: "123",
        parentId: "456",
      },
    });

    expect(html).toContain('class="comment-form"');
    expect(html).toContain('data-post-id="123"');
    expect(html).toContain('data-parent-id="456"');

    expect(html).toContain('for="authorName-456"');
    expect(html).toContain('name="authorName"');
    expect(html).toContain('id="authorName-456"');
    expect(html).toContain('for="email-456"');
    expect(html).toContain('type="email"');
    expect(html).toContain('name="commentText"');
    expect(html).toContain('id="commentText-456"');

    expect(html).toContain('class="reply-button"');
    expect(html).toContain('data-button-id="456"');
    expect(html).toContain("Post Reply");
    expect(html).toContain('style="color: black;"');
  });

  test("renders without parent attributes when parentId is not provided", async () => {
    const container = await AstroContainer.create();
    const { default: AddComment } = await import("./add-comment.astro");
    const html = await container.renderToString(AddComment, {
      props: {
        postId: "789",
      },
    });

    expect(html).toContain('data-post-id="789"');
    expect(html).not.toContain('data-parent-id="456"');
    expect(html).not.toContain('data-button-id="456"');
  });

  test("includes inline script for GraphQL submission and message handling", async () => {
    const container = await AstroContainer.create();
    const { default: AddComment } = await import("./add-comment.astro");
    const html = await container.renderToString(AddComment, {
      props: {
        postId: "123",
        parentId: "1",
      },
    });

    expect(html).toContain("DOMContentLoaded");
    expect(html).toContain('querySelectorAll("form[data-post-id]")');
    expect(html).toContain('button.dataset.handled === "true"');
    expect(html).toContain('fetch("https://blog.rdldn.co.uk/graphql"');
    expect(html).toContain("mutation AddComment($input: CreateCommentInput!)");
    expect(html).toContain("commentOn: parseInt(postId, 10)");
    expect(html).toContain("parent: parentId || null");
    expect(html).toContain("Failed to submit comment:");
    expect(html).toContain("Comment submitted! Awaiting moderation.");
    expect(html).toContain("form.reset()");
  });
});