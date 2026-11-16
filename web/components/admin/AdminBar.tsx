"use client";

interface AdminBarProps {
  isAdmin: boolean;
  onLogout: () => void;
  onOpenManager: () => void;
}

export function AdminBar({ isAdmin, onLogout, onOpenManager }: AdminBarProps) {
  if (!isAdmin) return null;

  return (
    <aside
      aria-label="Admin mode bar"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-3 border border-line bg-ink/90 px-3.5 py-2 shadow-xl backdrop-blur-md"
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="font-mono text-xs font-medium text-paper">Admin Mode</span>
      </div>

      <div className="h-3 w-px bg-line" />

      <button
        type="button"
        onClick={onOpenManager}
        className="px-2.5 py-1 bg-ink-2 border border-line-2 hover:border-white font-mono text-[11px] text-white transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <span>✎</span>
        <span>Manage All Content</span>
      </button>

      <span className="hidden md:inline font-mono text-[10px] text-muted">
        ⌘⇧F
      </span>

      <div className="h-3 w-px bg-line" />

      <button
        type="button"
        onClick={onLogout}
        className="font-mono text-[11px] text-muted hover:text-paper underline underline-offset-2 transition-colors cursor-pointer"
      >
        Exit
      </button>
    </aside>
  );
}
