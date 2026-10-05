import type { Locale } from "@/lib/i18n";

/**
 * What a piece of work is:
 * app      – working software people use (built for them, or for clients)
 * research – an experiment of my own, with findings
 * learning – something I am learning, usually by building it
 */
export type ItemType = "app" | "research" | "learning";
export const itemTypes: ItemType[] = ["app", "research", "learning"];

export type CategoryId = "ai" | "science" | "hardware" | "everyday";
export const categoryIds: CategoryId[] = ["ai", "science", "hardware", "everyday"];

/** Where it stands. Shown as a tag on cards and item pages. */
export type Status = "live" | "ongoing" | "learning";

/**
 * link   – opens the product's own site in a new tab
 * embed  – tap-to-load iframe (the product must allow framing)
 * native – a page inside this site, at /{lang}/sims/{slug}
 * soon   – real, but no public link yet
 */
export type LaunchMode = "link" | "embed" | "native" | "soon";

export interface CatalogItem {
  id: string;
  type: ItemType;
  category: CategoryId;
  status: Status;
  title: Record<Locale, string>;
  summary: Record<Locale, string>;
  mode: LaunchMode;
  /** External URL for link/embed, or the page slug for native. */
  target?: string;
  /** Tools it is built with, shown as small tags. */
  stack?: string[];
  /** Generative cover style; defaults by type. */
  art?: "lines" | "tiles" | "orbits";
  /** Rough data cost of opening it, in MB. */
  sizeMB?: number;
  /** True when the item keeps working after it has been opened once. */
  offline?: boolean;
}

/**
 * EVERYTHING ON THE SITE. The home page, the globe lights, "All work", search and
 * item pages are built from this list. Only real work goes here.
 */
export const catalog: CatalogItem[] = [
  {
    // digital_sim's daily world, native here: /{lang}/sims/village reads the
    // episodes the daily runner publishes into public/village/.
    id: "the-village",
    type: "research",
    category: "ai",
    status: "ongoing",
    title: { my: "AI ကျေးရွာ", en: "The Village" },
    summary: {
      my: "AI အေးဂျင့်များ နေထိုင်သော ကျေးရွာတစ်ရွာ။ မည်သူမျှ မညွှန်ကြားဘဲ လူ့အဖွဲ့အစည်း ပေါ်လာမလား။ နေ့စဉ် ဆက်လည်ပတ်ပြီး ဘာဖြစ်ခဲ့သည်ကို ကြည့်နိုင်သည်။",
      en: "A village of AI agents that nobody steers. Does a society form on its own? The world runs on every day, and you can watch what happened.",
    },
    mode: "native",
    target: "village",
    stack: ["Python", "LLM agents", "Gemini"],
    art: "orbits",
    sizeMB: 0.4,
  },
  {
    id: "golf-handicap",
    type: "app",
    category: "everyday",
    status: "live",
    title: { my: "Golf Handicap", en: "Golf Handicap" },
    summary: {
      my: "ဂေါက်သမားများ၏ handicap ကို မှတ်သားပေးသော မိုဘိုင်းအက်ပ်။",
      en: "A mobile app that keeps track of a golfer's handicap.",
    },
    // Add the App Store or download URL as `target` and set mode: "link".
    mode: "soon",
    art: "tiles",
  },
  {
    id: "edusim",
    type: "app",
    category: "science",
    status: "live",
    title: { my: "EduSim", en: "EduSim" },
    summary: {
      my: "GPU ပေါ်တွင် WebGPU ဖြင့် လည်ပတ်သော ရူပဗေဒ၊ ဇီဝဗေဒနှင့် ကွန်ပျူတာသိပ္ပံ အပြန်အလှန် စမ်းသပ်မှုများ။",
      en: "Interactive physics, biology and computer-science simulations that run on your GPU with WebGPU.",
    },
    mode: "link",
    target: "https://edusim-theta.vercel.app/",
    stack: ["WebGPU"],
    art: "orbits",
  },
  {
    id: "spikebook",
    type: "learning",
    category: "hardware",
    status: "learning",
    title: { my: "Spikebook", en: "Spikebook" },
    summary: {
      my: "Neuromorphic ချစ်ပ် ဒီဇိုင်းအကြောင်း အပြန်အလှန် စာအုပ်။ လေ့လာရင်း ကိုယ်တိုင် တည်ဆောက်ထားသည် — ကိုယ်တိုင်ပျံသန်းနိုင်သော ဒရုန်း တည်ဆောက်ရန် ပထမခြေလှမ်း။",
      en: "An interactive book on neuromorphic chip design, built while I learn it: the first step toward building an autonomous drone.",
    },
    mode: "link",
    target: "https://spikebook.vercel.app",
    stack: ["Neuromorphic computing"],
    art: "lines",
  },
  {
    id: "orbit",
    type: "app",
    category: "science",
    status: "live",
    title: { my: "ဂြိုဟ်လှည့်ပတ်မှု စမ်းသပ်ခန်း", en: "Orbit lab" },
    summary: {
      my: "နေ၏ ဆွဲအားအောက်တွင် ဂြိုဟ်တစ်လုံး ဘယ်လိုလှည့်ပတ်သည်ကို စမ်းကြည့်ပါ။",
      en: "See how a planet moves under the Sun's gravity.",
    },
    mode: "native",
    target: "orbit",
    stack: ["three.js"],
    art: "orbits",
    sizeMB: 0.3,
    offline: true,
  },
];

export const byType = (t: ItemType) => catalog.filter((i) => i.type === t);

export const getItem = (id: string) => catalog.find((i) => i.id === id);

export function itemHref(item: CatalogItem, lang: Locale) {
  return item.mode === "native" && item.target
    ? `/${lang}/sims/${item.target}`
    : `/${lang}/catalog/${item.id}`;
}
