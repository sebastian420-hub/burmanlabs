"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import type { Locale } from "@/lib/i18n";
import { useAdmin } from "@/components/admin";
import { getStoredAdminToken, isLocalTokenValid } from "@/lib/adminClient";

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

  const { setLoginModalOpen, isAdmin, openManager } = useAdmin();
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);

  function triggerAdmin() {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([30, 40, 30]);
      } catch {
        // ignore
      }
    }

    const hasValidToken = isLocalTokenValid(getStoredAdminToken());

    if (isAdmin || hasValidToken) {
      openManager();
    } else {
      setLoginModalOpen(true);
    }
  }

  function handleLogoClick(e: React.MouseEvent) {
    const now = Date.now();
    const elapsed = now - lastTapRef.current;
    lastTapRef.current = now;

    if (elapsed < 550) {
      tapCountRef.current += 1;
      e.preventDefault();
      e.stopPropagation();

      if (tapCountRef.current >= 3) {
        tapCountRef.current = 0;
        lastTapRef.current = 0;
        triggerAdmin();
      }
    } else {
      tapCountRef.current = 1;
    }
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 isolate pt-[env(safe-area-inset-top,0px)] [transform:translateZ(0)] [-webkit-transform:translateZ(0)] will-change-transform transition-colors duration-500 ${
        scrolled
          ? "border-b border-line/80 bg-ink/75 backdrop-blur-md"
          : "border-b border-line/40 bg-ink/60 backdrop-blur-md sm:border-transparent sm:bg-transparent sm:backdrop-blur-none"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 pl-[max(1.25rem,env(safe-area-inset-left,0px))] pr-[max(1.25rem,env(safe-area-inset-right,0px))] sm:px-8">
        <Link
          href={`/${lang}`}
          aria-label={home}
          onClick={handleLogoClick}
          className="group flex items-center gap-2.5 select-none touch-manipulation cursor-pointer"
        >
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
