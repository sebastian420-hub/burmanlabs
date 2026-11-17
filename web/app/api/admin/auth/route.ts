import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  getAdminTokenFromRequest,
  getCookieOptions,
  verifyAdminPassword,
} from "@/lib/adminSession";

export async function GET(req: Request) {
  const verifiedToken = await getAdminTokenFromRequest(req);
  const isAdmin = Boolean(verifiedToken);

  // If verified via header token or cookie, re-seed cookie
  if (isAdmin && verifiedToken) {
    try {
      const parts = verifiedToken.split(".");
      const expiresAt = Number(parts[0]);
      const remainingMs = expiresAt - Date.now();
      if (remainingMs > 0) {
        const cookieStore = await cookies();
        cookieStore.set(ADMIN_COOKIE_NAME, verifiedToken, getCookieOptions(remainingMs));
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
