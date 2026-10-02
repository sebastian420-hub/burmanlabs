// Builds PWA icons from the original line-art logo (black on transparent),
// inverted for the dark theme.  node scripts/make-icons.mjs
import sharp from "sharp";

const SRC = new URL("../../Portfolio/logo.png", import.meta.url).pathname;
const BG = "#060a13";

async function icon(size, file, pad = 0.2) {
  const inner = Math.round(size * (1 - pad * 2));
  const mark = await sharp(SRC)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .negate({ alpha: false })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: mark, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(new URL(`../public/${file}`, import.meta.url).pathname);
}

await icon(192, "icon-192.png");
await icon(512, "icon-512.png");
await icon(180, "apple-touch-icon.png", 0.14);
await sharp(SRC)
  .resize(96, 96, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .negate({ alpha: false })
  .png({ compressionLevel: 9 })
  .toFile(new URL("../public/logo-mark.png", import.meta.url).pathname);
