import type { Locale } from "@/lib/i18n";
import catalogJson from "./catalog.json";
import type { CatalogItem, ItemType, CategoryId, Status, Role, LaunchMode, L } from "@/lib/types";

export type { CatalogItem, ItemType, CategoryId, Status, Role, LaunchMode, L };

export const itemTypes: ItemType[] = ["app", "research", "learning"];
export const categoryIds: CategoryId[] = ["ai", "education", "art", "science", "hardware", "everyday"];

/**
 * Topics shown as ONE expandable row in the index (they open in place to list their work).
 * A topic with a single piece is shown as a plain row.
 */
export const groupedCategories: CategoryId[] = ["education"];

export const catalog: CatalogItem[] = catalogJson as CatalogItem[];

export const byType = (t: ItemType) => catalog.filter((i) => i.type === t);

export const getItem = (id: string) => catalog.find((i) => i.id === id);

export function itemHref(item: CatalogItem, lang: Locale) {
  return item.mode === "native" && item.target
    ? `/${lang}/sims/${item.target}`
    : `/${lang}/catalog/${item.id}`;
}

/** Where the dossier for an item lives (native items have both a page and a dossier). */
export const dossierHref = (item: CatalogItem, lang: Locale) => `/${lang}/catalog/${item.id}`;
