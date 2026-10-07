import { itemHref, type CatalogItem } from "@/content/catalog";
import type { Dict } from "@/lib/dictionaries";
import { num, type Locale } from "@/lib/i18n";
import Cover, { coverArt } from "./Cover";
import type { IndexItem } from "./WorkIndex";

/** One catalog entry, shaped for the index (server side, so covers render as SVG). */
export function toIndexItem(i: CatalogItem, lang: Locale, d: Dict): IndexItem {
  const other: Locale = lang === "my" ? "en" : "my";
  return {
    id: i.id,
    code: i.code,
    title: i.title[lang],
    titleAlt: i.title[other],
    summary: i.summary[lang],
    kind: i.type,
    kindLabel: d.type[i.type],
    category: i.category,
    categoryLabel: d.categories[i.category],
    stack: i.stack?.join(" · ") ?? "",
    status: i.status,
    statusLabel: d.status[i.status],
    year: num(i.year, lang),
    href: itemHref(i, lang),
    shot: i.shot ? { full: `/work/${i.shot}.webp`, thumb: `/work/${i.shot}-sm.webp` } : undefined,
    cover: <Cover id={i.id} art={coverArt(i)} className="h-full w-full" />,
    soon: i.mode === "soon",
  };
}

export const indexLabels = (d: Dict) => ({
  code: d.index.code,
  name: d.index.name,
  kind: d.index.kind,
  stack: d.index.stack,
  status: d.index.status,
  year: d.index.year,
  view: d.index.view,
  list: d.index.list,
  grid: d.index.grid,
  count: d.index.count,
  hint: d.index.hint,
  search: d.catalog.search,
  searchLabel: d.catalog.searchLabel,
  all: d.catalog.all,
  kinds: d.catalog.types,
  categories: d.catalog.categories,
  empty: d.catalog.empty,
  zawgyi: d.catalog.zawgyi,
});
