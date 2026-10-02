import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalog, itemHref, type ItemType } from "@/content/catalog";
import { pieces } from "@/content/studio";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale, num } from "@/lib/i18n";
import HeroGlobe from "@/components/HeroGlobe";
import SaveOffline from "@/components/SaveOffline";
import { ButtonLink, Container, SectionHead } from "@/components/ui";

const TYPES: ItemType[] = ["textbook", "app", "sim"];

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);

  const count = (type: ItemType) => catalog.filter((i) => i.type === type).length;
  const samples = catalog.filter((i) => i.sample).length;

  const heroItems = catalog.map((i) => ({
    id: i.id,
    type: i.type,
    title: i.title[lang],
    href: itemHref(i, lang),
    typeLabel: d.type[i.type],
  }));

  const offlineUrls = [
    `/${lang}`,
    `/${lang}/catalog`,
    `/${lang}/studio`,
    ...catalog.filter((i) => i.mode !== "soon").map((i) => itemHref(i, lang)),
    ...pieces.map((p) => `/${lang}/studio/${p.id}`),
  ];

  const [pre, em, post] = d.hero.title;

  return (
    <>
      {/* ------------------------------------------------------------ Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-20%] h-[700px] w-[700px] rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, #ff31311a, transparent 60%)" }}
        />
        <Container className="grid min-h-[calc(100svh-4rem)] items-center gap-6 pt-10 pb-8 lg:grid-cols-12 lg:gap-0 lg:pt-0">
          <div className="lg:col-span-6 lg:pr-6">
            <p className="eyebrow intro">{d.hero.eyebrow}</p>
            <h1 className="display t-hero intro-2 mt-6">
              {pre}
              <em>{em}</em>
              {post}
            </h1>
            <p className="intro-3 mt-7 max-w-md text-lg text-ash">{d.hero.sub}</p>
            <div className="intro-3 mt-9 flex flex-wrap gap-3">
              <ButtonLink href={`/${lang}/catalog`}>{d.hero.cta}</ButtonLink>
              <ButtonLink href={`/${lang}/sims/orbit`} variant="ghost">
                {d.hero.ctaSim}
              </ButtonLink>
            </div>
          </div>
          <div className="lg:col-span-6">
            <HeroGlobe
              items={heroItems}
              labels={{
                aria: d.hero.globeAria,
                off: d.hero.globeOff,
                on: d.hero.globeOn,
                hint: d.hero.hint,
                open: d.hero.open,
              }}
            />
          </div>
        </Container>

        {/* Stat strip */}
        <Container>
          <dl className="grid grid-cols-2 gap-px border-y border-line bg-line sm:grid-cols-4">
            {[
              [catalog.length, d.stats.items],
              [count("textbook"), d.stats.textbooks],
              [count("app"), d.stats.apps],
              [count("sim"), d.stats.sims],
            ].map(([n, label], i) => (
              <div key={String(label)} className="bg-ink px-1 py-6 sm:px-6 [&:nth-child(even)]:pl-5 sm:[&:nth-child(even)]:pl-6">
                <dt className="sr-only">{label}</dt>
                <dd className={`display num text-5xl sm:text-6xl ${i === 0 ? "text-signal" : ""}`}>
                  {num(Number(n), lang)}
                </dd>
                <dd className="mt-2 text-sm text-ash" aria-hidden>
                  {label}
                </dd>
              </div>
            ))}
          </dl>
          {samples > 0 && (
            <p className="mt-3 text-xs text-dim">{d.stats.sample.replace("{n}", num(samples, lang))}</p>
          )}
        </Container>
      </section>

      {/* ------------------------------------------------- (01) Inside */}
      <Container className="mt-32">
        <SectionHead index="01" eyebrow={d.inside.eyebrow} title={d.inside.title} />
        <ul className="border-b border-line">
          {TYPES.map((t, i) => (
            <li key={t} className="reveal border-t border-line">
              <Link
                href={`/${lang}/catalog?type=${t}`}
                className="group grid items-baseline gap-3 py-8 md:grid-cols-12 md:gap-6 md:py-10"
              >
                <span className="eyebrow num md:col-span-1">0{i + 1}</span>
                <span className="display t-row transition-colors duration-300 group-hover:text-signal md:col-span-5">
                  {d.typePlural[t]}
                </span>
                <span className="max-w-md text-ash md:col-span-4">{d.inside[t]}</span>
                <span className="flex items-center justify-between gap-4 md:col-span-2 md:justify-end">
                  <span className="num text-sm text-ash">{d.inside.count.replace("{n}", num(count(t), lang))}</span>
                  <span
                    aria-hidden
                    className="grid size-11 place-items-center rounded-full border border-line-2 transition duration-300 group-hover:border-signal group-hover:bg-signal group-hover:text-ink"
                  >
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      {/* ----------------------------------------------- (02) Featured */}
      <Container className="mt-32">
        <SectionHead index="02" eyebrow={d.featured.eyebrow} title={d.sim.orbitTitle} />
        <Link
          href={`/${lang}/sims/orbit`}
          className="reveal group grid overflow-hidden rounded-3xl border border-line bg-ink-2 md:grid-cols-12"
        >
          <div className="relative aspect-[16/10] md:col-span-8 md:aspect-auto md:min-h-[440px]">
            <Image
              src="/studio/orbit.webp"
              alt=""
              fill
              sizes="(min-width: 768px) 66vw, 100vw"
              className="object-cover transition duration-700 group-hover:scale-[1.03]"
            />
          </div>
          <div className="flex flex-col justify-between gap-10 p-7 md:col-span-4 md:p-10">
            <p className="text-lg text-ash">{d.sim.orbitLead}</p>
            <span className="inline-flex items-center gap-2 text-bone">
              {d.featured.cta}
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </span>
          </div>
        </Link>
      </Container>

      {/* ------------------------------------------------- (03) Studio */}
      <Container className="mt-32">
        <SectionHead
          index="03"
          eyebrow={d.studio.eyebrow}
          title={d.studio.title}
          aside={<p className="text-sm text-ash">{d.studio.lead}</p>}
        />
      </Container>
      <div className="no-scrollbar -mt-2 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 sm:scroll-px-8 sm:px-8 xl:scroll-px-[max(2rem,calc((100vw_-_80rem)/2_+_2rem))] xl:px-[max(2rem,calc((100vw_-_80rem)/2_+_2rem))]">
        {pieces.map((p, i) => (
          <Link
            key={p.id}
            href={`/${lang}/studio/${p.id}`}
            className="group relative w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw] xl:w-[23rem]"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-line bg-black">
              <Image
                src={`/studio/${p.id}.webp`}
                alt=""
                fill
                sizes="(min-width: 1280px) 368px, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 78vw"
                className="object-cover transition duration-700 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-5 pt-16">
                <p className="eyebrow num !text-bone/70">{String(i + 1).padStart(2, "0")}</p>
              </div>
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-3">
              <h3 className="display text-3xl">{p.title[lang]}</h3>
              <span className="text-xs text-dim">{p.medium[lang]}</span>
            </div>
          </Link>
        ))}
      </div>
      <Container className="mt-8">
        <ButtonLink href={`/${lang}/studio`} variant="ghost">
          {d.studio.viewAll}
        </ButtonLink>
      </Container>

      {/* --------------------------------------------- (04) Principles */}
      <Container className="mt-32">
        <SectionHead index="04" eyebrow={d.value.eyebrow} title={d.value.title} />
        <div className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {d.value.items.map((v, i) => (
            <div key={v.t} className="reveal flex flex-col gap-10 bg-ink p-7">
              <span className="display num text-4xl text-dim">{num(i + 1, lang)}</span>
              <div>
                <h3 className="text-lg font-semibold">{v.t}</h3>
                <p className="mt-2 text-sm text-ash">{v.d}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {/* ------------------------------------------------- Offline band */}
      <Container className="mt-24">
        <div className="reveal flex flex-col gap-6 rounded-3xl border border-line bg-ink-2 p-7 md:flex-row md:items-center md:justify-between md:p-10">
          <div>
            <h2 className="display text-3xl sm:text-4xl">{d.save.title}</h2>
          </div>
          <SaveOffline urls={offlineUrls} labels={d.save} />
        </div>
      </Container>
    </>
  );
}
