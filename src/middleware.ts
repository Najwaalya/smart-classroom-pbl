import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // List of public paths that don't require authentication
  const publicPaths = ["/login", "/register"];
  const excludePaths = [
    ...publicPaths,
    "/api", // All API routes
    "/_next", // Next.js internal routes
    "/images", // Public images
    "/favicon.ico",
  ];

  // Check if the current path should be excluded from auth check
  const isExcludedPath = excludePaths.some(
    (excludePath) =>
      pathname === excludePath ||
      pathname.startsWith(excludePath + "/") ||
      pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp)$/)
  );

  if (isExcludedPath) {
    return NextResponse.next();
  }

  // Check if user has role cookie
  const roleCookie = request.cookies.get("role");

  // If no role cookie and not on a public path, redirect to login
  if (!roleCookie && !publicPaths.includes(pathname)) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
