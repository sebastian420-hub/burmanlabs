import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalog, getItem } from "@/content/catalog";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale, locales, num } from "@/lib/i18n";
import Cover from "@/components/Cover";
import EmbedFrame from "@/components/EmbedFrame";
import { ButtonLink, Container, Tag } from "@/components/ui";

export function generateStaticParams() {
  return locales.flatMap((lang) => catalog.map((i) => ({ lang, id: i.id })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/catalog/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  const item = getItem(id);
  return {
    title: item && hasLocale(lang) ? item.title[lang] : undefined,
    description: item && hasLocale(lang) ? item.summary[lang] : undefined,
  };
}

export default async function ItemPage({ params }: PageProps<"/[lang]/catalog/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const item = getItem(id);
  if (!item) notFound();
  const d = getDictionary(lang);

  const facts: [string, string][] = [
    [d.item.type, d.type[item.type]],
    [d.item.subject, d.categories[item.category]],
    [d.item.access, d.item.free],
    [d.item.size, item.sizeMB ? `~${num(item.sizeMB, lang)} MB` : "—"],
    ["", item.offline ? d.item.offline : d.item.online],
  ];

  return (
    <article>
      <Container className="pt-10">
        <Link href={`/${lang}/catalog`} className="text-sm text-ash transition hover:text-bone">
          ← {d.item.back}
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="intro relative aspect-[400/260] overflow-hidden rounded-3xl border border-line">
              <Cover id={item.id} type={item.type} className="h-full w-full" />
            </div>
          </div>

          <div className="flex flex-col lg:col-span-5">
            <div className="flex flex-wrap gap-2">
              <Tag>{d.type[item.type]}</Tag>
              {item.sample && <Tag tone="signal">{d.item.sample}</Tag>}
            </div>
            <h1 className="display intro-2 mt-5 text-5xl sm:text-6xl">{item.title[lang]}</h1>
            <p className="intro-3 mt-5 text-lg text-ash">{item.summary[lang]}</p>

            <div className="mt-8">
              {item.mode === "link" && item.target && (
                <ButtonLink href={item.target} external>
                  {d.item.openNew}
                </ButtonLink>
              )}
              {item.mode === "native" && item.target && (
                <ButtonLink href={`/${lang}/sims/${item.target}`}>{d.item.open}</ButtonLink>
              )}
              {item.mode === "soon" && (
                <span className="inline-flex rounded-full border border-line-2 px-6 py-3 text-ash">
                  {d.item.soon}
                </span>
              )}
            </div>

            <dl className="mt-10 border-t border-line">
              {facts.map(([k, v]) => (
                <div key={k + v} className="flex justify-between gap-6 border-b border-line py-3 text-sm">
                  <dt className="text-dim">{k}</dt>
                  <dd className="text-right text-bone/90">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {item.mode === "embed" && item.target && (
          <div className="mt-12">
            <EmbedFrame
              url={item.target}
              title={item.title[lang]}
              labels={{ load: d.item.loadEmbed, note: d.item.embedNote }}
            />
          </div>
        )}
      </Container>
    </article>
  );
}
