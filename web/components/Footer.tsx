import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";

interface Props {
  lang: Locale;
  labels: { line: string; explore: string; contact: string; language: string };
  links: { href: string; label: string }[];
  email?: string;
}

export default function Footer({ lang, labels, links, email }: Props) {
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-line">
      <div className="mx-auto max-w-7xl px-5 pt-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <p className="max-w-xs text-ash">{labels.line}</p>
          <FooterCol title={labels.explore}>
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-bone">
                {l.label}
              </Link>
            ))}
          </FooterCol>
          <FooterCol title={labels.language}>
            <Link href="/my" lang="my" className={lang === "my" ? "text-bone" : "hover:text-bone"}>
              မြန်မာ
            </Link>
            <Link href="/en" lang="en" className={lang === "en" ? "text-bone" : "hover:text-bone"}>
              English
            </Link>
          </FooterCol>
          {email && (
            <FooterCol title={labels.contact}>
              <a href={`mailto:${email}`} className="break-all hover:text-bone">
                {email}
              </a>
            </FooterCol>
          )}
        </div>
      </div>

      {/* The original Burmanlabs wordmark, set large. */}
      <div className="mx-auto mt-20 max-w-7xl px-5 sm:px-8">
        <Image
          src="/brand/wordmark.webp"
          alt="Burman Labs"
          width={1100}
          height={490}
          sizes="(min-width: 1280px) 1200px, 100vw"
          className="mx-auto h-auto w-full max-w-5xl opacity-95"
        />
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-8 text-xs text-dim sm:px-8">
        <span>© {new Date().getFullYear()} Burmanlabs</span>
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
