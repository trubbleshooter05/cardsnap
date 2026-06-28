/** Best-effort private/incognito detection (Safari Private Relay, Chrome, Firefox). */
export async function detectPrivateSession(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    if (navigator.storage?.estimate) {
      const { quota } = await navigator.storage.estimate();
      if (typeof quota === "number" && quota > 0 && quota < 120_000_000) {
        return true;
      }
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
      return await new Promise<boolean>((resolve) => {
        w.webkitRequestFileSystem!(0, 1, () => resolve(false), () => resolve(true));
      });
    }
  } catch {
    /* ignore */
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
