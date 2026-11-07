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

/**
 * Topics shown as ONE expandable row in the index (they open in place to list their work).
 * A topic with a single piece is shown as a plain row.
 */
export const groupedCategories: CategoryId[] = ["education"];

/** Where it stands. Shown as a tag on cards and item pages. */
export type Status = "live" | "ongoing" | "learning";

/** My part in it. */
export type Role = "build" | "research" | "study";

/**
 * link   – opens the product's own site in a new tab
 * embed  – tap-to-load iframe (the product must allow framing)
 * native – a page inside this site, at /{lang}/sims/{slug}
 * soon    – real, but no public link yet
 * private – real and kept private: no link, and none promised
 */
export type LaunchMode = "link" | "embed" | "native" | "soon" | "private";

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
  /**
   * More pictures of the same thing, each in public/work/{shot}.webp (1600×1000) with a caption.
   * Shown under the main picture on its dossier, for work with more to show than one view.
   */
  gallery?: { shot: string; caption: L }[];
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
    // Browser 3D editor (React + three.js) with an AI co-builder; Django backend for AI relay, accounts and
    // cloud save. Copy is from the project's README and docs/STATUS.md (live site: the editor, AI with the
    // visitor's own key; cloud save and the connector wait for the hosted backend; check before editing).
    // Screenshots are of the current main branch; the scenes were built with the editor's own commands.
    id: "artcodex",
    code: "BL-004",
    type: "app",
    category: "art",
    status: "live",
    role: "build",
    year: 2025,
    title: { my: "Artcodex", en: "Artcodex" },
    summary: {
      my: "ဘရောက်ဇာထဲမှ 3D တည်းဖြတ်ကိရိယာ၊ AI ကူညီသူပါ — အခန်း၊ အိမ် သို့မဟုတ် ရှုခင်းတစ်ခုကို ဖော်ပြပါ၊ တည်ဆောက်သည်ကို ကြည့်ပါ၊ ထို့နောက် ထဲသို့ လျှောက်ဝင်ကြည့်ပါ။",
      en: "A 3D editor in the browser with an AI co-builder: describe a room, a house or a landscape, watch it get built, then walk through it.",
    },
    about: {
      my: "ဘာမှ တပ်ဆင်စရာမလိုပါ — လိုချင်တာကို ဖော်ပြလိုက်ရုံဖြင့် AI ကူညီသူက တည်းဖြတ်ကိရိယာ၏ ကိုယ်ပိုင်ကိရိယာများဖြင့် အဆင့်ဆင့် တည်ဆောက်ပေးသည်၊ တောင်းဆိုမှုတစ်ခုလျှင် undo တစ်ကြိမ်။ လက်ဖြင့်လည်း တည်ဆောက်နိုင်သည် — တံခါးနှင့် ပြတင်းပေါက်ပါသော အခန်းများ၊ အလွှာနှင့် လှေကားပါသော တိုက်ခန်းတစ်ခုလုံး၊ ချိန်ညှိနိုင်သော ပရိဘောဂ၊ တစ်ချက်နှိပ်ရုံ material ၃၄ မျိုး၊ ရေ၊ ကြီးထွားလာသော သစ်ပင်များနှင့် နေ့အချိန်အလိုက် ပြောင်းသော ကောင်းကင်ပါသည့် မြေပြင်။ ဘယ်အရာ မျောနေ၊ ထပ်နေ၊ တံခါးကို ပိတ်နေသည်ကို စစ်ဆေးကိရိယာက ပြောပြသည်။ Play ကိုနှိပ်၍ မြင်ကွင်းထဲတွင် ပထမလူအမြင်ဖြင့် တကယ့်တိုက်မိမှုများနှင့်အတူ လျှောက်ကြည့်နိုင်ပြီး behaviour နှင့် script များဖြင့် ဂိမ်းအဖြစ် ပြောင်းနိုင်သည်။ ပုံစံပြဇယား (SVG၊ PDF၊ DXF)၊ ray-traced render ပုံများနှင့် .glb ဖိုင်များအဖြစ် ထုတ်ယူနိုင်သည်။",
      en: "Nothing to install. Describe what you want and an AI co-builder builds it with the editor's own tools, step by step, one undo per request. Or build by hand: rooms with doors and windows, whole apartments with levels and stairs, furniture with settings, 34 one-click materials, and terrain with water, grown trees and a sky that follows the time of day. A checker tells you what floats, overlaps or blocks a door. Press Play and walk through the scene in first person with real collisions; behaviours and scripts turn it into a game. Drawings come out as plan sheets (SVG, PDF, DXF), pictures as path-traced renders, and scenes as .glb.",
    },
    standing: {
      my: "ဘရောက်ဇာထဲတွင် အခမဲ့ ဖွင့်ထားသည်။ AI ကူညီသူသည် သင့်ကိုယ်ပိုင် Anthropic key ဖြင့် အလုပ်လုပ်သည်။ cloud သိမ်းဆည်းမှု၊ မျှဝေလင့်ခ်များနှင့် Claude၊ ChatGPT၊ Cursor အတွက် ချိတ်ဆက်မှုတို့ ပြီးစီးပြီး backend ကို အွန်လိုင်းတင်ပြီးသည်နှင့် ဖွင့်ပါမည်။",
      en: "Live and free in the browser. The AI co-builder works with your own Anthropic key. Cloud save, share links and the connector for Claude, ChatGPT and Cursor are built and switch on when the backend is hosted.",
    },
    mode: "link",
    target: "https://artcodex.vercel.app/",
    stack: ["React", "three.js", "Django"],
    shot: "artcodex-cover",
    gallery: [
      { shot: "artcodex-atmosphere", caption: { my: "နေ၊ ကောင်းကင်နှင့် ရာသီဥတု တိုက်ရိုက်ထိန်းချုပ်မှုများ", en: "Live editor studio with atmospheric and lighting controls" } },
      { shot: "artcodex-lake-sunset", caption: { my: "ကန်စပ်နေဝင်ချိန်နှင့် ဆိပ်ခံတံတား ရှုခင်း", en: "Lakeside sunset and dock walkthrough" } },
      { shot: "artcodex-engineer-house", caption: { my: "ဗိသုကာအတွင်းပိုင်းနှင့် အဆင့်မြင့် အလင်းပြန်လက်ရာ", en: "Architectural interior and raytraced materials" } },
      { shot: "artcodex-art-pieces", caption: { my: "PBR Material များနှင့် 3D အနုပညာပုံသဏ္ဌာန်များ", en: "PBR materials and curated 3D art primitives" } },
    ],
    art: "orbits",
  },
  {
    // Interactive economics textbook (Astro + MDX + Svelte), in its own repo and site.
    // Chapter counts move: check the repo before quoting a number here.
    id: "economy-book",
    code: "BL-005",
    type: "learning",
    category: "education",
    status: "ongoing",
    role: "build",
    year: 2026, // confirm
    title: { my: "The Economy, From the Ground Up", en: "The Economy, From the Ground Up" },
    summary: {
      my: "အပြန်အလှန် ဆက်သွယ်နိုင်သော စီးပွားရေးဗေဒ ဖတ်စာအုပ် — ဦးစွာ ခန့်မှန်းပါ၊ ထို့နောက် မော်ဒယ်ဖြင့် ကစားကြည့်ပါ၊ နောက်ဆုံး အစစ်အမှန် ဒေတာနှင့် တိုက်ကြည့်ပါ။",
      en: "An interactive economics textbook: predict first, then play with the model, then check it against real data.",
    },
    about: {
      my: "ရှားပါးမှုနှင့် ဖလှယ်မှုမှ စတင်၍ စျေးကွက်များ၊ ဗျူဟာနှင့် နိုင်ငံ့စီးပွားရေးတစ်ခုလုံးအထိ သင်ပေးသော စာအုပ်။ အခန်းတိုင်းတွင် လှုပ်ရှားကြည့်နိုင်သော simulator များ ပါပြီး (လေးဆယ်ကျော်) တစ်ခုမကိုင်မီ ခန့်မှန်းချက်တစ်ခု ဦးစွာ ပေးရသည်။ စာထဲမှ မေးခွန်းများသည် သင့်ဘရောက်ဇာထဲရှိ spaced-repetition ကတ်များအဖြစ် ဝင်ပြီး မမေ့မီ ပြန်မေးပေးသည်။ ဇယားများကို အစစ်အမှန် ဒေတာဖြင့် ရင်းမြစ်နှင့် ရက်စွဲပြကာ ဆွဲထားပြီး အခန်းတိုင်းက ၎င်း၏ မော်ဒယ် ဘယ်နေရာတွင် မမှန်တော့သည်ကို ပြောပြသည်။ တစ်ကြိမ်ဖွင့်ပြီးလျှင် အင်တာနက်မရှိလည်း ဖတ်နိုင်သည်။",
      en: "A book that teaches economics from scarcity and exchange through markets, strategy and the economy as a whole. Every chapter has simulators you can move (more than forty so far), and each one asks you to commit to a prediction before you touch it. Prompts inside the text join a spaced-repetition deck that lives in your browser, charts are built from real data with the source and date shown, and every chapter says where its model breaks. After one visit it also reads offline.",
    },
    standing: {
      my: "ဖွင့်ထားပြီး အများရှေ့တွင် ဆက်ရေးနေသည် — စီစဉ်ထားသော အခန်းများ၏ တစ်ဝက်နီးပါး မူကြမ်း ရေးပြီးပြီ။ စာအုပ်သည် အင်္ဂလိပ်ဘာသာဖြင့်သာ ရှိသည်။",
      en: "Live and still being written in public: nearly half of the planned chapters are drafted. The book is in English only.",
    },
    mode: "link",
    target: "https://economy-from-the-ground-up.vercel.app/",
    stack: ["Astro", "Svelte", "TypeScript"],
    shot: "economy-book",
    art: "lines",
  },
  {
    // Three private repos: pia (agents, database, compose), pia-api (FastAPI), pia-ui (React + Cesium).
    // Facts are from their READMEs and docs/STATUS.md; the image is a diagram, not a screenshot
    // (PIA's data lives on the author's machine). The repos' own README names Myanmar as the
    // first focus; the public copy leaves the country out on purpose.
    id: "pia",
    code: "BL-006",
    type: "app",
    category: "ai",
    status: "ongoing",
    role: "build",
    year: 2026,
    title: { my: "PIA · Personal Intelligence Agency", en: "PIA · Personal Intelligence Agency" },
    summary: {
      my: "အများပြည်သူသိ အချက်အလက်များကို စုဆောင်း၍ လူပုဂ္ဂိုလ်၊ အဖွဲ့အစည်းနှင့် နေရာများအကြောင်း စစ်ဆေးပြီး အချက်များအဖြစ် ပြောင်းလဲကာ ၎င်းတို့ ဆက်စပ်ပုံကို ပြသည့် အချက်အလက် ပေါင်းစပ်ပလက်ဖောင်း။",
      en: "An intelligence platform for open sources: it collects public reports, turns them into checked facts about people, organisations and places, and shows how they connect.",
    },
    about: {
      my: "PIA သည် ဆော့ဖ်ဝဲထဲရှိ သတင်းထောက်လှမ်းရေး အဖွဲ့အစည်းတစ်ခုလို အလုပ်လုပ်သည်။ အေးဂျင့်တစ်ခုချင်းက အများပြည်သူသိ အချက်အလက်တစ်မျိုးစီကို စုဆောင်းသည် — အင်္ဂလိပ်နှင့် မြန်မာဘာသာ သတင်းများ၊ ပိတ်ဆို့အရေးယူစာရင်းများ၊ ကုမ္ပဏီမှတ်ပုံတင်များ၊ သဘာဝဘေးအန္တရာယ်ဒေတာ၊ ဂြိုဟ်တုများ၊ သင်္ဘောများ၊ လေယာဉ်များနှင့် ကင်မရာများ။ AI မော်ဒယ်တစ်ခုက ဆောင်းပါးတိုင်းကို ကိုးကားချက်အတိအကျပါသော ပြောဆိုချက်များအဖြစ် ပြောင်းပေးပြီး ဒုတိယ မော်ဒယ်က ကိုးကားချက်တစ်ခုချင်းကို ပြန်ဖတ်စစ်သည်။ အတည်ပြုပြီးသော ပြောဆိုချက်များကိုသာ ဘယ်သူက ဘယ်သူ့ကို ဘာလုပ်သည်၊ ဘယ်မှာ၊ ဘယ်အချိန်ဆိုသည့် ဆက်စပ်မှုကွန်ရက်အဖြစ် ချိတ်ဆက်သည်။ အချက်တိုင်းတွင် ကိုးကားချက်၊ ရင်းမြစ်နှင့် A မှ E အထိ အဆင့်သတ်မှတ်ချက် ပါသည်။ အချိန်ဘားပါသော 3D ကမ္ဘာလုံးမြေပုံနှင့် ကတ်များ၊ အချိန်စဉ်များ၊ အမှုများ ပါသော စားပွဲ (Desk) တို့ဖြင့် ပြသပြီး၊ အကူအညီပေးသူက ဝါကျတိုင်းကို အမှတ်စဉ်ပါ ရင်းမြစ်နှင့် ဖြေကြားသည်။",
      en: "PIA works like an intelligence agency in software. Separate agents each collect one kind of public data: news in English and Burmese, sanctions lists, company registers, hazard feeds, satellites, ships, planes and cameras. A model reads every article into claims with their exact quotes, and a second model re-reads each quote. Only confirmed claims join names into a web of who did what to whom, where and when. Every fact keeps its quote, its source and a source grade from A to E. A 3D globe with a time bar and a desk of cards, timelines and cases show it, and an assistant answers from the data with a numbered source for every sentence.",
    },
    standing: {
      my: "အလုပ်လုပ်သော စမ်းသပ်ပုံစံ (prototype) ဖြစ်ပြီး စက်တစ်လုံးတည်းတွင် စမ်းသပ်ကာလများအတွင်း လည်ပတ်ထားသည်။ အမြဲဖွင့်မထားသေးသလို မရောင်းချသေးပါ။ လောလောဆယ် အများသုံးရန် မဖွင့်ထားပါ။",
      en: "A working prototype, run for test windows on one machine. It is not always on yet and not for sale yet. It stays private for now.",
    },
    mode: "private",
    stack: ["Python", "PostgreSQL", "React", "Cesium"],
    shot: "pia-diagram",
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
