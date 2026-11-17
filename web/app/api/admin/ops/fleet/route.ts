import { NextResponse } from "next/server";
import { getAdminTokenFromRequest } from "@/lib/adminSession";
import catalog from "@/content/catalog.json";

export interface FleetTargetResult {
  id: string;
  code: string;
  name: string;
  url: string;
  category: string;
  status: number;
  latencyMs: number;
  ok: boolean;
  error?: string;
}

async function pingUrl(url: string): Promise<{ status: number; latencyMs: number; ok: boolean; error?: string }> {
  const start = performance.now();
  try {
    let res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "Burmanlabs-Ops-Fleet/1.0" },
      signal: AbortSignal.timeout(6000),
      cache: "no-store",
    });

    if (res.status === 405) {
      res = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "Burmanlabs-Ops-Fleet/1.0", Range: "bytes=0-0" },
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      });
    }

    const latencyMs = Math.round(performance.now() - start);
    return {
      status: res.status,
      latencyMs,
      ok: res.ok,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      status: 0,
      latencyMs,
      ok: false,
      error: err instanceof Error ? err.message : "Connection failed",
    };
  }
}

export async function GET(req: Request) {
  try {
    const token = await getAdminTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const currentOrigin = `${protocol}://${host}`;

    // Target list to ping
    const rawTargets: { id: string; code: string; name: string; url: string; category: string }[] = [
      {
        id: "main-site",
        code: "SITE",
        name: "Burmanlabs Main",
        url: currentOrigin,
        category: "infrastructure",
      },
    ];

    // Add external targets from catalog
    for (const item of catalog) {
      if (item.target && item.target.startsWith("http")) {
        rawTargets.push({
          id: item.id,
          code: item.code,
          name: item.title.en,
          url: item.target,
          category: item.category,
        });
      }
    }

    // Ping all targets concurrently
    const pingResults = await Promise.all(
      rawTargets.map(async (t) => {
        const ping = await pingUrl(t.url);
        return {
          ...t,
          status: ping.status,
          latencyMs: ping.latencyMs,
          ok: ping.ok,
          error: ping.error,
        } satisfies FleetTargetResult;
      })
    );

    return NextResponse.json({
      ok: true,
      timestamp: Date.now(),
      targets: pingResults,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
