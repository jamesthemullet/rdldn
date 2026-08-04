import { Show, SignInButton, UserButton } from "@clerk/astro/react";
import { memo } from "react";
import { useAuthFlag } from "../../lib/useAuthFlag";

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
