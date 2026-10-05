/** Site-wide settings. Override with environment variables in .env.local / Vercel. */
export const site = {
  /** Shown in the footer. Taken from the original portfolio; change it there or via env. */
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "zwe@quantumblitz.net",
};
