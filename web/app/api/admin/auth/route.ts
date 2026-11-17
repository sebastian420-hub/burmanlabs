import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  getCookieOptions,
  verifyAdminPassword,
  verifySessionToken,
} from "@/lib/adminSession";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const isAdmin = verifySessionToken(token);

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

    const { token, durationMs } = createSessionToken(Boolean(rememberMe));
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, getCookieOptions(durationMs));

    return NextResponse.json({ ok: true });
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
