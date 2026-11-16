import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "burmanlabs_admin";
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

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

export function createSessionToken(): string {
  const secret = getSecret();
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload = `${expiresAt}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
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

export function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(SESSION_DURATION_MS / 1000),
    secure: process.env.NODE_ENV === "production",
  };
}
