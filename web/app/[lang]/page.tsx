import Link from "next/link";
import { notFound } from "next/navigation";
import { catalog, itemHref } from "@/content/catalog";
import { getDictionary } from "@/lib/dictionaries";
import { hasLocale, num } from "@/lib/i18n";
import HeroGlobe from "@/components/HeroGlobe";
import SaveOffline from "@/components/SaveOffline";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);

  const count = (type: string) => catalog.filter((i) => i.type === type).length;
  const samples = catalog.filter((i) => i.sample).length;
  const categories = new Set(catalog.map((i) => i.category)).size;

  const heroItems = catalog.map((i) => ({
    id: i.id,
    type: i.type,
    title: i.title[lang],
    href: itemHref(i, lang),
    typeLabel: dict.type[i.type],
  }));

  const offlineUrls = [
    `/${lang}`,
    `/${lang}/catalog`,
    ...catalog.filter((i) => i.mode !== "soon").map((i) => itemHref(i, lang)),
  ];

  return (
    <>
      <section className="grid items-center gap-8 pt-8 md:grid-cols-2 md:gap-4 md:pt-14">
        <div>
          <h1 className="text-balance text-3xl font-bold sm:text-4xl lg:text-5xl">
            {dict.hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-mist">{dict.hero.sub}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={`/${lang}/catalog`}
              className="rounded-xl bg-ember px-6 py-3 font-bold text-ink hover:brightness-110"
            >
              {dict.hero.cta}
            </Link>
            <Link
              href={`/${lang}/sims/orbit`}
              className="rounded-xl border border-line px-6 py-3 font-medium hover:bg-panel-2"
            >
              {dict.hero.ctaSim}
            </Link>
          </div>
        </div>
        <HeroGlobe
          items={heroItems}
          labels={{
            aria: dict.hero.globeAria,
            off: dict.hero.globeOff,
            on: dict.hero.globeOn,
            hint: dict.hero.hint,
            open: dict.hero.open,
          }}
        />
      </section>

      <section className="mt-16" aria-label={dict.stats.items}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat big={num(catalog.length, lang)} label={dict.stats.items} accent />
          <Stat big={num(count("textbook"), lang)} label={dict.stats.textbooks} />
          <Stat big={num(count("app"), lang)} label={dict.stats.apps} />
          <Stat big={num(count("sim"), lang)} label={dict.stats.sims} />
        </div>
        <p className="mt-2 text-xs text-mist">
          {num(categories, lang)} {dict.stats.categories}
          {samples > 0 && ` · ${dict.stats.sample.replace("{n}", num(samples, lang))}`}
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold">{dict.value.title}</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {dict.value.items.map((v) => (
            <div key={v.t} className="rounded-2xl border border-line bg-panel p-5">
              <h3 className="font-bold text-ember">{v.t}</h3>
              <p className="mt-1 text-mist">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SaveOffline urls={offlineUrls} labels={dict.save} />
      </section>
    </>
  );
}

function Stat({ big, label, accent }: { big: string; label: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-panel p-4">
      <div className={`text-4xl font-bold ${accent ? "text-ember" : ""}`}>{big}</div>
      <div className="text-sm text-mist">{label}</div>
    </div>
  );
}
