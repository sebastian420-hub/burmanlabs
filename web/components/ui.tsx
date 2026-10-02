import Link from "next/link";

/** Small shared building blocks for the editorial layout. */

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function SectionHead({
  index,
  eyebrow,
  title,
  aside,
}: {
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="reveal mb-10 grid gap-6 border-t border-line pt-6 md:mb-14 md:grid-cols-12">
      <p className="eyebrow num md:col-span-3">
        <span className="text-signal">({index})</span>&nbsp;&nbsp;{eyebrow}
      </p>
      <h2 className="display t-section md:col-span-6">{title}</h2>
      {aside && <div className="self-end md:col-span-3 md:text-right">{aside}</div>}
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "solid",
  external,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "ghost";
  external?: boolean;
}) {
  const cls =
    variant === "solid"
      ? "bg-bone text-ink hover:bg-white"
      : "border border-line-2 text-bone hover:border-bone/60";
  const inner = (
    <>
      {children}
      <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">
        {external ? "↗" : "→"}
      </span>
    </>
  );
  const className = `group inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-medium transition ${cls}`;
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

export function Tag({ children, tone }: { children: React.ReactNode; tone?: "signal" | "gold" }) {
  const cls =
    tone === "signal"
      ? "border-signal/40 text-signal"
      : tone === "gold"
        ? "border-gold/40 text-gold"
        : "border-line-2 text-ash";
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs ${cls}`}>{children}</span>;
}
