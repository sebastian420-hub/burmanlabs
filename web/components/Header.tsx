"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

interface Props {
  lang: Locale;
  name: string;
  home: string;
  links: { href: string; label: string }[];
  other: { label: string; aria: string };
}

export default function Header({ lang, name, home, links, other }: Props) {
  const pathname = usePathname() ?? `/${lang}`;
  const otherLang: Locale = lang === "my" ? "en" : "my";
  // Same page, other language.
  const switchHref = pathname.replace(/^\/(my|en)(?=\/|$)/, `/${otherLang}`);

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 sm:px-6">
        <Link href={`/${lang}`} aria-label={home} className="flex items-center gap-2">
          <Image src="/logo-mark.png" alt="" width={32} height={32} className="size-8" />
          <span className="text-lg font-bold">{name}</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm sm:gap-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-1.5 text-mist hover:bg-panel-2 hover:text-snow"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={switchHref}
            hrefLang={otherLang}
            lang={otherLang}
            aria-label={other.aria}
            onClick={() => {
              document.cookie = `lang=${otherLang}; path=/; max-age=31536000; samesite=lax`;
            }}
            className="rounded-lg border border-line px-3 py-1.5 font-medium text-ember hover:bg-panel-2"
          >
            {other.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
