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

export const onRequest: MiddlewareHandler =
  process.env.PLAYWRIGHT === "true" ? (_, next) => next() : (clerkHandler as MiddlewareHandler);

export const config = {
  matcher: ["/((?!_astro|images|favicon\\.ico|.*\\..*).*)"],
};
