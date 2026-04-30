import { Show, SignInButton, UserButton } from "@clerk/astro/react";

export function HeaderAuthDesktop() {
  return (
    <>
      <Show when="signed-in">
        <UserButton />
      </Show>
      <Show when="signed-out">
        <span class="header-signin-desktop">
          <SignInButton />
        </span>
      </Show>
    </>
  );
}

export function HeaderAuthMobile() {
  return (
    <>
      <a href="/my-roasts">My Roasts</a>
      <Show when="signed-out">
        <span class="header-signin-mobile">
          <SignInButton />
        </span>
      </Show>
    </>
  );
}
