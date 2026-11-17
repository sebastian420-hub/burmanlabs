"use client";

interface AdminBarProps {
  isAdmin: boolean;
  onLogout: () => void;
  onOpenManager: () => void;
  onOpenCortex: () => void;
  onOpenOps: () => void;
}

export function AdminBar({ isAdmin, onLogout, onOpenManager, onOpenCortex, onOpenOps }: AdminBarProps) {
  if (!isAdmin) return null;

  return (
    <aside
      aria-label="Creator mode bar"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-[calc(1rem+env(safe-area-inset-right,0px))] max-w-[calc(100vw-2rem)] z-40 flex items-center gap-2 sm:gap-2.5 border border-line bg-ink/95 px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xl backdrop-blur-md touch-manipulation select-none rounded-lg"
    >
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="font-mono text-xs font-semibold text-paper whitespace-nowrap">Creator</span>
      </div>

      <div className="h-3 w-px bg-line shrink-0" />

      {/* Button 1: Cortex Terminal Dispatcher */}
      <button
        type="button"
        onClick={onOpenCortex}
        className="px-2.5 py-1 bg-ink-2 border border-line-2 hover:border-signal text-bone font-mono text-[11px] transition-all cursor-pointer flex items-center whitespace-nowrap active:scale-95 rounded"
        title="Open Cortex Dispatcher"
      >
        <span>Cortex</span>
      </button>

      {/* Button 2: Content Manager */}
      <button
        type="button"
        onClick={onOpenManager}
        className="px-2.5 py-1 bg-ink-2 border border-line-2 hover:border-white font-mono text-[11px] text-white transition-all cursor-pointer flex items-center whitespace-nowrap active:scale-95 rounded"
        title="Manage Site Content (⌘⇧E)"
      >
        <span>Content</span>
      </button>

      {/* Button 3: DevOps & Fleet Deck */}
      <button
        type="button"
        onClick={onOpenOps}
        className="px-2.5 py-1 bg-ink-2 border border-line-2 hover:border-signal text-bone font-mono text-[11px] transition-all cursor-pointer flex items-center whitespace-nowrap active:scale-95 rounded"
        title="Open DevOps & Fleet Deck (⌘⇧O)"
      >
        <span>Ops</span>
      </button>

      <span className="hidden lg:inline font-mono text-[10px] text-muted">
        ⌘⇧C
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
