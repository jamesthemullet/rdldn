import { clerkMiddleware, createRouteMatcher } from "@clerk/astro/server";

const isProtectedRoute = createRouteMatcher(["/api/wishlist(.*)", "/api/profile(.*)"]);

export const onRequest = clerkMiddleware((auth, context) => {
  if (isProtectedRoute(context.request)) {
    const { userId, redirectToSignIn } = auth();
    if (!userId) return redirectToSignIn();
  }
});

export const config = {
  matcher: ["/((?!_astro|images|favicon\\.ico|.*\\..*).*)"],
};
