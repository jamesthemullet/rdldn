import { Show, SignInButton, UserButton } from "@clerk/astro/react";
import { useState, useEffect } from "react";

function useFlag(key: string, defaultValue = true): boolean {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    const stored = localStorage.getItem(`flag_${key}`);
    setValue(stored === null ? defaultValue : stored === "true");
  }, []);
  return value;
}

export function HeaderAuthDesktop() {
  const authEnabled = useFlag("authFeatures");
  if (!authEnabled) return null;
  return (
    <>
      <Show when="signed-in">
        <UserButton />
      </Show>
      <Show when="signed-out">
        <span className="header-signin-desktop">
          <SignInButton />
        </span>
      </Show>
    </>
  );
}

export function HeaderAuthMobile() {
  const authEnabled = useFlag("authFeatures");
  if (!authEnabled) return null;
  return (
    <>
      <a href="/my-roasts">My Roasts</a>
      <Show when="signed-out">
        <span className="header-signin-mobile">
          <SignInButton />
        </span>
      </Show>
    </>
  );
}
