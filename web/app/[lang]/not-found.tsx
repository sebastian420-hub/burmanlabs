import Link from "next/link";

// not-found files get no route params, so this page is bilingual by design.
export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-3xl font-bold">ရှာမတွေ့ပါ</h1>
      <p lang="en" className="mt-1 text-mist">
        Not found
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/my" className="rounded-xl bg-ember px-5 py-2 font-bold text-ink">
          ပင်မစာမျက်နှာ
        </Link>
        <Link href="/en" lang="en" className="rounded-xl border border-line px-5 py-2">
          Home
        </Link>
      </div>
    </div>
  );
}
