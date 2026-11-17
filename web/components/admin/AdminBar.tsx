"use client";

interface AdminBarProps {
  isAdmin: boolean;
  onLogout: () => void;
  onOpenManager: () => void;
  onOpenCortex: () => void;
  onOpenOps: () => void;
}

export function AdminBar({
  isAdmin,
  onLogout,
  onOpenManager,
  onOpenCortex,
  onOpenOps,
}: AdminBarProps) {
  if (!isAdmin) return null;

  return (
    <aside
      aria-label="Creator mode bar"
      className="fixed bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] right-3 sm:right-6 max-w-[calc(100vw-1.5rem)] z-40 flex items-center gap-1.5 sm:gap-2 border border-line bg-ink/95 px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-2xl backdrop-blur-md touch-manipulation select-none rounded-lg"
    >
      {/* Creator Indicator Badge */}
      <div className="flex items-center gap-1.5 shrink-0 pl-0.5">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="font-mono text-xs font-semibold text-bone whitespace-nowrap">
          Creator
        </span>
      </div>

      <div className="h-3.5 w-px bg-line-2 shrink-0 mx-0.5" />

      {/* Action 1: Content Manager */}
      <button
        type="button"
        onClick={onOpenManager}
        className="h-7 px-2.5 sm:px-3 bg-ink-2 border border-line-2 hover:border-white font-mono text-xs text-bone hover:text-white transition-all cursor-pointer flex items-center whitespace-nowrap active:scale-95 rounded-md shadow-sm"
        title="Manage Site Content (⌘⇧E)"
      >
        <span>Content</span>
      </button>

      {/* Action 2: DevOps & Fleet Deck */}
      <button
        type="button"
        onClick={onOpenOps}
        className="h-7 px-2.5 sm:px-3 bg-ink-2 border border-line-2 hover:border-signal text-bone hover:text-white font-mono text-xs transition-all cursor-pointer flex items-center whitespace-nowrap active:scale-95 rounded-md shadow-sm"
        title="DevOps & Fleet Deck (⌘⇧O)"
      >
        <span>Ops</span>
      </button>

      {/* Action 3: Cortex Terminal Dispatcher */}
      <button
        type="button"
        onClick={onOpenCortex}
        className="h-7 px-2.5 sm:px-3 bg-ink-2 border border-line-2 hover:border-white text-bone hover:text-white font-mono text-xs transition-all cursor-pointer flex items-center whitespace-nowrap active:scale-95 rounded-md shadow-sm"
        title="Open Cortex Dispatcher (⌘⇧C)"
      >
        <span>Cortex</span>
      </button>

      <div className="h-3.5 w-px bg-line-2 shrink-0 mx-0.5" />

      {/* Action 4: Exit Creator Mode */}
      <button
        type="button"
        onClick={onLogout}
        className="font-mono text-xs text-ash hover:text-signal transition-colors cursor-pointer whitespace-nowrap px-1.5 py-1 active:scale-95"
        title="Exit Admin Mode"
      >
        Exit
      </button>
    </aside>
  );
}
