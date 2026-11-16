import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, hasLocale, type Locale } from "@/lib/i18n";

/** Visitors with no chosen language: Burmese unless the browser clearly prefers English. */
function pickLocale(request: NextRequest): Locale {
  const saved = request.cookies.get("lang")?.value;
  if (saved && hasLocale(saved)) return saved;

  const header = request.headers.get("accept-language") ?? "";
  const first = header.split(",")[0]?.trim().toLowerCase() ?? "";
  if (first.startsWith("en")) return "en";
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) return;

  // Direct /admin shortcut -> redirect to /[locale]?admin=1
  if (pathname === "/admin" || pathname === "/admin/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${pickLocale(request)}`;
    url.searchParams.set("admin", "1");
    return NextResponse.redirect(url);
  }

  const first = pathname.split("/")[1] ?? "";
  if (hasLocale(first)) {
    // Also handle /[locale]/admin
    const second = pathname.split("/")[2] ?? "";
    if (second === "admin") {
      const url = request.nextUrl.clone();
      url.pathname = `/${first}`;
      url.searchParams.set("admin", "1");
      return NextResponse.redirect(url);
    }
    return;
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${pickLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip API routes, Next internals, and anything with a file extension (sw.js, icons, manifest…).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
