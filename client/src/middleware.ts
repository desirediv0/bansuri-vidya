import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";

interface UserDetails {
  id: string;
  email: string;
  role: "ADMIN" | "STUDENT";
  name: string;
}

const ROUTES = {
  public: [
    "/",
    "/about",
    "/contact",
    "/courses",
    "/blog",
    "verify-email",
    "/reset-password",
  ],
  auth: ["/auth", "/login", "/register"],
  admin: ["/dashboard", "/admin"],
  user: ["/user-profile", "/my-courses", "/settings"],
} as const;

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const accessToken = request.cookies.get("accessToken")?.value;
  let user: UserDetails | null = null;

  // Helper functions
  const redirect = (path: string) =>
    NextResponse.redirect(new URL(path, request.url));
  const isPublicRoute = () =>
    ROUTES.public.some((route) => pathname.startsWith(route));
  const isAuthRoute = () =>
    ROUTES.auth.some((route) => pathname.startsWith(route));
  const isAdminRoute = () =>
    ROUTES.admin.some((route) => pathname.startsWith(route));
  const isUserRoute = () =>
    ROUTES.user.some((route) => pathname.startsWith(route));

  // Allow access to public routes without authentication
  if (isPublicRoute()) {
    return NextResponse.next();
  }

  // Handle authentication
  if (!accessToken) {
    // If no token and trying to access protected routes
    if (isAdminRoute() || isUserRoute()) {
      const response = redirect("/auth");
      response.cookies.delete("accessToken");
      return response;
    }
    // Allow access to auth routes
    if (isAuthRoute()) {
      return NextResponse.next();
    }
    // Redirect to auth for any other route
    const response = redirect("/auth");
    response.cookies.delete("accessToken");
    return response;
  }

  // Parse and verify token
  try {
    user = jwtDecode<UserDetails>(accessToken);
    if (!user || !user.id || !user.role) {
      const response = redirect("/auth");
      response.cookies.delete("accessToken");
      return response;
    }
  } catch {
    // Invalid token - clear it and redirect to auth
    const response = redirect("/auth");
    response.cookies.delete("accessToken");
    return response;
  }

  // Handle logout
  if (pathname === "/logout") {
    const response = redirect("/");
    response.cookies.delete("accessToken");
    return response;
  }

  // Auth routes - redirect logged in users
  if (isAuthRoute()) {
    const searchParams = request.nextUrl.searchParams;
    const redirectUrl = searchParams.get("redirect");
    const courseSlug = searchParams.get("course-slug");
    const liveClassId = searchParams.get("live-class-id");

    // If there's a redirect URL, use it
    if (redirectUrl) {
      return redirect(redirectUrl);
    }

    // If there's a course slug, redirect to course
    if (courseSlug) {
      return redirect(`/courses/${courseSlug}`);
    }

    // If there's a live class ID, redirect to live class
    if (liveClassId) {
      return redirect(`/live-classes/${liveClassId}`);
    }

    // Otherwise use default redirects based on role
    if (user.role === "ADMIN") {
      return redirect("/dashboard");
    }
    return redirect("/user-profile");
  }

  // Admin routes - strict admin check
  if (isAdminRoute()) {
    if (user.role !== "ADMIN") {
      return redirect("/user-profile");
    }
    return NextResponse.next();
  }

  // User routes - authenticated users only
  if (isUserRoute()) {
    return NextResponse.next();
  }

  // Default - allow authenticated users
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json).*)",
  ],
};
