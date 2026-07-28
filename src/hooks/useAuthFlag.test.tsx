// @vitest-environment happy-dom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { useAuthFlag } from "./useAuthFlag";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const FlagDisplay = () => {
  const flag = useAuthFlag();
  return <div data-testid="value">{String(flag)}</div>;
};

const setCookie = (name: string, value: string) => {
  document.cookie = `${name}=${value}; path=/`;
};

const clearCookie = (name: string) => {
  document.cookie = `${name}=; max-age=0; path=/`;
};

const waitForEffect = async () => {
  await act(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  });
};

const renderFlag = async () => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(<FlagDisplay />));
  await waitForEffect();
  const value = host.querySelector('[data-testid="value"]')?.textContent ?? "";
  await act(async () => root.unmount());
  return value;
};

beforeEach(() => {
  document.body.innerHTML = "";
  clearCookie("flag_authFeatures");
});

afterEach(() => {
  document.body.innerHTML = "";
  clearCookie("flag_authFeatures");
  clearCookie("other_cookie");
  clearCookie("prefix_flag_authFeatures");
});

describe("useAuthFlag", () => {
  test("returns false when no flag cookie is present", async () => {
    expect(await renderFlag()).toBe("false");
  });

  test("returns true when flag cookie value is 'true'", async () => {
    setCookie("flag_authFeatures", "true");
    expect(await renderFlag()).toBe("true");
  });

  test("returns false when flag cookie value is 'false'", async () => {
    setCookie("flag_authFeatures", "false");
    expect(await renderFlag()).toBe("false");
  });

  test("returns false for any value other than 'true'", async () => {
    setCookie("flag_authFeatures", "yes");
    expect(await renderFlag()).toBe("false");
  });

  test("correctly reads the flag when it is not the first cookie in the string", async () => {
    setCookie("other_cookie", "something");
    setCookie("flag_authFeatures", "true");
    expect(await renderFlag()).toBe("true");
  });

  test("does not match a cookie whose name has flag_authFeatures as a suffix", async () => {
    setCookie("prefix_flag_authFeatures", "true");
    expect(await renderFlag()).toBe("false");
  });
});
