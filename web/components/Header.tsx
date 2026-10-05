"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  const switchHref = pathname.replace(/^\/(my|en)(?=\/|$)/, `/${otherLang}`);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
        scrolled ? "border-b border-line/80 bg-ink/75 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 sm:px-8">
        <Link href={`/${lang}`} aria-label={home} className="group flex items-center gap-2.5">
          <Image
            src="/brand/mark.png"
            alt=""
            width={34}
            height={34}
            priority
            className="size-[34px] transition-transform duration-500 group-hover:-rotate-6"
          />
          <span className="hidden text-[15px] font-semibold tracking-tight min-[400px]:inline">{name}</span>
        </Link>

        <nav className="ml-auto flex items-center gap-0.5 text-sm whitespace-nowrap sm:gap-1">
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`relative rounded-full px-2 py-1.5 transition-colors sm:px-3 ${
                  active ? "text-bone" : "text-ash hover:text-bone"
                }`}
              >
                {l.label}
                {active && <span className="absolute inset-x-2 -bottom-0.5 h-px bg-signal sm:inset-x-3" />}
              </Link>
            );
          })}
          <Link
            href={switchHref}
            hrefLang={otherLang}
            lang={otherLang}
            aria-label={other.aria}
            onClick={() => {
              document.cookie = `lang=${otherLang}; path=/; max-age=31536000; samesite=lax`;
            }}
            className="ml-1 rounded-full border border-line-2 px-3 py-1 text-[13px] text-bone transition hover:border-bone/60"
          >
            {other.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
