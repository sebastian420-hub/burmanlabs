import type { Locale } from "@/lib/i18n";
import type my from "@/dictionaries/my.json";

export type L = Record<Locale, string>;

export type ItemType = "app" | "research" | "learning";
export type CategoryId = "ai" | "education" | "art" | "science" | "hardware" | "everyday";
export type Status = "live" | "ongoing" | "learning";
export type Role = "build" | "research" | "study";
export type LaunchMode = "link" | "embed" | "native" | "soon" | "private";

export interface CatalogItem {
  id: string;
  code: string;
  type: ItemType;
  category: CategoryId;
  status: Status;
  role: Role;
  year: number;
  title: L;
  summary: L;
  about: L;
  standing: L;
  mode: LaunchMode;
  target?: string;
  stack?: string[];
  shot?: string;
  gallery?: { shot: string; caption: L }[];
  art?: "lines" | "tiles" | "orbits";
  sizeMB?: number;
  offline?: boolean;
}

export type Dict = typeof my;

export type PieceId = "quantum" | "pulse" | "mandalay" | "binary";

export interface Piece {
  id: PieceId;
  title: L;
  medium: L;
  about: L;
  interact: L;
  source: string;
  webgl: boolean;
}
