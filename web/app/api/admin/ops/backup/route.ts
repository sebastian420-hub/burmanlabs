import { NextResponse } from "next/server";
import { getAdminTokenFromRequest } from "@/lib/adminSession";
import catalog from "@/content/catalog.json";
import studio from "@/content/studio.json";
import en from "@/dictionaries/en.json";
import my from "@/dictionaries/my.json";

export async function GET(req: Request) {
  try {
    const token = await getAdminTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const dateStr = new Date().toISOString().split("T")[0];
    const payload = {
      meta: {
        exportedAt: new Date().toISOString(),
        site: "Burmanlabs",
        generator: "Burmanlabs DevOps Content Backup",
      },
      catalog,
      studio,
      dictionaries: {
        en,
        my,
      },
    };

    const jsonStr = JSON.stringify(payload, null, 2);

    return new NextResponse(jsonStr, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="burmanlabs-content-backup-${dateStr}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
