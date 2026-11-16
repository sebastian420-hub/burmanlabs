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
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))] max-w-[calc(100vw-2rem)] z-40 flex items-center gap-2 sm:gap-3 border border-line bg-ink/95 px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-xl backdrop-blur-md touch-manipulation select-none"
    >
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="font-mono text-xs font-medium text-paper whitespace-nowrap">Admin</span>
      </div>

      <div className="h-3 w-px bg-line shrink-0" />

      <button
        type="button"
        onClick={onOpenManager}
        className="px-2.5 py-1 bg-ink-2 border border-line-2 hover:border-white font-mono text-[11px] text-white transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95"
      >
        <span>✎</span>
        <span className="hidden min-[380px]:inline">Manage All Content</span>
        <span className="min-[380px]:hidden">Manage</span>
      </button>

      <span className="hidden md:inline font-mono text-[10px] text-muted">
        ⌘⇧F
      </span>

      <div className="h-3 w-px bg-line shrink-0" />

      <button
        type="button"
        onClick={onLogout}
        className="font-mono text-[11px] text-muted hover:text-paper underline underline-offset-2 transition-colors cursor-pointer whitespace-nowrap px-1 py-0.5 active:scale-95"
      >
        Exit
      </button>
    </aside>
  );
}
