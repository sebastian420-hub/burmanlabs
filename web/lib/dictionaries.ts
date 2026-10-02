import my from "@/dictionaries/my";
import en from "@/dictionaries/en";
import type { Locale } from "./i18n";

const dictionaries = { my, en } satisfies Record<Locale, typeof my>;

export type Dict = typeof my;
export const getDictionary = (lang: Locale): Dict => dictionaries[lang];
