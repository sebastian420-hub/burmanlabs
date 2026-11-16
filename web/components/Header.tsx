"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import type { Locale } from "@/lib/i18n";
import { useAdmin } from "@/components/admin";

interface Props {
  lang: Locale;
  name: string;
  home: string;
  links: { href: string; label: string }[];
  other: { label: string; aria: string };
}

export default function Header({ lang, name, home, links, other }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? `/${lang}`;
  const otherLang: Locale = lang === "my" ? "en" : "my";
  const switchHref = pathname.replace(/^\/(my|en)(?=\/|$)/, `/${otherLang}`);
  const [scrolled, setScrolled] = useState(false);

  const { setLoginModalOpen, isAdmin, openManager } = useAdmin();
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isGestureActiveRef = useRef(false);

  function triggerAdmin() {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([30, 40, 30]);
      } catch {
        // ignore
      }
    }
    if (isAdmin) {
      openManager();
    } else {
      setLoginModalOpen(true);
    }
  }

  function handleLogoClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (isGestureActiveRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isGestureActiveRef.current = false;
      return;
    }

    const now = Date.now();
    const isRapid = now - lastTapRef.current < 450;
    lastTapRef.current = now;

    if (isRapid) {
      // 2nd or subsequent rapid tap: prevent navigation so user can finish triple-tap
      e.preventDefault();
      e.stopPropagation();
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      tapCountRef.current += 1;
      if (tapCountRef.current >= 3) {
        tapCountRef.current = 0;
        triggerAdmin();
      }
    } else {
      // 1st tap: start counter and delay navigation briefly (280ms) to allow multi-tap detection
      tapCountRef.current = 1;
      e.preventDefault();
      e.stopPropagation();
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      clickTimerRef.current = setTimeout(() => {
        if (tapCountRef.current === 1) {
          tapCountRef.current = 0;
          if (pathname === `/${lang}`) {
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            router.push(`/${lang}`);
          }
        }
      }, 280);
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    isGestureActiveRef.current = false;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    // 650ms long press: triggers admin mode with haptic feedback
    longPressTimerRef.current = setTimeout(() => {
      isGestureActiveRef.current = true;
      triggerAdmin();
    }, 650);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!touchStartPosRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
    // Finger dragged > 10px: cancel long press (user is scrolling)
    if (dx > 10 || dy > 10) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
  }

  function handleTouchEnd() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onContextMenu={(e) => {
            if (isGestureActiveRef.current) e.preventDefault();
          }}
          draggable={false}
          className="group flex items-center gap-2.5 select-none touch-manipulation [-webkit-touch-callout:none]"
        >
          <Image
            src="/brand/mark.png"
            alt=""
            width={34}
            height={34}
            priority
            draggable={false}
            className="size-[34px] transition-transform duration-500 group-hover:-rotate-6 pointer-events-none select-none"
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
