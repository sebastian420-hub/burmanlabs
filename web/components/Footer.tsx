export default function Footer({ line }: { line: string }) {
  return (
    <footer className="mt-24 border-t border-line/70">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-mist sm:px-6">
        <p>{line}</p>
        <p className="mt-1 text-xs opacity-70">© {new Date().getFullYear()} Burmanlabs</p>
      </div>
    </footer>
  );
}
