"use client";

import { useState, useTransition, type FormEvent } from "react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => Promise<{ ok: boolean; error?: string }>;
}

export function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isOpen) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;

    setError(null);
    startTransition(async () => {
      const res = await onLogin(password);
      if (res.ok) {
        setPassword("");
        onClose();
      } else {
        setError(res.error || "Incorrect password");
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm border border-line bg-ink p-5 sm:p-6 shadow-2xl touch-manipulation"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted">Burmanlabs</div>
            <h2 className="font-mono text-sm font-medium text-paper">Admin Unlock</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="px-2.5 py-1 text-xs rounded bg-ink-2 border border-line-2 hover:border-white text-bone font-mono transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <span>✕</span>
            <span>Close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block font-mono text-[11px] text-muted mb-1.5" htmlFor="admin-pwd">
              Password
            </label>
            <input
              id="admin-pwd"
              type="password"
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              enterKeyHint="go"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password…"
              className="w-full bg-ink-2 border border-line px-3 py-2 text-base sm:text-sm text-paper placeholder:text-muted/50 focus:border-paper focus:outline-none font-mono"
            />
          </div>

          {error && (
            <div className="font-mono text-[11px] text-red-400 bg-red-950/30 border border-red-900/50 px-2.5 py-1.5">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 sm:py-1.5 border border-line font-mono text-xs text-muted hover:text-paper hover:border-line-2 transition-colors rounded cursor-pointer active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !password}
              className="flex-1 sm:flex-initial px-5 py-2 sm:py-1.5 bg-paper text-ink font-mono text-xs font-semibold hover:bg-white disabled:opacity-50 transition-opacity rounded cursor-pointer active:scale-95 shadow-md"
            >
              {isPending ? "Unlocking…" : "Unlock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
