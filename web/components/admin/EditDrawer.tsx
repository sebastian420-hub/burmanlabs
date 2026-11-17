"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { CatalogItem, CategoryId, ItemType, LaunchMode, Piece, Role, Status } from "@/lib/types";
import { saveCatalogItemField, saveDictionaryField, saveStudioPieceField } from "@/lib/adminClient";
import type { EditTarget } from "./types";
import {
  buildContentRegistry,
  CATEGORY_TABS,
  type ContentCategory,
  type RegistryEntry,
} from "./contentRegistry";
import enDict from "@/dictionaries/en.json";
import myDict from "@/dictionaries/my.json";
import catalogJson from "@/content/catalog.json";
import studioJson from "@/content/studio.json";

interface EditDrawerProps {
  isOpen: boolean;
  activeTarget: EditTarget | null;
  onClose: () => void;
  onSelectTarget: (target: EditTarget | null) => void;
  onLogout?: () => void;
  onOpenCortex?: () => void;
}

export function EditDrawer({
  isOpen,
  activeTarget,
  onClose,
  onSelectTarget,
  onLogout,
  onOpenCortex,
}: EditDrawerProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ContentCategory>("all");

  // Build the complete registry
  const registry = useMemo(() => {
    return buildContentRegistry(
      enDict,
      myDict,
      catalogJson as CatalogItem[],
      studioJson as Piece[]
    );
  }, []);

  // Filter registry entries based on tab and search
  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return registry.filter((entry) => {
      const matchesCategory =
        selectedCategory === "all" || entry.category === selectedCategory;
      const matchesSearch = !q || entry.searchTokens.includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [registry, searchQuery, selectedCategory]);

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
        {activeTarget ? (
          <ItemEditorView
            target={activeTarget}
            onBack={() => onSelectTarget(null)}
            onClose={onClose}
            routerRefresh={() => router.refresh()}
          />
        ) : (
          <NavigatorView
            entries={filteredEntries}
            totalCount={registry.length}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onSelectTarget={(target) => onSelectTarget(target)}
            onClose={onClose}
            onLogout={onLogout}
            onOpenCortex={onOpenCortex}
          />
        )}
      </aside>
    </div>
  );
}

function GitHubStatusBadge() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking");
  const [detail, setDetail] = useState<string | null>(null);

  async function handleManualRetry() {
    setStatus("checking");
    try {
      const res = await fetch("/api/admin/test-github", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("connected");
        setDetail(data.repository || data.authenticatedAs || "Connected");
      } else {
        setStatus("error");
        setDetail(data.error || "Connection failed");
      }
    } catch {
      setStatus("error");
      setDetail("Offline / Network error");
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/admin/test-github", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.ok) {
          setStatus("connected");
          setDetail(data.repository || data.authenticatedAs || "Connected");
        } else {
          setStatus("error");
          setDetail(data.error || "Connection failed");
        }
      })
      .catch(() => {
        if (!active) return;
        setStatus("error");
        setDetail("Offline / Network error");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <button
      type="button"
      onClick={handleManualRetry}
      title={detail ? `GitHub Status: ${detail} (click to re-test)` : "Click to test GitHub connection"}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-ink-2/80 border border-line hover:border-line-2 transition-colors cursor-pointer select-none"
    >
      {status === "checking" && (
        <>
          <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-mono text-[10px] text-muted">Checking GitHub…</span>
        </>
      )}
      {status === "connected" && (
        <>
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          </span>
          <span className="font-mono text-[10px] text-emerald-400 font-medium">GitHub Connected</span>
        </>
      )}
      {status === "error" && (
        <>
          <span className="size-1.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <span className="font-mono text-[10px] text-red-400 font-medium">GitHub Offline</span>
        </>
      )}
    </button>
  );
}

// -------------------------------------------------------------
// NAVIGATOR VIEW (Search and browse all site text)
// -------------------------------------------------------------
interface NavigatorViewProps {
  entries: RegistryEntry[];
  totalCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: ContentCategory;
  setSelectedCategory: (cat: ContentCategory) => void;
  onSelectTarget: (t: EditTarget) => void;
  onClose: () => void;
  onLogout?: () => void;
  onOpenCortex?: () => void;
}

function NavigatorView({
  entries,
  totalCount,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onSelectTarget,
  onClose,
  onLogout,
  onOpenCortex,
}: NavigatorViewProps) {
  return (
    <>
      {/* Top Header */}
      <div className="p-4 sm:p-6 pb-4 border-b border-line bg-ink shrink-0 space-y-3.5 pt-[max(1rem,env(safe-area-inset-top,0px))]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-signal inline-block" />
              <span>Burmanlabs Admin</span>
            </div>
            <h2 className="font-mono text-base font-semibold text-paper mt-0.5">Content Manager</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenCortex && (
              <button
                type="button"
                onClick={onOpenCortex}
                className="px-3 py-1.5 rounded-md bg-ink-2 border border-line-2 hover:border-signal text-bone font-mono text-xs transition-colors cursor-pointer flex items-center active:scale-95"
                title="Switch to Cortex Dispatcher"
              >
                <span>Cortex</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md bg-ink-2 border border-line-2 hover:border-white text-bone font-mono text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
              aria-label="Close Content Manager"
            >
              <span>✕</span>
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* Live Search */}
        <div className="relative">
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all copy (e.g. Artcodex, bio, email)…"
            className="w-full bg-ink-2 border border-line px-3.5 pr-9 py-2 text-base sm:text-xs text-paper font-mono placeholder:text-muted/60 focus:border-paper focus:outline-none rounded-md"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-muted hover:text-paper font-mono text-xs cursor-pointer p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`h-8 px-3.5 font-mono text-xs whitespace-nowrap transition-all cursor-pointer rounded-full border touch-manipulation flex items-center justify-center shrink-0 ${
                  isActive
                    ? "bg-bone border-bone text-ink font-semibold shadow-sm"
                    : "bg-ink-2 border-line text-ash hover:text-white hover:border-line-2"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Results List */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 divide-y divide-line no-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {entries.length === 0 ? (
          <div className="py-12 text-center">
            <p className="font-mono text-xs text-muted">No text matches &ldquo;{searchQuery}&rdquo;</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-3 font-mono text-[11px] text-paper underline underline-offset-2 cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              onClick={() => onSelectTarget(entry.target)}
              className="py-3.5 group cursor-pointer hover:bg-ink-2/60 -mx-3 px-3 transition-colors rounded"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase text-muted tracking-wide">
                  {entry.categoryLabel}
                </span>
                <span className="font-mono text-[10px] text-muted group-hover:text-paper transition-colors">
                  Edit →
                </span>
              </div>
              <h3 className="font-mono text-xs font-medium text-paper mt-0.5 group-hover:text-white">
                {entry.label}
              </h3>
              {entry.description && (
                <p className="font-mono text-[11px] text-dim mt-0.5 line-clamp-1">
                  {entry.description}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bottom Footer Actions (Desktop & Mobile with safe-area padding) */}
      <div className="border-t border-line px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] bg-ink shrink-0 space-y-2.5">
        <div className="flex items-center justify-between gap-3 font-mono text-[11px] text-muted">
          <span>Showing {entries.length} of {totalCount} editable fields</span>
          <GitHubStatusBadge />
        </div>

        <div className="flex items-center gap-2 w-full">
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 sm:flex-none justify-center h-10 px-4 rounded-md bg-ink-2 border border-red-900/50 hover:border-red-500 text-red-400 hover:text-red-300 font-mono text-xs transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
              title="Log out of Admin Mode"
            >
              <span>⎋</span>
              <span>Exit Admin</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-none justify-center h-10 px-4 rounded-md bg-bone text-ink font-mono text-xs font-semibold hover:bg-white transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-md"
            title="Close Content Manager"
          >
            <span>✕</span>
            <span>Close Manager</span>
          </button>
        </div>
      </div>
    </>
  );
}

// -------------------------------------------------------------
// ITEM EDITOR VIEW (Bilingual edit form with Save & Publish)
// -------------------------------------------------------------
interface ItemEditorViewProps {
  target: EditTarget;
  onBack: () => void;
  onClose: () => void;
  routerRefresh: () => void;
}

function ItemEditorView({ target, onBack, onClose, routerRefresh }: ItemEditorViewProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Dictionary state
  const [enVal, setEnVal] = useState<unknown>(
    target.type === "dictionary" ? target.currentEn : ""
  );
  const [myVal, setMyVal] = useState<unknown>(
    target.type === "dictionary" ? target.currentMy : ""
  );

  // Catalog item state
  const [catCode, setCatCode] = useState(
    target.type === "catalogItem" ? target.item.code || "" : ""
  );
  const [catTitleEn, setCatTitleEn] = useState(
    target.type === "catalogItem" ? target.item.title?.en || "" : ""
  );
  const [catTitleMy, setCatTitleMy] = useState(
    target.type === "catalogItem" ? target.item.title?.my || "" : ""
  );
  const [catStatus, setCatStatus] = useState<Status>(
    target.type === "catalogItem" ? target.item.status : "ongoing"
  );
  const [catType, setCatType] = useState<ItemType>(
    target.type === "catalogItem" ? target.item.type : "app"
  );
  const [catCategory, setCatCategory] = useState<CategoryId>(
    target.type === "catalogItem" ? target.item.category : "art"
  );
  const [catRole, setCatRole] = useState<Role>(
    target.type === "catalogItem" ? target.item.role : "build"
  );
  const [catYear, setCatYear] = useState<string>(
    target.type === "catalogItem" ? String(target.item.year || "") : "2025"
  );
  const [catStack, setCatStack] = useState<string>(
    target.type === "catalogItem" ? (target.item.stack || []).join(", ") : ""
  );
  const [catSizeMB, setCatSizeMB] = useState<string>(
    target.type === "catalogItem" && target.item.sizeMB !== undefined
      ? String(target.item.sizeMB)
      : ""
  );
  const [catOffline, setCatOffline] = useState<boolean>(
    target.type === "catalogItem" ? Boolean(target.item.offline) : false
  );
  const [catMode, setCatMode] = useState<LaunchMode>(
    target.type === "catalogItem" ? target.item.mode : "link"
  );
  const [catTarget, setCatTarget] = useState<string>(
    target.type === "catalogItem" ? target.item.target || "" : ""
  );
  const [catStandingEn, setCatStandingEn] = useState(
    target.type === "catalogItem" ? target.item.standing?.en || "" : ""
  );
  const [catStandingMy, setCatStandingMy] = useState(
    target.type === "catalogItem" ? target.item.standing?.my || "" : ""
  );
  const [catSummaryEn, setCatSummaryEn] = useState(
    target.type === "catalogItem" ? target.item.summary?.en || "" : ""
  );
  const [catSummaryMy, setCatSummaryMy] = useState(
    target.type === "catalogItem" ? target.item.summary?.my || "" : ""
  );
  const [catAboutEn, setCatAboutEn] = useState(
    target.type === "catalogItem" ? target.item.about?.en || "" : ""
  );
  const [catAboutMy, setCatAboutMy] = useState(
    target.type === "catalogItem" ? target.item.about?.my || "" : ""
  );

  // Studio piece state
  const [studioTitleEn, setStudioTitleEn] = useState(
    target.type === "studioPiece" ? target.piece.title.en || "" : ""
  );
  const [studioTitleMy, setStudioTitleMy] = useState(
    target.type === "studioPiece" ? target.piece.title.my || "" : ""
  );
  const [studioMediumEn, setStudioMediumEn] = useState(
    target.type === "studioPiece" ? target.piece.medium.en || "" : ""
  );
  const [studioMediumMy, setStudioMediumMy] = useState(
    target.type === "studioPiece" ? target.piece.medium.my || "" : ""
  );
  const [studioAboutEn, setStudioAboutEn] = useState(
    target.type === "studioPiece" ? target.piece.about.en || "" : ""
  );
  const [studioAboutMy, setStudioAboutMy] = useState(
    target.type === "studioPiece" ? target.piece.about.my || "" : ""
  );
  const [studioInteractEn, setStudioInteractEn] = useState(
    target.type === "studioPiece" ? target.piece.interact.en || "" : ""
  );
  const [studioInteractMy, setStudioInteractMy] = useState(
    target.type === "studioPiece" ? target.piece.interact.my || "" : ""
  );

  async function handleSave() {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        if (target.type === "dictionary") {
          const res = await saveDictionaryField(target.keyPath, enVal, myVal);
          if (!res.ok) {
            setError(res.error || "Failed to save dictionary");
            return;
          }
        } else if (target.type === "catalogItem") {
          const stackArray = catStack
            .split(/[,\n·]/)
            .map((s) => s.trim())
            .filter(Boolean);

          const parsedYear = parseInt(catYear, 10);
          const parsedSize = parseFloat(catSizeMB);

          const patch: Partial<CatalogItem> = {
            code: catCode.trim(),
            title: { en: catTitleEn, my: catTitleMy },
            status: catStatus,
            type: catType,
            category: catCategory,
            role: catRole,
            year: !isNaN(parsedYear) ? parsedYear : new Date().getFullYear(),
            stack: stackArray,
            sizeMB: !isNaN(parsedSize) && parsedSize > 0 ? parsedSize : undefined,
            offline: catOffline,
            mode: catMode,
            target: catTarget.trim() || undefined,
            standing: { en: catStandingEn, my: catStandingMy },
            summary: { en: catSummaryEn, my: catSummaryMy },
            about: { en: catAboutEn, my: catAboutMy },
          };
          const res = await saveCatalogItemField(target.itemId, patch);
          if (!res.ok) {
            setError(res.error || "Failed to save catalog item");
            return;
          }
        } else if (target.type === "studioPiece") {
          const patch: Partial<Piece> = {
            title: { en: studioTitleEn, my: studioTitleMy },
            medium: { en: studioMediumEn, my: studioMediumMy },
            about: { en: studioAboutEn, my: studioAboutMy },
            interact: { en: studioInteractEn, my: studioInteractMy },
          };
          const res = await saveStudioPieceField(target.pieceId, patch);
          if (!res.ok) {
            setError(res.error || "Failed to save studio piece");
            return;
          }
        }

        setSuccess(true);
        routerRefresh();
        setTimeout(() => {
          setSuccess(false);
        }, 2000);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-line bg-ink shrink-0 pt-[max(0.875rem,env(safe-area-inset-top,0px))]">
        <div className="min-w-0 pr-2">
          <button
            type="button"
            onClick={onBack}
            className="font-mono text-xs text-muted hover:text-paper transition-colors flex items-center gap-1 cursor-pointer"
          >
            ← All Content
          </button>
          <h2 className="font-mono text-base font-semibold text-paper mt-1 truncate">{target.label}</h2>
          {target.type === "dictionary" && target.description && (
            <p className="font-mono text-xs text-muted mt-0.5 truncate">{target.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-3.5 py-1.5 bg-bone text-ink font-mono text-xs font-semibold hover:bg-white disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 rounded-md"
          >
            {isPending ? (
              <>
                <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-ink border-t-transparent" />
                <span className="hidden sm:inline">Saving…</span>
              </>
            ) : (
              <span>Save</span>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="px-3 py-1.5 rounded-md bg-ink-2 border border-line-2 hover:border-white text-bone font-mono text-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1"
          >
            <span>✕</span>
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6 no-scrollbar"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* CASE 1: Dictionary target */}
        {target.type === "dictionary" && (
          <>
            {target.kind === "heroTitle" && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="font-mono text-xs uppercase tracking-wider text-paper/90 border-b border-line pb-1">
                    English Title
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    <div>
                      <label className="block font-mono text-[10px] text-muted mb-1">Prefix text</label>
                      <input
                        type="text"
                        value={Array.isArray(enVal) ? (enVal[0] ?? "") : ""}
                        onChange={(e) => {
                          const arr = Array.isArray(enVal) ? [...enVal] : ["", "", ""];
                          arr[0] = e.target.value;
                          setEnVal(arr);
                        }}
                        className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-muted mb-1">
                        Emphasized / Italic word
                      </label>
                      <input
                        type="text"
                        value={Array.isArray(enVal) ? (enVal[1] ?? "") : ""}
                        onChange={(e) => {
                          const arr = Array.isArray(enVal) ? [...enVal] : ["", "", ""];
                          arr[1] = e.target.value;
                          setEnVal(arr);
                        }}
                        className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-serif italic focus:border-paper focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-muted mb-1">Suffix / punctuation</label>
                      <input
                        type="text"
                        value={Array.isArray(enVal) ? (enVal[2] ?? "") : ""}
                        onChange={(e) => {
                          const arr = Array.isArray(enVal) ? [...enVal] : ["", "", ""];
                          arr[2] = e.target.value;
                          setEnVal(arr);
                        }}
                        className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="font-mono text-xs uppercase tracking-wider text-paper/90 border-b border-line pb-1">
                    Burmese Title (မြန်မာ)
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    <div>
                      <label className="block font-mono text-[10px] text-muted mb-1">Prefix text</label>
                      <input
                        type="text"
                        value={Array.isArray(myVal) ? (myVal[0] ?? "") : ""}
                        onChange={(e) => {
                          const arr = Array.isArray(myVal) ? [...myVal] : ["", "", ""];
                          arr[0] = e.target.value;
                          setMyVal(arr);
                        }}
                        className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-sans focus:border-paper focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-muted mb-1">
                        Emphasized / Italic word
                      </label>
                      <input
                        type="text"
                        value={Array.isArray(myVal) ? (myVal[1] ?? "") : ""}
                        onChange={(e) => {
                          const arr = Array.isArray(myVal) ? [...myVal] : ["", "", ""];
                          arr[1] = e.target.value;
                          setMyVal(arr);
                        }}
                        className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-serif italic focus:border-paper focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] text-muted mb-1">Suffix / punctuation</label>
                      <input
                        type="text"
                        value={Array.isArray(myVal) ? (myVal[2] ?? "") : ""}
                        onChange={(e) => {
                          const arr = Array.isArray(myVal) ? [...myVal] : ["", "", ""];
                          arr[2] = e.target.value;
                          setMyVal(arr);
                        }}
                        className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {target.kind === "stringArray" && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="font-mono text-xs uppercase tracking-wider text-paper/90 border-b border-line pb-1">
                    English Items
                  </div>
                  {(Array.isArray(enVal) ? enVal : []).map((itemStr: string, idx: number) => (
                    <div key={idx}>
                      <label className="block font-mono text-[10px] text-muted mb-1">
                        Item {String(idx + 1).padStart(2, "0")}
                      </label>
                      <input
                        type="text"
                        value={itemStr}
                        onChange={(e) => {
                          const arr = Array.isArray(enVal) ? [...enVal] : [];
                          arr[idx] = e.target.value;
                          setEnVal(arr);
                        }}
                        className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="font-mono text-xs uppercase tracking-wider text-paper/90 border-b border-line pb-1">
                    Burmese Items (မြန်မာ)
                  </div>
                  {(Array.isArray(myVal) ? myVal : []).map((itemStr: string, idx: number) => (
                    <div key={idx}>
                      <label className="block font-mono text-[10px] text-muted mb-1">
                        Item {String(idx + 1).padStart(2, "0")}
                      </label>
                      <input
                        type="text"
                        value={itemStr}
                        onChange={(e) => {
                          const arr = Array.isArray(myVal) ? [...myVal] : [];
                          arr[idx] = e.target.value;
                          setMyVal(arr);
                        }}
                        className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-sans focus:border-paper focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {target.kind === "textarea" && (
              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] text-paper/90 mb-1.5">English</label>
                  <textarea
                    rows={5}
                    value={typeof enVal === "string" ? enVal : ""}
                    onChange={(e) => setEnVal(e.target.value)}
                    className="w-full bg-ink-2 border border-line p-3 text-xs text-paper font-mono leading-relaxed focus:border-paper focus:outline-none resize-y"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-paper/90 mb-1.5">Burmese (မြန်မာ)</label>
                  <textarea
                    rows={5}
                    value={typeof myVal === "string" ? myVal : ""}
                    onChange={(e) => setMyVal(e.target.value)}
                    className="w-full bg-ink-2 border border-line p-3 text-xs text-paper font-sans leading-relaxed focus:border-paper focus:outline-none resize-y"
                  />
                </div>
              </div>
            )}

            {(!target.kind || target.kind === "text") && (
              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-[11px] text-paper/90 mb-1.5">English</label>
                  <input
                    type="text"
                    value={typeof enVal === "string" ? enVal : ""}
                    onChange={(e) => setEnVal(e.target.value)}
                    className="w-full bg-ink-2 border border-line px-3 py-2 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-paper/90 mb-1.5">Burmese (မြန်မာ)</label>
                  <input
                    type="text"
                    value={typeof myVal === "string" ? myVal : ""}
                    onChange={(e) => setMyVal(e.target.value)}
                    className="w-full bg-ink-2 border border-line px-3 py-2 text-xs text-paper font-sans focus:border-paper focus:outline-none"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* CASE 2: Catalog item target */}
        {target.type === "catalogItem" && (
          <div className="space-y-6">
            {/* Section 1: Identification */}
            <div className="space-y-3 pb-4 border-b border-line">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Identification & Titles
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-mono text-[11px] text-paper/90 mb-1">Designation</label>
                  <input
                    type="text"
                    value={catCode}
                    onChange={(e) => setCatCode(e.target.value)}
                    placeholder="BL-004"
                    className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-paper/90 mb-1">Title (English)</label>
                  <input
                    type="text"
                    value={catTitleEn}
                    onChange={(e) => setCatTitleEn(e.target.value)}
                    placeholder="Artcodex"
                    className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[11px] text-paper/90 mb-1">Title (Burmese)</label>
                  <input
                    type="text"
                    value={catTitleMy}
                    onChange={(e) => setCatTitleMy(e.target.value)}
                    placeholder="Artcodex"
                    className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-sans focus:border-paper focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Facts & Metadata */}
            <div className="space-y-3 pb-4 border-b border-line">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Project Metadata & Facts
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-mono text-[11px] text-paper/90 mb-1">Status</label>
                  <select
                    value={catStatus}
                    onChange={(e) => setCatStatus(e.target.value as Status)}
                    className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                  >
                    <option value="ongoing">Ongoing (Beta / In development)</option>
                    <option value="live">Live (Production / Running)</option>
                    <option value="learning">Learning (Study / Research)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-paper/90 mb-1">Kind (Type)</label>
                  <select
                    value={catType}
                    onChange={(e) => setCatType(e.target.value as ItemType)}
                    className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                  >
                    <option value="app">App (Software tool / Web app)</option>
                    <option value="research">Research (Experiments / Exploration)</option>
                    <option value="learning">Learning (Simulations & Books)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-paper/90 mb-1">Topic (Category)</label>
                  <select
                    value={catCategory}
                    onChange={(e) => setCatCategory(e.target.value as CategoryId)}
                    className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                  >
                    <option value="art">Art & 3D</option>
                    <option value="ai">AI & Neural computing</option>
                    <option value="education">Education</option>
                    <option value="science">Science</option>
                    <option value="hardware">Hardware & robotics</option>
                    <option value="everyday">Everyday</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-paper/90 mb-1">Role</label>
                  <select
                    value={catRole}
                    onChange={(e) => setCatRole(e.target.value as Role)}
                    className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                  >
                    <option value="build">Design & build</option>
                    <option value="research">Research & build</option>
                    <option value="study">Independent study</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-paper/90 mb-1">Started (Year)</label>
                  <input
                    type="number"
                    value={catYear}
                    onChange={(e) => setCatYear(e.target.value)}
                    placeholder="2025"
                    className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-paper/90 mb-1">Data / Size (MB)</label>
                  <input
                    type="number"
                    step="any"
                    value={catSizeMB}
                    onChange={(e) => setCatSizeMB(e.target.value)}
                    placeholder="Leave blank for —"
                    className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-paper/90 mb-1">Launch Mode</label>
                  <select
                    value={catMode}
                    onChange={(e) => setCatMode(e.target.value as LaunchMode)}
                    className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                  >
                    <option value="link">External Link</option>
                    <option value="native">Native / Internal Sim</option>
                    <option value="embed">Embed</option>
                    <option value="soon">Coming Soon</option>
                    <option value="private">Private</option>
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-[11px] text-paper/90 mb-1">Link Target / URL</label>
                  <input
                    type="text"
                    value={catTarget}
                    onChange={(e) => setCatTarget(e.target.value)}
                    placeholder="https://artcodex.vercel.app"
                    className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block font-mono text-[11px] text-paper/90 mb-1">
                  Built with (Stack)
                </label>
                <input
                  type="text"
                  value={catStack}
                  onChange={(e) => setCatStack(e.target.value)}
                  placeholder="React, three.js, Django"
                  className="w-full bg-ink-2 border border-line px-3 py-1.5 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                />
                <span className="block font-mono text-[10px] text-muted mt-1">
                  Separate with commas or bullets (e.g. React, three.js, Django)
                </span>
              </div>

              <div className="pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer font-mono text-xs text-paper/90">
                  <input
                    type="checkbox"
                    checked={catOffline}
                    onChange={(e) => setCatOffline(e.target.checked)}
                    className="size-3.5 rounded border border-line bg-ink-2 text-white focus:ring-0"
                  />
                  <span>Works offline</span>
                </label>
              </div>
            </div>

            {/* Section 3: Descriptive Dossier */}
            <div className="space-y-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                Dossier & Descriptive Copy
              </div>
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1">
                  Standing Note (English)
                </label>
                <textarea
                  rows={3}
                  value={catStandingEn}
                  onChange={(e) => setCatStandingEn(e.target.value)}
                  className="w-full bg-ink-2 border border-line p-3 text-xs text-paper font-mono leading-relaxed focus:border-paper focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1">
                  Standing Note (Burmese · မြန်မာ)
                </label>
                <textarea
                  rows={3}
                  value={catStandingMy}
                  onChange={(e) => setCatStandingMy(e.target.value)}
                  className="w-full bg-ink-2 border border-line p-3 text-xs text-paper font-sans leading-relaxed focus:border-paper focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1">Summary (English)</label>
                <textarea
                  rows={3}
                  value={catSummaryEn}
                  onChange={(e) => setCatSummaryEn(e.target.value)}
                  className="w-full bg-ink-2 border border-line p-3 text-xs text-paper font-mono leading-relaxed focus:border-paper focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1">Summary (Burmese · မြန်မာ)</label>
                <textarea
                  rows={3}
                  value={catSummaryMy}
                  onChange={(e) => setCatSummaryMy(e.target.value)}
                  className="w-full bg-ink-2 border border-line p-3 text-xs text-paper font-sans leading-relaxed focus:border-paper focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1">About (English Dossier)</label>
                <textarea
                  rows={5}
                  value={catAboutEn}
                  onChange={(e) => setCatAboutEn(e.target.value)}
                  className="w-full bg-ink-2 border border-line p-3 text-xs text-paper font-mono leading-relaxed focus:border-paper focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1">About (Burmese Dossier)</label>
                <textarea
                  rows={5}
                  value={catAboutMy}
                  onChange={(e) => setCatAboutMy(e.target.value)}
                  className="w-full bg-ink-2 border border-line p-3 text-xs text-paper font-sans leading-relaxed focus:border-paper focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* CASE 3: Studio piece target */}
        {target.type === "studioPiece" && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1.5">Artwork Title (English)</label>
                <input
                  type="text"
                  value={studioTitleEn}
                  onChange={(e) => setStudioTitleEn(e.target.value)}
                  className="w-full bg-ink-2 border border-line px-3 py-2 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1.5">Artwork Title (Burmese · မြန်မာ)</label>
                <input
                  type="text"
                  value={studioTitleMy}
                  onChange={(e) => setStudioTitleMy(e.target.value)}
                  className="w-full bg-ink-2 border border-line px-3 py-2 text-xs text-paper font-sans focus:border-paper focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1.5">Medium / Technique (English)</label>
                <input
                  type="text"
                  value={studioMediumEn}
                  onChange={(e) => setStudioMediumEn(e.target.value)}
                  className="w-full bg-ink-2 border border-line px-3 py-2 text-xs text-paper font-mono focus:border-paper focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1.5">Medium / Technique (Burmese)</label>
                <input
                  type="text"
                  value={studioMediumMy}
                  onChange={(e) => setStudioMediumMy(e.target.value)}
                  className="w-full bg-ink-2 border border-line px-3 py-2 text-xs text-paper font-sans focus:border-paper focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1.5">About Artwork (English)</label>
                <textarea
                  rows={4}
                  value={studioAboutEn}
                  onChange={(e) => setStudioAboutEn(e.target.value)}
                  className="w-full bg-ink-2 border border-line p-3 text-xs text-paper font-mono leading-relaxed focus:border-paper focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1.5">About Artwork (Burmese)</label>
                <textarea
                  rows={4}
                  value={studioAboutMy}
                  onChange={(e) => setStudioAboutMy(e.target.value)}
                  className="w-full bg-ink-2 border border-line p-3 text-xs text-paper font-sans leading-relaxed focus:border-paper focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1.5">Interaction Hint (English)</label>
                <textarea
                  rows={3}
                  value={studioInteractEn}
                  onChange={(e) => setStudioInteractEn(e.target.value)}
                  className="w-full bg-ink-2 border border-line p-3 text-xs text-paper font-mono leading-relaxed focus:border-paper focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1.5">Interaction Hint (Burmese)</label>
                <textarea
                  rows={3}
                  value={studioInteractMy}
                  onChange={(e) => setStudioInteractMy(e.target.value)}
                  className="w-full bg-ink-2 border border-line p-3 text-xs text-paper font-sans leading-relaxed focus:border-paper focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions (Desktop & Mobile with safe-area padding) */}
      <div className="border-t border-line px-4 sm:px-6 py-3.5 pb-[max(1rem,env(safe-area-inset-bottom,0px))] bg-ink shrink-0 space-y-3">
        {error && (
          <div className="font-mono text-xs text-red-400 bg-red-950/30 border border-red-900/50 p-2.5 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="font-mono text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 p-2.5 rounded-md flex items-center gap-2">
            <span>✓</span> Published successfully! Page refreshed.
          </div>
        )}

        <div className="flex items-center gap-2.5 w-full">
          <button
            type="button"
            onClick={onBack}
            disabled={isPending}
            className="h-10 px-4 rounded-md border border-line-2 bg-ink-2 font-mono text-xs text-bone hover:border-white transition-colors cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 justify-center h-10 px-6 rounded-md bg-bone text-ink font-mono text-xs font-semibold hover:bg-white disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
          >
            {isPending ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                <span>Publishing…</span>
              </>
            ) : (
              <span>Save & Publish</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
