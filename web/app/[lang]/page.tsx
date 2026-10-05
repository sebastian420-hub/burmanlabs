import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { byType, catalog, itemHref, type CatalogItem, type ItemType } from "@/content/catalog";
import { pieces } from "@/content/studio";
import { getDictionary, type Dict } from "@/lib/dictionaries";
import { hasLocale, num, type Locale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { getDigest, getIndex } from "@/lib/village";
import Cover, { coverArt } from "@/components/Cover";
import HeroGlobe from "@/components/HeroGlobe";
import SaveOffline from "@/components/SaveOffline";
import { ButtonLink, Container, SectionHead, Tag } from "@/components/ui";
import VillagePoster from "@/components/village/VillagePoster";

/** One piece of work as a card: cover, status, what it is, what it's built with. */
function WorkCard({ item, lang, d }: { item: CatalogItem; lang: Locale; d: Dict }) {
  return (
    <Link href={itemHref(item, lang)} className="reveal group block">
      <div className="relative aspect-[400/260] overflow-hidden rounded-2xl border border-line transition duration-500 group-hover:border-line-2">
        <div className="h-full w-full transition duration-700 group-hover:scale-[1.04]">
          <Cover id={item.id} art={coverArt(item)} className="h-full w-full" />
        </div>
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <Tag tone={item.status === "live" ? "gold" : "signal"}>{d.status[item.status]}</Tag>
          {item.mode === "soon" && <Tag>{d.item.soon}</Tag>}
        </div>
      </div>
      <h3 className="mt-4 text-xl font-medium transition-colors group-hover:text-signal">{item.title[lang]}</h3>
      <p className="mt-1 text-sm leading-relaxed text-ash">{item.summary[lang]}</p>
      {item.stack && (
        <p className="mt-2 text-xs text-dim" lang="en">{item.stack.join(" · ")}</p>
      )}
    </Link>
  );
}

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const h = d.home;

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

  // The Village, featured: its latest episode and a still of the village.
  const latest = getIndex().episodes.at(-1);
  const digest = latest ? getDigest(latest) : null;

  const [pre, em, post] = d.hero.title;
  const counts: [number, string][] = [
    [byType("app").length, d.stats.app],
    [byType("research").length, d.stats.research],
    [byType("learning").length, d.stats.learning],
    [pieces.length, d.stats.studio],
  ];
  const sections: { type: ItemType; index: string; copy: { eyebrow: string; title: string; lead: string } }[] = [
    { type: "app", index: "02", copy: h.apps },
    { type: "learning", index: "03", copy: h.learning },
  ];

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
              <ButtonLink href={`/${lang}/sims/village`} variant="ghost">
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

        {/* What is here, counted honestly. */}
        <Container>
          <dl className="grid grid-cols-2 gap-px border-y border-line bg-line sm:grid-cols-4">
            {counts.map(([n, label], i) => (
              <div key={label} className="bg-ink px-1 py-6 sm:px-6 [&:nth-child(even)]:pl-5 sm:[&:nth-child(even)]:pl-6">
                <dt className="sr-only">{label}</dt>
                <dd className={`display num text-5xl sm:text-6xl ${i === 0 ? "text-signal" : ""}`}>{num(n, lang)}</dd>
                <dd className="mt-2 text-sm text-ash" aria-hidden>
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* ------------------------- (01) Research, led by The Village */}
      {latest && digest && (
        <Container className="mt-32">
          <SectionHead index="01" eyebrow={h.research.eyebrow} title={h.research.title} aside={<p className="text-sm text-ash">{h.research.lead}</p>} />
          <div className="reveal grid overflow-hidden rounded-3xl border border-line bg-ink-2 md:grid-cols-12">
            <Link href={`/${lang}/sims/village`} className="group relative block aspect-[16/11] bg-ink md:col-span-7 md:aspect-auto md:min-h-[460px]">
              <VillagePoster digest={digest} className="absolute inset-0 size-full transition duration-700 group-hover:scale-[1.02]" />
              <span className="absolute top-4 left-4 flex gap-2">
                <Tag tone="signal">{d.village.live}</Tag>
              </span>
            </Link>
            <div className="flex flex-col justify-between gap-8 p-7 md:col-span-5 md:p-10">
              <div>
                <p className="eyebrow text-signal">{h.featured.eyebrow}</p>
                <p className="display mt-2 text-4xl">{d.village.title}</p>
                <p className="mt-4 text-lg leading-relaxed text-ash">{h.featured.lead}</p>
                <p className="eyebrow num mt-8 text-gold">
                  {h.featured.latest} · {d.village.episode} {num(latest.episode, lang)}
                </p>
                <p className="display mt-2 text-3xl" lang="en">{latest.title}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Tag>{num(latest.alive, lang)} {d.village.living}</Tag>
                  {latest.born > 0 && <Tag tone="gold">{num(latest.born, lang)} {d.village.born}</Tag>}
                  {latest.died > 0 && <Tag tone="signal">{num(latest.died, lang)} {d.village.died}</Tag>}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href={`/${lang}/sims/village`}>{h.featured.watch}</ButtonLink>
                <ButtonLink href={`/${lang}/sims/village/research`} variant="ghost">
                  {h.featured.research}
                </ButtonLink>
              </div>
            </div>
          </div>
          {byType("research").filter((i) => i.id !== "the-village").length > 0 && (
            <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {byType("research").filter((i) => i.id !== "the-village").map((item) => (
                <WorkCard key={item.id} item={item} lang={lang} d={d} />
              ))}
            </div>
          )}
          <Link href={`/${lang}/studio`} className="mt-8 inline-block text-sm text-ash underline decoration-line-2 underline-offset-4 hover:text-bone">
            {h.research.earlier} →
          </Link>
        </Container>
      )}

      {/* ------------------------------------- (02–03) Apps, learning */}
      {sections.map(({ type, index, copy }) => {
        const items = byType(type);
        if (!items.length) return null;
        return (
          <Container key={type} className="mt-32">
            <SectionHead index={index} eyebrow={copy.eyebrow} title={copy.title} aside={<p className="text-sm text-ash">{copy.lead}</p>} />
            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <WorkCard key={item.id} item={item} lang={lang} d={d} />
              ))}
            </div>
          </Container>
        );
      })}
      <Container className="mt-12">
        <ButtonLink href={`/${lang}/catalog`} variant="ghost">
          {h.all}
        </ButtonLink>
      </Container>

      {/* ------------------------------------------------- (04) Studio */}
      <Container className="mt-32">
        <SectionHead
          index="04"
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

      {/* -------------------------------------------------- (05) About */}
      <div id="about" className="scroll-mt-24" />
      <Container className="mt-32">
        <SectionHead index="05" eyebrow={h.about.eyebrow} title={h.about.title} />
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="font-serif text-2xl leading-relaxed text-bone/90">{h.about.bio}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={`mailto:${site.email}`}
                className="inline-flex items-center gap-2 rounded-full bg-bone px-6 py-3 text-[15px] font-medium text-ink transition hover:bg-white"
              >
                {h.about.contact} <span aria-hidden>→</span>
              </a>
              <span className="text-sm text-ash">{site.email}</span>
            </div>
          </div>
          <div className="md:col-span-5">
            <p className="eyebrow text-gold">{h.about.nowTitle}</p>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {h.about.now.map((n, i) => (
                <li key={n} className="flex gap-4 py-4">
                  <span className="num text-signal">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-bone/90">{n}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-dim">{h.about.built}</p>
          </div>
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
