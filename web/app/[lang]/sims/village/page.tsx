import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { getIndex, getStory } from "@/lib/village";
import EpisodeView from "@/components/village/EpisodeView";

export async function generateMetadata({ params }: PageProps<"/[lang]/sims/village">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const v = getDictionary(lang).village;
  return { title: v.title, description: v.lead };
}

/** The latest episode of The Village. */
export default async function VillagePage({ params }: PageProps<"/[lang]/sims/village">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const latest = getIndex().episodes.at(-1);
  const story = latest ? getStory(latest.episode) : null;
  if (!story) notFound();
  return <EpisodeView lang={lang} d={getDictionary(lang)} story={story} />;
}
