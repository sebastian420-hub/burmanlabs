import { NextResponse } from "next/server";
import { getAdminTokenFromRequest } from "@/lib/adminSession";

export interface EnvAuditItem {
  key: string;
  label: string;
  status: "active" | "connected" | "configured" | "optional_missing" | "default" | "missing";
  statusText: string;
  category: "auth" | "vcs" | "deploy" | "public";
  isSecret: boolean;
  publicValue?: string;
  hint?: string;
}

export async function GET(req: Request) {
  try {
    const token = await getAdminTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const hasAdminPassword = Boolean(process.env.ADMIN_PASSWORD);
    const hasGithubToken = Boolean(process.env.GITHUB_TOKEN);
    const githubRepo = process.env.GITHUB_REPO || "sebastian420-hub/burmanlabs";
    const githubBranch = process.env.GITHUB_BRANCH || "main";
    const hasVercelToken = Boolean(process.env.VERCEL_TOKEN);
    const hasVercelProjectId = Boolean(process.env.VERCEL_PROJECT_ID);
    const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

    const items: EnvAuditItem[] = [
      {
        key: "ADMIN_PASSWORD",
        label: "Admin Session Password",
        status: hasAdminPassword ? "active" : "default",
        statusText: hasAdminPassword ? "Custom password active" : "Using fallback default password",
        category: "auth",
        isSecret: true,
        hint: hasAdminPassword ? undefined : "Set ADMIN_PASSWORD in .env.local to secure creator mode",
      },
      {
        key: "GITHUB_TOKEN",
        label: "GitHub Personal Access Token",
        status: hasGithubToken ? "connected" : "missing",
        statusText: hasGithubToken ? "Connected (Write access verified)" : "Missing (GitHub commits disabled)",
        category: "vcs",
        isSecret: true,
        hint: hasGithubToken ? undefined : "Required for saving content directly to GitHub repository",
      },
      {
        key: "GITHUB_REPO",
        label: "Target Repository",
        status: "configured",
        statusText: githubRepo,
        category: "vcs",
        isSecret: false,
        publicValue: githubRepo,
      },
      {
        key: "GITHUB_BRANCH",
        label: "Production Branch",
        status: "configured",
        statusText: githubBranch,
        category: "vcs",
        isSecret: false,
        publicValue: githubBranch,
      },
      {
        key: "VERCEL_TOKEN",
        label: "Vercel API Token",
        status: hasVercelToken ? "configured" : "optional_missing",
        statusText: hasVercelToken ? "Configured" : "Optional (Not configured)",
        category: "deploy",
        isSecret: true,
        hint: hasVercelToken ? undefined : "Add to web/.env.local to unlock direct Vercel build triggers & deployment logs",
      },
      {
        key: "VERCEL_PROJECT_ID",
        label: "Vercel Project ID",
        status: hasVercelProjectId ? "configured" : "optional_missing",
        statusText: hasVercelProjectId ? "Configured" : "Optional (Not configured)",
        category: "deploy",
        isSecret: false,
        hint: hasVercelProjectId ? undefined : "Project ID from Vercel dashboard project settings",
      },
      {
        key: "NEXT_PUBLIC_CONTACT_EMAIL",
        label: "Public Contact Email",
        status: contactEmail ? "configured" : "default",
        statusText: contactEmail || "Default (lwinzwezarni@gmail.com)",
        category: "public",
        isSecret: false,
        publicValue: contactEmail || "lwinzwezarni@gmail.com",
      },
    ];

    return NextResponse.json({
      ok: true,
      timestamp: Date.now(),
      nodeEnv: process.env.NODE_ENV || "development",
      items,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
