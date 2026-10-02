import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/request">): Promise<Metadata> {
  const { lang } = await params;
  return { title: hasLocale(lang) ? getDictionary(lang).request.title : undefined };
}

/**
 * Where users say what problem they need solved. Set NEXT_PUBLIC_REQUEST_URL to a
 * Messenger / Telegram / Viber / form link. (The nav link is hidden until it is set.)
 */
export default async function RequestPage({ params }: PageProps<"/[lang]/request">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { request } = getDictionary(lang);
  const url = process.env.NEXT_PUBLIC_REQUEST_URL;

  return (
    <div className="pt-8">
      <h1 className="text-3xl font-bold">{request.title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-mist">{request.lead}</p>
      <div className="mt-8">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-xl bg-ember px-6 py-3 font-bold text-ink hover:brightness-110"
          >
            {request.cta} ↗
          </a>
        ) : (
          <p className="text-mist">{request.unset}</p>
        )}
      </div>
    </div>
  );
}
