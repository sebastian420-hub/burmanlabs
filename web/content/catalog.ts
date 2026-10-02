import type { Locale } from "@/lib/i18n";

export type ItemType = "textbook" | "app" | "sim";
export type CategoryId = "science" | "math" | "ai" | "tools";
/**
 * link   – opens the product's own site in a new tab
 * embed  – tap-to-load iframe (the product must allow framing)
 * native – a page inside this site, at /{lang}/sims/{slug}
 * soon   – listed but not launchable yet
 */
export type LaunchMode = "link" | "embed" | "native" | "soon";

export interface CatalogItem {
  id: string;
  type: ItemType;
  category: CategoryId;
  title: Record<Locale, string>;
  summary: Record<Locale, string>;
  mode: LaunchMode;
  /** External URL for link/embed, or the sim slug for native. */
  target?: string;
  /** Rough data cost of opening it, in MB. */
  sizeMB?: number;
  /** True when the item keeps working after it has been opened once. */
  offline?: boolean;
  /** Placeholder entry. Delete these as the real catalog is filled in. */
  sample?: boolean;
}

export const categoryIds: CategoryId[] = ["science", "math", "ai", "tools"];

/**
 * THE CATALOG. This is the single source of truth: the landing-page counts, the
 * globe lights, search and item pages are all built from this list. Add a row
 * and the whole site updates.
 */
export const catalog: CatalogItem[] = [
  {
    id: "spikebook",
    type: "textbook",
    category: "science",
    title: { my: "Spikebook", en: "Spikebook" },
    summary: {
      my: "အပြန်အလှန်ဆက်သွယ်နိုင်သော ဖတ်စာအုပ်။",
      en: "An interactive textbook.",
    },
    mode: "link",
    target: "https://spikebook.vercel.app",
    // category, size and offline are guesses: confirm them.
    sample: true,
  },
  {
    id: "orbit",
    type: "sim",
    category: "science",
    title: { my: "ဂြိုဟ်လှည့်ပတ်မှု စမ်းသပ်ခန်း", en: "Orbit lab" },
    summary: {
      my: "နေ၏ ဆွဲအားအောက်တွင် ဂြိုဟ်တစ်လုံး ဘယ်လိုလှည့်ပတ်သည်ကို စမ်းကြည့်ပါ။",
      en: "See how a planet moves under the Sun's gravity.",
    },
    mode: "native",
    target: "orbit",
    sizeMB: 0.3,
    offline: true,
  },
  {
    id: "edusim",
    type: "sim",
    category: "science",
    title: { my: "EduSim", en: "EduSim" },
    summary: {
      my: "GPU ကို အသုံးပြု၍ ဖန်တီးထားသော အပြန်အလှန်ဆက်သွယ်နိုင်သော သိပ္ပံစမ်းသပ်မှုများ။",
      en: "Interactive physics, biology and computer-science simulations that run on your GPU with WebGPU.",
    },
    mode: "link",
    target: "https://edusim-theta.vercel.app/",
  },
  ...(
    [
      ["math-textbook", "textbook", "math", "သင်္ချာ ဖတ်စာအုပ်", "Mathematics textbook"],
      ["physics-sim", "sim", "science", "ရူပဗေဒ စမ်းသပ်မှု", "Physics simulation"],
      ["chem-sim", "sim", "science", "ဓာတုဗေဒ စမ်းသပ်မှု", "Chemistry simulation"],
      ["bio-textbook", "textbook", "science", "ဇီဝဗေဒ ဖတ်စာအုပ်", "Biology textbook"],
      ["research-ai", "sim", "ai", "AI သုတေသန စမ်းသပ်မှု", "AI research simulation"],
      ["ai-basics", "textbook", "ai", "AI အခြေခံ ဖတ်စာအုပ်", "AI basics textbook"],
      ["stat-sim", "sim", "math", "ဖြစ်နိုင်ခြေ စမ်းသပ်မှု", "Probability simulation"],
      ["tools-converter", "app", "tools", "ယူနစ်ပြောင်းအက်ပ်", "Unit converter"],
      ["tools-planner", "app", "tools", "လေ့လာရေး အချိန်ဇယား", "Study planner"],
      ["tools-calc", "app", "tools", "တွက်ချက်ရေး အက်ပ်", "Calculator app"],
    ] as const
  ).map(
    ([id, type, category, my, en]): CatalogItem => ({
      id,
      type,
      category,
      title: { my, en },
      summary: { my: "မကြာမီ ရောက်လာမည်။", en: "Coming soon." },
      mode: "soon",
      sample: true,
    }),
  ),
];

export const getItem = (id: string) => catalog.find((i) => i.id === id);

export function itemHref(item: CatalogItem, lang: Locale) {
  return item.mode === "native" && item.target
    ? `/${lang}/sims/${item.target}`
    : `/${lang}/catalog/${item.id}`;
}
