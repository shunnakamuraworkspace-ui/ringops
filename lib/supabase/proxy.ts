import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isSupabaseConfigured,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
} from "./config";

const protectedRoutePrefixes = [
  "/candidates",
  "/open-matches",
  "/matchmaking",
  "/events",
  "/messages",
  "/notifications",
  "/gym",
  "/onboarding",
];

const reviewRoutePrefixes = [
  "/candidates",
  "/open-matches",
  "/matchmaking",
  "/events",
  "/messages",
  "/notifications",
  "/gym",
];

const reviewModeEnabled = process.env.RINGOPS_REVIEW_MODE !== "false";

function matchesPrefix(pathname: string, prefixes: readonly string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function hasSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  const pathname = request.nextUrl.pathname;
  const protectedRoute = matchesPrefix(pathname, protectedRoutePrefixes);
  const reviewRoute = matchesPrefix(pathname, reviewRoutePrefixes);
  const hasSession = hasSessionCookie(request);

  // Anonymous review traffic should never wait on a Supabase auth roundtrip.
  if (!hasSession) {
    if (!protectedRoute || (reviewModeEnabled && reviewRoute)) return response;

    const loginUrl = request.nextUrl.clone();
    const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", requestedPath);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);

  if (protectedRoute && !isAuthenticated) {
    const loginUrl = request.nextUrl.clone();
    const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", requestedPath);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
