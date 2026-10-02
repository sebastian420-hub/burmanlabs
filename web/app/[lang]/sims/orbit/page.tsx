import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale } from "@/lib/i18n";
import SimLauncher from "@/components/SimLauncher";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/sims/orbit">): Promise<Metadata> {
  const { lang } = await params;
  return { title: hasLocale(lang) ? getDictionary(lang).sim.orbitTitle : undefined };
}

export default async function OrbitPage({ params }: PageProps<"/[lang]/sims/orbit">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { sim, item } = getDictionary(lang);

  return (
    <div className="pt-8">
      <Link href={`/${lang}/catalog`} className="text-sm text-mist hover:text-snow">
        ← {item.back}
      </Link>
      <h1 className="mt-6 text-3xl font-bold">{sim.orbitTitle}</h1>
      <p className="mt-2 mb-6 max-w-2xl text-lg text-mist">{sim.orbitLead}</p>
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
    </div>
  );
}
