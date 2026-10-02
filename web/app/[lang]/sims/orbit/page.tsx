import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale } from "@/lib/i18n";
import SimLauncher from "@/components/SimLauncher";
import { Container, Tag } from "@/components/ui";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/sims/orbit">): Promise<Metadata> {
  const { lang } = await params;
  return { title: hasLocale(lang) ? getDictionary(lang).sim.orbitTitle : undefined };
}

export default async function OrbitPage({ params }: PageProps<"/[lang]/sims/orbit">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { sim, item, type, categories } = getDictionary(lang);

  return (
    <Container className="pt-10">
      <Link href={`/${lang}/catalog`} className="text-sm text-ash transition hover:text-bone">
        ← {item.back}
      </Link>
      <div className="mt-8 grid gap-6 pb-10 md:grid-cols-12 md:items-end">
        <div className="md:col-span-7">
          <div className="flex flex-wrap gap-2">
            <Tag>{type.sim}</Tag>
            <Tag>{categories.science}</Tag>
            <Tag tone="gold">{item.offline}</Tag>
          </div>
          <h1 className="display intro mt-5 text-5xl sm:text-7xl">{sim.orbitTitle}</h1>
        </div>
        <p className="intro-2 text-lg text-ash md:col-span-5">{sim.orbitLead}</p>
      </div>
      <SimLauncher
        lang={lang}
        start={sim.start}
        note={sim.startNote}
        labels={{
          pause: sim.pause,
          play: sim.play,
          restart: sim.restart,
          speed: sim.speed,
          distance: sim.distance,
          speedHint: sim.speedHint,
          result: sim.result,
          circle: sim.circle,
          ellipse: sim.ellipse,
          escape: sim.escape,
          ecc: sim.ecc,
          period: sim.period,
          units: sim.units,
          webgl: sim.webgl,
          crashed: sim.crashed,
          lost: sim.lost,
        }}
      />
    </Container>
  );
}
