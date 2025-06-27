import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/']);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth().protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.+.[w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
