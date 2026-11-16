import my from "@/dictionaries/my.json";
import en from "@/dictionaries/en.json";
import type { Locale } from "./i18n";
import type { Dict } from "./types";

export type { Dict } from "./types";

const dictionaries: Record<Locale, Dict> = { my, en };

export const getDictionary = (lang: Locale): Dict => dictionaries[lang];
