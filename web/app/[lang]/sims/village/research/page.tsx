import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale, type Locale } from "@/lib/i18n";
import { villageResearch } from "@/content/villageResearch";
import { ButtonLink, Container, SectionHead, Tag } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/[lang]/sims/village/research">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const r = villageResearch[lang];
  return { title: r.meta.title, description: r.meta.description };
}

const STATUS_TONE = { built: "gold", testing: undefined, waiting: "signal", next: undefined } as const;

function Stats({ items }: { items: { n: string; t: string; d: string }[] }) {
  return (
    <div className={`grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 ${items.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
      {items.map((s) => (
        <div key={s.t} className="bg-ink-2 p-6">
          <p className="display num text-4xl text-bone">{s.n}</p>
          <p className="eyebrow mt-2 text-gold">{s.t}</p>
          <p className="mt-3 text-sm leading-relaxed text-ash">{s.d}</p>
        </div>
      ))}
    </div>
  );
}

function Cards({ items, cols = 3 }: { items: { t: string; d: string }[]; cols?: 2 | 3 }) {
  return (
    <div className={`grid gap-6 ${cols === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
      {items.map((c) => (
        <div key={c.t} className="border-t border-line pt-5">
          <p className="text-lg font-medium">{c.t}</p>
          <p className="mt-2 leading-relaxed text-ash">{c.d}</p>
        </div>
      ))}
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <h3 className="display mb-6 text-3xl text-bone">{children}</h3>;
}

/** What The Village is for, where it stands, and how it works underneath. */
export default async function VillageResearchPage({ params }: PageProps<"/[lang]/sims/village/research">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const r = villageResearch[lang as Locale];
  const d = getDictionary(lang);
  const h = r.how;

  return (
    <article>
      <Container className="pt-10">
        <Link href={`/${lang}/sims/village`} className="text-sm text-ash transition hover:text-bone">
          ← {d.village.title}
        </Link>
        <div className="mt-8 grid gap-6 pb-16 md:grid-cols-12 md:items-end">
          <div className="md:col-span-8">
            <p className="eyebrow text-signal">{r.hero.eyebrow}</p>
            <h1 className="display intro t-section mt-4">{r.hero.title}</h1>
          </div>
          <div className="intro-2 md:col-span-4">
            <p className="text-lg leading-relaxed text-ash">{r.hero.lead}</p>
            <div className="mt-6">
              <ButtonLink href={`/${lang}/sims/village`}>{r.cta.watch}</ButtonLink>
            </div>
          </div>
        </div>
      </Container>

      {/* 01 The goal */}
      <Container className="pb-20">
        <SectionHead index="01" eyebrow={r.goal.eyebrow} title={r.goal.title} />
        <div className="grid gap-10 md:grid-cols-12">
          <div className="space-y-5 md:col-span-7">
            {r.goal.body.map((p, k) => (
              <p key={k} className="font-serif text-xl leading-relaxed text-bone/90">{p}</p>
            ))}
          </div>
          <div className="space-y-4 md:col-span-5">
            {r.goal.questions.map((q) => (
              <div key={q.t} className="rounded-3xl border border-line bg-ink-2 p-6">
                <p className="eyebrow text-gold">{q.t}</p>
                <p className="mt-3 leading-relaxed text-ash">{q.d}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div className="rounded-3xl border border-signal/40 p-6">
            <p className="text-lg font-medium text-bone">{r.goal.split.brain.t}</p>
            <p className="mt-2 leading-relaxed text-ash">{r.goal.split.brain.d}</p>
          </div>
          <p aria-hidden className="grid place-items-center text-2xl text-dim md:px-2">→</p>
          <div className="rounded-3xl border border-line-2 p-6">
            <p className="text-lg font-medium text-bone">{r.goal.split.window.t}</p>
            <p className="mt-2 leading-relaxed text-ash">{r.goal.split.window.d}</p>
          </div>
        </div>
      </Container>

      {/* 02 Where we are */}
      <Container className="pb-20">
        <SectionHead index="02" eyebrow={r.status.eyebrow} title={r.status.title} />
        <p className="mb-10 max-w-3xl text-lg leading-relaxed text-ash">{r.status.intro}</p>
        <ul className="divide-y divide-line border-y border-line">
          {r.status.items.map((s) => (
            <li key={s.t} className="grid gap-3 py-6 md:grid-cols-12">
              <div className="md:col-span-2">
                <Tag tone={STATUS_TONE[s.tag]}>{r.status.tags[s.tag]}</Tag>
              </div>
              <p className="text-lg font-medium md:col-span-3">{s.t}</p>
              <p className="leading-relaxed text-ash md:col-span-7">{s.d}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 rounded-3xl border border-gold/40 p-6 md:p-8">
          <p className="eyebrow text-gold">{r.status.cannot.t}</p>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {r.status.cannot.d.map((p, k) => <p key={k} className="leading-relaxed text-ash">{p}</p>)}
          </div>
        </div>
      </Container>

      {/* 03 Findings */}
      <Container className="pb-20">
        <SectionHead index="03" eyebrow={r.findings.eyebrow} title={r.findings.title} aside={<p className="text-sm text-dim">{r.findings.source}</p>} />
        <Sub>{r.findings.society}</Sub>
        <Stats items={r.findings.societyStats} />
        <div className="mt-12">
          <Sub>{r.findings.minds}</Sub>
          <Stats items={r.findings.mindStats} />
        </div>
      </Container>

      {/* 04 How it works */}
      <Container className="pb-20">
        <SectionHead index="04" eyebrow={h.eyebrow} title={h.title} />
        <p className="mb-12 max-w-3xl text-lg leading-relaxed text-ash">{h.intro}</p>

        <Sub>{h.world.t}</Sub>
        <Cards items={h.world.facts} />

        <div className="mt-16">
          <Sub>{h.loop.t}</Sub>
          <p className="mb-8 max-w-3xl leading-relaxed text-ash">{h.loop.d}</p>
          <ol className="grid gap-3 md:grid-cols-5">
            {h.loop.steps.map((s, k) => (
              <li key={s.t} className="relative rounded-3xl border border-line bg-ink-2 p-5">
                <p className="eyebrow num text-signal">({String(k + 1).padStart(2, "0")})</p>
                <p className="mt-2 text-lg font-medium">{s.t}</p>
                <p className="mt-2 text-sm leading-relaxed text-ash">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-16 grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Sub>{h.actions.t}</Sub>
            <p className="leading-relaxed text-ash">{h.actions.d}</p>
            <div className="mt-5 flex flex-wrap gap-2" lang="en">
              {h.actions.list.map((a) => (
                <code key={a} className="rounded-full border border-line-2 px-3 py-1 text-sm text-bone">{a}</code>
              ))}
            </div>
          </div>
          <div className="md:col-span-7">
            <Sub>{h.mind.t}</Sub>
            <Cards items={h.mind.items} cols={2} />
          </div>
        </div>

        <div className="mt-16">
          <Sub>{h.honest.t}</Sub>
          <Cards items={h.honest.items} />
        </div>

        <div className="mt-16">
          <Sub>{h.cost.t}</Sub>
          <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
            {h.cost.stats.map((s) => (
              <div key={s.t} className="bg-ink-2 p-6">
                <p className="display num text-4xl">{s.n}</p>
                <p className="eyebrow mt-2 text-gold">{s.t}</p>
                <p className="mt-2 text-sm text-ash">{s.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 max-w-3xl leading-relaxed text-ash">{h.cost.d}</p>
        </div>

        <div className="mt-16">
          <Sub>{h.daily.t}</Sub>
          <ol className="space-y-3">
            {h.daily.steps.map((s, k) => (
              <li key={k} className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-line pt-3">
                <span className="num text-signal">{String(k + 1).padStart(2, "0")}</span>
                <span className="leading-relaxed text-ash">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </Container>

      {/* 05 Next */}
      <Container className="pb-24">
        <SectionHead index="05" eyebrow={r.next.eyebrow} title={r.next.title} />
        <ol className="grid gap-4 md:grid-cols-4">
          {r.next.items.map((n) => (
            <li key={n.t} className="rounded-3xl border border-line bg-ink-2 p-6">
              <p className="eyebrow text-signal">{n.when}</p>
              <p className="mt-3 text-lg font-medium">{n.t}</p>
              <p className="mt-2 text-sm leading-relaxed text-ash">{n.d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12">
          <ButtonLink href={`/${lang}/sims/village`}>{r.cta.watch}</ButtonLink>
        </div>
      </Container>
    </article>
  );
}
