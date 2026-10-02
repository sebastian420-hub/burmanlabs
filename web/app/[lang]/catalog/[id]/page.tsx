import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalog, getItem } from "@/content/catalog";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale, locales, num } from "@/lib/i18n";
import EmbedFrame from "@/components/EmbedFrame";

export function generateStaticParams() {
  return locales.flatMap((lang) => catalog.map((i) => ({ lang, id: i.id })));
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/catalog/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  const item = getItem(id);
  return { title: item && hasLocale(lang) ? item.title[lang] : undefined };
}

export default async function ItemPage({ params }: PageProps<"/[lang]/catalog/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const item = getItem(id);
  if (!item) notFound();
  const dict = getDictionary(lang);

  const buttonCls =
    "inline-block rounded-xl bg-ember px-6 py-3 font-bold text-ink hover:brightness-110";

  return (
    <article className="pt-8">
      <Link href={`/${lang}/catalog`} className="text-sm text-mist hover:text-snow">
        ← {dict.item.back}
      </Link>

      <p className="mt-6 text-sm text-mist">
        {dict.type[item.type]} · {dict.categories[item.category]}
      </p>
      <h1 className="mt-1 text-3xl font-bold">{item.title[lang]}</h1>
      <p className="mt-3 max-w-2xl text-lg text-mist">{item.summary[lang]}</p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {item.offline && (
          <span className="rounded-md border border-jade/40 px-2 py-0.5 text-jade">
            {dict.item.offline}
          </span>
        )}
        {item.sizeMB && (
          <span className="rounded-md border border-line px-2 py-0.5 text-mist">
            {dict.item.size} ~{num(item.sizeMB, lang)} MB
          </span>
        )}
        {item.sample && (
          <span className="rounded-md border border-ember/40 px-2 py-0.5 text-ember">
            {dict.item.sample}
          </span>
        )}
      </div>

      <div className="mt-8">
        {item.mode === "link" && item.target && (
          <a href={item.target} target="_blank" rel="noopener noreferrer" className={buttonCls}>
            {dict.item.openNew} ↗
          </a>
        )}
        {item.mode === "embed" && item.target && (
          <EmbedFrame
            url={item.target}
            title={item.title[lang]}
            labels={{ load: dict.item.loadEmbed, note: dict.item.embedNote }}
          />
        )}
        {item.mode === "native" && item.target && (
          <Link href={`/${lang}/sims/${item.target}`} className={buttonCls}>
            {dict.item.open}
          </Link>
        )}
        {item.mode === "soon" && (
          <span className="inline-block rounded-xl border border-line px-6 py-3 text-mist">
            {dict.item.soon}
          </span>
        )}
      </div>
    </article>
  );
}
