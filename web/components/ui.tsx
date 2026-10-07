import Link from "next/link";

/** Small shared building blocks for the editorial layout. */

export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

/** A section head: hairline, designation + eyebrow in mono, serif title, optional aside. */
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
    <div className="reveal mb-6 grid gap-3 border-t border-line pt-4 md:mb-8 md:grid-cols-12 md:gap-6">
      <p className="mono text-dim md:col-span-3">
        <span className="text-signal">{index}</span>
        <span className="mx-2 text-line-2">/</span>
        {eyebrow}
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
  small,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "ghost";
  external?: boolean;
  small?: boolean;
}) {
  const cls =
    variant === "solid"
      ? "bg-bone text-ink hover:bg-white"
      : "border border-line-2 text-bone hover:border-bone/60";
  const size = small ? "px-4 py-2 text-sm" : "px-6 py-3 text-[15px]";
  const inner = (
    <>
      {children}
      <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">
        {external ? "↗" : "→"}
      </span>
    </>
  );
  const className = `group inline-flex items-center gap-2 rounded-full font-medium transition ${size} ${cls}`;
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
  return <span className={`mono inline-flex rounded-full border px-2.5 py-0.5 ${cls}`}>{children}</span>;
}

/** A status dot in the data voice. */
export function StatusDot({ status }: { status: "live" | "ongoing" | "learning" }) {
  const c = status === "live" ? "bg-gold" : status === "ongoing" ? "bg-signal" : "bg-ash";
  return <span aria-hidden className={`inline-block size-1.5 rounded-full ${c}`} />;
}
