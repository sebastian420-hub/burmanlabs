import studioJson from "./studio.json";
import type { Piece, PieceId } from "@/lib/types";

export type { Piece, PieceId };

/** Artworks from the original Burmanlabs portfolio, ported to run natively here. */
export const pieces: Piece[] = studioJson as Piece[];

export const getPiece = (id: string) => pieces.find((p) => p.id === id);
