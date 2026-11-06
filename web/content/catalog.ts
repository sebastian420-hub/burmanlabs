import type { Locale } from "@/lib/i18n";

type L = Record<Locale, string>;

/**
 * What a piece of work is:
 * app      – working software people use (built for them, or for clients)
 * research – an experiment of my own, with findings
 * learning – something I am learning, usually by building it
 */
export type ItemType = "app" | "research" | "learning";
export const itemTypes: ItemType[] = ["app", "research", "learning"];

export type CategoryId = "ai" | "education" | "art" | "science" | "hardware" | "everyday";
export const categoryIds: CategoryId[] = ["ai", "education", "art", "science", "hardware", "everyday"];

/** Where it stands. Shown as a tag on cards and item pages. */
export type Status = "live" | "ongoing" | "learning";

/** My part in it. */
export type Role = "build" | "research" | "study";

/**
 * link   – opens the product's own site in a new tab
 * embed  – tap-to-load iframe (the product must allow framing)
 * native – a page inside this site, at /{lang}/sims/{slug}
 * soon   – real, but no public link yet
 */
export type LaunchMode = "link" | "embed" | "native" | "soon";

export interface CatalogItem {
  id: string;
  /** Designation, shown everywhere the item appears: BL-001, BL-002 … */
  code: string;
  type: ItemType;
  category: CategoryId;
  status: Status;
  role: Role;
  /** Year started. */
  year: number;
  title: L;
  summary: L;
  /** Dossier: what it is, in two or three sentences. */
  about: L;
  /** Dossier: where it stands right now. */
  standing: L;
  mode: LaunchMode;
  /** External URL for link/embed, or the page slug for native. */
  target?: string;
  /** Tools it is built with, shown as small tags. */
  stack?: string[];
  /**
   * Real screenshot in public/work/{shot}.webp (1600×1000) with a {shot}-sm.webp thumbnail.
   * Items without one get generative cover art.
   */
  shot?: string;
  /** Generative cover style; defaults by type. */
  art?: "lines" | "tiles" | "orbits";
  /** Rough data cost of opening it, in MB. */
  sizeMB?: number;
  /** True when the item keeps working after it has been opened once. */
  offline?: boolean;
}

/**
 * EVERYTHING ON THE SITE. The home index, the globe lights, "All work", search and
 * dossier pages are built from this list. Only real work goes here. Codes are
 * permanent: never renumber, add the next one.
 *
 * Years marked "confirm" are the year the item reached this site; replace with the
 * year the work actually started.
 */
export const catalog: CatalogItem[] = [
  {
    id: "edusim",
    code: "BL-001",
    type: "app",
    category: "education",
    status: "live",
    role: "build",
    year: 2026, // confirm
    title: { my: "EduSim", en: "EduSim" },
    summary: {
      my: "GPU ပေါ်တွင် WebGPU ဖြင့် လည်ပတ်သော ရူပဗေဒ၊ ဇီဝဗေဒနှင့် ကွန်ပျူတာသိပ္ပံ စမ်းသပ်မှုများ။",
      en: "Physics, biology and computer-science simulations that run on your GPU with WebGPU.",
    },
    about: {
      my: "ဘရောက်ဇာထဲတွင် တိုက်ရိုက် လည်ပတ်သော အပြန်အလှန် သိပ္ပံ စမ်းသပ်မှုများ။ WebGPU ကို အသုံးပြုထားသဖြင့် တွက်ချက်မှုများကို ဖုန်း သို့မဟုတ် ကွန်ပျူတာ၏ GPU ပေါ်တွင် ပြုလုပ်ပြီး ကြီးမားသော စမ်းသပ်မှုများကိုလည်း ချောမွေ့စွာ လည်ပတ်နိုင်သည်။",
      en: "Interactive science simulations that run straight in the browser. They use WebGPU, so the heavy computation happens on the device's own graphics processor and large simulations stay smooth.",
    },
    standing: {
      my: "အသုံးပြုနိုင်ပြီ။ WebGPU ပံ့ပိုးသော ဘရောက်ဇာ လိုအပ်သည်။",
      en: "Live. Needs a browser with WebGPU.",
    },
    mode: "link",
    target: "https://edusim-theta.vercel.app/",
    stack: ["WebGPU"],
    art: "orbits",
  },
  {
    id: "spikebook",
    code: "BL-002",
    type: "learning",
    category: "education",
    status: "learning",
    role: "study",
    year: 2026, // confirm
    title: { my: "Spikebook", en: "Spikebook" },
    summary: {
      my: "Neuromorphic ချစ်ပ် ဒီဇိုင်းအကြောင်း အပြန်အလှန် စာအုပ် — ကိုယ်တိုင်ပျံသန်းနိုင်သော ဒရုန်းဆီသို့ ပထမခြေလှမ်း။",
      en: "An interactive book on neuromorphic chip design: the first step toward an autonomous drone.",
    },
    about: {
      my: "Neuromorphic ချစ်ပ်များ — ဦးနှောက်ကဲ့သို့ spike များဖြင့် တွက်ချက်သော ဟာ့ဒ်ဝဲ — အကြောင်း လေ့လာရင်း ရေးသားနေသော စာအုပ်။ အခန်းတိုင်းတွင် စမ်းကစားနိုင်သော ပုံများ ပါဝင်သည်။ ရည်မှန်းချက်မှာ ထိုချစ်ပ်ဖြင့် တွေးခေါ်သော ကိုယ်တိုင်ပျံသန်းနိုင်သည့် ဒရုန်း ဖြစ်သည်။",
      en: "A book I am writing while I learn neuromorphic chips: hardware that computes with spikes, the way a brain does. Every chapter has diagrams you can play with. The goal at the end of it is an autonomous drone that thinks on such a chip.",
    },
    standing: {
      my: "လေ့လာရင်း ရေးသားနေဆဲ။ အခန်းသစ်များကို ဖတ်ရင်း ထည့်သွင်းနေသည်။",
      en: "Written in public, chapter by chapter, as I read.",
    },
    mode: "link",
    target: "https://spikebook.vercel.app",
    stack: ["Neuromorphic computing"],
    art: "lines",
  },
  {
    // Terminal agent. Private repo for now; add the install link as `target`, mode: "link".
    id: "cortex",
    code: "BL-003",
    type: "app",
    category: "ai",
    status: "live",
    role: "build",
    year: 2026, // confirm
    title: { my: "Cortex", en: "Cortex" },
    summary: {
      my: "ကုဒ်ရေးခြင်း၊ လုံခြုံရေးလုပ်ငန်းနှင့် နေ့စဉ်အလုပ်များအတွက် terminal AI အေးဂျင့် — မည်သည့် model နှင့်မဆို။",
      en: "A terminal agent for coding, security work and everyday tasks, with any model behind it.",
    },
    about: {
      my: "ပရောဂျက်ထဲတွင် တိုက်ရိုက် အလုပ်လုပ်သော command-line အေးဂျင့်။ ကုဒ်ကို ဖတ်၊ အစီအစဉ်ချ၊ ကိရိယာများ သုံးပြီး အန္တရာယ်ရှိနိုင်သည့်အရာ မလုပ်မီ မေးသည်။ Model ကို ကိုယ်တိုင်ရွေးနိုင်သည် — Ollama ဖြင့် စက်ထဲတွင်၊ သို့မဟုတ် OpenAI၊ Anthropic၊ DeepSeek၊ OpenRouter တို့မှ။ Session များကို သိမ်းပြီး နောက်မှ ဆက်လုပ်နိုင်သည်။ ပရောဂျက်အကြောင်း သင်ယူထားသည်များကို မှတ်ထားသော memory နှင့် ဖတ်ရုံသာ လုပ်သည့် plan mode ပါဝင်သည်။",
      en: "A command-line agent that works inside your project: it reads the code, plans, runs tools and asks before anything risky. The model is yours to choose, local through Ollama or hosted through OpenAI, Anthropic, DeepSeek or OpenRouter, and sessions can be saved and picked up later. Optional layered memory keeps what it learned about a project, and a plan mode works read-only.",
    },
    standing: {
      my: "ဗားရှင်း 1.2 ကို ကိုယ်တိုင် နေ့စဉ် သုံးနေသည်။ တပ်ဆင်ရန် package ကို မကြာမီ ထည့်ပါမည်။",
      en: "Version 1.2 runs daily as my own tool. A package to install is coming.",
    },
    mode: "soon",
    stack: ["Python", "LLM agents", "Ollama"],
    shot: "cortex",
    art: "lines",
  },
  {
    // Browser 3D editor (React + three.js) with a Django API for accounts.
    id: "artcodex",
    code: "BL-004",
    type: "app",
    category: "art",
    status: "live",
    role: "build",
    year: 2025,
    title: { my: "Artcodex", en: "Artcodex" },
    summary: {
      my: "ဘရောက်ဇာထဲမှ 3D တည်းဖြတ်ကိရိယာ — ပုံသဏ္ဌာန်များ၊ အသင့်သုံး material များ၊ အလင်းအမှန်၊ ပုံ သို့မဟုတ် .glb အဖြစ် ထုတ်ယူနိုင်သည်။",
      en: "A 3D editor in the browser: shapes, ready-made materials, real lighting, render to an image or a .glb.",
    },
    about: {
      my: "ဘာမှ တပ်ဆင်စရာမလိုဘဲ ဘရောက်ဇာထဲတွင် လည်ပတ်သော scene တည်းဖြတ်ကိရိယာ။ အခြေခံပုံများဖြင့် တည်ဆောက်ပါ သို့မဟုတ် .glb၊ .fbx၊ .obj model များ ထည့်သွင်းပါ။ Material ၂၄ မျိုး (ရွှေ၊ ဖန်၊ ကားဆေး၊ ကတ္တီပါ၊ နီယွန်) ကို အရာဝတ္ထုပေါ် တစ်ချက်နှိပ်ရုံ၊ studio သို့မဟုတ် HDR ပတ်ဝန်းကျင်ဖြင့် အလင်းပေး၊ glow၊ focus blur နှင့် vignette ကို ဖွင့်နိုင်သည်။ Scene များကို ဘရောက်ဇာထဲတွင် အလိုအလျောက် သိမ်းပြီး ပုံ သို့မဟုတ် Blender တွင် ဖွင့်နိုင်သော .glb အဖြစ် ထုတ်ယူနိုင်သည်။",
      en: "A scene editor that runs in the browser with nothing to install. Build from primitives or import .glb, .fbx and .obj models, drop one of 24 materials on an object (gold, glass, car paint, velvet, neon), light it with a studio or an HDR environment, and switch on glow, depth of field and vignette. Scenes autosave in the browser and export as an image or a .glb that opens in Blender.",
    },
    standing: {
      my: "အခမဲ့ editor အဖြစ် အလုပ်လုပ်နေသည်။ နောက်တစ်ဆင့် — scene များကို အကောင့်တွင် သိမ်းပြီး မျှဝေခြင်း၊ ထို့နောက် စာကြောင်းတစ်ကြောင်းဖြင့် scene ကို ပြင်ပေးသော AI co-builder။",
      en: "Working as a free editor. Next: saving scenes to an account and sharing them, then an AI co-builder that edits the scene from a sentence.",
    },
    mode: "link",
    target: "https://artcodex.vercel.app/",
    stack: ["React", "three.js", "Django"],
    shot: "artcodex",
    art: "orbits",
  },
];

export const byType = (t: ItemType) => catalog.filter((i) => i.type === t);

export const getItem = (id: string) => catalog.find((i) => i.id === id);

export function itemHref(item: CatalogItem, lang: Locale) {
  return item.mode === "native" && item.target
    ? `/${lang}/sims/${item.target}`
    : `/${lang}/catalog/${item.id}`;
}

/** Where the dossier for an item lives (native items have both a page and a dossier). */
export const dossierHref = (item: CatalogItem, lang: Locale) => `/${lang}/catalog/${item.id}`;
