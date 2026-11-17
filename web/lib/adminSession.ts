import crypto from "crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "burmanlabs_admin";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours active session

function getSecret(): string {
  return process.env.ADMIN_PASSWORD || "burmanlabs";
}

export function verifyAdminPassword(password: string): boolean {
  const secret = getSecret();
  if (!password || !secret) return false;

  const bufA = Buffer.from(password.trim());
  const bufB = Buffer.from(secret.trim());

  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function createSessionToken(): { token: string; durationMs: number } {
  const secret = getSecret();
  const durationMs = SESSION_DURATION_MS;
  const expiresAt = Date.now() + durationMs;
  const payload = `${expiresAt}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return { token: `${payload}.${sig}`, durationMs };
}

export function verifySessionToken(rawToken: string | undefined | null): boolean {
  if (!rawToken) return false;
  const token = rawToken.trim();
  const secret = getSecret();
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [payload, sig] = parts;
  const expiresAt = Number(payload);

  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const bufSig = Buffer.from(sig);
  const bufExpected = Buffer.from(expectedSig);

  if (bufSig.length !== bufExpected.length) return false;
  return crypto.timingSafeEqual(bufSig, bufExpected);
}

export function getCookieOptions(durationMs = SESSION_DURATION_MS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(durationMs / 1000),
    expires: new Date(Date.now() + durationMs),
    secure: process.env.NODE_ENV === "production",
  };
}

export async function getAdminTokenFromRequest(req: Request): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (cookieVal && verifySessionToken(cookieVal)) {
    return cookieVal;
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) {
      const candidate = match[1].trim();
      if (verifySessionToken(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}
