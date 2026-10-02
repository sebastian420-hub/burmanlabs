import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { site } from "@/lib/site";
import { ButtonLink, Container } from "@/components/ui";

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

  return (
    <Container className="pt-16">
      <h1 className="display t-hero intro max-w-4xl">{request.title}</h1>
      <p className="intro-2 mt-6 max-w-xl text-lg text-ash">{request.lead}</p>
      <div className="intro-3 mt-10">
        {site.requestUrl ? (
          <ButtonLink href={site.requestUrl} external>
            {request.cta}
          </ButtonLink>
        ) : (
          <p className="text-dim">{request.unset}</p>
        )}
      </div>
    </Container>
  );
}
