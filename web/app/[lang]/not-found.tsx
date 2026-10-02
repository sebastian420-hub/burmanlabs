import Link from "next/link";

// not-found files get no route params, so this page is bilingual by design.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-32 text-center sm:px-8">
      <p className="display text-[8rem] leading-none text-signal sm:text-[12rem]">404</p>
      <h1 className="mt-4 text-2xl">ရှာမတွေ့ပါ</h1>
      <p lang="en" className="mt-1 text-ash">
        Not found
      </p>
      <div className="mt-10 flex justify-center gap-3">
        <Link href="/my" className="rounded-full bg-bone px-6 py-2.5 font-medium text-ink">
          ပင်မစာမျက်နှာ
        </Link>
        <Link href="/en" lang="en" className="rounded-full border border-line-2 px-6 py-2.5">
          Home
        </Link>
      </div>
    </div>
  );
}
