import { NextResponse } from "next/server";
import { getAdminTokenFromRequest } from "@/lib/adminSession";

export interface VercelDeploymentInfo {
  uid: string;
  name: string;
  url: string;
  created: number;
  state: "BUILDING" | "ERROR" | "INITIALIZING" | "QUEUED" | "READY" | "CANCELED";
  commitSha?: string;
  commitMessage?: string;
  target?: string;
}

interface RawVercelDeployment {
  uid: string;
  name: string;
  url?: string;
  created: number;
  state: VercelDeploymentInfo["state"];
  target?: string;
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
  };
}

export async function GET(req: Request) {
  try {
    const token = await getAdminTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;

    if (!vercelToken || !vercelProjectId) {
      return NextResponse.json({
        ok: false,
        configured: false,
        hint: "To enable live Vercel build status and redeploy triggers, add VERCEL_TOKEN and VERCEL_PROJECT_ID to web/.env.local",
        deployments: [],
      });
    }

    const res = await fetch(`https://api.vercel.com/v6/deployments?projectId=${vercelProjectId}&limit=5`, {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({
        ok: false,
        configured: true,
        error: `Vercel API error (${res.status}): ${errText}`,
        deployments: [],
      });
    }

    const data = await res.json();
    const rawDeployments: RawVercelDeployment[] = data.deployments || [];
    const deployments: VercelDeploymentInfo[] = rawDeployments.map((d) => ({
      uid: d.uid,
      name: d.name,
      url: d.url ? `https://${d.url}` : "",
      created: d.created,
      state: d.state,
      commitSha: d.meta?.githubCommitSha?.slice(0, 7),
      commitMessage: d.meta?.githubCommitMessage,
      target: d.target,
    }));

    return NextResponse.json({
      ok: true,
      configured: true,
      deployments,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const token = await getAdminTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;

    if (!vercelToken || !vercelProjectId) {
      return NextResponse.json(
        {
          ok: false,
          error: "VERCEL_TOKEN or VERCEL_PROJECT_ID is not configured in web/.env.local",
        },
        { status: 400 }
      );
    }

    // Trigger redeploy via Vercel Deployments API
    const res = await fetch(`https://api.vercel.com/v13/deployments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "burmanlabs",
        project: vercelProjectId,
        target: "production",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ ok: false, error: `Vercel redeploy failed: ${errText}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({
      ok: true,
      message: "Vercel production build triggered successfully",
      deployment: {
        uid: data.id,
        url: data.url ? `https://${data.url}` : "",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Redeploy failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
