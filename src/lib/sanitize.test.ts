import { describe, expect, it } from "vitest";
import { sanitizeContent, sanitizeTitle } from "./sanitize";

describe("sanitizeContent", () => {
  it("returns empty string for null input", () => {
    expect(sanitizeContent(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(sanitizeContent(undefined)).toBe("");
  });

  it("strips script tags and their content", () => {
    const result = sanitizeContent('<p>Hello</p><script>alert("xss")</script>');
    expect(result).not.toContain("<script");
    expect(result).not.toContain("alert");
    expect(result).toContain("Hello");
  });

  it("strips event handler attributes", () => {
    const result = sanitizeContent('<a href="https://example.com" onclick="evil()">link</a>');
    expect(result).not.toContain("onclick");
    expect(result).toContain("href");
  });

  it("strips javascript: href schemes", () => {
    const result = sanitizeContent('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain("javascript:");
  });

  it("allows https: and http: href schemes", () => {
    const result = sanitizeContent('<a href="https://example.com">link</a>');
    expect(result).toContain('href="https://example.com"');
  });

  it("allows img tags with permitted attributes", () => {
    const result = sanitizeContent('<img src="photo.jpg" alt="A photo" width="100" height="100">');
    expect(result).toContain("<img");
    expect(result).toContain('src="photo.jpg"');
    expect(result).toContain('alt="A photo"');
  });

  it("strips disallowed attributes from img", () => {
    const result = sanitizeContent('<img src="photo.jpg" onerror="evil()">');
    expect(result).not.toContain("onerror");
  });

  it("allows iframe tags with permitted attributes", () => {
    const result = sanitizeContent('<iframe src="https://example.com" width="560" height="315" title="Video"></iframe>');
    expect(result).toContain("<iframe");
    expect(result).toContain('src="https://example.com"');
    expect(result).toContain('title="Video"');
  });

  it("allows figure and figcaption tags", () => {
    const result = sanitizeContent("<figure><img src=\"photo.jpg\"><figcaption>Caption</figcaption></figure>");
    expect(result).toContain("<figure>");
    expect(result).toContain("<figcaption>");
  });

  it("allows class and id attributes on any element", () => {
    const result = sanitizeContent('<p class="intro" id="first">Text</p>');
    expect(result).toContain('class="intro"');
    expect(result).toContain('id="first"');
  });

  it("passes through plain text unchanged", () => {
    expect(sanitizeContent("Hello world")).toBe("Hello world");
  });
});

describe("sanitizeTitle", () => {
  it("returns empty string for null input", () => {
    expect(sanitizeTitle(null)).toBe("");
  });

  it("returns empty string for undefined input", () => {
    expect(sanitizeTitle(undefined)).toBe("");
  });

  it("strips all HTML tags and returns plain text", () => {
    const result = sanitizeTitle("<h1>The <em>Best</em> Roast</h1>");
    expect(result).toBe("The Best Roast");
    expect(result).not.toContain("<");
  });

  it("strips script tags entirely", () => {
    const result = sanitizeTitle('<script>alert("xss")</script>Title');
    expect(result).not.toContain("<script");
    expect(result).not.toContain("alert");
  });

  it("passes through plain text unchanged", () => {
    expect(sanitizeTitle("Best Roast Dinner in London")).toBe("Best Roast Dinner in London");
  });
});
