import type { CatalogItem, Piece } from "@/lib/types";

export type DictionaryEditKind = "text" | "textarea" | "heroTitle" | "stringArray";

export interface DictionaryEditTarget {
  type: "dictionary";
  keyPath: string;
  label: string;
  description?: string;
  category?: string;
  kind?: DictionaryEditKind;
  currentEn: unknown;
  currentMy: unknown;
}

export interface CatalogItemEditTarget {
  type: "catalogItem";
  itemId: string;
  label: string;
  category?: string;
  item: CatalogItem;
}

export interface StudioPieceEditTarget {
  type: "studioPiece";
  pieceId: string;
  label: string;
  category?: string;
  piece: Piece;
}

export type EditTarget = DictionaryEditTarget | CatalogItemEditTarget | StudioPieceEditTarget;

export interface AdminContextType {
  isAdmin: boolean;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  activeEdit: EditTarget | null;
  isManagerOpen: boolean;
  isCortexOpen: boolean;
  openEdit: (target: EditTarget) => void;
  openManager: () => void;
  closeEdit: () => void;
  openCortex: () => void;
  closeCortex: () => void;
  login: (password: string, rememberMe?: boolean) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}
