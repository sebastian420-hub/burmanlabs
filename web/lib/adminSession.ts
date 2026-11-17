import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "burmanlabs_admin";
export const DEFAULT_SESSION_MS = 8 * 60 * 60 * 1000; // 8 hours
export const EXTENDED_SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days (personal device)

function getSecret(): string {
  return process.env.ADMIN_PASSWORD || "burmanlabs";
}

export function verifyAdminPassword(password: string): boolean {
  const secret = getSecret();
  if (!password || !secret) return false;

  const bufA = Buffer.from(password);
  const bufB = Buffer.from(secret);

  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function createSessionToken(rememberMe = true): { token: string; durationMs: number } {
  const secret = getSecret();
  const durationMs = rememberMe ? EXTENDED_SESSION_MS : DEFAULT_SESSION_MS;
  const expiresAt = Date.now() + durationMs;
  const payload = `${expiresAt}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return { token: `${payload}.${sig}`, durationMs };
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
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

export function getCookieOptions(durationMs = EXTENDED_SESSION_MS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(durationMs / 1000),
    secure: process.env.NODE_ENV === "production",
  };
}
