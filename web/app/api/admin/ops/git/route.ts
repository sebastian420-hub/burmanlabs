import { NextResponse } from "next/server";
import { getAdminTokenFromRequest } from "@/lib/adminSession";

export interface GitCommitInfo {
  sha: string;
  fullSha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface GitWorkflowRunInfo {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  url: string;
  createdAt: string;
  commitSha?: string;
}

interface RawGitHubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
}

interface RawGitHubRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
  head_sha?: string;
}

export async function GET(req: Request) {
  try {
    const token = await getAdminTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const githubToken = process.env.GITHUB_TOKEN;
    const githubRepo = process.env.GITHUB_REPO || "sebastian420-hub/burmanlabs";
    const githubBranch = process.env.GITHUB_BRANCH || "main";

    if (!githubToken) {
      return NextResponse.json({
        ok: false,
        error: "GITHUB_TOKEN is missing in web/.env.local",
        repo: githubRepo,
        branch: githubBranch,
        commits: [],
        runs: [],
      });
    }

    const headers = {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Burmanlabs-Ops-Deck/1.0",
    };

    let gitError: string | undefined;

    // 1. Fetch recent commits on the target branch
    const commitsPromise = fetch(
      `https://api.github.com/repos/${githubRepo}/commits?sha=${githubBranch}&per_page=6`,
      { headers, cache: "no-store" }
    )
      .then(async (r) => {
        if (!r.ok) {
          const errText = await r.text();
          gitError = `GitHub error (${r.status}): ${errText}`;
          return [];
        }
        const data = await r.json();
        if (!Array.isArray(data)) return [];
        return data.map((c: RawGitHubCommit) => ({
          sha: c.sha.slice(0, 7),
          fullSha: c.sha,
          message: c.commit.message.split("\n")[0],
          author: c.commit.author.name,
          date: c.commit.author.date,
          url: c.html_url,
        }));
      })
      .catch((err) => {
        gitError = err instanceof Error ? err.message : "Network failure";
        return [];
      });

    // 2. Fetch recent GitHub Actions workflow runs
    const runsPromise = fetch(
      `https://api.github.com/repos/${githubRepo}/actions/runs?per_page=5`,
      { headers, cache: "no-store" }
    )
      .then(async (r) => {
        if (!r.ok) return [];
        const data = await r.json();
        const runs: RawGitHubRun[] = data.workflow_runs || [];
        return runs.map((w) => ({
          id: w.id,
          name: w.name,
          status: w.status,
          conclusion: w.conclusion,
          url: w.html_url,
          createdAt: w.created_at,
          commitSha: w.head_sha?.slice(0, 7),
        }));
      })
      .catch(() => []);

    const [commits, runs] = await Promise.all([commitsPromise, runsPromise]);

    return NextResponse.json({
      ok: true,
      repo: githubRepo,
      branch: githubBranch,
      commits,
      runs,
      error: gitError,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
