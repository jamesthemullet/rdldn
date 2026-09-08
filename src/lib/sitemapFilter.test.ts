import { describe, expect, it } from "vitest";
import { shouldIncludeInSitemap } from "./sitemapFilter";

describe("shouldIncludeInSitemap", () => {
  it("excludes the noindex my-roasts route", () => {
    expect(shouldIncludeInSitemap("https://rdldn.co.uk/my-roasts")).toBe(false);
  });

  it("excludes the noindex sign-in route", () => {
    expect(shouldIncludeInSitemap("https://rdldn.co.uk/sign-in")).toBe(false);
  });

  it("excludes the noindex flags route", () => {
    expect(shouldIncludeInSitemap("https://rdldn.co.uk/flags")).toBe(false);
  });

  it("excludes the noindex my-passport route", () => {
    expect(shouldIncludeInSitemap("https://rdldn.co.uk/my-passport")).toBe(false);
  });

  it("excludes the noindex 404 route", () => {
    expect(shouldIncludeInSitemap("https://rdldn.co.uk/404")).toBe(false);
  });

  it("excludes a noindex route with a trailing slash", () => {
    expect(shouldIncludeInSitemap("https://rdldn.co.uk/my-passport/")).toBe(false);
  });

  it("includes the homepage", () => {
    expect(shouldIncludeInSitemap("https://rdldn.co.uk/")).toBe(true);
  });

  it("includes a regular post route", () => {
    expect(shouldIncludeInSitemap("https://rdldn.co.uk/ember-yard-soho")).toBe(true);
  });

  it("does not exclude routes that merely start with a noindex path segment", () => {
    expect(shouldIncludeInSitemap("https://rdldn.co.uk/my-roasts-guide")).toBe(true);
  });
});
