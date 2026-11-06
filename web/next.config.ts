import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages for work that was taken off the site. Temporary (307), so they can come back.
  async redirects() {
    return [
      { source: "/:lang(my|en)/sims/:slug(village|orbit)/:path*", destination: "/:lang/catalog", permanent: false },
      { source: "/:lang(my|en)/catalog/:id(the-village|golf-handicap|orbit)", destination: "/:lang/catalog", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        // The service worker must always be re-checked so updates reach phones quickly.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // Fonts and icons never change under the same name.
        source: "/fonts/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
