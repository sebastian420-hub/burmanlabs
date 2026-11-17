"use client";

import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { useAdmin } from "@/components/admin";
import { getStoredAdminToken, isLocalTokenValid } from "@/lib/adminClient";

interface Props {
  lang: Locale;
  labels: { line: string; explore: string; contact: string; language: string };
  links: { href: string; label: string }[];
  email?: string;
}

export default function Footer({ lang, labels, links, email }: Props) {
  const { setLoginModalOpen, isAdmin, openManager } = useAdmin();

  return (
    <footer className="relative mt-20 sm:mt-32 overflow-hidden border-t border-line bg-ink">
      <div className="mx-auto max-w-7xl px-5 pt-10 sm:pt-16 sm:px-8">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-12">
          {/* Lab intro */}
          <div className="space-y-2 max-w-sm">
            <p className="text-sm sm:text-base text-ash leading-relaxed">
              {labels.line}
            </p>
          </div>

          {/* 2-column on mobile, inline on desktop */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:contents">
            <FooterCol title={labels.explore}>
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="hover:text-bone transition-colors py-0.5">
                  {l.label}
                </Link>
              ))}
            </FooterCol>

            <FooterCol title={labels.language}>
              <Link href="/my" lang="my" className={`py-0.5 transition-colors ${lang === "my" ? "text-bone font-medium" : "text-ash hover:text-bone"}`}>
                မြန်မာ
              </Link>
              <Link href="/en" lang="en" className={`py-0.5 transition-colors ${lang === "en" ? "text-bone font-medium" : "text-ash hover:text-bone"}`}>
                English
              </Link>
            </FooterCol>
          </div>

          {email && (
            <FooterCol title={labels.contact}>
              <a href={`mailto:${email}`} className="break-all text-ash hover:text-bone transition-colors py-0.5">
                {email}
              </a>
            </FooterCol>
          )}
        </div>
      </div>

      {/* The original Burmanlabs wordmark. */}
      <div className="mx-auto mt-10 sm:mt-16 max-w-7xl border-t border-line/60 px-5 pt-8 sm:pt-14 sm:px-8">
        <Image
          src="/brand/burmanlabs-wordmark.webp"
          alt="Burman Labs"
          width={900}
          height={401}
          sizes="(min-width: 640px) 280px, 180px"
          className="mx-auto h-auto w-[180px] opacity-90 sm:w-[280px]"
        />
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] text-xs text-dim sm:px-8">
        <button
          type="button"
          onClick={() => {
            const hasValidToken = isLocalTokenValid(getStoredAdminToken());

            if (isAdmin || hasValidToken) {
              openManager();
            } else {
              setLoginModalOpen(true);
            }
          }}
          className="text-left text-dim hover:text-ash transition-colors cursor-default select-none"
          title="Burmanlabs"
        >
          © {new Date().getFullYear()} Burmanlabs
        </button>
        <span className="eyebrow !text-dim">Mandalay · Myanmar</span>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="eyebrow mb-4">{title}</p>
      <div className="flex flex-col gap-2 text-sm text-ash">{children}</div>
    </div>
  );
}
