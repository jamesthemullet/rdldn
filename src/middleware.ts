import { clerkMiddleware } from "@clerk/astro/server";
import type { MiddlewareHandler } from "astro";

const badBots = [
  "Bytespider",
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "dotbot",
  "PetalBot",
  "Crawlers",
  "Python-requests",
];

export const blockBadBots = (request: Request): Response | undefined => {
  const userAgent = request.headers.get("user-agent") || "";
  if (badBots.some((bot) => userAgent.includes(bot))) {
    return new Response("Blocked", { status: 403 });
  }
};

const protectedRoutePrefixes = ["/api/wishlist", "/api/profile", "/api/visits", "/my-roasts"];

export const isProtectedRoute = (request: Request): boolean => {
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

const baseHandler: MiddlewareHandler =
  process.env.PLAYWRIGHT === "true" ? testAuthHandler : (clerkHandler as MiddlewareHandler);

export const onRequest: MiddlewareHandler = (context, next) => {
  const blocked = blockBadBots(context.request);
  if (blocked) return blocked;
  return baseHandler(context, next);
};

export const config = {
  matcher: ["/((?!_astro|images|favicon\\.ico|.*\\..*).*)"],
};
