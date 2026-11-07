import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pieces } from "@/content/studio";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale } from "@/lib/i18n";
import { Container, SectionHead } from "@/components/ui";

export async function generateMetadata({ params }: PageProps<"/[lang]/studio">): Promise<Metadata> {
  const { lang } = await params;
  return { title: hasLocale(lang) ? getDictionary(lang).studio.eyebrow : undefined };
}

export default async function StudioPage({ params }: PageProps<"/[lang]/studio">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { studio } = getDictionary(lang);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-black">
        <Container className="flex min-h-[70svh] flex-col justify-center py-20 text-center">
          <p className="eyebrow intro">{studio.eyebrow}</p>
          <Image
            src="/brand/burmanlabs-wordmark.webp"
            alt="Burman Labs"
            width={900}
            height={401}
            priority
            sizes="(min-width: 640px) 420px, 260px"
            className="intro-2 mx-auto mt-8 h-auto w-[260px] sm:w-[420px]"
          />
          <h1 className="display intro-3 mx-auto mt-10 max-w-3xl text-3xl sm:text-5xl">{studio.title}</h1>
          <p className="intro-3 mx-auto mt-6 max-w-xl text-ash">{studio.artist}</p>
        </Container>
      </section>

      <Container className="mt-24">
        <SectionHead
          index="01"
          eyebrow={studio.eyebrow}
          title={studio.pieces}
          aside={<p className="text-sm text-ash">{studio.lead}</p>}
        />
        <div className="grid gap-x-6 gap-y-14 md:grid-cols-2">
          {pieces.map((p, i) => (
            <Link key={p.id} href={`/${lang}/studio/${p.id}`} className="reveal group block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-line bg-black">
                <Image
                  src={`/studio/${p.id}.webp`}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-baseline gap-4">
                <span className="eyebrow num">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="display text-4xl transition-colors group-hover:text-signal">{p.title[lang]}</h2>
                <span className="text-xs text-dim">{p.medium[lang]}</span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
