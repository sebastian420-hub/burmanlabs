export const locales = ["my", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "my";

export const hasLocale = (value: string): value is Locale =>
  (locales as readonly string[]).includes(value);

/** Myanmar digits for the Burmese UI. Deterministic, so server and client agree. */
export function num(n: number, lang: Locale): string {
  const s = String(n);
  return lang === "my" ? s.replace(/\d/g, (d) => String.fromCharCode(0x1040 + Number(d))) : s;
}

/** Strip zero-width characters and normalise so Burmese search is forgiving. */
export function fold(s: string): string {
  return s.normalize("NFC").replace(/[​-‍﻿]/g, "").toLowerCase();
}
