import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/"]);
const isWellKnownRoute = createRouteMatcher(["/.well-known/:path*"]);
const isApiRoute = createRouteMatcher(["/api/:path*"]);

export default clerkMiddleware(async (auth, request) => {
  // Handle well-known routes
  if (isWellKnownRoute(request)) {
    return NextResponse.next();
  }

  // Debug API calls
  if (isApiRoute(request)) {
    console.log("🛣️  API Route:", request.url);
    const { userId } = await auth();
    console.log("👤 User ID in middleware:", userId);
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
    "/.well-known/(.*)",
  ],
};
