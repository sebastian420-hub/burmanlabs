import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPiece, pieces } from "@/content/studio";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale, locales } from "@/lib/i18n";
import ArtStage from "@/components/ArtStage";
import { Container } from "@/components/ui";

export function generateStaticParams() {
  return locales.flatMap((lang) => pieces.map((p) => ({ lang, id: p.id })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/studio/[id]">): Promise<Metadata> {
  const { lang, id } = await params;
  const p = getPiece(id);
  return {
    title: p && hasLocale(lang) ? p.title[lang] : undefined,
    description: p && hasLocale(lang) ? p.about[lang] : undefined,
  };
}

export default async function PiecePage({ params }: PageProps<"/[lang]/studio/[id]">) {
  const { lang, id } = await params;
  if (!hasLocale(lang)) notFound();
  const piece = getPiece(id);
  if (!piece) notFound();
  const { studio } = getDictionary(lang);
  const index = pieces.indexOf(piece);
  const next = pieces[(index + 1) % pieces.length];

  return (
    <article>
      <div className="relative h-[72svh] min-h-[420px] w-full border-b border-line sm:h-[82svh]">
        <ArtStage
          id={piece.id}
          title={piece.title[lang]}
          webgl={piece.webgl}
          labels={{ play: studio.play, playNote: studio.playNote }}
        />
      </div>

      <Container className="mt-10">
        <div className="flex items-center justify-between text-sm">
          <Link href={`/${lang}/studio`} className="text-ash transition hover:text-bone">
            ← {studio.back}
          </Link>
          <span className="eyebrow num">
            {String(index + 1).padStart(2, "0")} / {String(pieces.length).padStart(2, "0")}
          </span>
        </div>

        <div className="mt-10 grid gap-10 border-t border-line pt-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <h1 className="display text-6xl sm:text-7xl">{piece.title[lang]}</h1>
            <p className="mt-4 text-sm text-dim">{piece.medium[lang]}</p>
          </div>
          <div className="space-y-8 md:col-span-6 md:col-start-7">
            <p className="text-lg text-bone/90">{piece.about[lang]}</p>
            <dl className="grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
              <div>
                <dt className="eyebrow">{studio.interact}</dt>
                <dd className="mt-2 text-ash">{piece.interact[lang]}</dd>
              </div>
              <div>
                <dt className="eyebrow">{studio.source}</dt>
                <dd className="mt-2 font-mono text-sm text-ash">Portfolio/{piece.source}</dd>
              </div>
            </dl>
          </div>
        </div>

        <Link
          href={`/${lang}/studio/${next.id}`}
          className="group mt-20 flex items-baseline justify-between gap-6 border-y border-line py-8"
        >
          <span className="eyebrow">{studio.next}</span>
          <span className="display text-4xl transition-colors group-hover:text-signal sm:text-5xl">
            {next.title[lang]} <span aria-hidden>→</span>
          </span>
        </Link>
      </Container>
    </article>
  );
}
