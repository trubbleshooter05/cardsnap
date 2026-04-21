/**
 * Wrap a promise with an explicit timeout.
 * If the promise doesn't resolve/reject within `ms`, returns the fallback value.
 */
export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  fallback: T,
  label?: string
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutHandle = setTimeout(() => {
      if (label) console.warn(`[timeout] ${label} exceeded ${ms}ms`);
      resolve(fallback);
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}
