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

export async function POST(req: Request) {
  try {
    const token = await getAdminTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { file, content } = body || {};

    if (!file || !ALLOWED_FILES[file]) {
      return NextResponse.json(
        { ok: false, error: `Invalid file target. Must be one of: ${Object.keys(ALLOWED_FILES).join(", ")}` },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "object") {
      return NextResponse.json({ ok: false, error: "Content must be a valid JSON object or array" }, { status: 400 });
    }

    const relPath = ALLOWED_FILES[file];
    const isVercel = process.env.VERCEL === "1";
    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO;
    const githubBranch = process.env.GITHUB_BRANCH || "main";

    // If running in production on Vercel with GitHub token provided, commit via GitHub API
    if (isVercel || (githubToken && githubRepo)) {
      if (!githubToken || !githubRepo) {
        return NextResponse.json(
          { ok: false, error: "Production mode requires GITHUB_TOKEN and GITHUB_REPO to commit changes" },
          { status: 500 }
        );
      }

      // Check repo relative path: usually "web/dictionaries/en.json" in monorepo/repo root
      const repoPath = `web/${relPath}`;
      const apiUrl = `https://api.github.com/repos/${githubRepo}/contents/${repoPath}?ref=${githubBranch}`;

      // 1. Get current file sha
      const getRes = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Burmanlabs-Admin",
        },
      });

      let currentSha: string | undefined;
      if (getRes.ok) {
        const fileData = await getRes.json();
        currentSha = fileData.sha;
      }

      // 2. Put updated file
      const updatedJsonString = JSON.stringify(content, null, 2) + "\n";
      const base64Content = Buffer.from(updatedJsonString, "utf-8").toString("base64");

      const putRes = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${repoPath}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          "User-Agent": "Burmanlabs-Admin",
        },
        body: JSON.stringify({
          message: `admin: update ${file}`,
          content: base64Content,
          sha: currentSha,
          branch: githubBranch,
        }),
      });

      if (!putRes.ok) {
        const errorText = await putRes.text();
        return NextResponse.json(
          { ok: false, error: `GitHub API error: ${putRes.status} ${errorText}` },
          { status: putRes.status }
        );
      }

      const commitResult = await putRes.json();

      // If running locally with GitHub token enabled, also sync local disk file so dev server hot-reloads
      if (!isVercel) {
        try {
          const cwd = process.cwd();
          const candidateA = path.join(cwd, relPath);
          const candidateB = path.join(cwd, "web", relPath);
          const targetFilePath = fs.existsSync(candidateA)
            ? candidateA
            : fs.existsSync(candidateB)
            ? candidateB
            : candidateA;
          fs.writeFileSync(targetFilePath, updatedJsonString, "utf-8");
        } catch {
          // Local write sync failed, but GitHub commit succeeded
        }
      }

      return NextResponse.json({ ok: true, source: "github", commit: commitResult.commit?.sha });
    }

    // Local filesystem write
    const cwd = process.cwd();
    const candidateA = path.join(cwd, relPath);
    const candidateB = path.join(cwd, "web", relPath);

    const targetFilePath = fs.existsSync(candidateA)
      ? candidateA
      : fs.existsSync(candidateB)
      ? candidateB
      : candidateA;

    const formatted = JSON.stringify(content, null, 2) + "\n";
    fs.writeFileSync(targetFilePath, formatted, "utf-8");

    return NextResponse.json({ ok: true, source: "local", path: targetFilePath });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
