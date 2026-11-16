"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { CatalogItem, Piece, Status } from "@/lib/types";
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
}

export function EditDrawer({ isOpen, activeTarget, onClose, onSelectTarget }: EditDrawerProps) {
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
        className="w-full max-w-xl h-dvh max-h-screen bg-ink border-l border-line shadow-2xl flex flex-col justify-between overflow-hidden"
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
          />
        )}
      </aside>
    </div>
  );
}

function GitHubTestButton() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleTest() {
    setTesting(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/test-github", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setIsSuccess(true);
        setResult(`✓ Connected to ${data.repository} (${data.authenticatedAs})`);
      } else {
        setIsSuccess(false);
        setResult(data.error || "GitHub connection failed");
      }
    } catch (err: unknown) {
      setIsSuccess(false);
      setResult(err instanceof Error ? err.message : "Network error");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {result && (
        <span
          className={`font-mono text-[10px] ${
            isSuccess ? "text-emerald-400" : "text-amber-400"
          }`}
        >
          {result}
        </span>
      )}
      <button
        type="button"
        onClick={handleTest}
        disabled={testing}
        className="px-2 py-0.5 bg-ink-2 border border-line hover:border-white text-white font-mono text-[10px] rounded transition-colors cursor-pointer disabled:opacity-50"
      >
        {testing ? "Checking…" : "⚡ Test GitHub Connection"}
      </button>
    </div>
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
}: NavigatorViewProps) {
  return (
    <>
      {/* Top Header */}
      <div className="p-6 pb-4 border-b border-line bg-ink shrink-0 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted">Burmanlabs Admin</div>
            <h2 className="font-mono text-base font-semibold text-paper mt-0.5">Content Manager</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-paper px-2 py-1 font-mono text-xs cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Live Search */}
        <div className="relative">
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search all copy (e.g. drone, Artcodex, bio, email)…"
            className="w-full bg-ink-2 border border-line px-3.5 py-2 text-xs text-paper font-mono placeholder:text-muted/60 focus:border-paper focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-muted hover:text-paper font-mono text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const isActive = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-2.5 py-1 font-mono text-[11px] whitespace-nowrap transition-colors cursor-pointer rounded border ${
                  isActive
                    ? "bg-black border-bone text-white font-semibold shadow-sm"
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
      <div className="flex-1 min-h-0 overflow-y-auto p-6 divide-y divide-line">
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

      {/* Footer Info */}
      <div className="border-t border-line px-6 py-3 bg-ink shrink-0 flex items-center justify-between text-muted font-mono text-[11px]">
        <span>Showing {entries.length} of {totalCount} editable fields</span>
        <div className="flex items-center gap-3">
          <GitHubTestButton />
          <span>Esc to close</span>
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
  const [catStatus, setCatStatus] = useState<Status>(
    target.type === "catalogItem" ? target.item.status : "ongoing"
  );
  const [catStandingEn, setCatStandingEn] = useState(
    target.type === "catalogItem" ? target.item.standing.en || "" : ""
  );
  const [catStandingMy, setCatStandingMy] = useState(
    target.type === "catalogItem" ? target.item.standing.my || "" : ""
  );
  const [catSummaryEn, setCatSummaryEn] = useState(
    target.type === "catalogItem" ? target.item.summary.en || "" : ""
  );
  const [catSummaryMy, setCatSummaryMy] = useState(
    target.type === "catalogItem" ? target.item.summary.my || "" : ""
  );
  const [catAboutEn, setCatAboutEn] = useState(
    target.type === "catalogItem" ? target.item.about.en || "" : ""
  );
  const [catAboutMy, setCatAboutMy] = useState(
    target.type === "catalogItem" ? target.item.about.my || "" : ""
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
          const patch: Partial<CatalogItem> = {
            status: catStatus,
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
      <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-ink shrink-0">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="font-mono text-[11px] text-muted hover:text-paper transition-colors flex items-center gap-1 cursor-pointer"
          >
            ← All Content
          </button>
          <h2 className="font-mono text-base font-semibold text-paper mt-1">{target.label}</h2>
          {target.type === "dictionary" && target.description && (
            <p className="font-mono text-xs text-muted mt-0.5">{target.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-3.5 py-1.5 bg-black border border-line-2 text-white font-mono text-xs font-medium hover:border-white disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {isPending ? (
              <>
                <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-white border-t-transparent" />
                <span>Saving…</span>
              </>
            ) : (
              <span>Save & Publish</span>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="text-muted hover:text-paper px-2 py-1 font-mono text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
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
            <div>
              <label className="block font-mono text-[11px] text-paper/90 mb-1.5">Project Status</label>
              <select
                value={catStatus}
                onChange={(e) => setCatStatus(e.target.value as Status)}
                className="w-full bg-ink-2 border border-line px-3 py-2 text-xs text-paper font-mono focus:border-paper focus:outline-none"
              >
                <option value="live">live (Live / Production)</option>
                <option value="ongoing">ongoing (Work in progress / Beta)</option>
                <option value="learning">learning (Study / Exploration)</option>
              </select>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1.5">
                  Standing Note (English)
                </label>
                <textarea
                  rows={4}
                  value={catStandingEn}
                  onChange={(e) => setCatStandingEn(e.target.value)}
                  className="w-full bg-ink-2 border border-line p-3 text-xs text-paper font-mono leading-relaxed focus:border-paper focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1.5">
                  Standing Note (Burmese · မြန်မာ)
                </label>
                <textarea
                  rows={4}
                  value={catStandingMy}
                  onChange={(e) => setCatStandingMy(e.target.value)}
                  className="w-full bg-ink-2 border border-line p-3 text-xs text-paper font-sans leading-relaxed focus:border-paper focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1.5">Summary (English)</label>
                <textarea
                  rows={3}
                  value={catSummaryEn}
                  onChange={(e) => setCatSummaryEn(e.target.value)}
                  className="w-full bg-ink-2 border border-line p-3 text-xs text-paper font-mono leading-relaxed focus:border-paper focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1.5">Summary (Burmese · မြန်မာ)</label>
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
                <label className="block font-mono text-[11px] text-paper/90 mb-1.5">About (English Dossier)</label>
                <textarea
                  rows={5}
                  value={catAboutEn}
                  onChange={(e) => setCatAboutEn(e.target.value)}
                  className="w-full bg-ink-2 border border-line p-3 text-xs text-paper font-mono leading-relaxed focus:border-paper focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] text-paper/90 mb-1.5">About (Burmese Dossier)</label>
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

      {/* Footer Actions */}
      <div className="border-t border-line px-6 py-4 bg-ink shrink-0">
        {error && (
          <div className="mb-3 font-mono text-xs text-red-400 bg-red-950/30 border border-red-900/50 p-2.5">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-3 font-mono text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 p-2.5 flex items-center gap-2">
            <span>✓</span> Published successfully! Page refreshed.
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={isPending}
            className="px-4 py-2 border border-line font-mono text-xs text-white hover:border-line-2 transition-colors cursor-pointer"
          >
            ← Back to All
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-5 py-2 bg-black border border-line-2 text-white font-mono text-xs font-medium hover:border-white disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            {isPending ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Publishing…
              </>
            ) : (
              "Save & Publish"
            )}
          </button>
        </div>
      </div>
    </>
  );
}
