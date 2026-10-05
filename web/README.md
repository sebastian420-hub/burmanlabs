# Burmanlabs web

Free, lean, Burmese-first site for interactive textbooks, apps and simulations.
Next.js (App Router) + Tailwind v4 + three.js. Burmese (`/my`) and English (`/en`).

```bash
npm install
npm run dev          # http://localhost:3000  (service worker is off in dev)
npm run build && npm start   # test offline/PWA behaviour here
```

> This Next.js version has breaking changes. Read `node_modules/next/dist/docs/` before
> changing framework-level code (see `AGENTS.md`).

## Deploying without touching the live portfolio

The repo root still holds the static `Portfolio/` site that `burmanlabs.vercel.app` serves.
This app lives in `web/`. In Vercel, create a **new project** from this repo with
**Root Directory = `web`** and check the preview before pointing any domain at it.

## Design system

Warm black, bone white and one loud colour: the red (`#ff3131`) of the original
BURMAN LABS wordmark (`public/brand/wordmark.webp`, from `Portfolio/burmanx.png`). Tokens live
in `app/globals.css` (`ink`, `bone`, `ash`, `signal`, `gold`, …).

- Type: Instrument Serif for display, Inter Tight for UI (Latin), Noto Sans Myanmar for
  Burmese. All self-hosted in `public/fonts/`. Burmese gets its own, smaller display scale
  (`.t-hero`, `.t-section`, `.t-row`) and generous line-height; it never uses uppercase or
  letter-spacing.
- Layout pieces: `components/ui.tsx` (`Container`, `SectionHead`, `ButtonLink`, `Tag`).
- Catalog items get generative SVG covers (`components/Cover.tsx`), deterministic from the id,
  with zero downloads.
- Motion: CSS-only entrance animations, plus scroll reveals where the browser supports
  scroll-driven animation. Both are off with reduced motion.

## Studio (the original portfolio)

`/{lang}/studio` presents works from the original `Portfolio/` site, ported to run natively
(no p5.js, which would be ~1 MB):

| Piece           | Ported from            | Engine      |
| --------------- | ---------------------- | ----------- |
| Quantum         | `atomsketch.js`        | three.js    |
| Pulse           | `x7.html`              | three.js    |
| Mandalay Palace | `mandalay.js`          | Canvas 2D   |
| Binary Rain     | `one.js`               | Canvas 2D   |

Data lives in `content/studio.ts`, the pieces in `components/art/`. They share `lib/artLoop.ts`
(pixel-ratio cap, 30 fps on low-end phones, pause off-screen, reduced motion). The original
Quantum snapped rings to random angles every frame (a strobe); the port keeps the jitter but
smooths it.

Posters in `public/studio/*.webp` are screenshots of the live pieces. They show before a piece
starts and on cards. Re-capture them if a piece changes.

The **archive** (`public/archive/`) serves the original Earth & Moon, the two neural network
visualizers and the technical analysis guide unchanged. They load three.js / TensorFlow from
public CDNs, so they need internet. Earth's 8K textures were reduced to 2K (~1 MB total).

## Adding to the catalog

Everything is driven by one list: `content/catalog.ts`. Add an item and the landing-page
counts, the globe lights, search and the item page all update.

| `mode`   | Behaviour                                                              |
| -------- | ---------------------------------------------------------------------- |
| `link`   | Opens the product's own site in a new tab.                             |
| `embed`  | Tap-to-load iframe. The product must allow framing (`frame-ancestors`). |
| `native` | A page in this site at `/{lang}/sims/{target}` (three.js sims).        |
| `soon`   | Listed, not launchable.                                                |

Entries marked `sample: true` are placeholders and show a "Sample" tag, and the landing page
says how many there are. Delete them as real items arrive. `spikebook` has a guessed
category: confirm it.

To add a Studio piece: add it to `content/studio.ts`, put the component in `components/art/`,
register it in `components/ArtStage.tsx` and `components/warm.ts`, and add a poster.

To add a native sim: create `components/<Name>Sim.tsx`, a page under
`app/[lang]/sims/<slug>/page.tsx`, add the dynamic import to `components/warm.ts` (so it is
saved for offline), and a catalog row with `mode: "native"`.

## The Village

`/{lang}/sims/village` shows the daily AI village from the `digital_sim` repo, which
publishes each episode into `public/village/`. How it fits together, how to publish an
episode and what each file holds: [`docs/village.md`](docs/village.md).

## Language and Burmese text

- Copy lives in `dictionaries/my.ts` and `dictionaries/en.ts` (English is typed from Burmese,
  so a missing key is a compile error). **The Burmese copy needs a native-speaker review.**
- Unicode only. The Burmese font (Noto Sans Myanmar, SIL OFL) is self-hosted in
  `public/fonts/` with `font-display: block`, because phones that still use a Zawgyi system
  font show Unicode text garbled until the webfont arrives. English pages don't download it.
- Burmese needs generous line-height (`globals.css`): stacked marks and digits clip with
  Tailwind's tight defaults.
- Search is substring-based (Burmese has no word spaces). Search input typed in **Zawgyi** will
  not match; the catalog page tells users to type Unicode. Adding a Zawgyi→Unicode converter
  for the search box is a possible follow-up.
- `/` redirects by cookie, then `Accept-Language`, default Burmese (`proxy.ts`).

## Low-data and offline design

- First load is ~310 KB (English) / ~335 KB (Burmese) with 3D off: ~145 KB React runtime and
  ~160 KB fonts, all cached immutably after the first visit.
- **3D is optional.** The globe is a separate ~140 KB chunk, fetched only if WebGL works and the
  browser is not on Save-Data or 2G. Otherwise a CSS poster is shown. Users can switch 3D off
  (remembered). It uses no textures: land is a generated 1° bitmap (`lib/landMask.ts`, made by
  `scripts/make-land-mask.mjs`), caps the pixel ratio, drops to 30 fps on low-end devices,
  and stops drawing when off-screen or when the tab is hidden.
- **Sims download only after a tap**, then run in a lazy chunk.
- **Service worker** (`public/sw.js`): network-first pages with a 3.5 s timeout, cache-first
  hashed assets, an offline page, and a "Save on this phone" button that downloads every
  page plus its JS/CSS. Production build only. Bump `VERSION` in `sw.js` to reset caches.
- External products (`link` / `embed`) are not cached; only this site is.

## Configuration

Copy `.env.example` to `.env.local`.

- `NEXT_PUBLIC_REQUEST_URL`: Messenger / Telegram / Viber / form link for the
  "tell us what you need" page. The nav link stays hidden until this is set.
- `NEXT_PUBLIC_CONTACT_EMAIL`: footer contact. Defaults to the address on the original
  portfolio (`lib/site.ts`).

## Not in this version

- No accounts and no payments: everything is free. The catalog and gating are structured so
  login could be added later without rewriting pages.
- Wallet (KBZPay / Wave) and card payments were intentionally dropped for now.

## Test on real phones before launch

Automated checks ran in Chromium with a Pixel 5 profile, but that is not a substitute for devices.
Please check on at least: a cheap Android with 2 GB RAM, an older Android (7–9), an iPhone, and a
phone with a Zawgyi system font.

1. Burmese renders correctly (including `သင်္ချာ`, `ကျွန်ုပ်`, and digits `၀၁၂၃၄၅၆၇၈၉`), nothing is clipped, and lines wrap sensibly.
2. Home loads on 3G or with Data Saver on and shows no 3D; turning 3D on works and stays smooth.
3. Dragging the globe sideways rotates it and does not block vertical scrolling; tapping a light opens its card.
4. Catalog search works with the Burmese keyboard you actually use (Unicode and Zawgyi).
5. "Save on this phone", then airplane mode: home, catalog and the orbit lab still open.
6. Add to Home Screen; the icon and standalone launch look right.
