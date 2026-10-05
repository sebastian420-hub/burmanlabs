// Builds the brand assets from the original portfolio files.  node scripts/make-brand.mjs
//
// - public/brand/burmanlabs-wordmark.webp: Portfolio/burmanx.png with its white/grey parts removed
//   (they were invisible on the old white site and show as blobs on the dark one).
// - public/brand/mark.png and the PWA icons: Portfolio/logo.png (black line art), recoloured
//   bone-white with strokes thickened so they survive small sizes.
import sharp from "sharp";

const P = (f) => new URL(`../../Portfolio/${f}`, import.meta.url).pathname;
const OUT = (f) => new URL(`../public/${f}`, import.meta.url).pathname;
const BG = "#0b0a09";
const BONE = "#f2efe9";

// ---- wordmark ---------------------------------------------------------------
{
  const { data, info } = await sharp(P("burmanx.png")).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const sat = Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]);
    if (sat < 60) data[i + 3] = 0; // keep only the reds
  }
  const trimmed = await sharp(data, { raw: info }).trim().png().toBuffer();
  await sharp(trimmed).resize(900).webp({ quality: 84, alphaQuality: 85, effort: 6 }).toFile(OUT("brand/burmanlabs-wordmark.webp"));
}

// ---- line-art mark ------------------------------------------------------------
async function mark(size, thicken) {
  const big = size * 2;
  const base = await sharp(P("logo.png"))
    .resize(big, big, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  // sharp's erode() grows the bright (opaque) strokes of the alpha channel.
  const alpha = await sharp(base).extractChannel(3).erode(thicken).raw().toBuffer();
  const tinted = await sharp({ create: { width: big, height: big, channels: 3, background: BONE } })
    .joinChannel(alpha, { raw: { width: big, height: big, channels: 1 } })
    .png()
    .toBuffer();
  return sharp(tinted).resize(size, size).png().toBuffer();
}

async function icon(size, file, pad) {
  const inner = Math.round(size * (1 - pad * 2));
  const m = await mark(inner, Math.max(2, Math.round(inner / 90)));
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: m, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(OUT(file));
}

await sharp(await mark(192, 2)).png({ compressionLevel: 9 }).toFile(OUT("brand/mark.png"));
await icon(192, "icon-192.png", 0.2);
await icon(512, "icon-512.png", 0.2);
await icon(180, "apple-touch-icon.png", 0.14);
console.log("brand assets written");
