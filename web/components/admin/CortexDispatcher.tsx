"use client";

import { useEffect, useState } from "react";
import {
  CORTEX_MODES,
  CORTEX_PROJECTS,
  CORTEX_MODELS,
  type CortexMode,
  type CortexModel,
  type CortexProject,
  type CortexTask,
  formatAllCortexCommands,
  formatCortexCommand,
  loadCortexTasks,
  saveCortexTasks,
} from "./cortexQueue";

interface CortexDispatcherProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenManager: () => void;
  onLogout?: () => void;
}

export function CortexDispatcher({
  isOpen,
  onClose,
  onOpenManager,
  onLogout,
}: CortexDispatcherProps) {
  const [tasks, setTasks] = useState<CortexTask[]>(() => {
    if (typeof window !== "undefined") {
      return loadCortexTasks();
    }
    return [];
  });
  const [prompt, setPrompt] = useState("");
  const [selectedProject, setSelectedProject] = useState<CortexProject>("cortex");
  const [selectedMode, setSelectedMode] = useState<CortexMode>("run");
  const [selectedModel, setSelectedModel] = useState<CortexModel>("default");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Sync with storage events across tabs or windows
  useEffect(() => {
    function handleStorage(e: StorageEvent) {
      if (e.key === "burmanlabs_cortex_queue_v1") {
        setTasks(loadCortexTasks());
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      const origBodyOverflow = document.body.style.overflow;
      const origHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = origBodyOverflow;
        document.documentElement.style.overflow = origHtmlOverflow;
      };
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function handleAddTask() {
    if (!prompt.trim()) return;

    const newTask: CortexTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      project: selectedProject,
      mode: selectedMode,
      model: selectedModel,
      prompt: prompt.trim(),
      createdAt: Date.now(),
      completed: false,
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveCortexTasks(updated);
    setPrompt("");

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(30);
      } catch {
        // ignore
      }
    }
  }

  function handleCopyTask(task: CortexTask) {
    const cmd = formatCortexCommand(task);
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(cmd);
      setCopiedId(task.id);
      setTimeout(() => setCopiedId(null), 2000);
      if (navigator.vibrate) {
        try {
          navigator.vibrate([20, 30]);
        } catch {
          // ignore
        }
      }
    }
  }

  function handleCopyAll() {
    const script = formatAllCortexCommands(tasks);
    if (!script) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(script);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
      if (navigator.vibrate) {
        try {
          navigator.vibrate([30, 40]);
        } catch {
          // ignore
        }
      }
    }
  }

  function handleToggleDone(id: string) {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTasks(updated);
    saveCortexTasks(updated);
  }

  function handleDeleteTask(id: string) {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveCortexTasks(updated);
  }

  function handleClearDone() {
    const updated = tasks.filter((t) => !t.completed);
    setTasks(updated);
    saveCortexTasks(updated);
  }

  const filteredTasks = tasks.filter((t) =>
    filterProject === "all" ? true : t.project === filterProject
  );

  const pendingCount = tasks.filter((t) => !t.completed).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-xl h-[100dvh] max-h-[100dvh] bg-ink border-l border-line shadow-2xl flex flex-col justify-between overflow-hidden overscroll-contain touch-manipulation"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 pb-4 border-b border-line bg-ink shrink-0 space-y-3.5 pt-[max(1rem,env(safe-area-inset-top,0px))]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-signal inline-block" />
                <span>Burmanlabs Creator Layer</span>
              </div>
              <h2 className="font-mono text-base font-semibold text-paper mt-0.5 flex items-center gap-2">
                <span>Cortex Dispatcher</span>
                <span className="font-mono text-[11px] font-normal text-muted bg-ink-2 px-2 py-0.5 rounded border border-line">
                  CLI Companion
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenManager}
                className="px-2.5 py-1.5 rounded bg-ink-2 border border-line-2 hover:border-white text-ash hover:text-white font-mono text-[11px] transition-colors cursor-pointer flex items-center active:scale-95"
                title="Switch to Content Manager"
              >
                <span>Content Mgr</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-ink-2 border border-line-2 hover:border-white text-bone font-mono text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                aria-label="Close Cortex Dispatcher"
              >
                <span>✕</span>
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Main Body */}
        <div
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6 no-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* Section 1: Quick Prompt Capture Box */}
          <div className="bg-ink-2 border border-line p-4 rounded-lg space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-paper/90 font-medium">
                Stage New Cortex Task
              </span>
              <span className="font-mono text-[10px] text-muted">Offline Storage</span>
            </div>

            {/* Project Selection Tabs */}
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] text-muted uppercase">Target Project</label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {CORTEX_PROJECTS.map((p) => {
                  const isActive = selectedProject === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProject(p.id)}
                      className={`px-2.5 py-1 rounded font-mono text-[11px] whitespace-nowrap transition-colors cursor-pointer border ${
                        isActive
                          ? "bg-black border-bone text-white font-semibold shadow-sm"
                          : "bg-ink-3 border-line text-ash hover:text-white"
                      }`}
                    >
                      <span className="text-signal/90 mr-1">[{p.code}]</span>
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode & Model Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block font-mono text-[10px] text-muted uppercase mb-1">Execution Mode</label>
                <div className="grid grid-cols-3 gap-1">
                  {CORTEX_MODES.map((m) => {
                    const isActive = selectedMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMode(m.id)}
                        className={`px-2 py-1.5 rounded font-mono text-[10px] text-center transition-colors cursor-pointer border ${
                          isActive
                            ? "bg-bone text-ink font-semibold border-white"
                            : "bg-ink border-line text-ash hover:text-white"
                        }`}
                        title={m.hint}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] text-muted uppercase mb-1">Model Profile</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as CortexModel)}
                  className="w-full bg-ink border border-line px-2.5 py-1.5 font-mono text-xs text-paper focus:border-paper focus:outline-none rounded"
                >
                  {CORTEX_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-1">
              <label className="block font-mono text-[10px] text-muted uppercase">Prompt / Task Instruction</label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What should Cortex build or investigate? (e.g. refactor vector memory into optional extra, run pytest suite, check rate limiter)…"
                className="w-full bg-ink border border-line p-3 text-base sm:text-xs text-paper font-mono placeholder:text-muted/60 focus:border-paper focus:outline-none rounded resize-none"
              />
            </div>

            {/* Command Preview & Add Button */}
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="font-mono text-[10px] text-muted truncate max-w-sm">
                <span>Preview: </span>
                <span className="text-bone/80">
                  {selectedMode === "plan"
                    ? 'cortex --plan "…"'
                    : selectedMode === "remember"
                    ? 'cortex --remember "…"'
                    : selectedModel !== "default"
                    ? `cortex -m ${selectedModel} "…"`
                    : 'cortex "…"'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddTask}
                disabled={!prompt.trim()}
                className="w-full sm:w-auto px-5 py-2 rounded bg-bone text-ink font-mono text-xs font-semibold hover:bg-white disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
              >
                <span>+</span>
                <span>Queue for Cortex</span>
              </button>
            </div>
          </div>

          {/* Section 2: Staged Queue List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-paper">
                  Staged Tasks
                </h3>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-ink-2 border border-line text-muted">
                  {pendingCount} pending
                </span>
              </div>

              {tasks.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="font-mono text-[11px] text-signal hover:underline transition-colors cursor-pointer"
                  >
                    {copiedAll ? "✓ Script Copied!" : "Copy All Script"}
                  </button>
                  {tasks.some((t) => t.completed) && (
                    <button
                      type="button"
                      onClick={handleClearDone}
                      className="font-mono text-[11px] text-muted hover:text-paper transition-colors cursor-pointer"
                    >
                      Clear Done
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Filter by project */}
            {tasks.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setFilterProject("all")}
                  className={`px-2 py-0.5 font-mono text-[10px] rounded transition-colors ${
                    filterProject === "all"
                      ? "bg-bone text-ink font-medium"
                      : "text-muted hover:text-paper"
                  }`}
                >
                  All ({tasks.length})
                </button>
                {CORTEX_PROJECTS.map((p) => {
                  const count = tasks.filter((t) => t.project === p.id).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFilterProject(p.id)}
                      className={`px-2 py-0.5 font-mono text-[10px] rounded transition-colors ${
                        filterProject === p.id
                          ? "bg-bone text-ink font-medium"
                          : "text-muted hover:text-paper"
                      }`}
                    >
                      {p.label} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tasks list */}
            {filteredTasks.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-line rounded-lg">
                <p className="font-mono text-xs text-muted">No queued tasks yet.</p>
                <p className="font-mono text-[11px] text-dim mt-1">
                  Type a prompt above to stage commands for your terminal.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTasks.map((task) => {
                  const cmd = formatCortexCommand(task);
                  const isCopied = copiedId === task.id;
                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded border transition-all ${
                        task.completed
                          ? "bg-ink-2/40 border-line/60 opacity-60"
                          : "bg-ink-2 border-line hover:border-line-2"
                      }`}
                    >
                      {/* Top metadata row */}
                      <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-ink-3 border border-line text-signal uppercase">
                            {task.project}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-ink border border-line text-muted uppercase">
                            {task.mode}
                          </span>
                          {task.model !== "default" && (
                            <span className="px-1.5 py-0.5 rounded bg-ink border border-line text-muted">
                              @{task.model}
                            </span>
                          )}
                        </div>
                        <span className="text-dim">
                          {new Date(task.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Prompt Body */}
                      <p
                        className={`font-mono text-xs text-paper mt-2 ${
                          task.completed ? "line-through text-muted" : ""
                        }`}
                      >
                        {task.prompt}
                      </p>

                      {/* Formatted CLI Command */}
                      <div className="mt-2.5 p-2 bg-ink border border-line rounded font-mono text-[11px] text-bone/90 break-all flex items-center justify-between gap-2">
                        <code className="text-bone select-all">{cmd}</code>
                        <button
                          type="button"
                          onClick={() => handleCopyTask(task)}
                          className="shrink-0 px-2 py-1 rounded bg-ink-2 border border-line-2 hover:border-white text-bone font-mono text-[10px] transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          {isCopied ? "✓ Copied" : "Copy"}
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-line/50 font-mono text-[10px]">
                        <button
                          type="button"
                          onClick={() => handleToggleDone(task.id)}
                          className="text-muted hover:text-paper cursor-pointer"
                        >
                          {task.completed ? "Mark Pending" : "✓ Mark Done"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          ✕ Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Footer Actions with safe-area padding */}
        <div className="border-t border-line px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] bg-ink shrink-0">
          <div className="flex items-center justify-between gap-3 font-mono text-[11px]">
            <div className="text-muted truncate">
              <span>{pendingCount} tasks staged</span>
            </div>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="px-3 py-1.5 rounded bg-ink-2 border border-line-2 hover:border-white text-bone transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  {copiedAll ? "✓ Script Copied!" : "Copy Script"}
                </button>
              )}
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2.5 py-1.5 rounded bg-ink-3 border border-red-900/60 hover:border-red-500 text-red-300 transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                  title="Log out of Admin Mode"
                >
                  <span>⎋</span>
                  <span>Exit</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded bg-bone text-ink font-semibold hover:bg-white transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-md"
              >
                <span>✕</span>
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
