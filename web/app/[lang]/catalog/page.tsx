import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { catalog, categoryIds, itemHref } from "@/content/catalog";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale, num } from "@/lib/i18n";
import CatalogBrowser from "@/components/CatalogBrowser";

export async function generateMetadata({ params }: PageProps<"/[lang]/catalog">): Promise<Metadata> {
  const { lang } = await params;
  return { title: hasLocale(lang) ? getDictionary(lang).catalog.title : undefined };
}

export default async function CatalogPage({ params }: PageProps<"/[lang]/catalog">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const other = lang === "my" ? "en" : "my";

  const items = catalog.map((i) => ({
    id: i.id,
    type: i.type,
    typeLabel: dict.type[i.type],
    category: i.category,
    categoryLabel: dict.categories[i.category],
    title: i.title[lang],
    titleAlt: i.title[other],
    summary: i.summary[lang],
    href: itemHref(i, lang),
    sizeLabel: i.sizeMB ? `~${num(i.sizeMB, lang)} MB` : undefined,
    offline: !!i.offline,
    soon: i.mode === "soon",
    sample: !!i.sample,
  }));

  return (
    <div className="pt-8">
      <h1 className="mb-5 text-3xl font-bold">{dict.catalog.title}</h1>
      <Suspense>
        <CatalogBrowser
          items={items}
          digits={lang}
          categories={categoryIds.map((id) => ({ id, label: dict.categories[id] }))}
          types={(["textbook", "app", "sim"] as const).map((id) => ({ id, label: dict.type[id] }))}
          labels={{
            search: dict.catalog.search,
            searchLabel: dict.catalog.searchLabel,
            all: dict.catalog.all,
            categories: dict.catalog.categories,
            types: dict.catalog.types,
            results: dict.catalog.results,
            empty: dict.catalog.empty,
            zawgyi: dict.catalog.zawgyi,
            offline: dict.item.offline,
            soon: dict.item.soon,
            sample: dict.item.sample,
          }}
        />
      </Suspense>
    </div>
  );
}
