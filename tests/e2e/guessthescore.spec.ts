import { expect, test, type Page } from "@playwright/test";

const SCORES_API = "/guessthescore/api/scores";
const SUBMIT_API = "/guessthescore/api/submit-score";

const mockLeaderboard = [
  { name: "Lord Gravy", score: 95, date: "2026-01-01T00:00:00.000Z" },
  { name: "Alice", score: 80, date: "2026-01-02T00:00:00.000Z" },
];

async function interceptScoresApi(page: Page, entries = mockLeaderboard) {
  await page.route(`**${SCORES_API}`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(entries),
    })
  );
}

async function interceptSubmitApi(page: Page, response: { status: number; body: object }) {
  await page.route(`**${SUBMIT_API}`, (route) =>
    route.fulfill({
      status: response.status,
      contentType: "application/json",
      body: JSON.stringify(response.body),
    })
  );
}

async function waitForAlpine(page: Page) {
  await expect(page.getByRole("button", { name: "Start Game" })).toBeVisible({ timeout: 15_000 });
}

/** Plays through N rounds by submitting the current guess and advancing. */
async function playRounds(page: Page, rounds: number) {
  for (let i = 0; i < rounds; i++) {
    await page.getByRole("button", { name: "Submit Guess" }).click();
    const isLastRound = i === rounds - 1;
    const nextBtn = isLastRound
      ? page.getByRole("button", { name: "See Your Results" })
      : page.getByRole("button", { name: "Next Roast" });
    await expect(nextBtn).toBeVisible({ timeout: 5_000 });
    await nextBtn.click();
  }
}

test.describe("guessthescore page", () => {
  test("loads and a full round can be played", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await interceptScoresApi(page);
    await page.goto("/guessthescore");
    await waitForAlpine(page);

    await expect(page.getByRole("heading", { level: 2, name: "Guess The Score!" })).toBeVisible();

    // Start game
    await page.getByRole("button", { name: "Start Game" }).click();
    await expect(page.locator(".progress")).toContainText("Round 1 of 10");
    await expect(page.locator(".score-slider")).toBeVisible();

    // Submit a guess and verify reveal
    await page.getByRole("button", { name: "Submit Guess" }).click();
    await expect(page.locator(".reveal-section")).toBeVisible();
    await expect(page.locator(".score-comparison")).toBeVisible();
    await expect(page.locator(".round-feedback")).toBeVisible();

    // Advance to round 2
    await page.getByRole("button", { name: "Next Roast" }).click();
    await expect(page.locator(".progress")).toContainText("Round 2 of 10");

    expect(consoleErrors).toEqual([]);
  });

  test("high scores panel shows leaderboard and can launch game", async ({ page }) => {
    await interceptScoresApi(page);
    await page.goto("/guessthescore");
    await waitForAlpine(page);

    await page.getByRole("button", { name: "High Scores" }).click();

    const panel = page.locator(".pre-game-leaderboard");
    await expect(panel).toBeVisible();
    await expect(panel.locator(".leaderboard-name").first()).toHaveText("Lord Gravy");
    await expect(panel.locator(".leaderboard-score").first()).toContainText("95/100");

    await panel.getByRole("button", { name: "Start Game" }).click();
    await expect(page.locator(".progress")).toContainText("Round 1 of 10");
  });

  test("completing all 10 rounds shows game over screen with submission form", async ({ page }) => {
    await interceptScoresApi(page);
    await page.goto("/guessthescore");
    await waitForAlpine(page);

    await page.getByRole("button", { name: "Start Game" }).click();
    await playRounds(page, 10);

    const gameOver = page.locator(".game-over");
    await expect(gameOver).toBeVisible();
    await expect(page.locator(".final-title")).toHaveText("Game Over!");
    await expect(page.locator(".final-score")).toBeVisible();
    await expect(gameOver.locator(".score-submit")).toBeVisible();
    await expect(gameOver.locator(".leaderboard")).toBeVisible();
  });

  test("empty name shows validation error, valid name submits and shows leaderboard", async ({
    page,
  }) => {
    await interceptScoresApi(page, [
      { name: "TestPlayer", score: 60, date: "2026-01-01T00:00:00.000Z" },
    ]);
    await interceptSubmitApi(page, { status: 200, body: { ok: true } });

    await page.goto("/guessthescore");
    await waitForAlpine(page);
    await page.getByRole("button", { name: "Start Game" }).click();
    await playRounds(page, 10);

    // Empty name is rejected client-side
    await page.getByRole("button", { name: "Submit Score" }).click();
    await expect(page.locator(".submit-error")).toHaveText("Please enter your name.");

    // Valid submission hides the form and shows the leaderboard
    await page.locator(".name-input").fill("TestPlayer");
    const submitResponse = page.waitForResponse(`**${SUBMIT_API}`);
    await page.getByRole("button", { name: "Submit Score" }).click();
    await submitResponse;

    const gameOver = page.locator(".game-over");
    await expect(gameOver.locator(".score-submit")).toBeHidden();
    await expect(gameOver.locator(".leaderboard")).toBeVisible();
  });

  test("post-game navigation: Play Again restarts, Back to Start returns to menu", async ({
    page,
  }) => {
    await interceptScoresApi(page);
    await page.goto("/guessthescore");
    await waitForAlpine(page);

    await page.getByRole("button", { name: "Start Game" }).click();
    await playRounds(page, 10);

    await page.getByRole("button", { name: "Play Again" }).click();
    await expect(page.locator(".progress")).toContainText("Round 1 of 10");

    // Play a round then go back to start
    await playRounds(page, 10);
    await page.getByRole("button", { name: "Back to Start" }).click();
    await expect(page.getByRole("button", { name: "Start Game" })).toBeVisible();
    await expect(page.locator(".progress")).toBeHidden();
  });
});
