import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { catalog, categoryIds, itemTypes } from "@/content/catalog";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale, num } from "@/lib/i18n";
import WorkIndex from "@/components/WorkIndex";
import { indexLabels, toIndexItem } from "@/components/indexItems";
import { Container } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/[lang]/catalog">): Promise<Metadata> {
  const { lang } = await params;
  return { title: hasLocale(lang) ? getDictionary(lang).catalog.title : undefined };
}

export default async function CatalogPage({ params }: PageProps<"/[lang]/catalog">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const d = getDictionary(lang);

  return (
    <Container className="pt-10">
      <div className="grid gap-4 border-b border-line pb-6 md:grid-cols-12 md:items-end">
        <div className="md:col-span-8">
          <p className="mono intro text-dim">
            <span className="text-signal">BL</span>
            <span className="mx-2 text-line-2">/</span>
            {d.catalog.eyebrow}
            <span className="mx-2 text-line-2">/</span>
            {d.index.count.replace("{n}", num(catalog.length, lang))}
          </p>
          <h1 className="display t-section intro-2 mt-3">{d.catalog.title}</h1>
        </div>
        <p className="intro-3 text-ash md:col-span-4 md:text-right">{d.catalog.lead}</p>
      </div>
      <div className="mt-5">
        <Suspense>
          <WorkIndex
            items={catalog.map((i) => toIndexItem(i, lang, d))}
            labels={indexLabels(d)}
            digits={lang}
            filters={{
              kinds: itemTypes.map((id) => ({ id, label: d.typePlural[id] })),
              categories: categoryIds.map((id) => ({ id, label: d.categories[id] })),
            }}
          />
        </Suspense>
      </div>
    </Container>
  );
}
