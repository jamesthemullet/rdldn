import { clerkMiddleware } from "@clerk/astro/server";
import type { MiddlewareHandler } from "astro";

const protectedRoutePrefixes = ["/api/wishlist", "/api/profile", "/my-roasts"];

const isProtectedRoute = (request: Request) => {
  const { pathname } = new URL(request.url);
  return protectedRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
};

const clerkHandler = clerkMiddleware((auth, context) => {
  if (isProtectedRoute(context.request)) {
    const { userId, redirectToSignIn } = auth();
    if (!userId) return redirectToSignIn();
  }
});

const testAuthHandler: MiddlewareHandler = (context, next) => {
  context.locals.auth = (() => ({
    userId: null,
    redirectToSignIn: () => context.redirect("/sign-in"),
  })) as typeof context.locals.auth;
  return next();
};

export const onRequest: MiddlewareHandler =
  process.env.PLAYWRIGHT === "true" ? testAuthHandler : (clerkHandler as MiddlewareHandler);

export const config = {
  matcher: ["/((?!_astro|images|favicon\\.ico|.*\\..*).*)"],
};
