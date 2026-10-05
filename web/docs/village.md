# The Village

A village of AI agents that lives one day at a time. Each day the world runs 400 more
ticks from where it stopped, and Burmanlabs shows what happened as a native page:
`/{lang}/sims/village` (the latest episode) and `/{lang}/sims/village/{n}` (any episode).

The village has two halves in two repos:

| Half                        | Repo                                                                 | What it is                                                     |
| --------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| The engine                  | [`digital_sim`](https://github.com/sebastian420-hub/digital_sim)     | Python simulation, LLM agents, daily runner, story writer      |
| The page people see         | this repo, `web/`                                                    | Next.js pages, canvas replay, dictionaries, the published data |

They meet at one folder, `web/public/village/`. The engine writes files there; the site
reads them at build time. The site has no backend and calls no model.

```
digital_sim                                   burmanlabs/web
───────────                                   ──────────────
scripts/daily.py ──writes──▶ public/village/ ──read at build──▶ lib/village.ts
  resume world                 days/index.json                    │
  run 400 ticks                days/NNNN/story.json               ▼
  write story                  days/NNNN/trace.jsonl.gz   app/[lang]/sims/village/…
                               world.json                 components/village/…
```

## Publishing a new episode

From the `digital_sim` checkout, with the two repos side by side:

```bash
python scripts/daily.py --publish ../burmanlabs/web/public/village --no-viewer
```

`--no-viewer` stops the runner copying its own HTML viewer, which Burmanlabs doesn't
use. Add `--provider scripted` for a free offline test run. The world's saved state stays
private in `digital_sim/world/state/`; only the files below are published.

Then commit the new files in burmanlabs and redeploy `web/`. The Vercel project is not
linked to Git, so a push alone does not update the live site.

The first real episode replaces the preview automatically. The runner removes any episode
the saved world doesn't contain (the preview's 400 ticks are past a new world's tick 0),
and rebuilds `index.json` without the `preview` note, so the gold banner goes away.

## The data

All four files are written by `digital_sim`. Treat them as generated. Don't edit them by
hand; fix the engine and publish again.

- **`days/index.json`**: every episode, oldest first (`episode`, `date`, `title`,
  `summary`, `start_tick`, `end_tick`, `alive`, `born`, `died`, `written_by`, `path`).
  An optional `preview` string marks a test run shown before the daily world starts.
- **`days/NNNN/story.json`**: the same fields plus `story` (paragraphs), `facts` (the
  record the story was written from: births, deaths, buildings, trades, lessons, richest,
  conversations) and `model`. It does not contain its own `path`; `getStory()` adds it
  from the index.
- **`days/NNNN/trace.jsonl.gz`**: the replay. One JSON object per line: a `header`
  line (map size, terrain rows, agents), then one `tick` line per tick (positions,
  actions, thoughts, inventories, resources, buildings, deaths, births). About 0.3 MB.
- **`world.json`**: who lives in the world now (names, roles, coins, food), plus
  structures. Public facts only: no memories or prompts.

## The code

| File                                          | Job                                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `lib/village.ts`                              | Reads `public/village/` at build time: `getIndex`, `getStory`, `getPeople`, `getDigest`, `traceUrl` |
| `lib/villageTrace.ts`                         | Pure trace logic shared by server and browser: types, `parseTrace`, `findMoments`, `digestOf` |
| `app/[lang]/sims/village/page.tsx`            | Latest episode                                                                               |
| `app/[lang]/sims/village/[episode]/page.tsx`  | One episode. `generateStaticParams` + `dynamicParams = false`: every page is static           |
| `components/village/EpisodeView.tsx`          | The page: short header, replay, story and record, overheard, villagers, about, archive       |
| `components/village/VillageReplay.tsx`        | The player: guided playback, camera, key moments, follow a villager, panels                   |
| `components/village/iso.ts`                   | Drawing only: the angled (isometric) map, buildings, people, night, graves                    |
| `dictionaries/{en,my}.ts` → `village`         | All labels, including the key-moment and feed sentences (`moment`, `feedTrade`, …)            |
| `content/catalog.ts` → `the-village`          | Catalog entry, `mode: "native"`, `target: "village"`                                         |

### How the replay works

- **Before the tap (no download).** At build time `getDigest()` unpacks the episode's
  trace and keeps about 6 KB: the terrain, the cast, the episode's last afternoon as a
  still frame, and its **key moments**. The page draws that frame as the poster and lists
  the moments, so a visitor sees the village before anything downloads.
- **Key moments** (`findMoments`): every death, birth and new building, the first trade
  and first lesson, and each person's first library entry and first collapse. They are
  the dots on the timeline and the "Key moments" list. Their sentences come from the
  dictionaries, so they read in Burmese too.
- **Guided play.** Pressing play downloads the trace (~0.3 MB). Playback slows before
  each moment, the camera flies to where it happened, rests about 3 seconds with a
  caption, then moves on. "Next moment" and the timeline dots jump straight to one.
- **Follow a villager.** Tap a name (or a person on the map): the camera follows them
  and the panel shows what they are doing, their own words, energy, water and what
  they carry. A key moment still takes the camera, then it returns to them.
- **Looking around.** Drag sideways to pan (vertical drags still scroll the page), the
  + / − buttons zoom, ⤢ returns to the whole village.
- **Low data and motion.** The trace is gzip, unpacked in the browser with
  `DecompressionStream`; the service worker doesn't save it for offline. Drawing uses
  `lib/artLoop.ts` (pixel-ratio cap, 30 fps on low-end phones, stops off-screen); with
  reduced motion the camera cuts instead of gliding.
- **Swapping the renderer.** `iso.ts` only turns a `Scene` (people, buildings, resources,
  time of day, links, focus) into pixels. A future 3D view of a bigger world can
  replace it without touching playback, moments or panels.

## Language

Labels, numbers, dates, key moments and the trade/lesson feed are in both languages
(Burmese digits via `num()`). Episode titles, stories, the record, and the villagers'
own words come from the engine in English, are marked `lang="en"`, and the Burmese
page says so (`village.englishOnly`). Map coordinates are stripped from engine text
before it is shown. A Burmese
story is planned in `digital_sim` (DAILY_WORLD_PLAN G4). **The Burmese labels need a
native-speaker review.**

## Checking a change

```bash
npm run lint
npm run build    # must list /en/sims/village, /my/sims/village and one page per episode
npm start        # open /en/sims/village: the poster and key moments show before any tap;
                 # press play, tap a key moment, follow a villager
```

If the replay says it couldn't load, open the network tab: the URL should be
`/village/days/NNNN/trace.jsonl.gz`.
