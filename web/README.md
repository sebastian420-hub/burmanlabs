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

- First load is ~210 KB (English) / ~260 KB (Burmese), most of it the React runtime and font.
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
