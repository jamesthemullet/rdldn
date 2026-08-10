import { Show, SignInButton, UserButton } from "@clerk/astro/react";
import { memo } from "react";

export const HeaderAuthDesktop = memo(function HeaderAuthDesktop() {
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
