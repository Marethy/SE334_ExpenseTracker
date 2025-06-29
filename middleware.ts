import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/"]);
const isWellKnownRoute = createRouteMatcher(["/.well-known/:path*"]);

export default clerkMiddleware(async (auth, request) => {
  // Handle well-known routes
  if (isWellKnownRoute(request)) {
    return NextResponse.next();
  }

  // Handle protected routes
  if (isProtectedRoute(request)) {
    await auth().protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!.+.[w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
    "/.well-known/(.*)", // Add well-known routes
  ],
};
