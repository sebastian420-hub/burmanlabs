import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import "../globals.css";
import { hasLocale, locales } from "@/lib/i18n";
import { getDictionary } from "@/lib/dictionaries";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SWRegister from "@/components/SWRegister";

export const viewport: Viewport = {
  themeColor: "#060a13",
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
  // Start the Burmese font download with the HTML instead of after the CSS is parsed.
  if (lang === "my") {
    preload("/fonts/noto-myanmar-400.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  }
  const requestUrl = process.env.NEXT_PUBLIC_REQUEST_URL;

  return (
    <html lang={lang}>
      <body>
        <Header
          lang={lang}
          name={dict.site.name}
          home={dict.nav.home}
          links={[
            { href: `/${lang}/catalog`, label: dict.nav.catalog },
            ...(requestUrl ? [{ href: `/${lang}/request`, label: dict.nav.request }] : []),
          ]}
          other={{ label: dict.lang.other, aria: dict.lang.otherLabel }}
        />
        <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">{children}</main>
        <Footer line={dict.footer.line} />
        <SWRegister />
      </body>
    </html>
  );
}
