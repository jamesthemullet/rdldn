import type { APIContext } from "astro";
import { beforeEach, describe, expect, test, vi } from "vitest";

const { mockSelect, mockInsert } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock("../../lib/db", () => ({
  db: { select: mockSelect, insert: mockInsert },
}));

import { GET } from "./profile";

const selectChain = (resolvedValue: unknown) => ({
  from: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue(resolvedValue),
    }),
  }),
});

const makeContext = (clerkId: string | null, email = ""): APIContext =>
  ({
    locals: {
      auth: () => ({ userId: clerkId }),
      currentUser: () =>
        Promise.resolve(
          email ? { emailAddresses: [{ emailAddress: email }] } : null
        ),
    },
    request: new Request("http://localhost/api/profile"),
  }) as unknown as APIContext;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/profile", () => {
  test("returns 401 when the request is not authenticated", async () => {
    const response = await GET(makeContext(null));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  test("returns the existing user profile without inserting a new row", async () => {
    const existingUser = { id: "uuid-1", clerkId: "clerk_abc", email: "user@example.com" };
    mockSelect
      .mockReturnValueOnce(selectChain([existingUser]))
      .mockReturnValueOnce(selectChain([existingUser]));

    const response = await GET(makeContext("clerk_abc", "user@example.com"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(existingUser);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  test("inserts a new user on first visit then returns their profile", async () => {
    const newUser = { id: "uuid-2", clerkId: "clerk_xyz", email: "new@example.com" };
    mockSelect
      .mockReturnValueOnce(selectChain([]))
      .mockReturnValueOnce(selectChain([newUser]));
    mockInsert.mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });

    const response = await GET(makeContext("clerk_xyz", "new@example.com"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(newUser);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });
});
