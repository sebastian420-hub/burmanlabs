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
  onOpenOps?: () => void;
  onLogout?: () => void;
}

export function CortexDispatcher({
  isOpen,
  onClose,
  onOpenManager,
  onOpenOps,
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

  const previewCommand =
    selectedMode === "plan"
      ? 'cortex --plan "…"'
      : selectedMode === "remember"
      ? 'cortex --remember "…"'
      : selectedModel !== "default"
      ? `cortex -m ${selectedModel} "…"`
      : 'cortex "…"';

  const currentProjectObj = CORTEX_PROJECTS.find((p) => p.id === selectedProject);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <aside
        className="w-full max-w-2xl h-[100dvh] max-h-[100dvh] bg-ink border-l border-line shadow-2xl flex flex-col justify-between overflow-hidden overscroll-contain touch-manipulation"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-6 pb-4 border-b border-line bg-ink shrink-0 space-y-3.5 pt-[max(1rem,env(safe-area-inset-top,0px))]">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-wider text-ash flex items-center gap-1.5 truncate">
                <span className="size-1.5 rounded-full bg-signal shrink-0" />
                <span className="truncate">Burmanlabs Creator Layer</span>
                <span className="text-dim hidden sm:inline">·</span>
                <span className="text-ash/90 hidden sm:inline">CLI Companion</span>
              </div>
              <h2 className="font-mono text-base font-semibold text-bone mt-0.5 truncate">
                Cortex Dispatcher
              </h2>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenManager}
                className="px-2.5 sm:px-3 py-1.5 rounded-md bg-ink-2 border border-line-2 hover:border-white text-bone hover:text-white font-mono text-xs transition-all cursor-pointer flex items-center active:scale-95"
                title="Switch to Content Manager (⌘⇧E)"
              >
                <span>Content</span>
              </button>
              {onOpenOps && (
                <button
                  type="button"
                  onClick={onOpenOps}
                  className="px-2.5 sm:px-3 py-1.5 rounded-md bg-ink-2 border border-line-2 hover:border-signal text-bone hover:text-white font-mono text-xs transition-all cursor-pointer flex items-center active:scale-95"
                  title="Switch to DevOps & Fleet Deck (⌘⇧O)"
                >
                  <span>Ops</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 sm:px-3 py-1.5 rounded-md bg-ink-2 border border-line-2 hover:border-white text-bone hover:text-white font-mono text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1"
                aria-label="Close Cortex Dispatcher"
              >
                <span>✕</span>
                <span className="hidden xs:inline">Close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Main Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6 no-scrollbar">
          {/* Section 1: Quick Prompt Capture Box */}
          <div className="bg-ink-2 border border-line p-4 sm:p-5 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-bone font-medium flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-signal" />
                <span>Stage New Cortex Task</span>
              </span>
              <span className="font-mono text-[10px] text-ash">Offline Queue</span>
            </div>

            {/* Target Project Selection Pills with negative margin edge-bleed on mobile */}
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] text-ash uppercase tracking-wider">
                Target Project
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 sm:-mx-5 sm:px-5">
                {CORTEX_PROJECTS.map((p) => {
                  const isActive = selectedProject === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProject(p.id)}
                      className={`h-7.5 px-3 rounded-full font-mono text-xs whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5 shrink-0 ${
                        isActive
                          ? "bg-bone border-bone text-ink font-semibold shadow-sm"
                          : "bg-ink border-line text-ash hover:text-white hover:border-line-2"
                      }`}
                    >
                      <span className={`text-[10px] font-mono ${isActive ? "text-ink/80" : "text-signal"}`}>
                        [{p.code}]
                      </span>
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Execution Mode Segmented Control & Model Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-mono text-[10px] text-ash uppercase tracking-wider mb-1.5">
                  Execution Mode
                </label>
                <div className="grid grid-cols-3 p-1 bg-ink border border-line rounded-lg gap-1">
                  {CORTEX_MODES.map((m) => {
                    const isActive = selectedMode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMode(m.id)}
                        className={`py-1.5 font-mono text-[11px] text-center rounded-md transition-all cursor-pointer ${
                          isActive
                            ? "bg-bone text-ink font-semibold shadow-sm"
                            : "text-ash hover:text-bone hover:bg-ink-2/60"
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
                <label className="block font-mono text-[10px] text-ash uppercase tracking-wider mb-1.5">
                  Model Profile
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as CortexModel)}
                  className="w-full h-[38px] bg-ink border border-line px-3 font-mono text-xs text-bone rounded-lg focus:border-bone focus:outline-none transition-colors cursor-pointer"
                >
                  {CORTEX_MODELS.map((m) => (
                    <option key={m.id} value={m.id} className="bg-ink text-bone">
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prompt Textarea */}
            <div className="space-y-1.5">
              <label className="block font-mono text-[10px] text-ash uppercase tracking-wider">
                Task Instruction
              </label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What should Cortex build or investigate? (e.g. refactor vector memory into optional extra, run pytest suite, check rate limiter)…"
                className="w-full bg-ink border border-line p-3 text-xs text-bone font-mono placeholder:text-ash/60 focus:border-bone focus:outline-none rounded-lg resize-none leading-relaxed transition-colors"
              />
            </div>

            {/* CLI Command Preview */}
            <div className="flex items-center gap-2 px-3 py-2 bg-ink border border-line rounded-md text-[11px] font-mono text-ash overflow-hidden">
              <span className="text-dim uppercase tracking-wider text-[10px] shrink-0">Preview</span>
              <span className="text-line-2">|</span>
              <code className="text-bone truncate">{previewCommand}</code>
            </div>

            {/* Add Button */}
            <button
              type="button"
              onClick={handleAddTask}
              disabled={!prompt.trim()}
              className="w-full py-2.5 px-4 rounded-md bg-bone border border-bone text-ink font-mono text-xs font-semibold hover:bg-white disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-95"
            >
              <span>+ Queue for Cortex</span>
            </button>
          </div>

          {/* Section 2: Staged Queue List */}
          <div className="space-y-3.5 pt-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-bone">
                  Staged Tasks
                </h3>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-ink-2 border border-line text-ash">
                  {pendingCount} pending
                </span>
              </div>

              {tasks.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="font-mono text-xs text-bone hover:text-signal transition-colors cursor-pointer underline underline-offset-2"
                  >
                    {copiedAll ? "Script Copied!" : "Copy All Script"}
                  </button>
                  {tasks.some((t) => t.completed) && (
                    <button
                      type="button"
                      onClick={handleClearDone}
                      className="font-mono text-xs text-ash hover:text-white transition-colors cursor-pointer"
                    >
                      Clear Done
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Project Filter Tabs */}
            {tasks.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setFilterProject("all")}
                  className={`h-7 px-3 rounded-full font-mono text-xs transition-all whitespace-nowrap cursor-pointer border ${
                    filterProject === "all"
                      ? "bg-bone border-bone text-ink font-semibold shadow-sm"
                      : "bg-ink-2 border-line text-ash hover:text-white hover:border-line-2"
                  }`}
                >
                  All ({tasks.length})
                </button>
                {CORTEX_PROJECTS.map((p) => {
                  const count = tasks.filter((t) => t.project === p.id).length;
                  if (count === 0) return null;
                  const isActive = filterProject === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFilterProject(p.id)}
                      className={`h-7 px-3 rounded-full font-mono text-xs transition-all whitespace-nowrap cursor-pointer border ${
                        isActive
                          ? "bg-bone border-bone text-ink font-semibold shadow-sm"
                          : "bg-ink-2 border-line text-ash hover:text-white hover:border-line-2"
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
                <p className="font-mono text-xs text-ash">No queued tasks yet.</p>
                <p className="font-mono text-[11px] text-dim mt-1">
                  Type a prompt above to stage commands for your terminal.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const cmd = formatCortexCommand(task);
                  const isCopied = copiedId === task.id;
                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-lg border transition-all space-y-2.5 ${
                        task.completed
                          ? "bg-ink-2/40 border-line/50 opacity-60"
                          : "bg-ink-2 border-line hover:border-line-2"
                      }`}
                    >
                      {/* Top metadata row */}
                      <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-ink border border-line text-signal uppercase font-semibold text-[10px]">
                            {task.project}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-ink border border-line text-ash uppercase text-[10px]">
                            {task.mode}
                          </span>
                          {task.model !== "default" && (
                            <span className="px-2 py-0.5 rounded bg-ink border border-line text-ash text-[10px]">
                              @{task.model}
                            </span>
                          )}
                        </div>
                        <span className="text-dim text-[10px]">
                          {new Date(task.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Prompt Body */}
                      <p
                        className={`font-mono text-xs text-bone leading-relaxed ${
                          task.completed ? "line-through text-ash" : ""
                        }`}
                      >
                        {task.prompt}
                      </p>

                      {/* Formatted CLI Command */}
                      <div className="p-2.5 bg-ink border border-line rounded-md font-mono text-xs text-bone break-all flex items-center justify-between gap-2">
                        <code className="text-bone select-all font-mono truncate">{cmd}</code>
                        <button
                          type="button"
                          onClick={() => handleCopyTask(task)}
                          className="shrink-0 px-2.5 py-1 rounded bg-ink-2 border border-line hover:border-white text-bone font-mono text-[11px] transition-all active:scale-95 cursor-pointer"
                        >
                          {isCopied ? "Copied" : "Copy"}
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-1 font-mono text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleToggleDone(task.id)}
                          className="text-ash hover:text-bone cursor-pointer transition-colors"
                        >
                          {task.completed ? "Mark Pending" : "Mark Done"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-signal hover:underline cursor-pointer transition-colors text-[11px]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Navigator Footer matching EditDrawer & OpsDeck balanced 2-row layout */}
        <div className="p-4 sm:p-5 border-t border-line bg-ink shrink-0 space-y-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          <div className="flex items-center justify-between text-xs font-mono text-ash">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-signal" />
              <span>Burmanlabs Cortex Active</span>
            </span>
            <span className="truncate max-w-[200px] text-right">
              {pendingCount} tasks staged · {currentProjectObj ? currentProjectObj.label : selectedProject}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2.5 px-3 rounded-md bg-ink-2 border border-line hover:border-signal text-bone font-mono text-xs transition-colors cursor-pointer text-center active:scale-95"
              >
                Exit Admin
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`w-full py-2.5 px-3 rounded-md bg-bone border border-bone text-ink font-semibold font-mono text-xs hover:bg-white active:scale-95 transition-all shadow-md cursor-pointer text-center ${
                !onLogout ? "col-span-2" : ""
              }`}
            >
              Close Cortex
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
