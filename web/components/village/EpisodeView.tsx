import Link from "next/link";
import type { Dict } from "@/lib/dictionaries";
import type { Locale } from "@/lib/i18n";
import { num } from "@/lib/i18n";
import { getDigest, getIndex, getPeople, traceUrl, type Story } from "@/lib/village";
import { ButtonLink, Container, SectionHead, Tag } from "@/components/ui";
import VillageReplay from "./VillageReplay";

const ROLE_DOT: Record<string, string> = {
  explorer: "#7fb4d8", builder: "#e0a458", gatherer: "#8fbf7f", scholar: "#b99ad6",
};

/** Map coordinates mean nothing to a reader: "built at (15, 4)" -> "built". */
const plain = (t: string) => t.replace(/\s*(?:at|to)? \(\d+, \d+\)/g, "");

function factLines(s: Story): string[] {
  const f = s.facts;
  const out: string[] = [];
  for (const b of f.built ?? []) out.push(`${b.by ? `${b.by} built a ${b.type}` : `A ${b.type} was built`} — ${b.when}`);
  for (const b of f.born ?? []) out.push(`${b.name} (${b.role}) was born at ${b.house_owner}'s house — ${b.when}`);
  for (const d of f.died ?? []) out.push(`${d.name}: ${d.cause || "died"} — ${d.when}`);
  out.push(`${f.trades_completed} trades completed, ${f.lessons_taught} lessons taught, ${f.goods_sold_at_market} goods sold at market`);
  if (f.richest?.length) out.push(`Most coins: ${f.richest.map((r) => `${r.name} (${r.coins})`).join(", ")}`);
  return out;
}

export default function EpisodeView({ lang, d, story }: { lang: Locale; d: Dict; story: Story }) {
  const v = d.village;
  const index = getIndex();
  const latest = index.episodes.at(-1)?.episode === story.episode;
  const people = getPeople();
  const digest = getDigest(story);
  const date = new Date(`${story.date}T12:00:00`).toLocaleDateString(lang === "my" ? "my-MM" : "en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <article>
      <Container className="pt-10">
        <Link href={`/${lang}/catalog/the-village`} className="text-sm text-ash transition hover:text-bone">
          ← {d.item.back}
        </Link>

        {/* One short header: the village, this episode, and straight into the map. */}
        <div className="mt-6 mb-6 grid gap-4 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <div className="flex flex-wrap items-center gap-2">
              <Tag>{d.type.research}</Tag>
              <Tag tone="signal">{v.live}</Tag>
              {index.preview && <Tag tone="gold">{v.previewTag}</Tag>}
            </div>
            <p className="eyebrow num mt-5">
              <span className="text-signal">{v.title}</span>&nbsp;&nbsp;·&nbsp;&nbsp;
              {latest ? `${v.latest} · ` : ""}{v.episode} {num(story.episode, lang)} · {date}
            </p>
            <h1 className="display intro t-section mt-2" lang="en">{story.title}</h1>
            <p className="intro-2 mt-3 max-w-2xl text-ash">
              {v.lead}{" "}
              <Link href={`/${lang}/sims/village/research`} className="whitespace-nowrap text-bone underline decoration-line-2 underline-offset-4 hover:decoration-bone">
                {v.research} →
              </Link>
            </p>
          </div>
          <div className="flex flex-wrap gap-2 md:col-span-4 md:justify-end">
            <Tag>{num(story.alive, lang)} {v.living}</Tag>
            {story.born > 0 && <Tag tone="gold">{num(story.born, lang)} {v.born}</Tag>}
            {story.died > 0 && <Tag tone="signal">{num(story.died, lang)} {v.died}</Tag>}
            <Tag>{num(story.facts.trades_completed, lang)} {v.trades}</Tag>
          </div>
        </div>

        {digest ? (
          <VillageReplay url={traceUrl(story)} lang={lang} v={v} digest={digest} />
        ) : (
          <p className="rounded-2xl border border-line px-4 py-3 text-ash">{v.failed}</p>
        )}
        {index.preview && <p className="mt-4 text-xs text-gold">{v.preview}</p>}
      </Container>

      <Container className="py-16">
        <SectionHead index="01" eyebrow={v.story} title={<span lang="en">{plain(story.summary)}</span>} />
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7" lang="en">
            {v.englishOnly && <p className="mb-4 text-sm text-gold" lang="my">{v.englishOnly}</p>}
            {story.story.map((p, k) => (
              <p key={k} className="mb-5 font-serif text-xl leading-relaxed text-bone/90">{plain(p)}</p>
            ))}
            <p className="mt-6 border-t border-line pt-4 text-sm text-dim" lang={lang}>
              {story.written_by === "model" ? v.storyModel : v.storyPlain}
            </p>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-ash" lang={lang}>{v.record}</summary>
              <ul className="mt-3 space-y-1 text-sm text-ash">
                {factLines(story).map((l, k) => <li key={k}>— {l}</li>)}
              </ul>
            </details>
          </div>
          <aside className="md:col-span-5">
            <p className="eyebrow mb-4">{v.overheard}</p>
            {story.facts.conversations?.length ? (
              <div className="space-y-5" lang="en">
                {story.facts.conversations.slice(0, 4).map((c, k) => (
                  <figure key={k}>
                    <blockquote className="font-serif text-lg italic text-bone/90">“{c.said}”</blockquote>
                    <figcaption className="mt-1 text-xs text-dim">{c.from} → {c.to}</figcaption>
                  </figure>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ash">{v.nobodySpoke}</p>
            )}
          </aside>
        </div>
      </Container>

      <Container className="pb-16">
        <SectionHead index="02" eyebrow={v.people} title={`${num(people.filter((p) => p.alive).length, lang)} ${v.living}`} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {people.map((p) => (
            <div key={p.id} className={`rounded-2xl border border-line bg-ink-2 p-4 ${p.alive ? "" : "opacity-45"}`}>
              <p className="flex items-center gap-2 font-medium">
                <span className="size-2.5 rounded-full" style={{ background: ROLE_DOT[p.role] }} />
                {p.name}
              </p>
              <p className="mt-1 text-xs text-ash">
                {v.roles[p.role] ?? p.role}
                {p.alive ? "" : ` · ${v.died}`}
              </p>
              {p.alive && (
                <p className="num mt-2 text-xs text-dim">
                  {num(p.coins, lang)} {v.coins} · {num(p.food, lang)} {v.food}
                </p>
              )}
            </div>
          ))}
        </div>
      </Container>

      <Container className="pb-16">
        <SectionHead
          index="03"
          eyebrow={v.aboutEyebrow}
          title={v.aboutTitle}
          aside={<ButtonLink href={`/${lang}/sims/village/research`} variant="ghost">{v.research}</ButtonLink>}
        />
        <div className="grid gap-6 md:grid-cols-3">
          {v.about.map((a) => (
            <div key={a.t} className="border-t border-line pt-5">
              <p className="text-lg font-medium">{a.t}</p>
              <p className="mt-2 text-ash">{a.d}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="pb-24">
        <SectionHead index="04" eyebrow={v.archive} title={`${num(index.episodes.length, lang)} ${v.episode}`} />
        <ul className="divide-y divide-line border-y border-line">
          {index.episodes.slice().reverse().map((e) => (
            <li key={e.episode}>
              <Link
                href={`/${lang}/sims/village/${e.episode}`}
                className={`grid gap-2 py-5 transition hover:bg-ink-2 md:grid-cols-12 ${e.episode === story.episode ? "text-bone" : "text-ash"}`}
              >
                <span className="num text-sm md:col-span-2">{v.episode} {num(e.episode, lang)}</span>
                <span className="display text-2xl md:col-span-6" lang="en">{e.title}</span>
                <span className="text-sm md:col-span-4 md:text-right">
                  {num(e.alive, lang)} {v.living}
                  {e.born ? ` · ${num(e.born, lang)} ${v.born}` : ""}
                  {e.died ? ` · ${num(e.died, lang)} ${v.died}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </article>
  );
}
