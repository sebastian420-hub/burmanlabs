import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminTokenFromRequest } from "@/lib/adminSession";

export async function POST(req: Request) {
  try {
    const token = await getAdminTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Purge the root layout and key locale paths
    revalidatePath("/", "layout");
    revalidatePath("/en", "layout");
    revalidatePath("/my", "layout");

    return NextResponse.json({
      ok: true,
      timestamp: Date.now(),
      message: "Cache purged and revalidated across all routes",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Revalidation failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
