import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { byType, catalog, itemHref } from "@/content/catalog";
import { pieces } from "@/content/studio";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale, num } from "@/lib/i18n";
import { site } from "@/lib/site";
import HeroGlobe from "@/components/HeroGlobe";
import Readout from "@/components/Readout";
import SaveOffline from "@/components/SaveOffline";
import WorkIndex from "@/components/WorkIndex";
import { indexLabels, toIndexItem } from "@/components/indexItems";
import { ButtonLink, Container, SectionHead } from "@/components/ui";

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
    ...catalog.map((i) => `/${lang}/catalog/${i.id}`),
    ...pieces.map((p) => `/${lang}/studio/${p.id}`),
  ];

  const [pre, em, post] = d.hero.title;
  // Counted from the catalog; a kind with nothing in it is left out rather than shown as zero.
  const statLine = (
    [
      [catalog.length, d.readout.entries],
      [byType("app").length, d.stats.app],
      [byType("research").length, d.stats.research],
      [byType("learning").length, d.stats.learning],
      [pieces.length, d.stats.studio],
    ] as const
  ).filter(([n]) => n > 0);

  return (
    <>
      {/* ------------------------------------------------------------ Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-20%] h-[600px] w-[600px] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, #ff313118, transparent 60%)" }}
        />
        <Container className="grid items-center gap-6 pt-8 pb-6 lg:min-h-[56svh] lg:grid-cols-12 lg:gap-4 lg:pt-4">
          <div className="lg:col-span-7">
            <p className="eyebrow intro">{d.hero.eyebrow}</p>
            <h1 className="display t-hero intro-2 mt-4 max-w-3xl">
              {pre}
              <em>{em}</em>
              {post}
            </h1>
            <p className="intro-3 mt-5 max-w-lg text-[17px] text-ash">{d.hero.sub}</p>
            <div className="intro-3 mt-6 flex flex-wrap items-center gap-3">
              <ButtonLink href={`/${lang}/catalog`}>{d.hero.cta}</ButtonLink>
              <ButtonLink href={`/${lang}/studio`} variant="ghost">
                {d.studio.viewAll}
              </ButtonLink>
            </div>
            <div className="intro-3 mt-8">
              <Readout place={d.readout.place} local={d.readout.local} />
            </div>
          </div>
          <div className="mx-auto w-full max-w-[300px] sm:max-w-[360px] lg:col-span-5 lg:ml-auto lg:max-w-[400px]">
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

        {/* One line of numbers, counted honestly. */}
        <Container>
          <p className="mono flex flex-wrap gap-x-4 gap-y-1 border-y border-line py-3 text-dim">
            <span className="text-signal">BL</span>
            {statLine.map(([n, label], i) => (
              <span key={label} className="flex items-center gap-4">
                {i > 0 && <span aria-hidden className="text-line-2">/</span>}
                <span>
                  <span className="text-bone">{num(n, lang)}</span> {label}
                </span>
              </span>
            ))}
          </p>
        </Container>
      </section>

      {/* ------------------------------------------------------- 01 Index */}
      <Container className="mt-14 md:mt-16">
        <SectionHead
          index="01"
          eyebrow={d.index.eyebrow}
          title={d.index.title}
          aside={
            <Link href={`/${lang}/catalog`} className="mono text-ash underline decoration-line-2 underline-offset-4 hover:text-bone">
              {d.index.all} →
            </Link>
          }
        />
        <Suspense>
          <WorkIndex items={catalog.map((i) => toIndexItem(i, lang, d))} labels={indexLabels(d)} digits={lang} />
        </Suspense>
      </Container>

      {/* ----------------------------------------------------- 02 Studio */}
      <Container className="mt-16 md:mt-20">
        <SectionHead
          index="02"
          eyebrow={d.studio.eyebrow}
          title={d.studio.title}
          aside={
            <Link href={`/${lang}/studio`} className="mono text-ash underline decoration-line-2 underline-offset-4 hover:text-bone">
              {d.studio.viewAll} →
            </Link>
          }
        />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {pieces.map((p, i) => (
            <li key={p.id} className="reveal">
              <Link href={`/${lang}/studio/${p.id}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden border border-line bg-black">
                  <Image
                    src={`/studio/${p.id}.webp`}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                  <span className="mono absolute top-2 left-2.5 text-bone/70">ST-{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className="mt-2 flex items-baseline justify-between gap-2">
                  <h3 className="truncate text-[15px] font-medium transition-colors group-hover:text-signal">{p.title[lang]}</h3>
                  <span className="mono hidden text-dim sm:inline">{p.medium[lang].split(" · ")[0]}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      {/* ------------------------------------------------------ 03 About */}
      <div id="about" className="scroll-mt-24" />
      <Container className="mt-16 md:mt-20">
        <SectionHead index="03" eyebrow={h.about.eyebrow} title={h.about.title} />
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="font-serif text-xl leading-relaxed text-bone/90 sm:text-2xl">{h.about.bio}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <ButtonLink href={`mailto:${site.email}`} external>
                {h.about.contact}
              </ButtonLink>
              <span className="mono text-ash">{site.email}</span>
            </div>
          </div>
          <div className="md:col-span-5">
            <p className="mono text-gold">{h.about.nowTitle}</p>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {h.about.now.map((n, i) => (
                <li key={n} className="flex gap-4 py-3">
                  <span className="mono text-signal">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[15px] text-bone/90">{n}</span>
                </li>
              ))}
            </ul>
            <p className="mono mt-4 text-dim">{h.about.built}</p>
            <p className="mono mt-2 text-dim">{h.about.services}</p>
          </div>
        </div>
      </Container>

      {/* ------------------------------------------------- Offline row */}
      <Container className="mt-14 md:mt-16">
        <div className="reveal flex flex-col gap-4 border-y border-line py-5 md:flex-row md:items-center md:justify-between">
          <h2 className="display text-2xl sm:text-3xl">{d.save.title}</h2>
          <SaveOffline urls={offlineUrls} labels={d.save} />
        </div>
      </Container>
    </>
  );
}
