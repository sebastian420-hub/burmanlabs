import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalog, getItem } from "@/content/catalog";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale, locales, num } from "@/lib/i18n";
import Cover, { coverArt } from "@/components/Cover";
import EmbedFrame from "@/components/EmbedFrame";
import { ButtonLink, Container, StatusDot } from "@/components/ui";

export function generateStaticParams() {
  return locales.flatMap((lang) => catalog.map((i) => ({ lang, id: i.id })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/catalog/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  const item = getItem(id);
  return {
    title: item && hasLocale(lang) ? `${item.code} ${item.title[lang]}` : undefined,
    description: item && hasLocale(lang) ? item.summary[lang] : undefined,
  };
}

/** A dossier: designation, facts, the piece itself, what it is, where it stands. */
export default async function ItemPage({ params }: PageProps<"/[lang]/catalog/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const item = getItem(id);
  if (!item) notFound();
  const d = getDictionary(lang);
  const idx = catalog.indexOf(item);
  const prev = catalog[(idx - 1 + catalog.length) % catalog.length];
  const next = catalog[(idx + 1) % catalog.length];

  const linkHref =
    item.mode === "native" && item.target ? `/${lang}/sims/${item.target}` : item.mode !== "soon" && item.mode !== "private" ? item.target : undefined;

  const facts: [string, React.ReactNode][] = [
    [d.dossier.code, item.code],
    [
      d.item.status,
      <span key="s" className="inline-flex items-center gap-2">
        <StatusDot status={item.status} />
        {d.status[item.status]}
      </span>,
    ],
    [d.item.type, d.type[item.type]],
    [d.item.subject, d.categories[item.category]],
    [d.dossier.role, d.role[item.role]],
    [d.dossier.year, num(item.year, lang)],
    [d.item.stack, item.stack?.length ? <span lang="en">{item.stack.join(" · ")}</span> : d.dossier.none],
    [d.item.size, item.sizeMB ? `~${num(item.sizeMB, lang)} MB` : d.dossier.none],
    [
      d.dossier.link,
      linkHref ? (
        item.mode === "native" ? (
          <Link href={linkHref} className="text-bone underline decoration-line-2 underline-offset-4 hover:text-signal">
            {d.item.open} →
          </Link>
        ) : (
          <a href={linkHref} target="_blank" rel="noopener noreferrer" className="text-bone underline decoration-line-2 underline-offset-4 hover:text-signal" lang="en">
            {linkHref.replace(/^https?:\/\//, "").replace(/\/$/, "")} ↗
          </a>
        )
      ) : (
        item.mode === "private" ? d.item.private : d.item.soon
      ),
    ],
  ];

  return (
    <article>
      <Container className="pt-8">
        <div className="mono flex items-center justify-between text-dim">
          <Link href={`/${lang}/catalog`} className="transition hover:text-bone">
            ← {d.item.back}
          </Link>
          <span>
            {String(idx + 1).padStart(2, "0")} / {String(catalog.length).padStart(2, "0")}
          </span>
        </div>

        {/* Header */}
        <div className="mt-6 grid gap-8 border-t border-line pt-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="mono intro flex items-center gap-3">
              <span className="text-signal">{item.code}</span>
              <span className="text-line-2">/</span>
              <span className="inline-flex items-center gap-2 text-ash">
                <StatusDot status={item.status} />
                {d.status[item.status]}
              </span>
            </p>
            <h1 className="display intro-2 mt-3 text-5xl sm:text-6xl lg:text-7xl">{item.title[lang]}</h1>
            <p className="intro-3 mt-4 max-w-xl text-lg text-ash">{item.summary[lang]}</p>
            <div className="intro-3 mt-6">
              {item.mode === "link" && item.target && (
                <ButtonLink href={item.target} external>
                  {d.item.openNew}
                </ButtonLink>
              )}
              {item.mode === "native" && item.target && (
                <ButtonLink href={`/${lang}/sims/${item.target}`}>{d.item.open}</ButtonLink>
              )}
              {(item.mode === "soon" || item.mode === "private") && (
                <span className="mono inline-flex rounded-full border border-line-2 px-5 py-2.5 text-ash">
                  {item.mode === "private" ? d.item.private : d.item.soon}
                </span>
              )}
            </div>
          </div>

          {/* Facts block */}
          <dl className="intro-3 self-start border-t border-line lg:col-span-5 lg:border-t-0 lg:border-l lg:pl-8">
            {facts.map(([k, v]) => (
              <div key={k} className="mono grid grid-cols-[7rem_1fr] gap-4 border-b border-line py-2.5">
                <dt className="text-dim">{k}</dt>
                <dd className="text-bone/90">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* The piece */}
        <div className="intro-fade relative mt-10 aspect-[16/10] overflow-hidden border border-line bg-ink-2">
          {item.shot ? (
            <Image src={`/work/${item.shot}.webp`} alt={item.title[lang]} fill priority sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
          ) : (
            <Cover id={item.id} art={coverArt(item)} className="h-full w-full" />
          )}
          <span className="mono absolute bottom-3 left-3 text-bone/70">
            {item.code} · {item.title[lang]}
          </span>
        </div>

        {item.mode === "embed" && item.target && (
          <div className="mt-8">
            <EmbedFrame url={item.target} title={item.title[lang]} labels={{ load: d.item.loadEmbed, note: d.item.embedNote }} />
          </div>
        )}

        {/* What it is / where it stands */}
        <div className="mt-10 divide-y divide-line border-y border-line">
          {(
            [
              [d.dossier.what, item.about[lang]],
              [d.dossier.standing, item.standing[lang]],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="grid gap-3 py-6 md:grid-cols-12 md:gap-6">
              <p className="mono text-dim md:col-span-3">{k}</p>
              <p className="text-[17px] leading-relaxed text-bone/90 md:col-span-7">{v}</p>
            </div>
          ))}
        </div>

        {/* Prev / next */}
        <nav className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-2">
          <Link href={`/${lang}/catalog/${prev.id}`} className="group bg-ink p-5 transition hover:bg-ink-2">
            <p className="mono text-dim">← {d.dossier.prev}</p>
            <p className="mt-1 font-medium transition-colors group-hover:text-signal">
              <span className="mono mr-2 text-dim">{prev.code}</span>
              {prev.title[lang]}
            </p>
          </Link>
          <Link href={`/${lang}/catalog/${next.id}`} className="group bg-ink p-5 text-right transition hover:bg-ink-2">
            <p className="mono text-dim">{d.dossier.next} →</p>
            <p className="mt-1 font-medium transition-colors group-hover:text-signal">
              <span className="mono mr-2 text-dim">{next.code}</span>
              {next.title[lang]}
            </p>
          </Link>
        </nav>
      </Container>
    </article>
  );
}
