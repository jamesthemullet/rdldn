import { Show, SignInButton, UserButton } from "@clerk/astro/react";
import { memo, useEffect, useState } from "react";

function useAuthFlag(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    const match = document.cookie.match(/(^| )flag_authFeatures=([^;]+)/);
    const val = match ? match[2] : null;
    setEnabled(val === null ? false : val === "true");
  }, []);
  return enabled;
}

export const HeaderAuthDesktop = memo(function HeaderAuthDesktop() {
  const enabled = useAuthFlag();
  if (!enabled) return null;
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
});

export const HeaderAuthMobile = memo(function HeaderAuthMobile() {
  const enabled = useAuthFlag();
  if (!enabled) return null;
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
});
