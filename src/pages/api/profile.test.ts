import type { APIContext } from "astro";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../../lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

import { db } from "../../lib/db";
import { GET } from "./profile";

function makeSelectChain(result: unknown[]) {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn().mockResolvedValue(result),
  };
  chain.from.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  return chain as unknown as ReturnType<typeof db.select>;
}

function makeInsertChain() {
  return { values: vi.fn().mockResolvedValue(undefined) } as unknown as ReturnType<typeof db.insert>;
}

function makeContext({
  clerkId,
  email,
  hasCurrentUser = true,
}: {
  clerkId: string | null;
  email?: string;
  hasCurrentUser?: boolean;
}): APIContext {
  const currentUserFn = hasCurrentUser
    ? vi.fn().mockResolvedValue(
        email !== undefined ? { emailAddresses: [{ emailAddress: email }] } : null
      )
    : undefined;

  return {
    locals: {
      auth: () => ({ userId: clerkId }),
      currentUser: currentUserFn,
    },
  } as unknown as APIContext;
}

describe("GET /api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns 401 when not authenticated", async () => {
    const response = await GET(makeContext({ clerkId: null }));
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  test("returns existing profile without inserting when user already exists", async () => {
    const profile = { id: "user-1", clerkId: "clerk-abc", email: "user@example.com" };
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([profile]))
      .mockReturnValueOnce(makeSelectChain([profile]));

    const response = await GET(makeContext({ clerkId: "clerk-abc", email: "user@example.com" }));

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(profile);
    expect(db.insert).not.toHaveBeenCalled();
  });

  test("inserts a new user and returns their profile when the user does not yet exist", async () => {
    const profile = { id: "user-2", clerkId: "clerk-new", email: "new@example.com" };
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([]))
      .mockReturnValueOnce(makeSelectChain([profile]));
    vi.mocked(db.insert).mockReturnValue(makeInsertChain());

    const response = await GET(makeContext({ clerkId: "clerk-new", email: "new@example.com" }));

    expect(response.status).toBe(200);
    expect(db.insert).toHaveBeenCalledTimes(1);
    const data = await response.json();
    expect(data).toEqual(profile);
  });

  test("uses an empty string for email when context.locals.currentUser is absent", async () => {
    const profile = { id: "user-3", clerkId: "clerk-xyz", email: "" };
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([]))
      .mockReturnValueOnce(makeSelectChain([profile]));
    vi.mocked(db.insert).mockReturnValue(makeInsertChain());

    const response = await GET(makeContext({ clerkId: "clerk-xyz", hasCurrentUser: false }));

    expect(response.status).toBe(200);
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  test("uses an empty string for email when currentUser resolves to null", async () => {
    const profile = { id: "user-4", clerkId: "clerk-null-user", email: "" };
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([]))
      .mockReturnValueOnce(makeSelectChain([profile]));
    vi.mocked(db.insert).mockReturnValue(makeInsertChain());

    const response = await GET(makeContext({ clerkId: "clerk-null-user" }));

    expect(response.status).toBe(200);
    expect(db.insert).toHaveBeenCalledTimes(1);
  });

  test("returns the profile with Content-Type application/json header", async () => {
    const profile = { id: "user-5", clerkId: "clerk-headers", email: "h@example.com" };
    vi.mocked(db.select)
      .mockReturnValueOnce(makeSelectChain([profile]))
      .mockReturnValueOnce(makeSelectChain([profile]));

    const response = await GET(makeContext({ clerkId: "clerk-headers", email: "h@example.com" }));

    expect(response.headers.get("Content-Type")).toBe("application/json");
  });
});
