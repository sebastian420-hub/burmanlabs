import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAdminTokenFromRequest } from "@/lib/adminSession";

const ALLOWED_FILES: Record<string, string> = {
  en: "dictionaries/en.json",
  my: "dictionaries/my.json",
  catalog: "content/catalog.json",
  studio: "content/studio.json",
};

export async function GET(req: Request) {
  try {
    const token = await getAdminTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const file = searchParams.get("file");

    if (!file || !ALLOWED_FILES[file]) {
      return NextResponse.json(
        { ok: false, error: `Invalid file. Must be one of: ${Object.keys(ALLOWED_FILES).join(", ")}` },
        { status: 400 }
      );
    }

    const relPath = ALLOWED_FILES[file];
    const cwd = process.cwd();
    const candidateA = path.join(cwd, relPath);
    const candidateB = path.join(cwd, "web", relPath);

    const targetFilePath = fs.existsSync(candidateA)
      ? candidateA
      : fs.existsSync(candidateB)
      ? candidateB
      : candidateA;

    if (fs.existsSync(targetFilePath)) {
      const raw = fs.readFileSync(targetFilePath, "utf-8");
      return NextResponse.json({ ok: true, data: JSON.parse(raw) });
    }

    return NextResponse.json({ ok: false, error: "File not found" }, { status: 404 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
