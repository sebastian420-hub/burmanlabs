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

| File                                          | Job                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------ |
| `lib/village.ts`                              | Reads `public/village/` at build time: `getIndex`, `getStory`, `getPeople`, `traceUrl` |
| `app/[lang]/sims/village/page.tsx`            | Latest episode                                                                       |
| `app/[lang]/sims/village/[episode]/page.tsx`  | One episode. `generateStaticParams` + `dynamicParams = false`: every page is static   |
| `components/village/EpisodeView.tsx`          | The page: header, replay, story and record, overheard, villagers, about, archive     |
| `components/village/VillageReplay.tsx`        | Client canvas replay: tap to load, play/pause, speed, scrub, select a villager, feed |
| `dictionaries/{en,my}.ts` → `village`         | All labels                                                                           |
| `content/catalog.ts` → `the-village`          | Catalog entry, `mode: "native"`, `target: "village"`                                 |

The replay follows the site's low-data rules: nothing downloads until the visitor taps
"Watch the episode". The trace is gzip, unpacked in the browser with
`DecompressionStream`. The service worker doesn't save traces for offline use.

## Language

Labels, numbers and dates are in both languages (Burmese digits via `num()`). Episode
titles, stories, the record and the live feed come from the engine in English, are
marked `lang="en"`, and the Burmese page says so (`village.englishOnly`). A Burmese
story is planned in `digital_sim` (DAILY_WORLD_PLAN G4). **The Burmese labels need a
native-speaker review.**

## Checking a change

```bash
npm run lint
npm run build    # must list /en/sims/village, /my/sims/village and one page per episode
npm start        # open /en/sims/village, tap "Watch the episode"
```

If the replay says it couldn't load, open the network tab: the URL should be
`/village/days/NNNN/trace.jsonl.gz`.
