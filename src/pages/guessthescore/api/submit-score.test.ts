import { createHmac, randomUUID } from "node:crypto";
import type { APIContext } from "astro";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../../lib/kv", () => ({
  kv: {
    zadd: vi.fn(),
  },
}));

import { kv } from "../../../lib/kv";
import { POST } from "./submit-score";

const TEST_SECRET = "test-secret";

function createValidToken(secret = TEST_SECRET, ageMs = 0): string {
  const nonce = randomUUID();
  const timestamp = (Date.now() - ageMs).toString();
  const sig = createHmac("sha256", secret).update(`${nonce}:${timestamp}`).digest("hex");
  return `${nonce}:${timestamp}:${sig}`;
}

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/guessthescore/api/submit-score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /guessthescore/api/submit-score", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("SCORE_SECRET", TEST_SECRET);
    vi.mocked(kv.zadd).mockResolvedValue(1);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("request body validation", () => {
    test("returns 400 on invalid JSON body", async () => {
      const request = new Request("http://localhost/guessthescore/api/submit-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json{{{",
      });
      const response = await POST({ request } as unknown as APIContext);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid request body");
    });
  });

  describe("token validation", () => {
    test("returns 403 when token is absent", async () => {
      const response = await POST({ request: makeRequest({ name: "Alice", score: 80 }) } as unknown as APIContext);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe("Invalid token");
    });

    test("returns 403 when token has wrong format", async () => {
      const response = await POST({
        request: makeRequest({ name: "Alice", score: 80, token: "badtoken" }),
      } as unknown as APIContext);

      expect(response.status).toBe(403);
    });

    test("returns 403 when token signature is wrong", async () => {
      const nonce = randomUUID();
      const timestamp = Date.now().toString();
      const token = `${nonce}:${timestamp}:wrongsignature`;

      const response = await POST({
        request: makeRequest({ name: "Alice", score: 80, token }),
      } as unknown as APIContext);

      expect(response.status).toBe(403);
    });

    test("returns 403 when token is older than 2 hours", async () => {
      const expiredToken = createValidToken(TEST_SECRET, 3 * 60 * 60 * 1000);

      const response = await POST({
        request: makeRequest({ name: "Alice", score: 80, token: expiredToken }),
      } as unknown as APIContext);

      expect(response.status).toBe(403);
    });

    test("returns 403 when token has a future timestamp", async () => {
      const futureToken = createValidToken(TEST_SECRET, -60_000);

      const response = await POST({
        request: makeRequest({ name: "Alice", score: 80, token: futureToken }),
      } as unknown as APIContext);

      expect(response.status).toBe(403);
    });

    test("returns 403 when SCORE_SECRET is not set", async () => {
      vi.unstubAllEnvs();
      const token = createValidToken(TEST_SECRET);

      const response = await POST({
        request: makeRequest({ name: "Alice", score: 80, token }),
      } as unknown as APIContext);

      expect(response.status).toBe(403);
    });
  });

  describe("name validation", () => {
    test("returns 400 when name is empty string", async () => {
      const token = createValidToken();
      const response = await POST({ request: makeRequest({ name: "", score: 80, token }) } as unknown as APIContext);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid name");
    });

    test("returns 400 when name is only whitespace", async () => {
      const token = createValidToken();
      const response = await POST({ request: makeRequest({ name: "   ", score: 80, token }) } as unknown as APIContext);

      expect(response.status).toBe(400);
    });

    test("returns 400 when name exceeds 30 characters", async () => {
      const token = createValidToken();
      const response = await POST({
        request: makeRequest({ name: "A".repeat(31), score: 80, token }),
      } as unknown as APIContext);

      expect(response.status).toBe(400);
    });

    test("accepts a name of exactly 30 characters", async () => {
      const token = createValidToken();
      const response = await POST({
        request: makeRequest({ name: "A".repeat(30), score: 80, token }),
      } as unknown as APIContext);

      expect(response.status).toBe(200);
    });

    test("returns 400 when name is not a string", async () => {
      const token = createValidToken();
      const response = await POST({ request: makeRequest({ name: 42, score: 80, token }) } as unknown as APIContext);

      expect(response.status).toBe(400);
    });
  });

  describe("score validation", () => {
    test("returns 400 when score is a string", async () => {
      const token = createValidToken();
      const response = await POST({
        request: makeRequest({ name: "Alice", score: "80", token }),
      } as unknown as APIContext);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Invalid score");
    });

    test("returns 400 when score is negative", async () => {
      const token = createValidToken();
      const response = await POST({
        request: makeRequest({ name: "Alice", score: -1, token }),
      } as unknown as APIContext);

      expect(response.status).toBe(400);
    });

    test("returns 400 when score exceeds 100", async () => {
      const token = createValidToken();
      const response = await POST({
        request: makeRequest({ name: "Alice", score: 101, token }),
      } as unknown as APIContext);

      expect(response.status).toBe(400);
    });

    test("returns 400 when score is a float", async () => {
      const token = createValidToken();
      const response = await POST({
        request: makeRequest({ name: "Alice", score: 75.5, token }),
      } as unknown as APIContext);

      expect(response.status).toBe(400);
    });

    test("accepts score of 0", async () => {
      const token = createValidToken();
      const response = await POST({ request: makeRequest({ name: "Alice", score: 0, token }) } as unknown as APIContext);

      expect(response.status).toBe(200);
    });

    test("accepts score of 100", async () => {
      const token = createValidToken();
      const response = await POST({
        request: makeRequest({ name: "Alice", score: 100, token }),
      } as unknown as APIContext);

      expect(response.status).toBe(200);
    });
  });

  describe("successful submission", () => {
    test("saves to KV and returns ok:true", async () => {
      const token = createValidToken();
      const response = await POST({ request: makeRequest({ name: "Alice", score: 80, token }) } as unknown as APIContext);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(kv.zadd).toHaveBeenCalledWith(
        "leaderboard",
        expect.objectContaining({ score: 80 })
      );
    });

    test("trims whitespace from name before saving", async () => {
      const token = createValidToken();
      await POST({ request: makeRequest({ name: "  Alice  ", score: 80, token }) } as unknown as APIContext);

      const [, { member }] = vi.mocked(kv.zadd).mock.calls[0] as [string, { score: number; member: string }];
      const saved = JSON.parse(member);
      expect(saved.name).toBe("Alice");
    });

    test("stores score and date in the KV member", async () => {
      const token = createValidToken();
      await POST({ request: makeRequest({ name: "Alice", score: 75, token }) } as unknown as APIContext);

      const [, { member }] = vi.mocked(kv.zadd).mock.calls[0] as [string, { score: number; member: string }];
      const saved = JSON.parse(member);
      expect(saved.score).toBe(75);
      expect(typeof saved.date).toBe("string");
    });

    test("sets content-type header on success", async () => {
      const token = createValidToken();
      const response = await POST({ request: makeRequest({ name: "Alice", score: 80, token }) } as unknown as APIContext);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });
});
