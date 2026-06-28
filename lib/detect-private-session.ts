/** Best-effort private/incognito detection. Server-side fingerprint is the primary guard. */
export async function detectPrivateSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const estimate = await navigator.storage?.estimate?.();
    const quota = estimate?.quota;
    if (typeof quota === "number" && quota > 0 && quota < 120_000_000) {
      return true;
    }
  } catch {
    /* ignore */
  }

  try {
    const w = window as Window & {
      webkitRequestFileSystem?: (
        type: number,
        size: number,
        success: () => void,
        error: () => void
      ) => void;
    };
    if (w.webkitRequestFileSystem) {
      const webkitPrivate = await new Promise<boolean>((resolve) => {
        w.webkitRequestFileSystem!(0, 1, () => resolve(false), () => resolve(true));
      });
      if (webkitPrivate) return true;
    }
  } catch {
    /* ignore */
  }

  try {
    const dbName = `__cs_priv_${Date.now()}__`;
    const blocked = await new Promise<boolean>((resolve) => {
      const req = indexedDB.open(dbName, 1);
      req.onerror = () => resolve(true);
      req.onsuccess = () => {
        req.result.close();
        indexedDB.deleteDatabase(dbName);
        resolve(false);
      };
    });
    if (blocked) return true;
  } catch {
    return true;
  }

  try {
    const key = "__cs_priv_probe__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
  } catch {
    return true;
  }

  return false;
}
