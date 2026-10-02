interface NetworkInfo {
  saveData?: boolean;
  effectiveType?: string;
}

/** True when WebGL works and the connection is not flagged as data-saving or 2G. */
export function canRun3D(): boolean {
  try {
    const c = document.createElement("canvas");
    if (!(c.getContext("webgl2") || c.getContext("webgl"))) return false;
  } catch {
    return false;
  }
  const conn = (navigator as Navigator & { connection?: NetworkInfo }).connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType === "slow-2g" || conn?.effectiveType === "2g") return false;
  return true;
}
