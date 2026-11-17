import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  getCookieOptions,
  verifyAdminPassword,
  verifySessionToken,
} from "@/lib/adminSession";

export async function GET(req: Request) {
  const cookieStore = await cookies();
  let token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  // Header fallback for iOS PWAs where cookies can be evicted on suspension
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
  }

  const isAdmin = verifySessionToken(token);

  // If verified via valid header token, re-seed cookie
  if (isAdmin && token) {
    try {
      const parts = token.split(".");
      const expiresAt = Number(parts[0]);
      const remainingMs = expiresAt - Date.now();
      if (remainingMs > 0) {
        cookieStore.set(ADMIN_COOKIE_NAME, token, getCookieOptions(remainingMs));
      }
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ isAdmin });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password, rememberMe = true } = body || {};

    if (!password || typeof password !== "string") {
      return NextResponse.json({ ok: false, error: "Password is required" }, { status: 400 });
    }

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ ok: false, error: "Incorrect password" }, { status: 401 });
    }

    const isRemember = Boolean(rememberMe);
    const { token, durationMs } = createSessionToken(isRemember);
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, getCookieOptions(durationMs));

    return NextResponse.json({ ok: true, token: isRemember ? token : undefined });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
