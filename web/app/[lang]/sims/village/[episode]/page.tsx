import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { getIndex, getStory } from "@/lib/village";
import EpisodeView from "@/components/village/EpisodeView";

/** One page per published episode; anything else is a 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return getIndex().episodes.map((e) => ({ episode: String(e.episode) }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/sims/village/[episode]">): Promise<Metadata> {
  const { lang, episode } = await params;
  if (!hasLocale(lang)) return {};
  const story = getStory(Number(episode));
  const v = getDictionary(lang).village;
  return { title: story ? `${story.title} · ${v.title}` : v.title, description: story?.summary };
}

export default async function EpisodePage({ params }: PageProps<"/[lang]/sims/village/[episode]">) {
  const { lang, episode } = await params;
  if (!hasLocale(lang)) notFound();
  const story = getStory(Number(episode));
  if (!story) notFound();
  return <EpisodeView lang={lang} d={getDictionary(lang)} story={story} />;
}
