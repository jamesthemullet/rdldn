import { expect, test } from "@playwright/test";

const COMMENTS_ENDPOINT = "https://blog.rdldn.co.uk/graphql";

const setupCommentRoute = async (page: import("@playwright/test").Page) => {
  let requestCount = 0;
  let lastPayload: any = null;

  await page.route(COMMENTS_ENDPOINT, async (route) => {
    requestCount += 1;
    const request = route.request();
    try {
      lastPayload = request.postDataJSON();
    } catch {
      lastPayload = request.postData();
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: { createComment: { success: true } } })
    });
  });

  return {
    getRequestCount: () => requestCount,
    getLastPayload: () => lastPayload
  };
};

test.describe("comment form", () => {
  test("validates required fields", async ({ page }) => {
    const routeInfo = await setupCommentRoute(page);

    await page.goto("/about", { waitUntil: "domcontentloaded" });
    const form = page.locator("#comment-form");
    await expect(form).toBeVisible();

    await form.getByRole("button", { name: "Post Comment" }).click();

    const nameInput = form.locator("#authorName");
    const emailInput = form.locator("#email");
    const commentInput = form.locator("#commentText");

    expect(await nameInput.evaluate((el) => (el as HTMLInputElement).validity.valueMissing)).toBe(
      true
    );
    expect(await emailInput.evaluate((el) => (el as HTMLInputElement).validity.valueMissing)).toBe(
      true
    );
    expect(
      await commentInput.evaluate((el) => (el as HTMLTextAreaElement).validity.valueMissing)
    ).toBe(true);

    expect(routeInfo.getRequestCount()).toBe(0);
  });

  test("rejects invalid emails", async ({ page }) => {
    const routeInfo = await setupCommentRoute(page);

    await page.goto("/about", { waitUntil: "domcontentloaded" });
    const form = page.locator("#comment-form");
    await expect(form).toBeVisible();

    await form.locator("#authorName").fill("Jane Doe");
    await form.locator("#email").fill("not-an-email");
    await form.locator("#commentText").fill("Looks great!");

    await form.getByRole("button", { name: "Post Comment" }).click();

    const emailInput = form.locator("#email");
    expect(
      await emailInput.evaluate((el) => (el as HTMLInputElement).validity.typeMismatch)
    ).toBe(true);

    expect(routeInfo.getRequestCount()).toBe(0);
  });

  test("accepts valid submission", async ({ page }) => {
    const routeInfo = await setupCommentRoute(page);

    await page.goto("/about", { waitUntil: "domcontentloaded" });
    const form = page.locator("#comment-form");
    await expect(form).toBeVisible();

    await form.locator("#authorName").fill("Jane Doe");
    await form.locator("#email").fill("jane@example.com");
    await form.locator("#commentText").fill("Looks great!");

    const postId = await form.getAttribute("data-post-id");
    const responsePromise = page.waitForResponse(COMMENTS_ENDPOINT);
    await form.getByRole("button", { name: "Post Comment" }).click();
    await responsePromise;

    const message = form.locator("#message");
    await expect(message).toHaveText("Comment submitted! Awaiting moderation.");

    expect(routeInfo.getRequestCount()).toBe(1);
    const payload = routeInfo.getLastPayload();
    expect(payload?.variables?.input?.author).toBe("Jane Doe");
    expect(payload?.variables?.input?.authorEmail).toBe("jane@example.com");
    expect(payload?.variables?.input?.content).toBe("Looks great!");
    if (postId) {
      expect(payload?.variables?.input?.commentOn).toBe(Number.parseInt(postId, 10));
    }
  });
});