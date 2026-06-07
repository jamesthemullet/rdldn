// @vitest-environment happy-dom

import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { translateClosedDown } from "./useSortFilter";

describe("translateClosedDown", () => {
  it("returns 'Closed Down' for closeddown", () => {
    expect(translateClosedDown("closeddown", undefined)).toBe("Closed Down");
  });

  it("returns 'Stopped Doing Roasts' for stopped", () => {
    expect(translateClosedDown("stopped", undefined)).toBe("Stopped Doing Roasts");
  });

  it("returns 'Popup Moved' for popupmoved", () => {
    expect(translateClosedDown("popupmoved", undefined)).toBe("Popup Moved");
  });

  it("returns 'Temporarily Closed' for tempclosed", () => {
    expect(translateClosedDown("tempclosed", undefined)).toBe("Temporarily Closed");
  });

  it("returns 'New Owners' for newowners", () => {
    expect(translateClosedDown("newowners", undefined)).toBe("New Owners");
  });

  it("returns 'Popup Stopped' for popupstopped", () => {
    expect(translateClosedDown("popupstopped", undefined)).toBe("Popup Stopped");
  });

  it("returns a plain string for re-reviewed when there is no newSlug", () => {
    expect(translateClosedDown("re-reviewed-2024", undefined)).toBe("Re-reviewed in 2024");
  });

  it("returns an anchor element linking to the new slug for re-reviewed with newSlug", () => {
    const result = translateClosedDown("re-reviewed-2024", "new-place") as ReactElement;
    const props = result.props as { href: string; children: string };

    expect(result.type).toBe("a");
    expect(props.href).toBe("/new-place");
    expect(props.children).toContain("2024");
  });

  it("passes unknown strings through unchanged", () => {
    expect(translateClosedDown("some-unknown-status", undefined)).toBe("some-unknown-status");
  });

  it("returns undefined for undefined input", () => {
    expect(translateClosedDown(undefined, undefined)).toBeUndefined();
  });
});
