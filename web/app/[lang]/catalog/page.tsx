import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { catalog, categoryIds, itemHref, itemTypes } from "@/content/catalog";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale, num } from "@/lib/i18n";
import CatalogBrowser from "@/components/CatalogBrowser";
import Cover, { coverArt } from "@/components/Cover";
import { Container } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/[lang]/catalog">): Promise<Metadata> {
  const { lang } = await params;
  return { title: hasLocale(lang) ? getDictionary(lang).catalog.title : undefined };
}

export default async function CatalogPage({ params }: PageProps<"/[lang]/catalog">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);
  const other = lang === "my" ? "en" : "my";

  const items = catalog.map((i) => ({
    id: i.id,
    type: i.type,
    typeLabel: d.type[i.type],
    category: i.category,
    categoryLabel: d.categories[i.category],
    title: i.title[lang],
    titleAlt: i.title[other],
    summary: i.summary[lang],
    href: itemHref(i, lang),
    sizeLabel: i.sizeMB ? `~${num(i.sizeMB, lang)} MB` : undefined,
    offline: !!i.offline,
    soon: i.mode === "soon",
    statusLabel: d.status[i.status],
    live: i.status === "live",
    cover: <Cover id={i.id} art={coverArt(i)} className="h-full w-full" />,
  }));

  return (
    <Container className="pt-14">
      <div className="grid gap-6 pb-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <p className="eyebrow intro">
            <span className="num text-signal">{num(catalog.length, lang)}</span>&nbsp;&nbsp;{d.catalog.eyebrow}
          </p>
          <h1 className="display t-hero intro-2 mt-4">{d.catalog.title}</h1>
        </div>
        <p className="intro-3 text-ash md:col-span-4">{d.catalog.lead}</p>
      </div>
      <Suspense>
        <CatalogBrowser
          items={items}
          digits={lang}
          categories={categoryIds.map((id) => ({ id, label: d.categories[id] }))}
          types={itemTypes.map((id) => ({ id, label: d.typePlural[id] }))}
          labels={{
            search: d.catalog.search,
            searchLabel: d.catalog.searchLabel,
            all: d.catalog.all,
            categories: d.catalog.categories,
            types: d.catalog.types,
            results: d.catalog.results,
            empty: d.catalog.empty,
            zawgyi: d.catalog.zawgyi,
            offline: d.item.offline,
            soon: d.item.soon,
          }}
        />
      </Suspense>
    </Container>
  );
}
