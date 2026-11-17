import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Burmanlabs",
    short_name: "Burmanlabs",
    id: "burmanlabs-pwa",
    description:
      "Independent software laboratory in Upper Myanmar. Offline-first tools, simulations, and creative computation.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#0b0a09",
    theme_color: "#0b0a09",
    orientation: "any",
    categories: ["utilities", "productivity", "education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Founder Deck",
        short_name: "Deck",
        description: "Burmanlabs Founder & Content Management",
        url: "/?admin=1",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Cortex Queue",
        short_name: "Cortex",
        description: "Queue prompts and tasks for Cortex CLI",
        url: "/?cortex=1",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Studio 3D",
        short_name: "Studio",
        description: "Interactive 3D shaders and geometry",
        url: "/en/studio",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
