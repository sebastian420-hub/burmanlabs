# Burmanlabs web

Zwe's personal lab: apps built for people who need them, my own research and experiments,
what I'm learning on the way to robotics, and the original art studio. Lean and Burmese-first.
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
BURMAN LABS wordmark (`public/brand/burmanlabs-wordmark.webp`, from `Portfolio/burmanx.png`, built by `scripts/make-brand.mjs`). Tokens live
in `app/globals.css` (`ink`, `bone`, `ash`, `signal`, `gold`, …).

- Three voices of type, all self-hosted in `public/fonts/`: Instrument Serif for titles,
  Inter Tight for body (Latin), **Geist Mono for data** (designations, status, stack, years,
  readouts: the `.mono` and `.eyebrow` classes), Noto Sans Myanmar for Burmese. Burmese gets
  its own, smaller display scale (`.t-hero`, `.t-section`, `.t-row`) and generous line-height;
  it never uses uppercase or letter-spacing.
- The tone is a mission log, not a brochure: dense, hairline rules, metadata in mono, one
  accent. No HUD decoration (brackets, scanlines, cyan): the only "readout" is the real one,
  Mandalay's coordinates and local time (`components/Readout.tsx`).
- Layout pieces: `components/ui.tsx` (`Container`, `SectionHead`, `ButtonLink`, `Tag`,
  `StatusDot`).
- Every work item has a permanent designation (`BL-001`…), a year, a role and a status.
  Items with a real screenshot in `public/work/{shot}.webp` (1600×1000, plus `{shot}-sm.webp`)
  show it; the rest get generative SVG covers (`components/Cover.tsx`). Capture new
  screenshots at 1600×1000 and desaturate ~15% so they sit on the palette.

## The work index

`components/WorkIndex.tsx` lists work as rows (designation · title · kind · built with ·
status · year) with a list/grid toggle remembered in `localStorage` (`bl-view`). On devices
with a fine pointer and WebGL, hovering a row floats its screenshot beside the cursor through
a small three.js shader (`components/HoverPreview.tsx`: lens bulge + RGB split that scales with
cursor speed); the other rows dim. Keyboard focus anchors the preview beside the row. On touch
there is no preview: rows are 72 px tap targets with the facts on a second line. The chunk is
lazy and ~40 KB on top of the globe's three.js.

Item pages (`/{lang}/catalog/{id}`) are dossiers: designation, facts block, the screenshot,
"what it is" and "where it stands" (`about` / `standing` in `content/catalog.ts`), prev/next.
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

The original Earth & Moon page, the two neural network visualizers and the technical analysis
guide were taken off the site in November 2026 (they are in git history, and most are still in
`Portfolio/`). `/archive/*` redirects to the home page.

## Adding work

Everything is driven by one list: `content/catalog.ts`. Add an item and the home page
sections and counts, the globe lights, "All work", search and the item page all update.
**Only real work goes in the list** (no placeholders).

Each item has a `type` (what it is) and a `status` (where it stands):

| `type`     | Home section             | Meaning                                         |
| ---------- | ------------------------ | ----------------------------------------------- |
| `app`      | Apps                     | Working software people use                     |
| `research` | Research & experiments   | An experiment of my own, with findings          |
| `learning` | Learning                 | Something I'm learning, usually by building it  |

`status` is `live`, `ongoing` or `learning`. `stack` lists the tools it's built with, and
`art` picks the generative cover (`lines`, `tiles`, `orbits`).

| `mode`   | Behaviour                                                              |
| -------- | ---------------------------------------------------------------------- |
| `link`   | Opens the product's own site (or App Store page) in a new tab.         |
| `embed`  | Tap-to-load iframe. The product must allow framing (`frame-ancestors`). |
| `native` | A page in this site at `/{lang}/sims/{target}`.                        |
| `soon`   | Real, but no public link yet ("Link coming soon").                     |
| `private`| Real, kept private: no link and none promised ("Private for now").     |

`category` is the topic filter on All work: `ai`, `science`, `hardware`, `art`, `everyday`.

Topics listed in `groupedCategories` (in `content/catalog.ts`; now `education`) show as ONE
row in the index that opens in place to list their work, in both the list and grid views.
A search or filter shows every match flat, and a topic with a single piece is a plain row.
To group another topic, add its id there; the row's label, count and names come from the
catalog and `index.works` / `index.expand` / `index.collapse` in the dictionaries.

Cortex is `soon` until its package link exists: set `target` to the URL and
`mode: "link"`. The screenshots in `public/work/` were captured from the real products
(the Artcodex editor from its `main` branch, with scenes built by the editor's own commands, and a
recorded Cortex session rendered through xterm.js). An item can also carry a `gallery` of captioned
extra pictures (`public/work/{shot}.webp`, 1600×1000), shown under its main picture; Artcodex has four. When you replace a picture, give it a NEW file name: the offline cache and the
image optimiser keep the old file under the old name.

The Village, Gentlemen and Orbit lab were taken off the site in November 2026 and the
remaining work was renumbered BL-001 to BL-004. Their old URLs redirect to All work
(see `next.config.ts`).
The All work filters show only kinds and topics that have work in them.

To add a Studio piece: add it to `content/studio.ts`, put the component in `components/art/`,
register it in `components/ArtStage.tsx` and `components/warm.ts`, and add a poster.

To add a native sim: create `components/<Name>Sim.tsx`, a page under
`app/[lang]/sims/<slug>/page.tsx`, add the dynamic import to `components/warm.ts` (so it is
saved for offline), and a catalog row with `mode: "native"`.

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
  hashed assets, and an offline page; pages open offline once visited. Production build only. Bump `VERSION` in `sw.js` to reset caches.
- External products (`link` / `embed`) are not cached; only this site is.

## Configuration

Copy `.env.example` to `.env.local`.

- `NEXT_PUBLIC_CONTACT_EMAIL`: footer contact. Defaults to the address on the original
  portfolio (`lib/site.ts`).

## Not in this version

- No accounts and no payments.
- Wallet (KBZPay / Wave) and card payments were intentionally dropped for now.

## Test on real phones before launch

Automated checks ran in Chromium with a Pixel 5 profile, but that is not a substitute for devices.
Please check on at least: a cheap Android with 2 GB RAM, an older Android (7–9), an iPhone, and a
phone with a Zawgyi system font.

1. Burmese renders correctly (including `သင်္ချာ`, `ကျွန်ုပ်`, and digits `၀၁၂၃၄၅၆၇၈၉`), nothing is clipped, and lines wrap sensibly.
2. Home loads on 3G or with Data Saver on and shows no 3D; turning 3D on works and stays smooth.
3. Dragging the globe sideways rotates it and does not block vertical scrolling; tapping a light opens its card.
4. Catalog search works with the Burmese keyboard you actually use (Unicode and Zawgyi).
5. Visit home, the catalog and a Studio piece, then airplane mode: those pages still open.
6. Add to Home Screen; the icon and standalone launch look right.
