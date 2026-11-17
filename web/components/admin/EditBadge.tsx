"use client";

import { useAdmin } from "./AdminProvider";
import type { EditTarget } from "./types";

interface EditBadgeProps {
  target: EditTarget;
  className?: string;
  label?: string;
}

export function EditBadge({ target, className = "", label }: EditBadgeProps) {
  const { isAdmin, openEdit } = useAdmin();

  if (!isAdmin) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        openEdit(target);
      }}
      title={label || `Edit ${target.label}`}
      aria-label={label || `Edit ${target.label}`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[10px] tracking-tight text-paper/80 bg-ink-2/90 border border-line-2 hover:border-paper/60 hover:text-paper shadow-sm backdrop-blur transition-all cursor-pointer ${className}`}
    >
      <span className="size-1 rounded-full bg-signal" />
      <span>{label || "Edit"}</span>
    </button>
  );
}
