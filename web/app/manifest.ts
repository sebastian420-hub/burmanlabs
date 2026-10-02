import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Burmanlabs",
    short_name: "Burmanlabs",
    description:
      "Interactive textbooks, apps and simulations for Myanmar. Free, light on data, works offline.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#060a13",
    theme_color: "#060a13",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
