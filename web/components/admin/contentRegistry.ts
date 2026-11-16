import type { CatalogItem, Piece, Dict } from "@/lib/types";
import type { EditTarget } from "./types";

export type ContentCategory = "all" | "hero" | "about" | "catalog" | "studio" | "nav_footer" | "labels";

export interface CategoryTab {
  id: ContentCategory;
  label: string;
  count?: number;
}

export interface RegistryEntry {
  id: string;
  category: ContentCategory;
  categoryLabel: string;
  label: string;
  description?: string;
  target: EditTarget;
  searchTokens: string;
}

export const CATEGORY_TABS: CategoryTab[] = [
  { id: "all", label: "All Content" },
  { id: "hero", label: "Hero & Landing" },
  { id: "about", label: "About Zwe" },
  { id: "catalog", label: "Catalog (Projects)" },
  { id: "studio", label: "Studio (Artworks)" },
  { id: "nav_footer", label: "Nav & Footer" },
  { id: "labels", label: "UI & Labels" },
];

function stringifyValue(val: unknown): string {
  if (typeof val === "string") return val;
  if (Array.isArray(val)) return val.join(" ");
  if (val && typeof val === "object") return Object.values(val).map(stringifyValue).join(" ");
  return "";
}

export function buildContentRegistry(
  en: Dict,
  my: Dict,
  catalog: CatalogItem[],
  studio: Piece[]
): RegistryEntry[] {
  const entries: RegistryEntry[] = [];

  function addDict(
    id: string,
    category: ContentCategory,
    categoryLabel: string,
    label: string,
    keyPath: string,
    enVal: unknown,
    myVal: unknown,
    kind: "text" | "textarea" | "heroTitle" | "stringArray" = "text",
    description?: string
  ) {
    const tokens = `${label} ${description || ""} ${keyPath} ${stringifyValue(enVal)} ${stringifyValue(myVal)}`.toLowerCase();
    entries.push({
      id,
      category,
      categoryLabel,
      label,
      description,
      target: {
        type: "dictionary",
        keyPath,
        label,
        description,
        category,
        kind,
        currentEn: enVal,
        currentMy: myVal,
      },
      searchTokens: tokens,
    });
  }

  // --- 1. HERO & LANDING ---
  addDict("hero_eyebrow", "hero", "Hero & Landing", "Hero Eyebrow", "hero.eyebrow", en.hero.eyebrow, my.hero.eyebrow, "text", "Top tag above the headline");
  addDict("hero_title", "hero", "Hero & Landing", "Hero Headline", "hero.title", en.hero.title, my.hero.title, "heroTitle", "3-part headline: prefix, italic word, punctuation");
  addDict("hero_sub", "hero", "Hero & Landing", "Hero Subtitle", "hero.sub", en.hero.sub, my.hero.sub, "textarea", "Sentence below the main headline");
  addDict("hero_cta", "hero", "Hero & Landing", "Hero CTA Button", "hero.cta", en.hero.cta, my.hero.cta, "text", "Primary button link text");
  addDict("hero_hint", "hero", "Hero & Landing", "Globe Hint", "hero.hint", en.hero.hint, my.hero.hint, "text", "Hint text below the 3D globe");

  // --- 2. ABOUT ZWE ---
  addDict("about_eyebrow", "about", "About Zwe", "About Eyebrow", "home.about.eyebrow", en.home.about.eyebrow, my.home.about.eyebrow, "text", "Tag above the About section");
  addDict("about_title", "about", "About Zwe", "About Title", "home.about.title", en.home.about.title, my.home.about.title, "text", "Main intro greeting title (e.g. I am Zwe.)");
  addDict("about_bio", "about", "About Zwe", "About Bio", "home.about.bio", en.home.about.bio, my.home.about.bio, "textarea", "Main biographical description paragraph");
  addDict("about_now_title", "about", "About Zwe", "Right Now Title", "home.about.nowTitle", en.home.about.nowTitle, my.home.about.nowTitle, "text", "Headline for current active focuses");
  addDict("about_now", "about", "About Zwe", "Right Now (Focus Items)", "home.about.now", en.home.about.now, my.home.about.now, "stringArray", "Numbered focus bullets (01, 02, 03)");
  addDict("about_contact", "about", "About Zwe", "Contact Button", "home.about.contact", en.home.about.contact, my.home.about.contact, "text", "Contact CTA button text");
  addDict("site_email", "about", "About Zwe", "Contact Email", "site.email", en.site.email || "lwinzwezarni@gmail.com", my.site.email || "lwinzwezarni@gmail.com", "text", "Public contact email displayed in bio & footer");

  // --- 3. CATALOG PROJECTS ---
  for (const item of catalog) {
    const tokens = `${item.code} ${item.id} ${item.title.en} ${item.title.my} ${item.summary.en} ${item.summary.my} ${item.about.en} ${item.about.my} ${item.standing.en} ${item.standing.my} ${item.status} ${(item.stack || []).join(" ")}`.toLowerCase();
    entries.push({
      id: `catalog_${item.id}`,
      category: "catalog",
      categoryLabel: "Catalog (Projects)",
      label: `${item.title.en} (${item.code})`,
      description: `Project ${item.code} · ${item.status} · ${item.category}`,
      target: {
        type: "catalogItem",
        itemId: item.id,
        label: `${item.title.en} (${item.code})`,
        category: "catalog",
        item,
      },
      searchTokens: tokens,
    });
  }

  // --- 4. STUDIO ARTWORKS ---
  for (const piece of studio) {
    const tokens = `${piece.id} ${piece.title.en} ${piece.title.my} ${piece.medium.en} ${piece.medium.my} ${piece.about.en} ${piece.about.my} ${piece.interact.en} ${piece.interact.my}`.toLowerCase();
    entries.push({
      id: `studio_${piece.id}`,
      category: "studio",
      categoryLabel: "Studio (Artworks)",
      label: `${piece.title.en} (${piece.id})`,
      description: `Artwork · ${piece.medium.en}`,
      target: {
        type: "studioPiece",
        pieceId: piece.id,
        label: `${piece.title.en} (${piece.id})`,
        category: "studio",
        piece,
      },
      searchTokens: tokens,
    });
  }

  // --- 5. NAVIGATION & FOOTER ---
  addDict("site_name", "nav_footer", "Nav & Footer", "Site Name", "site.name", en.site.name, my.site.name, "text");
  addDict("site_description", "nav_footer", "Nav & Footer", "Site Description", "site.description", en.site.description, my.site.description, "textarea");
  addDict("nav_catalog", "nav_footer", "Nav & Footer", "Nav Link: Work", "nav.catalog", en.nav.catalog, my.nav.catalog, "text");
  addDict("nav_studio", "nav_footer", "Nav & Footer", "Nav Link: Studio", "nav.studio", en.nav.studio, my.nav.studio, "text");
  addDict("nav_about", "nav_footer", "Nav & Footer", "Nav Link: About", "nav.about", en.nav.about, my.nav.about, "text");
  addDict("footer_line", "nav_footer", "Nav & Footer", "Footer Baseline Copy", "footer.line", en.footer.line, my.footer.line, "textarea");
  addDict("footer_explore", "nav_footer", "Nav & Footer", "Footer Explore Header", "footer.explore", en.footer.explore, my.footer.explore, "text");
  addDict("footer_contact", "nav_footer", "Nav & Footer", "Footer Contact Header", "footer.contact", en.footer.contact, my.footer.contact, "text");
  addDict("footer_language", "nav_footer", "Nav & Footer", "Footer Language Header", "footer.language", en.footer.language, my.footer.language, "text");

  // --- 6. UI & SYSTEM LABELS ---
  addDict("catalog_title", "labels", "UI & Labels", "All Work Header", "catalog.title", en.catalog.title, my.catalog.title, "text");
  addDict("catalog_lead", "labels", "UI & Labels", "All Work Lead Text", "catalog.lead", en.catalog.lead, my.catalog.lead, "textarea");
  addDict("studio_title", "labels", "UI & Labels", "Studio Page Title", "studio.title", en.studio.title, my.studio.title, "textarea");
  addDict("studio_lead", "labels", "UI & Labels", "Studio Page Lead", "studio.lead", en.studio.lead, my.studio.lead, "textarea");
  addDict("studio_artist", "labels", "UI & Labels", "Studio Artist Bio Note", "studio.artist", en.studio.artist, my.studio.artist, "textarea");

  return entries;
}
