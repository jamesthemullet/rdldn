import { describe, expect, it } from "vitest";
import type { Post } from "../types";
import { postForDate } from "./postForDate";

function makePost(slug: string): Post {
  return { date: "2024-01-01", slug } as Post;
}

describe("postForDate", () => {
  it("returns null when there are no posts", () => {
    expect(postForDate(new Date("2026-01-01T12:00:00Z"), [])).toBeNull();
  });

  it("returns the same post for the same calendar day regardless of time of day", () => {
    const posts = [makePost("alpha"), makePost("beta"), makePost("gamma")];

    const morning = postForDate(new Date("2026-03-05T00:00:01Z"), posts);
    const night = postForDate(new Date("2026-03-05T23:59:59Z"), posts);

    expect(morning).toEqual(night);
  });

  it("returns a different post on a different day when there is more than one post", () => {
    const posts = [makePost("alpha"), makePost("beta")];

    const day1 = postForDate(new Date("2026-03-05T12:00:00Z"), posts);
    const day2 = postForDate(new Date("2026-03-06T12:00:00Z"), posts);

    expect(day1?.slug).not.toBe(day2?.slug);
  });

  it("is independent of the input array's order", () => {
    const posts = [makePost("alpha"), makePost("beta"), makePost("gamma")];
    const shuffled = [makePost("gamma"), makePost("alpha"), makePost("beta")];
    const date = new Date("2026-03-05T12:00:00Z");

    expect(postForDate(date, posts)?.slug).toBe(postForDate(date, shuffled)?.slug);
  });

  it("returns the only post when given a single post", () => {
    const posts = [makePost("solo")];

    expect(postForDate(new Date("2026-03-05T12:00:00Z"), posts)?.slug).toBe("solo");
  });
});
