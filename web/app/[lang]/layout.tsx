import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import "../globals.css";
import { hasLocale, locales } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionaries";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SWRegister from "@/components/SWRegister";
import { site } from "@/lib/site";

export const viewport: Viewport = {
  themeColor: "#0b0a09",
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: { default: dict.site.name, template: `%s · ${dict.site.name}` },
    description: dict.site.description,
    applicationName: dict.site.name,
    icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
    alternates: { languages: { my: "/my", en: "/en" } },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = getDictionary(lang);
  // Start font downloads with the HTML instead of after CSS and layout. Burmese is
  // preloaded on English pages too: the language switch and footer use it, and
  // nearly every visitor reads Burmese anyway.
  preload("/fonts/noto-myanmar-400.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  preload("/fonts/inter-tight-var.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  const links = [
    { href: `/${lang}/catalog`, label: dict.nav.catalog },
    { href: `/${lang}/studio`, label: dict.nav.studio },
    { href: `/${lang}#about`, label: dict.nav.about },
  ];

  return (
    <html lang={lang}>
      <body>
        <Header
          lang={lang}
          name={dict.site.name}
          home={dict.nav.home}
          links={links}
          other={{ label: dict.lang.other, aria: dict.lang.otherLabel }}
        />
        <main className="pt-16">{children}</main>
        <Footer lang={lang} labels={dict.footer} links={links} email={site.email} />
        <SWRegister />
      </body>
    </html>
  );
}
