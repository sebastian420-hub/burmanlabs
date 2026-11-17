import { NextResponse } from "next/server";
import { getAdminTokenFromRequest } from "@/lib/adminSession";

export async function GET(req: Request) {
  try {
    const token = await getAdminTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized: Admin session required" }, { status: 401 });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO || "sebastian420-hub/burmanlabs";

    if (!githubToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "GITHUB_TOKEN is missing in web/.env.local",
          hint: "Add your GitHub token to web/.env.local next to GITHUB_TOKEN=",
        },
        { status: 400 }
      );
    }

    // 1. Verify User & Token
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Burmanlabs-Admin-Test",
      },
      cache: "no-store",
    });

    if (!userRes.ok) {
      const errText = await userRes.text();
      return NextResponse.json(
        { ok: false, error: `Invalid GitHub Token (${userRes.status}): ${errText}` },
        { status: userRes.status }
      );
    }

    const userData = await userRes.json();

    // 2. Verify Repository & Write Permissions
    const repoRes = await fetch(`https://api.github.com/repos/${githubRepo}`, {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Burmanlabs-Admin-Test",
      },
      cache: "no-store",
    });

    if (!repoRes.ok) {
      const errText = await repoRes.text();
      return NextResponse.json(
        { ok: false, error: `Cannot access repository ${githubRepo} (${repoRes.status}): ${errText}` },
        { status: repoRes.status }
      );
    }

    const repoData = await repoRes.json();
    const canPush = Boolean(repoData.permissions?.push);

    return NextResponse.json({
      ok: true,
      authenticatedAs: userData.login,
      repository: repoData.full_name,
      isPrivate: repoData.private,
      canPush,
      defaultBranch: repoData.default_branch,
      message: canPush
        ? "✓ GitHub token is valid and has push/commit access to the repository!"
        : "⚠️ Token is valid, but does NOT have write/push access. Ensure 'repo' scope is selected.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
