import type { CatalogItem, Piece } from "./types";

export interface SaveResponse {
  ok: boolean;
  error?: string;
  source?: "local" | "github";
  commit?: string;
}

export type AdminFileTarget = "en" | "my" | "catalog" | "studio";

const ADMIN_STORAGE_KEY = "burmanlabs_admin_token";

export async function checkAdminAuth(): Promise<boolean> {
  try {
    const headers: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (storedToken) {
        headers["Authorization"] = `Bearer ${storedToken}`;
      }
    }

    const res = await fetch("/api/admin/auth", { cache: "no-store", headers });
    if (!res.ok) return false;
    const data = await res.json();
    const isAdmin = Boolean(data.isAdmin);

    if (!isAdmin && typeof window !== "undefined") {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    }

    return isAdmin;
  } catch {
    return false;
  }
}

export async function loginAdmin(
  password: string,
  rememberMe = true
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, rememberMe }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || "Failed to authenticate" };
    }

    if (typeof window !== "undefined") {
      if (data.token) {
        localStorage.setItem(ADMIN_STORAGE_KEY, data.token);
      } else {
        localStorage.removeItem(ADMIN_STORAGE_KEY);
      }
    }

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
    await fetch("/api/admin/auth", { method: "DELETE" });
  } catch {
    // Ignore network errors on logout
  }
}

export async function fetchFileContent<T = unknown>(file: AdminFileTarget): Promise<T> {
  const res = await fetch(`/api/admin/content?file=${file}`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json.error || `Failed to fetch ${file}`);
  }
  return json.data as T;
}

export async function saveFile(file: AdminFileTarget, content: unknown): Promise<SaveResponse> {
  const res = await fetch("/api/admin/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file, content }),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) {
    return { ok: false, error: json.error || "Failed to save file" };
  }
  return json;
}

// Helper to set nested object path e.g. "home.about.bio"
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

export async function saveDictionaryField(
  keyPath: string,
  enVal: unknown,
  myVal: unknown
): Promise<{ ok: boolean; error?: string }> {
  try {
    const [enData, myData] = await Promise.all([
      fetchFileContent<Record<string, unknown>>("en"),
      fetchFileContent<Record<string, unknown>>("my"),
    ]);

    setNestedValue(enData, keyPath, enVal);
    setNestedValue(myData, keyPath, myVal);

    const enSave = await saveFile("en", enData);
    if (!enSave.ok) return enSave;

    const mySave = await saveFile("my", myData);
    if (!mySave.ok) return mySave;

    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Error saving dictionary field" };
  }
}

export async function saveCatalogItemField(
  itemId: string,
  patch: Partial<CatalogItem>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const catalogData = await fetchFileContent<CatalogItem[]>("catalog");
    const index = catalogData.findIndex((it) => it.id === itemId);
    if (index === -1) {
      return { ok: false, error: `Item ${itemId} not found in catalog` };
    }

    catalogData[index] = {
      ...catalogData[index],
      ...patch,
      standing: {
        ...catalogData[index].standing,
        ...(patch.standing || {}),
      },
      title: {
        ...catalogData[index].title,
        ...(patch.title || {}),
      },
      about: {
        ...catalogData[index].about,
        ...(patch.about || {}),
      },
      summary: {
        ...catalogData[index].summary,
        ...(patch.summary || {}),
      },
    };

    return await saveFile("catalog", catalogData);
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Error saving catalog item" };
  }
}

export async function saveStudioPieceField(
  pieceId: string,
  patch: Partial<Piece>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const studioData = await fetchFileContent<Piece[]>("studio");
    const index = studioData.findIndex((p) => p.id === pieceId);
    if (index === -1) {
      return { ok: false, error: `Studio piece ${pieceId} not found` };
    }

    studioData[index] = {
      ...studioData[index],
      ...patch,
      title: {
        ...studioData[index].title,
        ...(patch.title || {}),
      },
      medium: {
        ...studioData[index].medium,
        ...(patch.medium || {}),
      },
      about: {
        ...studioData[index].about,
        ...(patch.about || {}),
      },
      interact: {
        ...studioData[index].interact,
        ...(patch.interact || {}),
      },
    };

    return await saveFile("studio", studioData);
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Error saving studio piece" };
  }
}
