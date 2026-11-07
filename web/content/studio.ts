import type { Locale } from "@/lib/i18n";

type L = Record<Locale, string>;

export type PieceId = "quantum" | "pulse" | "mandalay" | "binary";

export interface Piece {
  id: PieceId;
  title: L;
  medium: L;
  about: L;
  interact: L;
  /** File in Portfolio/ this was ported from. */
  source: string;
  /** Needs the three.js chunk (~140 KB). */
  webgl: boolean;
}

/** Artworks from the original Burmanlabs portfolio, ported to run natively here. */
export const pieces: Piece[] = [
  {
    id: "quantum",
    title: { en: "Quantum", my: "ကွမ်တမ်" },
    medium: { en: "WebGL · from p5.js", my: "WebGL · p5.js မှ" },
    about: {
      en: "The opening piece of the original Burmanlabs portfolio. Rings of light spin around a pulsing core, their strokes flickering through random reds every frame.",
      my: "မူလ Burmanlabs portfolio ၏ အဖွင့်လက်ရာ။ အလင်းကွင်းများသည် တုန်ခါနေသော ဗဟိုကို လှည့်ပတ်နေပြီး ဘောင်တိုင်းတွင် အနီရောင် အမျိုးမျိုး တဖျတ်ဖျတ် ပြောင်းလဲနေသည်။",
    },
    interact: {
      en: "Press and hold: the inner rings grow further before they collapse.",
      my: "ဖိထားပါ — အတွင်းကွင်းများ ပြိုမကျမီ ပိုကြီးထွားလာမည်။",
    },
    source: "atomsketch.js",
    webgl: true,
  },
  {
    id: "pulse",
    title: { en: "Pulse", my: "သွေးခုန်သံ" },
    medium: { en: "three.js · generative lines", my: "three.js · ထုတ်လုပ်ထားသော လိုင်းများ" },
    about: {
      en: "Thirty-five ovals drawn as a single unbroken line, breathing in and out on two waves while the colour drifts through the whole spectrum.",
      my: "ဘဲဥပုံ ၃၅ ခုကို မပြတ်သော လိုင်းတစ်ကြောင်းတည်းဖြင့် ဆွဲထားသည်။ လှိုင်းနှစ်ခုဖြင့် အသက်ရှူသလို ကျယ်လိုက် ကျုံ့လိုက် ဖြစ်နေပြီး အရောင်များ တဖြည်းဖြည်း ပြောင်းလဲနေသည်။",
    },
    interact: {
      en: "Tap to cycle through the original presets: Classic, Dynamic, Chaos.",
      my: "ထိလိုက်လျှင် မူလ ပုံစံများ — Classic၊ Dynamic၊ Chaos — ကို ပြောင်းမည်။",
    },
    source: "x7.html",
    webgl: true,
  },
  {
    id: "mandalay",
    title: { en: "Mandalay Palace", my: "မန္တလေး နန်းတော်" },
    medium: { en: "Canvas · from p5.js", my: "Canvas · p5.js မှ" },
    about: {
      en: "The palace in Mandalay, the artist's home city, drawn in flat shapes. The sun circles the palace; every full turn swaps day for night.",
      my: "အနုပညာရှင်၏ မွေးရပ်မြေ မန္တလေးမြို့ရှိ နန်းတော်ကို ရိုးရှင်းသော ပုံသဏ္ဌာန်များဖြင့် ရေးဆွဲထားသည်။ နေသည် နန်းတော်ကို လှည့်ပတ်နေပြီး တစ်ပတ်ပြည့်တိုင်း နေ့နှင့် ည ပြောင်းသည်။",
    },
    interact: {
      en: "Move across the drawing to change the speed. Tap to open the gates.",
      my: "ပုံပေါ်တွင် ဘေးတိုက် ရွှေ့ပြီး အမြန်နှုန်း ပြောင်းပါ။ ထိလိုက်လျှင် တံခါးများ ပွင့်မည်။",
    },
    source: "mandalay.js",
    webgl: false,
  },
  {
    id: "binary",
    title: { en: "Binary Rain", my: "ဘိုင်နရီ မိုး" },
    medium: { en: "Canvas · from p5.js", my: "Canvas · p5.js မှ" },
    about: {
      en: "Ones and zeros falling through a field of red: the inner core of everything on this site.",
      my: "အနီရောင် ကွင်းပြင်ထဲသို့ ၁ နှင့် ၀ များ ကျဆင်းနေသည် — ဤဆိုက်ရှိ အရာအားလုံး၏ အတွင်းအမာခံ။",
    },
    interact: {
      en: "Tap to switch between the slow and fast rain.",
      my: "ထိလိုက်လျှင် မိုးနှေးနှင့် မိုးမြန် ပြောင်းမည်။",
    },
    source: "one.js",
    webgl: false,
  },
];

export const getPiece = (id: string) => pieces.find((p) => p.id === id);
